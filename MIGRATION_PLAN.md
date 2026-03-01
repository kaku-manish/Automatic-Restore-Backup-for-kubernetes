# VaultGuard UI Migration Plan: Backend Automation Integration

## 1. Overview & Strategy
The goal of this migration is to switch K8s VaultGuard from a static, manually-updated UI to a fully autonomous, data-driven platform **without altering a single pixel of the current React layout**.

We will achieve this by adhering strictly to the **Data Contract (JSON Schema)** currently used by the frontend components. TanStack Query (React Query) is already implemented in the project, making this a smooth "drop-in" replacement of the data source.

---

## 2. The Golden Rule
**Do not modify `.tsx` layout structures.**
If the UI expects `b.size` to be a string like `"12.4 GB"`, the new Node.js backend must return `"12.4 GB"`. If the backend returns `12400000000` (bytes), the visualization will break. All data transformation must occur in the backend `metricsEngine.js` before the payload reaches the browser.

---

## 3. Implementation of Feature Flags (`DEMO_MODE` vs `PROD_MODE`)
To allow for safe demonstrations and seamless developer onboarding, the `server.js` file will be refactored to support feature flags via Environment Variables.

*   `MODE=DEMO`: The in-memory database initializes with pre-populated AWS/GCP clusters, 3 historical backups, and simulated activity trends. Great for showing a populated dashboard immediately.
*   `MODE=PROD`: The database initializes completely blank (`{ backups: [], clusters: [], ... }`). Real objects are only created when the user interacts with the UI or the watcher detects existing K8s objects.

---

## 4. Page-by-Page Integration Steps

### Step 1: Global API Client (`src/api/client.ts`)
*   **Action**: Ensure all `fetch()` calls point to the correct dynamically matched backend URL `http://localhost:3001/api`.
*   **Risk**: CORS issues.
*   **Mitigation**: The Express backend already implements `app.use(cors())`.

### Step 2: Dashboard (`src/pages/Dashboard.tsx`)
*   **Current State**: Relies on static arrays (`storageByType`, `backupHistory`).
*   **Action**: 
    1.  Update the `useQuery(['metrics'])` to pull from `/api/metrics`.
    2.  Map `metrics.dashboard.storageByType` directly into the `<PieChart>` component.
    3.  Map `metrics.dashboard.backupHistory` directly into the `<BarChart>` component.
*   **Verification**: Ensure charts render 0s instead of collapsing when the DB is empty. (Handled safely by `metricsEngine.js`).

### Step 3: Schedules (`src/pages/Schedules.tsx`)
*   **Current State**: Saves to static array without triggering backups.
*   **Action**: Continue using `mutation.mutate(formData)`. The UI remains untouched. The backend (`POST /api/schedules`) will now intercept this, save the policy, and immediately fire off the *Bootstrap Backup*.
*   **Verification**: Creating a policy should instantly show a toast, and navigating to the "Backups" page should show a new `bootstrap-*` backup running.

### Step 4: Backups (`src/pages/Backups.tsx`)
*   **Current State**: Manual creation adds a static line to a table.
*   **Action**: No UI changes needed! The `useQuery(['backups'])` automatically polls the backend. The newly added `BackupWatcher` in Node.js will mutate the state from "Pending" -> "Running" -> "Completed", and React Query will reflect this live in the table.

### Step 5: Restore (`src/pages/Restore.tsx`)
*   **Current State**: Basic form that does nothing.
*   **Action**: Map the form's "Target Namespace" field to `POST /api/restores`. The backend's `restoreService` will handle the Velero namespace remapping automatically.

### Step 6: Monitoring (`src/pages/Monitoring.tsx`)
*   **Current State**: Static duration/growth charts.
*   **Action**: Point the line charts to `metrics.monitoring.durationData` and `metrics.monitoring.storageGrowthData`. The backend shapes this precisely as Recharts expects it: `[{ name: 'Backup1', duration: 120 }, ...]`.

### Step 7: Disaster Recovery (New Tab/Component)
*   **Action**: Create a new page `DR.tsx` that fetches from `GET /api/dr-tests`. Map the table to display: `id`, `backupName`, `testNamespace`, `status`, `duration`, and importantly, the `evidence` (terminal command output) in a code block.

---

## 5. Rollback Plan

If the new backend integration causes critical UI failures during a demo, follow this rapid rollback sequence:

### 1. Revert to Static Mock Data
If the API goes down, we will maintain a `mockData.ts` file in the frontend.
```typescript
// If the fetch fails, return the local constant instead of crashing
export const fetchBackups = async () => {
    try {
        const res = await fetch(`${API_BASE}/backups`);
        if (!res.ok) throw new Error("API Down");
        return await res.json();
    } catch (e) {
        console.warn("Falling back to local mock data.");
        return MOCK_BACKUPS; 
    }
};
```

### 2. Bypass K8s Watcher (Local Only)
If Velero is not installed or the K8s API is unreachable, the backend API commands (`velero backup create`) will fail. 
*   **Action**: Disable the webhook/child_process executors by setting `DEMO_MODE=true` in the Node environment. The Node.js server will revert to immediately marking backups as "completed" using a 3-second `setTimeout()` instead of consulting actual Kubernetes clusters, preserving the interactive demo experience.
