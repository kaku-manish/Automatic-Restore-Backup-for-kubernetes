# Automatic Restore & Backup for Kubernetes
### K8s VaultGuard — Autonomous Kubernetes Resilience Platform

A production-grade Kubernetes backup and disaster recovery platform with automated Velero integration, real-time monitoring, and self-driving DR verification.

---

## 📁 Project Structure

```
├── frontend/          # React + Vite UI (Tailwind, Radix UI, Recharts)
│   ├── src/
│   │   ├── api/       # API client (fetch wrapper for backend)
│   │   ├── pages/     # Dashboard, Backups, Schedules, Restore, Clusters, Monitoring, DR, Upload
│   │   ├── components/# Shared UI components
│   │   └── types/     # TypeScript types
│   ├── package.json   # Frontend dependencies
│   └── vite.config.ts
│
├── backend/           # Node.js + Express API Server
│   ├── server.js      # Main API server (port 3001) — all routes + file upload
│   ├── backupService.js   # Backup orchestration router
│   ├── backupWatcher.js   # Background Velero status poller
│   ├── veleroClient.js    # Velero CLI wrapper
│   ├── restoreService.js  # Manual + automated DR restore logic
│   ├── metricsEngine.js   # Computes dashboard/monitoring metrics
│   ├── backend-uploader.js # Legacy standalone uploader (superseded by server.js)
│   ├── Dockerfile     # Docker image for backend API
│   └── package.json   # Backend dependencies (express, cors, multer)
│
├── uploads/           # CSV/Excel files saved by the file upload API (gitignored)
├── vaultguard-demo-app.yaml       # K8s Namespace + PVC + Deployment + Service
├── vaultguard-api-deployment.yaml # K8s Deployment for backend pod
├── PROJECT_DOCUMENTATION.md
├── VAULTGUARD_ARCHITECTURE.md
└── MIGRATION_PLAN.md
```

---

## 🚀 Quick Start

### 1. Start the Backend API
```bash
cd backend
npm install
node server.js
# Server starts at http://localhost:3001
```

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
# UI starts at http://localhost:8080
```

---

## 🔑 Key Features
- **File Upload → Auto Backup**: Upload CSV/Excel files and instantly trigger Kubernetes backups
- **Bootstrap Backup**: Creating a policy immediately creates the first backup
- **Shadow DR Restore**: After each backup, automatically restores to a safe `dr-test-*` namespace and validates
- **Live Dashboard**: Real-time metrics — success rate, storage used, cluster health, 7-day trends
- **Velero Integration**: Native Velero CLI and Kubernetes CRD management via Node.js

---

## 📡 API Endpoints (Port 3001)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/metrics` | Dashboard KPIs and charts |
| GET/POST | `/api/backups` | List / trigger backups |
| GET/POST | `/api/schedules` | List / create policies (with auto bootstrap backup) |
| GET/POST | `/api/restores` | List / initiate restores |
| GET/POST | `/api/clusters` | List / add clusters |
| POST | `/api/files/upload` | Upload file to PVC and trigger backup |
| GET | `/api/files` | List uploaded file versions |

---

## 🏗️ Kubernetes Setup (Demo)
```bash
# Apply namespace, PVC, pod
kubectl apply -f vaultguard-demo-app.yaml

# Apply backend API deployment (mounts same PVC)
kubectl apply -f vaultguard-api-deployment.yaml
```
