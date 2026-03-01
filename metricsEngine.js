export const computeMetrics = (db) => {
    const now = new Date();

    // Core KPIs
    const totalBackups = db.backups.length;
    const completedBackups = db.backups.filter(b => b.status === "completed");
    const failedBackups = db.backups.filter(b => b.status === "failed");

    const successRate = totalBackups === 0 ? 0 : Math.round((completedBackups.length / totalBackups) * 100);

    // Storage Used (Parse out "GB" string from demo data, e.g., "12.4 GB" -> 12.4)
    const storageUsedGB = completedBackups.reduce((sum, b) => {
        const num = parseFloat(b.size) || 0;
        return sum + num;
    }, 0).toFixed(1);

    // Storage By Type Chart Data (Fallback 0 to prevent render issues)
    const storageByType = [
        { name: "Full", value: completedBackups.filter(b => b.type === "full").reduce((s, b) => s + (parseFloat(b.size) || 0), 0) || 0, fill: "hsl(210, 100%, 56%)" },
        { name: "Incremental", value: completedBackups.filter(b => b.type === "incremental").reduce((s, b) => s + (parseFloat(b.size) || 0), 0) || 0, fill: "hsl(280, 80%, 60%)" },
        { name: "Snapshot", value: completedBackups.filter(b => b.type === "snapshot" || b.type === "full-snapshot").reduce((s, b) => s + (parseFloat(b.size) || 0), 0) || 0, fill: "hsl(142, 71%, 45%)" }
    ];

    // 7-Day Activity Trends
    const backupHistoryMap = new Map();
    // Initialize exactly 7 days back with 0s to guarantee Recharts renders properly even if DB is empty
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateKey = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        backupHistoryMap.set(dateKey, { date: dateKey, success: 0, failed: 0 });
    }

    db.backups.forEach(b => {
        if (!b.startedAt) return;
        const d = new Date(b.startedAt);
        // Only count within last 7 days
        if ((now - d) / (1000 * 60 * 60 * 24) <= 7) {
            const dateKey = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (backupHistoryMap.has(dateKey)) {
                const entry = backupHistoryMap.get(dateKey);
                if (b.status === "completed") entry.success++;
                if (b.status === "failed") entry.failed++;
            }
        }
    });

    const backupHistory = Array.from(backupHistoryMap.values());

    // Generate Dynamic Alerts
    const activeAlerts = [];

    // 1. Failed Backup Alert
    const recentFailed = failedBackups.filter(b => (now - new Date(b.startedAt)) < 86400000); // last 24h
    if (recentFailed.length > 0) {
        activeAlerts.push({
            id: `alert-failed-${Date.now()}`,
            title: "Backup Failures Detected",
            desc: `${recentFailed.length} backup(s) failed in the last 24 hours. Check Velero logs.`,
            severity: "critical",
            time: "Recent",
            resolved: false
        });
    }

    // 2. High Storage Warning
    if (parseFloat(storageUsedGB) > 100) { // Arbitrary threshold for demo
        activeAlerts.push({
            id: `alert-storage-${Date.now()}`,
            title: "High Storage Usage",
            desc: `Total backup volume has exceeded 100GB threshold (${storageUsedGB}GB used).`,
            severity: "warning",
            time: "System",
            resolved: false
        });
    }

    return {
        dashboard: {
            totalBackups,
            successRate,
            totalStorageGB: storageUsedGB,
            activeClusters: db.clusters.filter(c => c.status === "online").length,
            backupsToday: db.backups.filter(b => (now - new Date(b.startedAt)) < 86400000).length,
            restoresToday: db.restores ? db.restores.filter(r => (now - new Date(r.startedAt)) < 86400000).length : 0,
            failedToday: recentFailed.length,
            storageByType,
            backupHistory,
            drStats: db.drStats || { status: "unknown", lastDrTest: null }
        },
        monitoring: {
            successRateTrend: backupHistory, // Re-use the data structure for simplicity
            storageGrowthData: generateStorageGrowth(completedBackups),
            durationData: generateDurationTrends(completedBackups),
            alerts: activeAlerts.concat(db.alerts || []).filter(a => !a.resolved)
        }
    };
};

// Helper: Parse "4m 12s" into total seconds for charting
const parseDurationSeconds = (str) => {
    if (!str) return 0;
    const match = str.match(/(?:(\d+)m\s*)?(?:(\d+)s)?/);
    if (!match) return 0;
    const mins = parseInt(match[1] || '0', 10);
    const secs = parseInt(match[2] || '0', 10);
    return (mins * 60) + secs;
};

const generateDurationTrends = (completedBackups) => {
    // Sort oldest to newest
    const sorted = [...completedBackups].sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt)).slice(-10); // Last 10
    if (sorted.length === 0) return [{ name: "No Data", duration: 0 }];

    return sorted.map(b => ({
        name: b.name.substring(0, 10) + '...', // Shorten for UI
        duration: parseDurationSeconds(b.duration)
    }));
};

const generateStorageGrowth = (completedBackups) => {
    const sorted = [...completedBackups].sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt));
    if (sorted.length === 0) return [{ date: "No Data", storage: 0 }];

    let cumulativeGB = 0;
    return sorted.map(b => {
        cumulativeGB += (parseFloat(b.size) || 0);
        return {
            date: new Date(b.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            storage: parseFloat(cumulativeGB.toFixed(1))
        };
    });
};
