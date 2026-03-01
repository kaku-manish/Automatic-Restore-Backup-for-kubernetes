export interface BackupJob {
  id: string;
  name: string;
  namespace: string;
  cluster: string;
  pvcName: string;
  status: "completed" | "running" | "failed" | "pending" | "scheduled";
  type: "full" | "incremental" | "snapshot";
  size: string;
  duration: string;
  startedAt: string;
  completedAt: string | null;
  schedule: string;
  storageLocation: string;
  encrypted: boolean;
  retentionDays: number;
  errorMessage?: string;
}

export interface RestoreJob {
  id: string;
  backupId: string;
  backupName: string;
  targetCluster: string;
  targetNamespace: string;
  targetPVC: string;
  status: "completed" | "running" | "failed" | "pending";
  startedAt: string;
  completedAt: string | null;
  initiatedBy: string;
}

export interface Cluster {
  id: string;
  name: string;
  provider: "AWS" | "GCP" | "Azure" | "On-Prem";
  region: string;
  status: "healthy" | "warning" | "degraded" | "offline";
  nodesCount: number;
  pvcsCount: number;
  lastBackup: string;
  backupSchedules: number;
  version: string;
}

export interface BackupSchedule {
  id: string;
  name: string;
  cron: string;
  enabled: boolean;
  lastRun: string;
  nextRun: string;
  cluster: string;
  namespace: string;
  pvcSelector: string;
}

export interface BackupStats {
  totalBackups: number;
  successRate: number;
  totalStorageGB: number;
  activeClusters: number;
  lastBackupTime: string;
  backupsToday: number;
  restoresToday: number;
  failedToday: number;
}
