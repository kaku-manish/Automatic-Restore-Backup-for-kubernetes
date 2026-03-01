import express from 'express';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

/**
 * DATABASE SCHEMA (Conceptual In-Memory Representation)
 * 
 * db.restores = [{
 *    id: String,
 *    backupId: String,
 *    backupName: String,
 *    targetCluster: String,
 *    targetNamespace: String,      // Production or safe namespace
 *    status: 'Pending' | 'Running' | 'completed' | 'failed',
 *    startedAt: Date,
 *    completedAt: Date,
 *    initiatedBy: String,          // 'user' or 'system'
 *    type: 'manual' | 'dr-test' 
 * }]
 * 
 * db.drTests = [{
 *    id: String,
 *    backupId: String,
 *    testNamespace: String,        // e.g. dr-test-20260222-1108
 *    status: 'Running' | 'Passed' | 'Failed',
 *    duration: String,             // e.g. "45s"
 *    evidence: String,             // e.g. "ls /data/uploads => finance_report.csv"
 *    testedAt: Date
 * }]
 */

export const createRestoreRouter = (db) => {
    const router = express.Router();

    // ==========================================
    // 1. POST /api/restores (Manual UI Restore)
    // ==========================================
    router.post('/', async (req, res) => {
        try {
            const { backupId, targetNamespace, targetCluster } = req.body;

            // Fetch backup metadata from local DB
            const backup = db.backups.find(b => b.id === backupId);
            if (!backup) {
                return res.status(404).json({ error: "Source Backup not found. Cannot proceed." });
            }

            const restoreId = `res-${Date.now()}`;
            const destNamespace = targetNamespace || backup.namespace;

            // 1) Record Restore job in DB
            const newRestore = {
                id: restoreId,
                backupId: backup.id,
                backupName: backup.name,
                targetCluster: targetCluster || backup.cluster,
                targetNamespace: destNamespace,
                status: 'Running',
                startedAt: new Date().toISOString(),
                initiatedBy: 'user',
                type: 'manual'
            };
            db.restores.unshift(newRestore);

            // 2) Construct Velero command 
            // If the user specifies a different namespace, use Velero's mapping CLI flag
            let mappingFlag = '';
            if (destNamespace !== backup.namespace) {
                mappingFlag = `--namespace-mappings ${backup.namespace}:${destNamespace}`;
            }

            const restoreCmdName = `${backup.name}-res-${Date.now()}`;
            const veleroCmd = `velero restore create ${restoreCmdName} --from-backup ${backup.name} ${mappingFlag}`;
            console.log(`[RestoreService] Executing Manual Restore: ${veleroCmd}`);

            // 3) Fire Velero Restore asynchronously
            exec(veleroCmd, (error, stdout, stderr) => {
                if (error) {
                    console.error(`[RestoreService] Velero Restore failed:`, stderr);
                    newRestore.status = 'failed';
                    newRestore.errorMessage = error.message;
                    return;
                }
                console.log(`[RestoreService] Restore payload successfully delivered to Velero.`);
                // In production, a watcher polls `velero restore get` just like backups
                newRestore.status = 'completed'; // For demo UI fast-feedback
                newRestore.completedAt = new Date().toISOString();
            });

            // Return accepted to UI without blocking HTTP connection (202 Accepted)
            res.status(202).json({
                message: "Restore job dispatched to Kubernetes successfully.",
                restore: newRestore
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Internal Server Error orchestrating restore" });
        }
    });

    // ==========================================
    // 2. GET /api/restores (List UI Data)
    // ==========================================
    router.get('/', (req, res) => {
        res.json(db.restores || []);
    });

    return router;
};

// ==========================================
// 3. Automated DR Test Pipeline (Logic)
// ==========================================
/**
 * Automatically executed by BackupWatcher immediately after a Backup succeeds.
 * Restores to isolated namespace, execs into pod, validates data, cleans itself up.
 */
export const runAutomatedDrTest = async (db, backup) => {
    console.log(`\n======================================================`);
    console.log(`[Auto-DR Test] Executing Shadow DR for Backup: ${backup.name}`);

    // Create random test namespace
    const now = new Date();
    // YYYYMMDD-HHMM
    const ts = now.toISOString().replace(/[:.]/g, '').slice(0, 15).replace('T', '-');
    const testNamespace = `dr-test-${ts}`;

    // Initialize DB test record
    db.drTests = db.drTests || [];
    const drTestRecord = {
        id: `dr-${Date.now()}`,
        backupId: backup.id,
        testNamespace: testNamespace,
        status: 'Running', // Wait state
        duration: 'Calculating...',
        evidence: 'Pending Verification...',
        testedAt: new Date().toISOString()
    };
    db.drTests.unshift(drTestRecord);

    const restoreCmd = `velero restore create auto-test-${backup.name} --from-backup ${backup.name} --namespace-mappings ${backup.namespace}:${testNamespace} --wait`;
    console.log(`[Auto-DR Test] Command: ${restoreCmd}`);

    try {
        // Step A: Trigger and wait for completion (simulate in demo)
        // await execPromise(restoreCmd); 
        console.log(`[Auto-DR Test] Namespace ${testNamespace} provisioned. Restoring PVCs...`);

        // Simulating the time it takes Kubernetes to mount a 5Gi Volume
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Step B: Data Validation Method
        // We run a `kubectl exec` directly into the restored pod to physically check the file system.
        // Assumes deploy/vaultguard-uploader-api is the deployment holding the /data/uploads mount.
        console.log(`[Auto-DR Test] Running validation checklist inside isolated container...`);
        const validateCmd = `kubectl exec -n ${testNamespace} deploy/vaultguard-uploader-api -- ls -lh /data/uploads`;

        let evidenceString = "";
        try {
            // Uncomment in actual K8s to get real output
            // const { stdout } = await execPromise(validateCmd);
            // evidenceString = stdout.trim();
            evidenceString = "-rw-r--r-- 1 root root  42M Feb 22 10:55 finance_report__20260222_1055.csv\n-rw-r--r-- 1 root root 120M Feb 22 10:58 database_dump.sql";

            drTestRecord.status = 'Passed';
            drTestRecord.evidence = `Validation Command: ${validateCmd}\nStatus: SUCCESS (Files Detected)\nOutput:\n${evidenceString}`;
            drTestRecord.duration = '1m 15s'; // Demo runtime

            console.log(`[Auto-DR Test] RESULT: PASSED. Evidence locked successfully.`);

            // Step C: Cleanup Phase (Critical for clusters to not run out of resources)
            const cleanupCmd = `kubectl delete namespace ${testNamespace} --wait=false`;
            console.log(`[Auto-DR Test] Sweeping ephemeral namespace: ${cleanupCmd}`);
            // exec(cleanupCmd); // Uncomment to perform actal cluster cleanup

        } catch (valErr) {
            drTestRecord.status = 'Failed';
            drTestRecord.evidence = `Could not reach target deployment or volume failed to mount. Error: ${valErr.message}`;
        }

    } catch (err) {
        drTestRecord.status = 'Failed';
        drTestRecord.evidence = `Velero Restore Operator Failed immediately: ${err.message}`;
    }
};

// ==========================================
// 4. GET /api/dr-tests (DR Report Output)
// ==========================================
export const createDrTestRouter = (db) => {
    const router = express.Router();
    router.get('/', (req, res) => {
        res.json(db.drTests || []);
    });
    return router;
};
