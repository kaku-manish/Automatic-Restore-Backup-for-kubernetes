<div align="center">

# ☁️ Kubmanger — Automatic Restore & Backup for Kubernetes

**An autonomous, self-healing Kubernetes data protection platform.**

Backup → Verify → Restore. Fully automated. Zero manual steps.

[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![Velero](https://img.shields.io/badge/Engine-Velero-326CE5?style=for-the-badge&logo=kubernetes)](https://velero.io)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

</div>

---

## 🚀 What Is This?

**Kubmanger** is a production-grade Kubernetes backup and disaster recovery control plane. It wraps **Velero** with a beautiful UI and a fully automated backend pipeline that:

1. **Detects** when new data arrives (file upload, schedule trigger)
2. **Backs it up instantly** via Velero into S3-compatible object storage
3. **Automatically validates** the backup by restoring it into an isolated DR namespace
4. **Alerts** you if anything goes wrong — before you even notice

> Think of it as your Kubernetes "Time Machine" — but with autonomous self-verification.

---

## 🏗️ System Architecture

```mermaid
graph TB
    subgraph CLIENT["🖥️ Client Layer — React + Vite (Port 8080)"]
        D["📊 Dashboard"]
        B["💾 Backups"]
        S["📅 Schedules"]
        R["🔄 Restore"]
        C["🏢 Clusters"]
        M["📈 Monitoring"]
        DR["🚨 Disaster Recovery"]
        U["📤 Data Source Upload"]
    end

    subgraph API["⚡ API Layer — Node.js + Express (Port 3001)"]
        direction TB
        SERVER["🔀 server.js — Main Router"]
        BS["backupService.js"]
        RS["restoreService.js"]
        ME["metricsEngine.js"]
        BW["backupWatcher.js"]
        VC["veleroClient.js"]
        MU["Multer File Handler"]
    end

    subgraph K8S["☸️ Kubernetes Cluster"]
        direction TB
        VEL["Velero Controller"]
        PVC["Persistent Volume Claims"]
        NS_DR["dr-test-* Namespace"]
        NS_PROD["production Namespace"]
    end

    subgraph STORE["🗄️ Storage Layer"]
        S3["MinIO / S3 Bucket"]
        DB["In-Memory DB (backups, clusters, schedules, restores)"]
    end

    CLIENT -->|"REST API calls (JSON)"| SERVER
    SERVER --> BS
    SERVER --> RS
    SERVER --> ME
    SERVER --> MU
    BS --> VC
    RS --> VC
    BW -->|"polls every 30s"| VC
    VC -->|"velero CLI"| VEL
    VEL -->|"snapshot"| PVC
    VEL -->|"store"| S3
    VEL -->|"restore"| NS_DR
    NS_PROD --> PVC
    MU -->|"saves file"| PVC
    BS --> DB
    RS --> DB
    ME --> DB
    BW --> DB
```

---

## 🔄 Full Automation Workflow

```mermaid
sequenceDiagram
    actor User
    participant UI as React UI
    participant API as Express API
    participant DB as In-Memory DB
    participant Velero as Velero Controller
    participant S3 as MinIO / S3
    participant DR as DR Namespace

    User->>UI: Upload CSV/Excel File
    UI->>API: POST /api/files/upload
    API->>DB: Save file to backend/uploads/
    API->>DB: Create auto-backup record
    API-->>UI: 201 Created + backup info
    UI->>UI: Refresh Backups page

    Note over API,Velero: 🔁 Automation Pipeline Starts

    API->>Velero: velero backup create auto-sync-*
    Velero->>DB: Backup status = Running
    Velero->>S3: Snapshot PVC data
    S3-->>Velero: Stored ✅
    Velero->>DB: Backup status = Completed

    Note over Velero,DR: 🧪 Automatic DR Verification

    Velero->>DR: Restore backup → dr-test-* namespace
    DR-->>Velero: Restore validated ✅
    Velero->>DB: DR stats updated (RPO / RTO)
    DB-->>UI: Monitoring page refreshes
```

---

## 📅 Bootstrap Backup Pipeline (New Schedule → Instant Protection)

```mermaid
flowchart LR
    A([👤 User creates\na new Schedule]) --> B[/POST \/api\/schedules/]
    B --> C[(Save to DB)]
    C --> D{{"⚡ AUTOMATION 1\nBootstrap Backup"}}
    D --> E[Create full backup\ninstantly]
    E --> F[(Backup record\nadded to DB)]
    F --> G{{"🧪 AUTOMATION 2\nDR Verification"}}
    G --> H[Restore backup to\nisolated dr-test-*\nnamespace]
    H --> I{Validation\npassed?}
    I -->|Yes ✅| J[(Update DR Stats\nstatus = passed)]
    I -->|No ❌| K[(Create Alert\nseverity = critical)]
    J --> L([🟢 Dashboard updated])
    K --> L
```

---

## 🔁 Backup State Machine

```mermaid
stateDiagram-v2
    [*] --> Pending : Backup triggered

    Pending --> Running : Velero picks up job
    Running --> Completed : Snapshot successful
    Running --> Failed : PVC error / timeout

    Completed --> DRVerifying : Auto DR test starts
    DRVerifying --> DRPassed : Restore validated ✅
    DRVerifying --> DRFailed : Validation error ❌

    DRPassed --> [*]
    DRFailed --> AlertGenerated : High severity alert
    AlertGenerated --> [*]

    Failed --> AlertGenerated : Backup failed alert
```

---

## 📤 File Upload → Automatic Backup Flow

```mermaid
flowchart TD
    A([📁 User selects\nCSV or Excel file]) --> B[Data Source Upload\npage in UI]
    B --> C[POST /api/files/upload\nmultipart/form-data]
    C --> D{File received\nby Multer?}
    D -->|No| E[❌ 400 Bad Request]
    D -->|Yes| F[Save file with\ntimestamp version\nfilename__YYYYMMDD_HHMMSS.xlsx]
    F --> G[Emit FILE_UPDATED\nevent internally]
    G --> H[Create backup DB record\ntype = incremental\nstatus = completed]
    H --> I[POST /api/backups\nauto-created in DB]
    I --> J[(DB updated)]
    J --> K[React Query\nauto-refetch triggers]
    K --> L([✅ Backups page shows\nnew auto-sync backup\ninstantly])
```

---

## 📊 Metrics Engine — How the Dashboard Works

```mermaid
flowchart LR
    subgraph SOURCE["📦 Data Sources"]
        DB1[Backups Array]
        DB2[Clusters Array]
        DB3[Restores Array]
        DB4[DR Stats Object]
        DB5[Alerts Array]
    end

    subgraph ENGINE["⚙️ metricsEngine.js"]
        M1[Total Backups Count]
        M2[Success Rate %]
        M3[Storage Used GB]
        M4[Active Clusters]
        M5[7-Day Activity History]
        M6[Storage by Type\nFull / Incremental / Snapshot]
    end

    subgraph CHARTS["📈 Dashboard Charts"]
        C1[KPI Stat Cards]
        C2[Bar Chart\nBackup Activity 7 Days]
        C3[Donut Chart\nStorage by Type]
        C4[Alert Badge]
        C5[DR Stats Panel]
    end

    DB1 --> M1
    DB1 --> M2
    DB1 --> M3
    DB1 --> M5
    DB1 --> M6
    DB2 --> M4
    DB3 --> M1
    DB4 --> C5
    DB5 --> C4
    M1 --> C1
    M2 --> C1
    M3 --> C1
    M4 --> C1
    M5 --> C2
    M6 --> C3
```

---

## 🗂️ API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/metrics` | Dashboard KPIs, charts, DR stats, alerts |
| `GET` | `/api/backups` | List all backup jobs |
| `POST` | `/api/backups` | Trigger a manual backup |
| `GET` | `/api/schedules` | List all backup policies |
| `POST` | `/api/schedules` | Create policy → auto-triggers bootstrap backup + DR test |
| `GET` | `/api/restores` | List all restore jobs |
| `POST` | `/api/restores` | Initiate a manual restore |
| `GET` | `/api/clusters` | List all connected K8s clusters |
| `POST` | `/api/clusters` | Register a new cluster |
| `GET` | `/api/alerts` | List active system alerts |
| `POST` | `/api/files/upload` | Upload file to PVC → triggers instant backup |
| `GET` | `/api/files` | List all versioned files in PVC |
| `GET` | `/api/files/:name` | Download a specific file version |

---

## ⚡ Quick Start

### 1. Start the Backend API
```bash
cd backend
npm install
node server.js
# ✅ VaultGuard API running on http://localhost:3001
```

### 2. Start the Frontend UI
```bash
cd frontend
npm install
npm run dev
# ✅ UI running on http://localhost:8080
```

---

## 🧩 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Radix UI |
| **Data Fetching** | TanStack Query (React Query) with auto-refetch |
| **Charts** | Recharts (Bar + Donut charts) |
| **Animations** | Framer Motion |
| **Backend** | Node.js, Express 5, ESM modules |
| **File Handling** | Multer (multipart upload with timestamp versioning) |
| **K8s Integration** | Velero CLI via `child_process`, `@kubernetes/client-node` |
| **Storage** | MinIO / AWS S3 (via Velero backend) |
| **Containerisation** | Docker + Kubernetes Deployments |

---

## 🌐 Application Pages

| Page | Route | Purpose |
|------|-------|---------|
| Dashboard | `/` | Live KPIs, charts, alerts, DR health |
| Backups | `/backups` | All backup jobs with status, size, type |
| Schedules | `/schedules` | Backup policies + cron config |
| Restore | `/restore` | Initiate and track restores |
| Clusters | `/clusters` | Multi-cluster overview |
| Monitoring | `/monitoring` | Detailed metrics + trends |
| Disaster Recovery | `/disaster-recovery` | DR test results + RPO/RTO |
| Data Source | `/upload-demo` | Upload CSV/Excel → triggers instant backup |
| Architecture | `/architecture` | Visual system diagram |

---

## 🛡️ Key Design Decisions

- **Single unified backend** — all routes including file upload run on one Express server (port 3001), no separate processes needed
- **Stateless in-memory DB** — seeded with realistic data on startup for demo/dev; swap to PostgreSQL/MongoDB in production
- **Isolated DR namespaces** — automated restores always go to `dr-test-*` namespaces, never touching production data
- **Timestamp file versioning** — uploaded files saved as `filename__YYYYMMDD_HHMMSS.ext` for full history
- **React Query auto-refetch** — UI polls backend every 30s automatically so data stays fresh without manual refresh

---

<div align="center">

Built with ❤️ by [kaku-manish](https://github.com/kaku-manish)

</div>
