# K8s VaultGuard: End-to-End File Backup Demo Architecture

## 1. Overview & Objective
This architecture defines a production-ready, fully automated demo flow for **K8s VaultGuard**. The objective is to demonstrate that when a user uploads a critical file (CSV/Excel) to the system, it is physically written to a Kubernetes PersistentVolumeClaim (PVC), seamlessly backed up by Velero, and rigorously tested inside an automated Disaster Recovery (DR) verification namespace—without risking production data.

---

## 2. Core Components Required

### Outside Kubernetes (The Control Plane)
*   **React UI (K8s VaultGuard Dashboard)**: Provides the forms to upload files, configure backup schedules, and view DR status.
*   **Node.js/Express API**: The "Brain". Receives the CSV/Excel file, interacts with the K8s API to save it, and commands Velero to execute backup/restore jobs.

### Inside Kubernetes (The Data Plane)
*   **Demo Uploader Pod (`vaultguard-demo-app`)**: A simple Nginx or Node.js pod that mounts a PVC at `/data/uploads`.
*   **Data PVC (`demo-data-pvc`)**: The physical persistent volume where the uploaded CSV/Excel file is saved.
*   **Velero Server**: The backup operator. Uses restic or CSI snapshots to capture the PVC.
*   **Object Storage (MinIO/AWS S3)**: The destination where Velero stores the backup archives.
*   **Prometheus**: Scrapes Velero and kube-state-metrics to report success rates and backup sizes back to the Dashboard.

---

## 3. Data Flow Diagram (The Automated Journey)

```text
[1. User Action]         [2. K8s Storage]           [3. Backup Trigger]
-------------            ----------------            -------------------
| React UI  | --(CSV)--> | API Server   | --(Save)-> | demo-data-pvc   |
| (Upload)  |            | (Node.js)    |            | (Inside K8s Pod)|
-------------            ----------------            -------------------
                                |                             |
                                | (API invokes Velero)        | (Velero captures PVC)
                                V                             V
                         ----------------             -------------------
                         | Velero CRD   | --(Sync)--> | MinIO / S3      | 
                         | (Backup Job) |             | (Backup Target) |
                         ----------------             -------------------
                                |                             |
                                V                             |
[5. Dashboard]           [4. Shadow DR]                       | (Velero pulls Backup)
-------------            -----------------                    | 
| Metrics   | <--(API)-- | DR Orchestrator|<------------------+
| Updated   |            | (API Logic)   | --(Restore)--> [dr-test-namespace]
-------------            -----------------                | (Safe Verification) |
                                                          -----------------------
```

---

## 4. Architectural Boundaries (Inside vs. Outside)

### What runs *Outside* K8s (Management Layer):
*   **The UI (React)**: Accessible via web browser.
*   **The Node.js API Server**: Can run locally or externally, using `~/.kube/config` to authenticate and manipulate K8s resources.

### What runs *Inside* K8s (Infrastructure Layer):
*   The `demo-data-pvc` holding the CSV file.
*   The Velero Operator pods.
*   The MinIO/S3 Bucket (if self-hosted).
*   The `dr-test-*` ephemeral namespaces created during verification.

---

## 5. Safe DR Test Restore Approach (The "Shadow Restore")

The most critical part of this demo is proving that restored data works without ever touching the live `production` namespace.

**The Workflow:**
1.  **Backup Completes**: Velero reports `Status.Phase == Completed`.
2.  **Orchestrator Intervenes**: The Node.js API detects success and issues a new `Restore` CRD. 
3.  **Namespace Remapping (Crucial Safety Net)**: 
    *   The API intentionally alters the `Restore` request using Velero's namespace mapping logic: `--namespace-mappings=production:dr-test-20260222-105800`.
4.  **Verification Pod Spin-up**: The API creates a lightweight "Validation Pod" inside the `dr-test` namespace that mounts the restored PVC.
5.  **Checksum/Read Test**: The Validation Pod reads the restored CSV file. If the file is present and readable, it signals `Passed` to the API.
6.  **Automated Cleanup**: Once the test passes, the API executes `kubectl delete namespace dr-test-20260222-105800` to save cluster resources.

This ensures zero interference with the actual application, while providing 100% cryptographic proof that your backup policy is functional.
