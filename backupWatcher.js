import { veleroClient } from './veleroClient.js';

export class BackupWatcher {
    /**
     * @param {Object} db Reference to your centralized in-memory or persisted database
     */
    constructor(db) {
        this.db = db;
        this.activeWatches = new Map(); // Store polling intervals by backupId
    }

    /**
     * Non-blocking poll every 10 seconds checking Velero's API status mapping into your DB.
     */
    startWatching(backupId, backupName) {
        if (this.activeWatches.has(backupId)) return;

        console.log(`[BackupWatcher] Watcher initialized for: ${backupName} (${backupId})`);

        const interval = setInterval(async () => {
            const statusResult = await veleroClient.getBackupStatus(backupName);

            // 1. Locate the DB entry
            const backupRecord = this.db.backups.find(b => b.id === backupId);
            if (!backupRecord) {
                console.warn(`[BackupWatcher] Cannot find DB record ${backupId}. Destroying watcher.`);
                this.stopWatching(backupId);
                return;
            }

            // 2. Handle HTTP/CLI fetch errors (transient)
            if (!statusResult.success) {
                console.log(`[BackupWatcher] Transient lookup error for ${backupName}. Will retry in 10s.`);
                return;
            }

            const phase = statusResult.phase;
            console.log(`[BackupWatcher] Status update for ${backupName}: Phase = ${phase}`);

            // 3. Update Status State Machine Mapping
            if (phase === 'New' || phase === 'InProgress') {
                backupRecord.status = 'Running';

            } else if (phase === 'Completed') {
                console.log(`[BackupWatcher] Success -> ${backupId}`);
                backupRecord.status = 'completed';
                backupRecord.duration = this._calculateDuration(statusResult.startTimestamp, statusResult.completionTimestamp);

                // Demo mapping logic for UI display
                backupRecord.size = '1.2 GB'; // Ideally parsed from S3 metrics via prometheus later

                this.stopWatching(backupId);

            } else if (phase === 'Failed' || phase === 'PartiallyFailed') {
                console.error(`[BackupWatcher] Failed -> ${backupId}`);
                backupRecord.status = 'failed';
                backupRecord.errorMessage = `Velero encountered ${statusResult.errors} error(s).`;
                backupRecord.duration = this._calculateDuration(statusResult.startTimestamp, statusResult.completionTimestamp);

                this.stopWatching(backupId);
            }

        }, 10000); // 10 seconds interval

        // Track the running interval
        this.activeWatches.set(backupId, interval);
    }

    stopWatching(backupId) {
        if (this.activeWatches.has(backupId)) {
            clearInterval(this.activeWatches.get(backupId));
            this.activeWatches.delete(backupId);
            console.log(`[BackupWatcher] Stopped watching backup: ${backupId}`);
        }
    }

    _calculateDuration(startISO, endISO) {
        if (!startISO || !endISO) return 'Calculating...';

        const start = new Date(startISO).getTime();
        const end = new Date(endISO).getTime();
        const diffInSeconds = Math.floor((end - start) / 1000);

        const mins = Math.floor(diffInSeconds / 60);
        const secs = diffInSeconds % 60;
        return `${mins}m ${secs}s`;
    }
}
