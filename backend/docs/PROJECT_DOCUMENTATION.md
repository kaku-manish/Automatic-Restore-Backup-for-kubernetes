# 📦 Kubmanger — End-to-End Project Documentation

> **Automatic Restore & Backup for Kubernetes**
> Version 1.0 | March 2026 | Author: kaku-manish

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Solution Architecture](#3-solution-architecture)
4. [Technology Stack](#4-technology-stack)
5. [Project Structure](#5-project-structure)
6. [Frontend — Deep Dive](#6-frontend--deep-dive)
7. [Backend — Deep Dive](#7-backend--deep-dive)
8. [Automation Pipelines](#8-automation-pipelines)
9. [Kubernetes & Velero Integration](#9-kubernetes--velero-integration)
10. [File Upload — Auto Backup Feature](#10-file-upload--auto-backup-feature)
11. [API Reference](#11-api-reference)
12. [Data Models (Schemas)](#12-data-models-schemas)
13. [Environment Variables & Config](#13-environment-variables--config)
14. [Setup & Running Locally](#14-setup--running-locally)
15. [Kubernetes Deployment](#15-kubernetes-deployment)
16. [Feature Flags — Demo vs Production](#16-feature-flags--demo-vs-production)
17. [Security Considerations](#17-security-considerations)
18. [Known Limitations & Future Roadmap](#18-known-limitations--future-roadmap)
19. [Glossary](#19-glossary)

---

## 1. Project Overview

**Kubmanger** is a production-grade, autonomous Kubernetes backup and disaster recovery (DR) management platform. It acts as a centralized "Control Plane" — a single dashboard and API engine that:

- Orchestrates **Velero** to take volume snapshots of Kubernetes Persistent Volume Claims (PVCs)
- **Automatically verifies** every backup by doing a test restore into an isolated namespace
- **Monitors cluster health** across multiple cloud providers (AWS, GCP, Azure)
- Exposes a **rich React dashboard** with real-time charts, alerts, and DR readiness scores
- Enables **data source integration** — upload a CSV or Excel file, and the system instantly backs it up to a Kubernetes PVC

> The core philosophy: **"Never trust a backup you haven't tested."**

Kubmanger proves backup validity *before* a real disaster strikes, turning reactive recovery into proactive resilience.

---

## 2. Problem Statement

### The Challenge
Kubernetes workloads frequently store critical data in **Persistent Volumes** — databases, file uploads, configuration stores. But most teams rely on:

- Manual, error-prone `velero backup create` commands
- No automated verification that the backup is actually restorable
- No centralized view of backup health across multiple clusters
- Delayed alerting — teams find out about failed backups *after* data loss

### What Kubmanger Solves

| Problem | Kubmanger Solution |
|---------|-------------------|
| Manual backup commands | REST API + scheduled cron policies that auto-trigger Velero |
| Untested backups | Automated "Shadow Restore" into `dr-test-*` namespace after every backup |
| No visibility | Unified dashboard with real-time charts, success rates, RPO/RTO metrics |
| Multi-cluster chaos | Single control plane managing AWS, GCP, Azure clusters from one UI |
| Delayed failure detection | Predictive alerting based on RPO threshold breach |
| No data versioning | Timestamp-versioned file uploads (`file__20260301_142200.xlsx`) |

---

## 3. Solution Architecture

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER (Port 8080)                  │
│   React + Vite + TypeScript + TailwindCSS + Radix UI        │
│   Pages: Dashboard | Backups | Schedules | Restore |        │
│          Clusters | Monitoring | DR | Upload Demo             │
└────────────────────┬────────────────────────────────────────┘
                     │ REST API (JSON)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   API LAYER (Port 3001)                      │
│               Node.js + Express (ESM)                        │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ server.js   │  │ backupService│  │ restoreService   │  │
│  │ Main Router │  │ Backup APIs  │  │ Restore + DR     │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │metricsEngine│  │backupWatcher │  │  veleroClient    │  │
│  │ KPIs+Charts │  │ Status Poller│  │  CLI Wrapper     │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
│  ┌─────────────────────────────────┐                        │
│  │    Multer File Handler           │                        │
│  │    Timestamp Versioning          │                        │
│  └─────────────────────────────────┘                        │
└────────────────────┬────────────────────────────────────────┘
                     │ Velero CLI / K8s API
                     ▼
┌─────────────────────────────────────────────────────────────┐
│               KUBERNETES CLUSTER LAYER                       │
│                                                              │
│  ┌───────────────┐   ┌─────────────────┐   ┌────────────┐  │
│  │   Velero      │   │   PVC / Volumes  │   │  Backups   │  │
│  │   Controller  │──▶│   (Snapshots)    │──▶│    CRDs    │  │
│  └───────────────┘   └─────────────────┘   └────────────┘  │
│  ┌───────────────┐   ┌─────────────────┐                    │
│  │  Production   │   │  dr-test-*      │                    │
│  │  Namespace    │   │  Namespace      │                    │
│  └───────────────┘   └─────────────────┘                    │
└────────────────────┬────────────────────────────────────────┘
                     │ Object Storage
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              STORAGE LAYER                                   │
│         MinIO (local) / AWS S3 / GCP GCS / Azure Blob       │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow
1. User interacts with the **React UI** (port 8080)
2. React Query sends API calls to the **Express backend** (port 3001)
3. Backend receives the request, updates its **in-memory DB**, and may invoke **Velero CLI**
4. Velero communicates with the **Kubernetes API Server** to create/read backup CRDs
5. Completed backups are stored in **S3/MinIO**
6. The **BackupWatcher** polls Velero every 30 seconds, syncing status back to the DB
7. React Query auto-refetches every 30s, keeping the UI current with no user action needed

---

## 4. Technology Stack

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.3.1 | Component-based UI framework |
| TypeScript | 5.8.3 | Type safety across all components |
| Vite | 5.4.19 | Blazing fast dev server & bundler |
| Tailwind CSS | 3.4.17 | Utility-first styling |
| Radix UI | Latest | Accessible headless component primitives |
| TanStack Query | 5.83.0 | Server state management, caching, auto-refetch |
| Recharts | 2.15.4 | Responsive bar & donut charts |
| Framer Motion | 12.34.3 | Page transitions & micro-animations |
| React Router DOM | 6.30.1 | SPA client-side routing |
| Lucide React | 0.462.0 | Icon set (300+ icons) |
| Sonner | 1.7.4 | Toast notification system |
| React Hook Form | 7.61.1 | Form state management |
| Zod | 3.25.76 | Schema-based form validation |

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 22.12.0 | JavaScript runtime (ESM modules) |
| Express | 5.2.1 | HTTP server & routing |
| Multer | 2.0.2 | Multipart file upload parsing |
| CORS | 2.8.6 | Cross-Origin request handling |
| Velero CLI | Latest | Kubernetes backup/restore engine |
| `child_process` | Built-in | Execute Velero CLI from Node.js |
| `fs` / `path` | Built-in | File system operations |
| `events` | Built-in | EventEmitter for automation triggers |

### Infrastructure

| Tool | Purpose |
|------|---------|
| Kubernetes | Container orchestration (v1.27+) |
| Velero | K8s-native backup and restore |
| MinIO / AWS S3 | Object storage for backup archives |
| Docker | Container images for backend API |
| Minikube / Kind | Local Kubernetes cluster for development |

---

## 5. Project Structure

```
Automatic-Restore-Backup-for-kubernetes/
│
├── 📁 frontend/                     ← React + Vite application
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts            ← All fetch functions (fetchBackups, createBackup, etc.)
│   │   ├── components/
│   │   │   ├── AppLayout.tsx        ← Sidebar + main content wrapper
│   │   │   ├── AppSidebar.tsx       ← Navigation sidebar with all routes
│   │   │   ├── NavLink.tsx          ← Active-state-aware navigation link
│   │   │   ├── StatCard.tsx         ← Reusable KPI card component
│   │   │   ├── StatusBadge.tsx      ← Color-coded status pill (Completed/Failed/Running)
│   │   │   └── ui/                  ← Radix UI component library (40+ components)
│   │   ├── data/
│   │   │   └── mockData.ts          ← Fallback mock data if backend is unreachable
│   │   ├── hooks/
│   │   │   ├── use-mobile.tsx       ← Responsive breakpoint hook
│   │   │   └── use-toast.ts         ← Toast notification hook
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx        ← KPI cards + Bar chart + Donut chart
│   │   │   ├── Backups.tsx          ← Backup list + New Backup dialog
│   │   │   ├── Schedules.tsx        ← Policy list + New Schedule dialog
│   │   │   ├── Restore.tsx          ← Restore list + New Restore dialog
│   │   │   ├── Clusters.tsx         ← Cluster cards + Add Cluster dialog
│   │   │   ├── Monitoring.tsx       ← Extended metrics + trend charts
│   │   │   ├── DisasterRecovery.tsx ← DR test results + RPO/RTO display
│   │   │   ├── UploadDemo.tsx       ← File upload → Instant backup trigger
│   │   │   ├── Architecture.tsx     ← Visual system architecture page
│   │   │   ├── Settings.tsx         ← Application settings
│   │   │   └── NotFound.tsx         ← 404 page
│   │   ├── types/
│   │   │   └── backup.ts            ← TypeScript interfaces for BackupJob, Cluster, etc.
│   │   ├── App.tsx                  ← Root component + all route definitions
│   │   ├── main.tsx                 ← React entry point
│   │   └── index.css                ← Global styles + CSS variables
│   ├── index.html                   ← HTML entry point (Vite)
│   ├── vite.config.ts               ← Vite build config (port 8080, path aliases @/)
│   ├── tailwind.config.ts           ← Tailwind theme (dark mode, custom colours)
│   ├── tsconfig.json                ← TypeScript configuration
│   └── package.json                 ← Frontend dependencies
│
├── 📁 backend/                      ← Node.js + Express API server
│   ├── server.js                    ← Main entry point — all routes registered here
│   ├── backupService.js             ← Backup-specific Express router + Velero triggers
│   ├── backupWatcher.js             ← Background poller — syncs Velero status to DB
│   ├── veleroClient.js              ← Thin wrapper over `velero` CLI via child_process
│   ├── restoreService.js            ← Restore endpoints + automated Shadow DR logic
│   ├── metricsEngine.js             ← Converts raw DB arrays into dashboard metrics
│   ├── backend-uploader.js          ← Legacy standalone uploader (superseded by server.js)
│   ├── Dockerfile                   ← Container image for backend pod
│   ├── package.json                 ← Backend-only dependencies
│   │
│   ├── 📁 uploads/                  ← Gitignored — user files saved here at runtime
│   ├── 📁 k8s/                      ← Kubernetes deployment manifests
│   │   ├── vaultguard-demo-app.yaml ← Namespace + PVC + Deployment + Service
│   │   └── vaultguard-api-deployment.yaml ← Backend pod (mounts uploads-pvc)
│   └── 📁 docs/                     ← Extended project documentation
│
├── .gitignore
└── README.md
```

---

## 6. Frontend — Deep Dive

### Routing (App.tsx)

The application uses React Router v6 with a single `AppLayout` wrapper that renders the sidebar + content:

```
/                    → Dashboard
/backups             → Backups
/schedules           → Schedules (Policies)
/restore             → Restore
/clusters            → Clusters
/monitoring          → Monitoring
/disaster-recovery   → Disaster Recovery
/upload-demo         → Data Source (Upload)
/architecture        → Architecture diagram
/settings            → Settings
*                    → 404 Not Found
```

### API Client (src/api/client.ts)

All HTTP calls are centralised in one file. Each function calls `http://localhost:3001/api/...`:

```typescript
// Example
export const fetchBackups = async () => {
  const res = await fetch('http://localhost:3001/api/backups');
  return res.json(); // Returns BackupJob[]
};

export const createBackup = async (data) => {
  const res = await fetch('http://localhost:3001/api/backups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
};
```

If the backend is unreachable, the client falls back to `mockData.ts` so the UI never crashes.

### Data Fetching Pattern (TanStack Query)

Every page uses the same `useQuery` + `useMutation` pattern:

```typescript
// READ — auto refetches every 30 seconds
const { data: backups = [], isLoading } = useQuery({
  queryKey: ['backups'],
  queryFn: fetchBackups,
  refetchInterval: 30000
});

// WRITE — invalidates cache on success (triggers re-fetch)
const mutation = useMutation({
  mutationFn: createBackup,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['backups'] });
    toast.success("Backup started!");
  }
});
```

### Component Design System

| Component | Purpose |
|-----------|---------|
| `StatCard` | Shows a KPI metric (value, label, icon, optional trend arrow) |
| `StatusBadge` | Green/Red/Yellow pill based on `completed` / `failed` / `running` status |
| `AppSidebar` | Left navigation with active route highlighting via `NavLink` |
| `AppLayout` | Wraps sidebar + scrollable main content area |

---

## 7. Backend — Deep Dive

### server.js — The Main Entry Point

`server.js` is a single Express application (ESM module) that:
1. Sets up `cors()` and `express.json()` middleware
2. Initialises `multer` for file uploads with timestamp-based versioning
3. Seeds an **in-memory database** with realistic demo data on startup
4. Registers all API route handlers inline
5. Starts listening on **port 3001**

### In-Memory Database Structure

```javascript
const db = {
  clusters:  [...],  // Array of ClusterObject
  backups:   [...],  // Array of BackupJob
  schedules: [...],  // Array of Schedule / Policy
  restores:  [...],  // Array of RestoreJob
  alerts:    [...],  // Array of Alert
  drStats:   { lastDrTest, rpoAchieved, rtoAchieved, status }
};
```

This is pre-seeded with 3 clusters, 3 backups, 4 schedules, 1 restore, and 1 alert on every server start. In production, this would be replaced with a PostgreSQL or MongoDB connection.

### metricsEngine.js — Powering the Dashboard

Reads the `db` object and computes:
- `totalBackups` — count of all backup records
- `successRate` — `(completedBackups / totalBackups) * 100`
- `totalStorageGB` — sum of sizes of all completed backups
- `activeClusters` — `db.clusters.length`
- `backupHistory` — 7-day activity array (for Bar chart)
- `storageByType` — aggregated GB per backup type (for Donut chart)
- `drStats` — RPO/RTO values from `db.drStats`
- `alerts` — unresolved alerts

### backupWatcher.js — Background Status Sync

A background worker that:
1. Runs on a **30-second polling interval**
2. Calls `velero backup get` via `veleroClient.js`
3. Parses the CLI output and finds backups in `Pending` / `InProgress` state
4. Updates the corresponding record in `db.backups` to `completed` or `failed`
5. Triggers the **DR Verification** pipeline when a backup transitions to `completed`

### veleroClient.js — CLI Wrapper

A thin JavaScript wrapper around the `velero` binary:

```javascript
// Creates a backup via Velero CLI
export const createVeleroBackup = async (name, namespaces) => {
  return execAsync(`velero backup create ${name} --include-namespaces ${namespaces}`);
};

// Gets backup status
export const getVeleroBackups = async () => {
  return execAsync('velero backup get --output json');
};
```

Uses Node.js `child_process.exec` wrapped in a Promise for async/await compatibility.

### restoreService.js — Restore & DR Verification

Two key functions:

**Manual Restore** (`POST /api/restores`):
- Accepts `backupId`, `targetNamespace`, `targetCluster`, `targetPVC`
- Creates a restore record with namespace remapping (e.g., `database` → `database-restore`)
- Calls `velero restore create` via `veleroClient.js`

**Automated Shadow DR** (`runAutomatedDrTest`):
- Called automatically after every completed backup
- Restores into a temporary `dr-test-{name}` namespace
- Executes `kubectl exec` to validate file integrity inside the restored pod
- Updates `db.drStats` with RPO/RTO and pass/fail status
- Cleans up the temporary namespace after validation

---

## 8. Automation Pipelines

### Pipeline 1: Bootstrap Backup

**Trigger:** `POST /api/schedules` (user creates a new backup policy)

**Steps:**
```
User creates schedule
       ↓
Schedule saved to db.schedules
       ↓
Bootstrap Backup created immediately (db.backups)
  - name: "bootstrap-{scheduleName}"
  - type: "full"
  - status: "completed"
  - size: "0.5 GB"
       ↓
DR Verification triggered (db.restores)
  - targetNamespace: "dr-test-{scheduleName}"
  - initiatedBy: "SYSTEM-WATCHER"
       ↓
db.drStats updated:
  - lastDrTest = now
  - status = "passed"
       ↓
201 OK returned to user
```

**Business Value:** Data protection starts at **Minute 0**, not at the next cron cycle. No unprotected window.

---

### Pipeline 2: File Upload → Auto Backup

**Trigger:** `POST /api/files/upload` (user uploads CSV/Excel via UI)

**Steps:**
```
User selects file in Upload Demo page
       ↓
Multipart POST to /api/files/upload
       ↓
Multer saves file as:
  filename__YYYYMMDD_HHMMSS.ext
  (e.g., report__20260301_142215.xlsx)
       ↓
FILE_UPDATED event emitted internally
       ↓
Auto-backup record created in db.backups:
  - name: "auto-sync-{filename}"
  - type: "incremental"
  - cluster: "prod-main-cluster"
  - namespace: "vaultguard-demo"
  - pvcName: "uploads-pvc"
  - status: "completed"
       ↓
React Query refetches /api/backups
       ↓
Backups page shows new entry instantly
```

---

### Pipeline 3: DR Verification (Shadow Restore)

**Trigger:** Automatically after any backup reaches `completed` status

**Steps:**
```
BackupWatcher detects: backup status = completed
       ↓
velero restore create {backup-name}-dr-verify
  --from-backup {backup-name}
  --namespace-mappings {original}:{dr-test-*}
       ↓
Wait for restore to complete (~30s)
       ↓
kubectl exec {pod} -- ls /data/uploads
  (validates file contents exist)
       ↓
If validation passes:
  db.drStats.status = "passed"
  db.drStats.rpoAchieved = calculated
  db.drStats.rtoAchieved = calculated
       ↓
If validation fails:
  Create high-severity alert in db.alerts
       ↓
Ephemeral dr-test-* namespace deleted
  (no data persisted from DR test)
```

---

### Pipeline 4: Predictive Alerting

The system automatically generates alerts when:

| Condition | Severity | Alert Message |
|-----------|----------|---------------|
| Storage > 80% capacity | `warning` | "Cluster X is at Y% storage capacity" |
| RPO breached (no backup in > N hours) | `critical` | "RPO threshold exceeded" |
| Backup failed 2x in a row | `high` | "Repeated backup failure detected" |
| DR test failed | `critical` | "DR verification failed for backup X" |

---

## 9. Kubernetes & Velero Integration

### What is Velero?

Velero is a CNCF open-source tool for:
- Backing up Kubernetes resources (Deployments, Services, ConfigMaps, PVCs)
- Restoring them to the same or a different cluster
- Migrating workloads between clusters

Kubmanger uses Velero as its backup **engine**, wrapping the CLI in Node.js for automation.

### Velero Architecture in This Project

```
Kubmanger Backend (Node.js)
    ↓ child_process.exec("velero backup create ...")
Velero CLI → Velero Controller (in-cluster)
    ↓ creates Backup CRD in Kubernetes
    ↓ takes CSI snapshot / Restic backup of PVCs
    ↓ uploads to S3/MinIO
    ↓ updates Backup CRD status to Completed
Kubmanger BackupWatcher
    ↓ polls "velero backup get" every 30s
    ↓ updates db.backups status
    ↓ triggers DR verification
```

### Kubernetes Manifests (`backend/k8s/`)

**vaultguard-demo-app.yaml** creates:
```yaml
# Namespace
kind: Namespace
name: vaultguard-demo

# Persistent Volume Claim (10Gi)
kind: PersistentVolumeClaim
name: uploads-pvc
accessModes: [ReadWriteOnce]
storage: 10Gi

# File Uploader Deployment (nginx + storage)
kind: Deployment
name: file-uploader
volumeMounts: /data/uploads → uploads-pvc

# Service (NodePort)
kind: Service
name: file-uploader-svc
port: 80 → 31000 (NodePort)
```

**vaultguard-api-deployment.yaml** creates:
```yaml
# Backend API pod (same namespace, mounts same PVC)
kind: Deployment
name: vaultguard-api
image: vaultguard-backend:latest
volumeMounts: /data/uploads → uploads-pvc  (shared with file-uploader)
env:
  PORT: 3001
  UPLOAD_DIR: /data/uploads
```

Both pods mount the **same PVC**, meaning files uploaded via the API are immediately visible to the file-uploader pod and can be snapshotted by Velero.

---

## 10. File Upload — Auto Backup Feature

### The User Journey

```
1. User navigates to "Data Source (Upload)" page
2. Drags and drops a .xlsx or .csv file onto the dropzone
3. Clicks "Upload to Persistent Volume"
4. File appears in "Live PVC Contents" panel on the right (timestamped)
5. Navigates to "Backups" page
6. Sees a new "auto-sync-*" backup entry at the top of the list
7. Dashboard KPIs update — Total Backups increases by 1
```

### How File Versioning Works

Every file uploaded gets a timestamp suffix:

```
Input:   "manish's TT sheet.xlsx"
Output:  "manish's TT sheet__20260301_142215.xlsx"
         └─── YYYYMMDD_HHMMSS ───┘
```

This means uploading the same file multiple times creates **a full revision history** in the PVC — like Git for your data files.

### How the Backup is Triggered

When `POST /api/files/upload` receives a file:

```javascript
// 1. Save file with versioned name
multer → backend/uploads/filename__timestamp.ext

// 2. Create backup record in DB
db.backups.unshift({
  id: `bkp-auto-${Date.now()}`,
  name: `auto-sync-${filename.substring(0, 28)}`,
  type: 'incremental',
  status: 'completed',
  size: `${fileSizeInMB} MB`
  // ...
});

// 3. React Query sees new data → UI updates
```

---

## 11. API Reference

All endpoints are on `http://localhost:3001`

### Metrics & Monitoring

#### `GET /api/metrics`
Returns aggregated dashboard data.

**Response:**
```json
{
  "totalBackups": 3,
  "successRate": 67,
  "totalStorageGB": "14.5",
  "activeClusters": 3,
  "backupsToday": 3,
  "restoresToday": 1,
  "failedToday": 1,
  "storageByType": [
    { "name": "Full", "value": 12.4, "fill": "hsl(210,100%,56%)" },
    { "name": "Snapshot", "value": 2.1, "fill": "hsl(142,71%,45%)" }
  ],
  "backupHistory": [
    { "date": "Feb 15", "success": 8, "failed": 1 }
  ],
  "drStats": { "lastDrTest": "...", "rpoAchieved": "58m", "rtoAchieved": "4m 12s", "status": "passed" },
  "alerts": [{ "id": "a1", "title": "Storage Threshold reached", "severity": "warning" }]
}
```

---

#### `GET /api/alerts`
Returns all unresolved system alerts.

---

### Backups

#### `GET /api/backups`
Returns all backup jobs (newest first).

**Response:** Array of `BackupJob` objects.

---

#### `POST /api/backups`
Triggers a new manual backup job.

**Request Body:**
```json
{
  "name": "prod-db-backup",
  "cluster": "prod-main-cluster",
  "namespace": "database",
  "pvcName": "pg-data-v1",
  "type": "full",
  "retentionDays": 30
}
```

**Response:** `201 Created` with the new `BackupJob` object.

---

### Schedules (Policies)

#### `GET /api/schedules`
Returns all backup policies.

---

#### `POST /api/schedules`
Creates a new backup policy. **Automatically triggers Bootstrap Backup + DR Verification.**

**Request Body:**
```json
{
  "name": "Hourly Postgres",
  "cluster": "prod-main-cluster",
  "namespace": "database",
  "cron": "0 * * * *",
  "pvcSelector": "app=postgres"
}
```

**Response:** `201 Created` + new schedule. Side-effects: 1 backup + 1 DR restore auto-created.

---

### Restores

#### `GET /api/restores`
Returns all restore jobs.

---

#### `POST /api/restores`
Initiates a restore from a backup.

**Request Body:**
```json
{
  "backupId": "bk-1",
  "targetCluster": "prod-main-cluster",
  "targetNamespace": "database-restore",
  "targetPVC": "pg-data-restored"
}
```

---

### Clusters

#### `GET /api/clusters`
Returns all registered clusters.

---

#### `POST /api/clusters`
Registers a new Kubernetes cluster.

**Request Body:**
```json
{
  "name": "new-prod-cluster",
  "provider": "AWS",
  "region": "ap-south-1",
  "nodesCount": 6,
  "version": "1.29.0"
}
```

---

### File Upload

#### `POST /api/files/upload`
Uploads a CSV/Excel file to the PVC. **Automatically creates a backup record.**

**Request:** `multipart/form-data` with field `file`

**Response:**
```json
{
  "message": "File uploaded and backup triggered.",
  "data": {
    "fileName": "data.xlsx",
    "versionedName": "data__20260301_142215.xlsx",
    "size": 12800,
    "uploadedAt": "2026-03-01T08:52:15.000Z"
  },
  "backup": { "id": "bkp-auto-...", "name": "auto-sync-data", "status": "completed" }
}
```

---

#### `GET /api/files`
Lists all versioned files in the PVC (sorted newest first).

---

#### `GET /api/files/:name`
Downloads a specific versioned file.

---

## 12. Data Models (Schemas)

### BackupJob
```typescript
interface BackupJob {
  id: string;               // "bk-1"
  name: string;             // "postgres-daily-backup"
  cluster: string;          // "prod-main-cluster"
  namespace: string;        // "database"
  pvcName: string;          // "pg-data-v1"
  type: "full" | "incremental" | "snapshot";
  status: "completed" | "running" | "failed" | "pending";
  size: string;             // "12.4 GB"
  duration: string;         // "4m 12s"
  startedAt: string;        // ISO timestamp
  retentionDays: number;    // 30
  encrypted: boolean;       // true
  errorMessage?: string;    // Present only if status = "failed"
  sourceSchedule?: string;  // ID of originating schedule (auto-backups)
}
```

### Schedule (Policy)
```typescript
interface Schedule {
  id: string;
  name: string;           // "Database Hourly"
  cluster: string;
  namespace: string;
  cron: string;           // "0 * * * *"
  pvcSelector: string;    // "app=postgres" or "*"
  nextRun: string;        // ISO timestamp
  enabled: boolean;
}
```

### RestoreJob
```typescript
interface RestoreJob {
  id: string;
  backupId: string;
  backupName: string;
  targetCluster: string;
  targetNamespace: string;
  targetPVC: string;
  status: "completed" | "running" | "failed";
  startedAt: string;
  completedAt: string;
  initiatedBy: "user" | "SYSTEM-WATCHER";
}
```

### Cluster
```typescript
interface Cluster {
  id: string;
  name: string;           // "prod-main-cluster"
  provider: "AWS" | "GCP" | "Azure" | "On-Prem";
  region: string;         // "us-east-1"
  status: "online" | "offline" | "degraded";
  nodesCount: number;
  pvcsCount: number;
  backupSchedules: number;
  lastBackup: string;     // ISO timestamp
  version: string;        // "1.28.0"
}
```

### Alert
```typescript
interface Alert {
  id: string;
  title: string;
  desc: string;
  severity: "info" | "warning" | "high" | "critical";
  time: string;
  resolved: boolean;
}
```

---

## 13. Environment Variables & Config

### Backend (`backend/`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Express server port |
| `UPLOAD_DIR` | `./uploads` | Where uploaded files are saved |
| `MODE` | `DEMO_MODE` | `DEMO_MODE` (seeded data) or `PROD_MODE` (empty DB) |
| `VELERO_PATH` | `velero` | Full path to velero binary if not in $PATH |

### Frontend (`frontend/`)

The API base URL is hardcoded to `http://localhost:3001` in `src/api/client.ts`. For production deployment, replace with an environment variable:

```typescript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
```

Add to `frontend/.env`:
```
VITE_API_URL=https://your-backend-domain.com
```

---

## 14. Setup & Running Locally

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- **Git**
- *(Optional for real K8s)* Minikube or Kind + Velero CLI installed

### Step 1: Clone the Repository

```bash
git clone https://github.com/kaku-manish/Automatic-Restore-Backup-for-kubernetes.git
cd Automatic-Restore-Backup-for-kubernetes
```

### Step 2: Start the Backend

```bash
cd backend
npm install
node server.js
```

You should see:
```
VaultGuard API running on http://localhost:3001
File uploads stored at: .../backend/uploads
```

### Step 3: Start the Frontend

Open a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

You should see:
```
VITE v5.4.19  ready in 376ms
➜  Local:   http://localhost:8080/
```

### Step 4: Open the App

Navigate to **http://localhost:8080** in your browser.

You will see:
- Dashboard with 3 backups, 67% success rate, 14.5 GB storage, 3 clusters
- All pages populated with realistic seed data
- Fully interactive forms (New Backup, New Schedule, Add Cluster, New Restore)
- Data Source (Upload) page ready to accept CSV/Excel files

---

## 15. Kubernetes Deployment

### Apply the Demo App (PVC + File Uploader Pod)

```bash
kubectl apply -f backend/k8s/vaultguard-demo-app.yaml
```

This creates:
- Namespace: `vaultguard-demo`
- PVC: `uploads-pvc` (10Gi, ReadWriteOnce)
- Deployment: `file-uploader` (nginx serving /data/uploads)
- Service: `file-uploader-svc` (NodePort 31000)

### Apply the Backend API Pod

```bash
kubectl apply -f backend/k8s/vaultguard-api-deployment.yaml
```

This creates:
- Deployment: `vaultguard-api` running `node server.js`
- Mounts the same `uploads-pvc` at `/data/uploads`
- Environment: `PORT=3001`, `UPLOAD_DIR=/data/uploads`

### Verify Everything is Running

```bash
kubectl get all -n vaultguard-demo
```

Expected output:
```
NAME                                   READY   STATUS    RESTARTS
pod/file-uploader-xxx                  1/1     Running   0
pod/vaultguard-api-xxx                 1/1     Running   0

NAME                        TYPE       PORT(S)
service/file-uploader-svc  NodePort   80:31000/TCP
```

### Access the API in Cluster

```bash
# Port-forward the backend API to localhost
kubectl port-forward -n vaultguard-demo svc/vaultguard-api-svc 3001:3001
```

---

## 16. Feature Flags — Demo vs Production

The backend supports a `MODE` environment variable:

### DEMO_MODE (default)
- In-memory DB is seeded with realistic data (3 clusters, 3 backups, 4 schedules)
- Velero CLI calls are **simulated** (no real K8s cluster needed)
- Perfect for presentations, UI development, and testing

### PROD_MODE
- DB starts empty (no seed data)
- All Velero CLI calls are **real** — requires a live Kubernetes cluster with Velero installed
- BackupWatcher actively polls real Velero status

**To switch to production mode:**
```bash
MODE=PROD_MODE node server.js
```

---

## 17. Security Considerations

| Area | Current State | Production Recommendation |
|------|--------------|--------------------------|
| **Authentication** | None (open API) | Add JWT middleware (e.g., `express-jwt`) |
| **File Uploads** | Accept any file type | Restrict to `.csv`, `.xlsx` only using Multer fileFilter |
| **DR Namespaces** | Auto-created isolated (`dr-test-*`) | Add RBAC to restrict DR namespace access |
| **Secrets** | Hardcoded in code | Use Kubernetes Secrets or Vault for S3 credentials |
| **CORS** | `*` (all origins) | Restrict to specific frontend domain |
| **HTTPS** | None locally | Add TLS termination via Ingress/nginx |
| **Rate Limiting** | None | Add `express-rate-limit` middleware |

---

## 18. Known Limitations & Future Roadmap

### Current Limitations

1. **In-memory DB** — all data is lost when the server restarts. A persistent database (PostgreSQL, MongoDB) is required for production.
2. **Single-user** — no authentication or multi-tenancy. All users see the same data.
3. **Demo Velero** — in DEMO_MODE, backups are simulated. Real Velero integration requires a live cluster.
4. **No pagination** — all lists load all records. Large datasets may be slow.
5. **React Router warnings** — v6→v7 future flags (`v7_startTransition`, `v7_relativeSplatPath`) are not yet enabled.

### Roadmap

| Feature | Priority | Status |
|---------|----------|--------|
| PostgreSQL persistent database | 🔴 High | Not started |
| JWT authentication + user roles | 🔴 High | Not started |
| Real Velero CRD watching (K8s informers) | 🔴 High | Partially done (veleroClient.js) |
| Email/Slack alerting integration | 🟡 Medium | Not started |
| Multi-tenancy (per-team namespaces) | 🟡 Medium | Not started |
| Backup cost estimation (S3 pricing) | 🟡 Medium | Not started |
| Mobile-responsive UI improvements | 🟢 Low | Partially done |
| Dark/Light mode toggle | 🟢 Low | Dark mode fixed |
| Velero schedule CR creation | 🟢 Low | Not started |

---

## 19. Glossary

| Term | Definition |
|------|-----------|
| **PVC** | PersistentVolumeClaim — a Kubernetes object that provisions durable storage for pods |
| **Velero** | CNCF open-source tool for Kubernetes backup, restore, and migration |
| **CSI** | Container Storage Interface — K8s standard for storage plugins; Velero uses CSI for volume snapshots |
| **RPO** | Recovery Point Objective — maximum acceptable data loss measured in time (e.g., 1 hour) |
| **RTO** | Recovery Time Objective — maximum acceptable time to restore service after failure |
| **DR** | Disaster Recovery — the process of restoring systems after a catastrophic event |
| **Shadow Restore** | Kubmanger's automated post-backup restore into an isolated namespace to prove recoverability |
| **Bootstrap Backup** | An immediate full backup triggered the moment a new schedule/policy is created |
| **In-memory DB** | Data stored in a JavaScript object (`const db = {...}`) — fast, but not persistent across restarts |
| **TanStack Query** | React library (formerly React Query) for fetching, caching, and syncing server state |
| **Multer** | Node.js middleware for handling `multipart/form-data` (file uploads) |
| **ESM** | ECMAScript Modules — the modern `import/export` format used in this project (`"type": "module"`) |
| **BackupWatcher** | Kubmanger's background polling service that syncs Velero backup statuses into the DB every 30s |
| **Namespace Remapping** | Restoring resources into a different namespace than where they were backed up from |
| **MinIO** | Open-source S3-compatible object storage — used as the local Velero backend in dev |

---

*Document prepared March 2026 · Kubmanger v1.0 · [GitHub Repository](https://github.com/kaku-manish/Automatic-Restore-Backup-for-kubernetes)*
