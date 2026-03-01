import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export const veleroClient = {
    /**
     * Executes the Velero CLI to trigger a backup.
     * @param {string} backupName The unique name of the backup
     * @param {string} namespace The namespace to backup (e.g., vaultguard-demo)
     */
    async createBackup(backupName, namespace) {
        // Construct the Velero command. 
        // Adding --snapshot-volumes=true ensures CSI or restic snapshots of PVCs are included.
        const cmd = `velero backup create ${backupName} --include-namespaces ${namespace} --snapshot-volumes=true`;
        console.log(`[VeleroClient] Executing: ${cmd}`);

        try {
            const { stdout, stderr } = await execPromise(cmd);
            return { success: true, stdout, stderr };
        } catch (error) {
            console.error(`[VeleroClient] Execution failed:`, error.message);
            return { success: false, error: error.message };
        }
    },

    /**
     * Retrieves the JSON status of a specific Velero backup.
     * @param {string} backupName The unique name of the backup
     */
    async getBackupStatus(backupName) {
        const cmd = `velero backup get ${backupName} -o json`;

        try {
            const { stdout } = await execPromise(cmd);
            const data = JSON.parse(stdout);

            return {
                success: true,
                phase: data.status?.phase || 'Unknown', // e.g., New, InProgress, Completed, Failed
                errors: data.status?.errors || 0,
                warnings: data.status?.warnings || 0,
                startTimestamp: data.status?.startTimestamp,
                completionTimestamp: data.status?.completionTimestamp,
                expiration: data.status?.expiration
            };
        } catch (error) {
            // Could mean Velero pod is unreachable, or backup hasn't fully registered in K8s API yet
            return { success: false, error: error.message };
        }
    }
};
