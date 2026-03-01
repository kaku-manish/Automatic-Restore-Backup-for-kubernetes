import express from 'express';
import { veleroClient } from './veleroClient.js';
// The router expects the actual in-memory DB and Watcher class instance passed during mounting
export const createBackupRouter = (db, backupWatcher) => {
    const router = express.Router();

    // 1. POST /api/backups/trigger -> Instructs Velero CLI and starts watching
    router.post('/trigger', async (req, res) => {
        try {
            const { name, namespace } = req.body;

            // VaultGuard Specifics (Target the Demo Namespace containing PVCs)
            const targetNamespace = namespace || 'vaultguard-demo';

            // Sanitize names for K8s compliance (lowercase, no spaces)
            const sanitizedPrefix = (name || 'manual').replace(/\s+/g, '-').toLowerCase();
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const backupName = `${sanitizedPrefix}-${timestamp}`;
            const backupId = `bkp-vol-${Date.now()}`;

            // Step 1: Create DB Record (Initial Pending state)
            const newBackup = {
                id: backupId,
                name: backupName,
                cluster: 'vaultguard-cluster',
                namespace: targetNamespace,
                pvcName: 'auto-discovered-snapshots',
                type: 'full-snapshot',
                status: 'Pending', // Sent to Velero, awaiting response
                size: 'Calculating...',
                duration: '0m 0s',
                startedAt: new Date().toISOString(),
                retentionDays: 30,
                encrypted: true,
                errorMessage: null
            };
            db.backups.unshift(newBackup); // Prepend to history

            // Step 2: Fire execution payload natively
            const veleroResult = await veleroClient.createBackup(backupName, targetNamespace);

            if (!veleroResult.success) {
                // If CLI fails immediately (e.g. velero not installed, invalid namespace)
                newBackup.status = 'failed';
                newBackup.errorMessage = veleroResult.error;

                return res.status(500).json({
                    error: 'Failed to dispatch Velero command',
                    details: veleroResult.error
                });
            }

            // Step 3: Success CLI Execution -> Let the background watcher poll the K8s API
            newBackup.status = 'Running';
            backupWatcher.startWatching(backupId, backupName);

            // Respond immidiately (Non-blocking design)
            res.status(202).json({
                message: 'Backup triggered successfully into Velero queue.',
                backup: newBackup
            });

        } catch (error) {
            console.error('[BackupService] Internal routing error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // 2. GET /api/backups -> List all backups from DB
    router.get('/', (req, res) => {
        res.json(db.backups);
    });

    // 3. GET /api/backups/:id -> Fetch specific metadata for a single snapshot job
    router.get('/:id', (req, res) => {
        const backupId = req.params.id;
        const backup = db.backups.find(b => b.id === backupId);

        if (!backup) {
            return res.status(404).json({ error: `Backup ID ${backupId} not found in registry.` });
        }

        res.json(backup);
    });

    return router;
};
