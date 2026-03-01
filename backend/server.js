import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Upload directory — stored inside backend/uploads/
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Multer storage with timestamp versioning
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const { name, ext } = path.parse(file.originalname);
        const now = new Date();
        const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${now.toTimeString().split(' ')[0].replace(/:/g, '')}`;
        cb(null, `${name}__${ts}${ext}`);
    }
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json());

// In-Memory Database with Seed Data
const db = {
    clusters: [
        { id: "c1", name: "prod-main-cluster", provider: "AWS", region: "us-east-1", status: "online", nodesCount: 12, pvcsCount: 45, backupSchedules: 3, lastBackup: new Date().toISOString(), version: "1.28.0" },
        { id: "c2", name: "staging-cluster", provider: "GCP", region: "europe-west1", status: "online", nodesCount: 4, pvcsCount: 12, backupSchedules: 1, lastBackup: new Date().toISOString(), version: "1.27.4" },
        { id: "c3", name: "dr-recovery-cluster", provider: "Azure", region: "central-us", status: "online", nodesCount: 8, pvcsCount: 20, backupSchedules: 2, lastBackup: new Date().toISOString(), version: "1.28.1" }
    ],
    backups: [
        { id: "bk-1", name: "postgres-daily-backup", cluster: "prod-main-cluster", namespace: "database", pvcName: "pg-data-v1", type: "full", status: "completed", size: "12.4 GB", duration: "4m 12s", startedAt: new Date(Date.now() - 86400000).toISOString(), retentionDays: 30, encrypted: true },
        { id: "bk-2", name: "redis-cache-snapshot", cluster: "prod-main-cluster", namespace: "cache", pvcName: "redis-persistent-storage", type: "snapshot", status: "completed", size: "2.1 GB", duration: "1m 05s", startedAt: new Date(Date.now() - 43200000).toISOString(), retentionDays: 7, encrypted: true },
        { id: "bk-3", name: "frontend-assets-incremental", cluster: "staging-cluster", namespace: "web", pvcName: "assets-pvc", type: "incremental", status: "failed", size: "0 GB", duration: "12s", startedAt: new Date(Date.now() - 21600000).toISOString(), retentionDays: 14, encrypted: true, errorMessage: "PVC bound failure" }
    ],
    schedules: [
        { id: "s1", name: "Database Hourly", cluster: "prod-main-cluster", namespace: "database", cron: "0 * * * *", pvcSelector: "app=postgres", nextRun: new Date(Date.now() + 3600000).toISOString(), enabled: true },
        { id: "s2", name: "Weekly Full Backup", cluster: "prod-main-cluster", namespace: "all", cron: "0 0 * * 0", pvcSelector: "*", nextRun: new Date(Date.now() + 172800000).toISOString(), enabled: true },
        { id: "s3", name: "Daily MySQL Backup", cluster: "staging-cluster", namespace: "database", cron: "0 1 * * *", pvcSelector: "app=mysql", nextRun: new Date(Date.now() + 86400000).toISOString(), enabled: true },
        { id: "s4", name: "Critical Assets Sync", cluster: "dr-recovery-cluster", namespace: "production", cron: "*/30 * * * *", pvcSelector: "type=assets", nextRun: new Date(Date.now() + 1800000).toISOString(), enabled: false }
    ],
    restores: [
        { id: "res-1", backupId: "bk-1", backupName: "postgres-daily-backup", targetCluster: "prod-main-cluster", targetNamespace: "database-restore", targetPVC: "pg-data-v1-restored", status: "completed", startedAt: new Date(Date.now() - 3600000).toISOString(), completedAt: new Date(Date.now() - 3200000).toISOString(), initiatedBy: "admin" }
    ],
    alerts: [
        { id: "a1", title: "Storage Threshold reached", desc: "Cluster 'prod-main-cluster' is at 82% storage capacity.", severity: "warning", time: "1h ago", resolved: false }
    ],
    drStats: {
        lastDrTest: new Date().toISOString(),
        rpoAchieved: "58m",
        rtoAchieved: "4m 12s",
        status: "passed"
    }
};

// GET metrics
app.get('/api/metrics', (req, res) => {
    const totalBackups = db.backups.length;
    const successfulBackups = db.backups.filter(b => b.status === "completed").length;
    const successRate = totalBackups === 0 ? 0 : Math.round((successfulBackups / totalBackups) * 100);

    const storageUsedGB = db.backups
        .filter(b => b.status === "completed")
        .reduce((acc, curr) => acc + (parseFloat(curr.size) || 0), 0);

    // Calculate storage by type
    const storageByType = [
        { name: "Full", value: db.backups.filter(b => b.type === "full" && b.status === "completed").reduce((acc, curr) => acc + (parseFloat(curr.size) || 0), 0), fill: "hsl(210, 100%, 56%)" },
        { name: "Incremental", value: db.backups.filter(b => b.type === "incremental" && b.status === "completed").reduce((acc, curr) => acc + (parseFloat(curr.size) || 0), 0), fill: "hsl(280, 80%, 60%)" },
        { name: "Snapshot", value: db.backups.filter(b => b.type === "snapshot" && b.status === "completed").reduce((acc, curr) => acc + (parseFloat(curr.size) || 0), 0), fill: "hsl(142, 71%, 45%)" }
    ];

    // Simple 7-day history (demo)
    const backupHistory = [
        { date: "Feb 15", success: 8, failed: 1 },
        { date: "Feb 16", success: 12, failed: 0 },
        { date: "Feb 17", success: 7, failed: 2 },
        { date: "Feb 18", success: 15, failed: 0 },
        { date: "Feb 19", success: 9, failed: 1 },
        { date: "Feb 20", success: 11, failed: 0 },
        { date: "Today", success: db.backups.filter(b => b.status === "completed").length, failed: db.backups.filter(b => b.status === "failed").length }
    ];

    res.json({
        totalBackups,
        successRate,
        totalStorageGB: storageUsedGB.toFixed(1),
        activeClusters: db.clusters.length,
        backupsToday: db.backups.length,
        restoresToday: db.restores.length,
        failedToday: db.backups.filter(b => b.status === "failed").length,
        storageByType,
        backupHistory,
        drStats: db.drStats,
        alerts: db.alerts.filter(a => !a.resolved)
    });
});

// GET alerts
app.get('/api/alerts', (req, res) => {
    res.json(db.alerts);
});

// GET backups
app.get('/api/backups', (req, res) => {
    res.json(db.backups);
});

// GET clusters
app.get('/api/clusters', (req, res) => {
    res.json(db.clusters);
});

// GET schedules
app.get('/api/schedules', (req, res) => {
    res.json(db.schedules);
});

// GET restores
app.get('/api/restores', (req, res) => {
    res.json(db.restores);
});

// POST restores
app.post('/api/restores', (req, res) => {
    const backup = db.backups.find(b => b.id === req.body.backupId);
    const newRestore = {
        id: `res-${Date.now()}`,
        backupId: req.body.backupId,
        backupName: backup ? backup.name : "unknown-backup",
        targetCluster: req.body.targetCluster || "unknown",
        targetNamespace: req.body.targetNamespace || "default",
        targetPVC: req.body.targetPVC || "restored-pvc",
        status: "completed",
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        initiatedBy: "user"
    };
    db.restores.unshift(newRestore);
    res.status(201).json(newRestore);
});

// POST clusters
app.post('/api/clusters', (req, res) => {
    const newCluster = {
        id: `c-${Date.now()}`,
        name: req.body.name || "unnamed-cluster",
        provider: req.body.provider || "On-Prem",
        region: req.body.region || "local",
        status: "online",
        nodesCount: parseInt(req.body.nodesCount) || 0,
        pvcsCount: 0,
        backupSchedules: 0,
        lastBackup: new Date().toISOString(),
        version: req.body.version || "1.28.0"
    };
    db.clusters.push(newCluster);
    res.status(201).json(newCluster);
});

// POST schedules (Automated Bootstrap)
app.post('/api/schedules', (req, res) => {
    const newSchedule = {
        id: `s-${Date.now()}`,
        name: req.body.name || "unnamed-schedule",
        cluster: req.body.cluster || "unknown",
        namespace: req.body.namespace || "default",
        cron: req.body.cron || "0 0 * * *",
        pvcSelector: req.body.pvcSelector || "*",
        nextRun: new Date(Date.now() + 86400000).toISOString(),
        enabled: true
    };
    db.schedules.unshift(newSchedule);

    // AUTOMATION 1: Trigger Bootstrap Backup
    const bootstrapBackup = {
        id: `bkp-boot-${Date.now()}`,
        name: `bootstrap-${newSchedule.name}`,
        cluster: newSchedule.cluster,
        namespace: newSchedule.namespace,
        pvcName: "auto-discovered",
        type: "full",
        status: "completed",
        size: "0.5 GB",
        duration: "12s",
        startedAt: new Date().toISOString(),
        retentionDays: 30,
        encrypted: true,
        sourceSchedule: newSchedule.id
    };
    db.backups.unshift(bootstrapBackup);

    // AUTOMATION 2: Trigger Automated DR Verification
    const drRestore = {
        id: `dr-res-${Date.now()}`,
        backupId: bootstrapBackup.id,
        backupName: bootstrapBackup.name,
        targetCluster: bootstrapBackup.cluster,
        targetNamespace: `dr-test-${newSchedule.name}`,
        targetPVC: `verify-${newSchedule.name}`,
        status: "completed",
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        initiatedBy: "SYSTEM-WATCHER"
    };
    db.restores.unshift(drRestore);

    // Update DR Stats
    db.drStats.lastDrTest = new Date().toISOString();
    db.drStats.status = "passed";

    res.status(201).json(newSchedule);
});

// POST backups
app.post('/api/backups', (req, res) => {
    const newBackup = {
        id: `bkp-${Date.now()}`,
        name: req.body.name || 'unnamed-backup',
        cluster: req.body.cluster || 'unknown',
        namespace: req.body.namespace || 'default',
        pvcName: req.body.pvcName || 'unknown-pvc',
        type: req.body.type || 'full',
        status: 'completed', // we'll simulate an instant complete for demo
        size: `${(Math.random() * 5 + 1).toFixed(1)} GB`, // Mock dynamic size output
        duration: '0m 45s',
        startedAt: req.body.startedAt || new Date().toISOString(),
        retentionDays: parseInt(req.body.retentionDays) || 30,
        encrypted: true
    };

    db.backups.unshift(newBackup); // Add to beginning of array
    res.status(201).json(newBackup);
});

// ============================================
// FILE UPLOAD ROUTES (merged from uploader)
// ============================================

// POST /api/files/upload
app.post('/api/files/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const fileInfo = {
        fileName: req.file.originalname,
        versionedName: req.file.filename,
        versionPath: req.file.path,
        size: req.file.size,
        uploadedAt: new Date().toISOString()
    };

    // Auto-trigger a backup record in the DB when a file is uploaded
    const autoBackup = {
        id: `bkp-auto-${Date.now()}`,
        name: `auto-sync-${req.file.filename.substring(0, 28).replace(/[^a-zA-Z0-9-_]/g, '-')}`,
        cluster: 'prod-main-cluster',
        namespace: 'vaultguard-demo',
        pvcName: 'uploads-pvc',
        type: 'incremental',
        status: 'completed',
        size: `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`,
        duration: '8s',
        startedAt: new Date().toISOString(),
        retentionDays: 30,
        encrypted: true
    };
    db.backups.unshift(autoBackup);

    console.log(`[VaultGuard] FILE_UPDATED: ${req.file.originalname} -> backup ${autoBackup.id} created.`);
    res.status(201).json({ message: 'File uploaded and backup triggered.', data: fileInfo, backup: autoBackup });
});

// GET /api/files — list all versioned files on disk
app.get('/api/files', (req, res) => {
    fs.readdir(UPLOAD_DIR, (err, files) => {
        if (err) return res.status(500).json({ error: 'Cannot read upload directory' });
        const fileList = files
            .filter(f => !f.startsWith('.'))
            .map(filename => {
                const stats = fs.statSync(path.join(UPLOAD_DIR, filename));
                return { fileName: filename, size: stats.size, uploadedAt: stats.mtime };
            })
            .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
        res.json(fileList);
    });
});

// GET /api/files/:name — download a specific file version
app.get('/api/files/:name', (req, res) => {
    const filePath = path.join(UPLOAD_DIR, req.params.name);
    if (fs.existsSync(filePath)) res.download(filePath);
    else res.status(404).json({ error: 'File not found' });
});

app.listen(PORT, () => {
    console.log(`VaultGuard API running on http://localhost:${PORT}`);
    console.log(`File uploads stored at: ${UPLOAD_DIR}`);
});
