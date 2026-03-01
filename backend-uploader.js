import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { EventEmitter } from 'events';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3000;
const uploadDir = process.env.UPLOAD_DIR || '/data/uploads';

// Ensure upload directory exists inside the pod
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Event Emitter for the VaultGuard orchestrator logic
const fileEvents = new EventEmitter();

// Configure Multer for file uploads and timestamp versioning
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const parsedPath = path.parse(file.originalname);
        const name = parsedPath.name;
        const ext = parsedPath.ext;

        // Format YYYYMMDD_HHMMSS
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const time = now.toTimeString().split(' ')[0].replace(/:/g, ''); // HHMMSS
        const timestamp = `${year}${month}${day}_${time}`;

        const newFilename = `${name}__${timestamp}${ext}`;
        cb(null, newFilename);
    }
});

const upload = multer({ storage });

app.use(cors());
app.use(express.json());

// 1. POST /api/files/upload (multipart/form-data)
app.post('/api/files/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileInfo = {
        fileName: req.file.originalname,
        versionPath: req.file.path,
        size: req.file.size,
        uploadedAt: new Date().toISOString()
    };

    // Emit event for VaultGuard orchestrator (This is where the automation starts!)
    fileEvents.emit('FILE_UPDATED', fileInfo);

    console.log(`[EVENT] FILE_UPDATED: ${JSON.stringify(fileInfo)}`);

    res.status(201).json({
        message: 'File completely uploaded and versioned.',
        data: fileInfo
    });
});

// 2. GET /api/files (list versions)
app.get('/api/files', (req, res) => {
    fs.readdir(uploadDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read PVC directory' });
        }

        const fileList = files.map(filename => {
            const stats = fs.statSync(path.join(uploadDir, filename));
            return {
                fileName: filename,
                size: stats.size,
                uploadedAt: stats.mtime
            };
        });

        // Sort by newest first
        res.json(fileList.sort((a, b) => b.uploadedAt - a.uploadedAt));
    });
});

// 3. GET /api/files/:name (download)
app.get('/api/files/:name', (req, res) => {
    const fileName = req.params.name;
    const filePath = path.join(uploadDir, fileName);

    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).json({ error: 'File version not found in PVC' });
    }
});

// VaultGuard Internal Listener: Trigger Backup
fileEvents.on('FILE_UPDATED', async (data) => {
    // In production, this would execute `velero backup create ...` via @kubernetes/client-node
    console.log(`\n======================================================`);
    console.log(`[VaultGuard Auto-Sync] Detected change: ${data.fileName}`);
    console.log(`[VaultGuard Auto-Sync] TRIGGERING INSTANT VELERO BACKUP...`);
    console.log(`======================================================\n`);

    try {
        await fetch('http://localhost:3001/api/backups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: `auto-sync-${data.fileName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase().substring(0, 30)}`,
                cluster: 'prod-main-cluster',
                namespace: 'vaultguard-demo',
                pvcName: 'uploads-pvc',
                type: 'incremental',
                startedAt: new Date().toISOString()
            })
        });
        console.log(`[VaultGuard Auto-Sync] Sent backup trigger to VaultGuard control plane on port 3001.`);
    } catch (err) {
        console.error(`[VaultGuard Auto-Sync] Could not reach control plane API on port 3001:`, err.message);
    }
});

app.listen(port, () => {
    console.log(`VaultGuard Upload API running on port ${port}`);
    console.log(`Writing files to mounted PVC path: ${uploadDir}`);
});
