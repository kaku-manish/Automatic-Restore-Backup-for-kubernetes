import { BackupJob, RestoreJob, Cluster, BackupSchedule, BackupStats } from "@/types/backup";

export const mockStats: BackupStats = {
  totalBackups: 0,
  successRate: 0,
  totalStorageGB: 0,
  activeClusters: 0,
  lastBackupTime: "—",
  backupsToday: 0,
  restoresToday: 0,
  failedToday: 0,
};

export const mockBackupJobs: BackupJob[] = [];

export const mockRestoreJobs: RestoreJob[] = [];

export const mockClusters: Cluster[] = [];

export const mockSchedules: BackupSchedule[] = [];

export const mockBackupHistory: { date: string; success: number; failed: number }[] = [];

export const mockStorageUsage: { name: string; value: number; fill: string }[] = [];
