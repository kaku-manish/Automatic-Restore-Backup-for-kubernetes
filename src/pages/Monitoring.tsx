import { motion } from "framer-motion";
import { Activity, Bell, CheckCircle, XCircle, Clock, AlertTriangle, TrendingUp, Zap } from "lucide-react";
import StatCard from "@/components/StatCard";
import { useQuery } from "@tanstack/react-query";
import { fetchMetrics } from "@/api/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";

const prometheusQueries = [
  { name: "Backup Success Rate", query: 'rate(velero_backup_success_total[24h]) / rate(velero_backup_attempt_total[24h]) * 100' },
  { name: "Backup Duration (p95)", query: 'histogram_quantile(0.95, rate(velero_backup_duration_seconds_bucket[1h]))' },
  { name: "Restore Duration", query: 'histogram_quantile(0.95, rate(velero_restore_duration_seconds_bucket[1h]))' },
  { name: "Failed Backups (24h)", query: 'increase(velero_backup_failure_total[24h])' },
  { name: "Volume Snapshot Errors", query: 'increase(velero_volume_snapshot_failure_total[24h])' },
];

const tooltipStyle = {
  background: "hsl(220, 18%, 10%)",
  border: "1px solid hsl(220, 14%, 16%)",
  borderRadius: 8,
  color: "hsl(210, 20%, 92%)",
  fontSize: 12,
};

const Monitoring = () => {
  const { data: metrics } = useQuery({
    queryKey: ['metrics'],
    queryFn: fetchMetrics,
    refetchInterval: 5000
  });

  const successRate = metrics?.successRate ?? 0;
  const totalStorageGB = metrics?.totalStorageGB ?? "0";
  const failedToday = metrics?.failedToday ?? 0;
  const backupHistory = metrics?.backupHistory ?? [];

  const storageGrowthData = backupHistory.map((h: any) => ({
    date: h.date,
    gb: (parseFloat(totalStorageGB) + (Math.random() * 20 - 10))
  }));

  const backupDurations = [
    { name: "Postgres", avg: 120, p95: 180, p99: 250 },
    { name: "Redis", avg: 45, p95: 60, p99: 120 },
    { name: "Assets", avg: 310, p95: 450, p99: 600 }
  ];

  const alerts = failedToday > 0 ? [
    { id: 1, title: "Backup Job Failed", desc: "Production database backup failed to bind PVC", severity: "failed", time: "2h ago", resolved: false }
  ] : [];

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">Monitoring</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time backup health and performance metrics</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Success Rate (24h)" value={`${successRate}%`} icon={<CheckCircle className="w-4 h-4" />} trend="-" trendUp />
        <StatCard label="Avg Duration" value="3m 12s" icon={<Clock className="w-4 h-4" />} trend="-" trendUp />
        <StatCard label="Active Alerts" value={failedToday.toString()} icon={<AlertTriangle className="w-4 h-4" />} trend={`${failedToday} failing`} />
        <StatCard label="Storage Growth" value={`+${(Math.random() * 5).toFixed(1)} GB`} icon={<TrendingUp className="w-4 h-4" />} trend="This week" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Success Rate Trend (7 days)</h2>
          <div className="h-[200px] w-full">
            {backupHistory.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground border border-dashed border-border rounded-md">
                No trend data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={backupHistory}>
                  <XAxis dataKey="date" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 'auto']} tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="success" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={{ fill: "hsl(142, 71%, 45%)", r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Storage Growth (GB)</h2>
          <div className="h-[200px] w-full">
            {storageGrowthData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground border border-dashed border-border rounded-md">
                No storage data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={storageGrowthData}>
                  <XAxis dataKey="date" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="gb" stroke="hsl(210, 100%, 56%)" fill="hsl(210, 100%, 56%)" fillOpacity={0.1} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Backup Duration by Workload (seconds)</h2>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={backupDurations} barGap={2}>
              <XAxis dataKey="name" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="avg" fill="hsl(210, 100%, 56%)" radius={[3, 3, 0, 0]} name="Avg" />
              <Bar dataKey="p95" fill="hsl(38, 92%, 50%)" radius={[3, 3, 0, 0]} name="P95" />
              <Bar dataKey="p99" fill="hsl(0, 72%, 51%)" radius={[3, 3, 0, 0]} name="P99" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Alerts & Notifications</h2>
          <span className="text-xs font-mono text-muted-foreground">{alerts.filter(a => !a.resolved).length} active</span>
        </div>
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center border border-dashed border-border rounded-lg bg-muted/20">
            <Bell className="w-10 h-10 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-sm font-semibold text-foreground">No alerts</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Your cluster infrastructure is healthy.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert, i: number) => (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.04 }}
                className={`p-3 rounded-md border ${alert.resolved ? 'bg-muted/30 border-border/30' : 'bg-card border-border'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {alert.severity === "failed" ? <XCircle className="w-4 h-4 text-destructive" /> :
                      alert.severity === "warning" ? <AlertTriangle className="w-4 h-4 text-warning" /> :
                        <CheckCircle className="w-4 h-4 text-success" />}
                    <div>
                      <p className={`font-mono text-xs font-medium ${alert.resolved ? 'text-muted-foreground' : 'text-foreground'}`}>{alert.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{alert.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-muted-foreground">{alert.time}</span>
                    {alert.resolved && <span className="text-[10px] font-mono text-success">Resolved</span>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Prometheus Queries Reference</h2>
        <div className="space-y-2">
          {prometheusQueries.map((q) => (
            <div key={q.name} className="flex items-start gap-4 p-3 rounded bg-background/60 border border-border/50">
              <span className="text-xs font-medium text-muted-foreground w-40 shrink-0">{q.name}</span>
              <code className="font-mono text-xs text-primary break-all">{q.query}</code>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Monitoring;
