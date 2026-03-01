# Kubmanger: Autonomous Kubernetes Resilience Platform

## 1. Project Overview
**Kubmanger** is a production-grade management platform designed to prevent data loss for Kubernetes persistent volumes. It provides a centralized "Control Plane" for orchestrating backups, automating disaster recovery tests, and monitoring cluster health across multi-cloud environments (AWS, GCP, Azure).

Building upon industry standards like **Velero**, **CSI snapshots**, and **Prometheus**, Kubmanger transforms manual backup procedures into a fully autonomous resilience pipeline.

---

## 2. Core Modules & Features
- **Unified Dashboard**: Real-time overview of total storage used, success rates, and active cluster health.
- **Backup Management**: Granular control over volume snapshots with support for Full, Incremental, and Snapshot types.
- **Automated Scheduling**: Cron-based policy engine with a `pvcSelector` for precise workload targeting.
- **Safety-First Restore**: One-click recovery into specific namespaces with built-in "Shadow Restore" validation.
- **Multi-Cluster Support**: Manage AWS, Azure, and GCP clusters from a single pane of glass.
- **Live Monitoring**: High-fidelity charts showing success trends, storage growth, and backup latency.
- **Disaster Recovery (DR)**: Automated RPO/RTO calculation and evidence-based recovery testing.

---

## 3. High-Level Architecture
### Frontend (React + Vite)
- **UI/UX**: Dark-themed, glassmorphic design using Tailwind CSS and Framer Motion for smooth transitions.
- **State Management**: React Query for robust caching, background refetching, and optimistic UI updates.
- **Data Visualization**: Recharts for responsive, interactive monitoring graphs.

### Backend (Node.js + Express)
- **API Engine**: RESTful service managing the resilience database and orchestrating K8s operations.
- **Autonomous Watcher**: An internal logic engine that monitors backup completion events and triggers secondary verification tasks.

---

## 4. The Automation Pipeline (VaultGuard Orchestrator)
The project distinguishes itself through its **End-to-End Automation** logic:

1.  **Bootstrap Pipeline**: Creating a new schedule immediately triggers a "Bootstrap Backup." This ensures that data protection starts at Minute 0, rather than waiting for the next cron cycle.
2.  **DR Verification Pipeline**: Every completed backup automatically triggers a "Shadow Restore" into an isolated `dr-test-*` namespace. This verifies that the backup data is not just stored, but actually functional.
3.  **Predictive Alerting**: The system continuously monitors the **Recovery Point Objective (RPO)**. If the gap between successful backups exceeds the defined threshold, it automatically generates a high-severity alert.

---

## 5. Technical Stack
- **Languages**: TypeScript, JavaScript
- **Frontend**: React 18, Vite, Tailwind CSS, Radix UI, Lucide Icons
- **Backend**: Node.js, Express.js
- **Formatting & Stability**: ESLint, Vitest, PostCSS
- **Key Libraries**: TanStack Query (React Query), Recharts, Framer Motion, Sonner (Toasts)

---

## 6. Setup & Execution
### Prerequisites
- Node.js (v18+)
- npm or bun

### Running the Project
1. **Clone the repository**
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Start the Backend API**:
   ```bash
   node server.js
   ```
4. **Start the Frontend Dashboard**:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

---

## 7. API Schema Reference
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/metrics` | GET | Aggregated dashboard statistics and chart data. |
| `/api/clusters` | GET/POST | Manage connected Kubernetes clusters. |
| `/api/backups` | GET/POST | View backup history or trigger manual snapshots. |
| `/api/schedules` | GET/POST | Configure automated policies (triggers Bootstrap). |
| `/api/restores` | GET/POST | Execute restores and view DR test history. |
| `/api/alerts` | GET | View system-generated health notifications. |

---

## 8. Summary of Impact
Kubmanger reduces the complexity of Kubernetes data protection by replacing manual verification with **Autonomous Infrastructure**. It provides the confidence levels required for enterprise production workloads by proving recoverability *before* a disaster strikes.
