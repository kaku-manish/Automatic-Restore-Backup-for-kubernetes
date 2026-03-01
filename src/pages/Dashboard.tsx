import { motion } from "framer-motion";
import { HardDrive, CheckCircle, Database, Server, AlertTriangle, Clock, RotateCcw, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchMetrics, fetchBackups } from "@/api/client";
import { mockBackupHistory, mockStorageUsage } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";

const Dashboard = () => {
  const { data: metrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['metrics'],
    queryFn: fetchMetrics,
    refetchInterval: 5000 // Auto-refresh for demo
  });

  const { data: backups = [] } = useQuery({
    queryKey: ['backups'],
    queryFn: fetchBackups
  });

  const totalBackups = metrics?.totalBackups ?? 0;
  const successRate = metrics?.successRate ?? 0;
  const totalStorageGB = metrics?.totalStorageGB ?? "0.0";
  const activeClusters = metrics?.activeClusters ?? 0;
  const storageByType = metrics?.storageByType ?? [];
  const backupHistory = metrics?.backupHistory ?? [];

  const recentBackups = backups.slice(0, 5);

  const tooltipStyle = {
    background: "hsl(220, 18%, 10%)",
    border: "1px solid hsl(220, 14%, 16%)",
    borderRadius: 8,
    color: "hsl(210, 20%, 92%)",
    fontSize: 12,
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Kubernetes volume backup overview</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Backups" value={totalBackups.toLocaleString()} icon={<HardDrive className="w-4 h-4" />} trend="" />
        <StatCard label="Success Rate" value={`${successRate}%`} icon={<CheckCircle className="w-4 h-4" />} trend="" />
        <StatCard label="Storage Used" value={`${totalStorageGB} GB`} icon={<Database className="w-4 h-4" />} trend="" />
        <StatCard label="Active Clusters" value={activeClusters} icon={<Server className="w-4 h-4" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5 lg:col-span-2 min-h-[320px]">
          <h2 className="text-sm font-semibold text-foreground mb-4">Backup Activity (7 days)</h2>
          <div className="h-[240px] w-full">
            {backupHistory.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground border border-dashed border-border rounded-md">
                No backup history available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={backupHistory} barGap={2}>
                  <XAxis dataKey="date" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="success" fill="hsl(142, 71%, 45%)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="failed" fill="hsl(0, 72%, 51%)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-5 min-h-[320px]">
          <h2 className="text-sm font-semibold text-foreground mb-4">Storage by Type</h2>
          <div className="h-[180px] w-full">
            {storageByType.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground border border-dashed border-border rounded-md">
                No storage data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={storageByType} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70} strokeWidth={0}>
                    {storageByType.map((entry: any, i: number) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="space-y-1.5 mt-4">
            {storageByType.map((item: any) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: item.fill }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-mono text-foreground">{(item.value || 0).toFixed(1)} GB</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Recent Backups</h2>
        {recentBackups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-dashed border-border rounded-lg mt-4 bg-muted/20">
            <HardDrive className="w-10 h-10 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-sm font-semibold text-foreground">No backups found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Your recent backup activity will appear here once you create a backup policy.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 data-label">Name</th>
                  <th className="text-left py-2 px-3 data-label">Cluster</th>
                  <th className="text-left py-2 px-3 data-label">Type</th>
                  <th className="text-left py-2 px-3 data-label">Status</th>
                  <th className="text-left py-2 px-3 data-label">Size</th>
                  <th className="text-left py-2 px-3 data-label">Duration</th>
                </tr>
              </thead>
              <tbody>
                {recentBackups.map((job) => (
                  <tr key={job.id} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                    <td className="py-2.5 px-3">
                      <span className="font-mono text-xs text-foreground">{job.name}</span>
                      <p className="text-[10px] text-muted-foreground">{job.pvcName}</p>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">{job.cluster}</td>
                    <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground capitalize">{job.type}</td>
                    <td className="py-2.5 px-3"><StatusBadge status={job.status} /></td>
                    <td className="py-2.5 px-3 font-mono text-xs text-foreground">{job.size}</td>
                    <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">{job.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Dashboard;
