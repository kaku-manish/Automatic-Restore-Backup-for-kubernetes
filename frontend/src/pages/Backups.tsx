import { motion } from "framer-motion";
import { HardDrive, Search, Filter, Plus, Lock, Unlock } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchBackups, createBackup, fetchClusters } from "@/api/client";
import { toast } from "sonner";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BackupJob } from "@/types/backup";

const Backups = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    cluster: "",
    namespace: "",
    pvcName: "",
    type: "",
    startedAt: new Date().toISOString().slice(0, 16),
    retentionDays: "30"
  });

  // Fetch Backups
  const { data: backups = [], isLoading } = useQuery<BackupJob[]>({
    queryKey: ['backups'],
    queryFn: fetchBackups
  });

  const { data: clusters = [] } = useQuery({
    queryKey: ['clusters'],
    queryFn: fetchClusters
  });

  // Create Backup Mutation
  const mutation = useMutation({
    mutationFn: createBackup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] });
      setIsDialogOpen(false);
      setFormData({ name: "", cluster: "", namespace: "", pvcName: "", type: "", startedAt: new Date().toISOString().slice(0, 16), retentionDays: "30" });
      toast.success("Backup job started successfully.");
    },
    onError: () => {
      toast.error("Failed to start backup.");
    }
  });

  const handleStartBackup = () => {
    mutation.mutate(formData);
  };

  const filtered = backups.filter((job) => {
    const matchesSearch = job.name.toLowerCase().includes(search.toLowerCase()) || job.cluster.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Backups</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and monitor all backup jobs</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Backup
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Create New Backup</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Backup Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., prod-db-backup" className="bg-muted border-border font-mono text-sm" />
              </div>
              <div className="space-y-2">
                <Label>Cluster</Label>
                <Select value={formData.cluster} onValueChange={(val) => setFormData({ ...formData, cluster: val })}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Select cluster" /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {clusters.length === 0 ? (
                      <div className="p-2 text-xs text-muted-foreground text-center italic">
                        No clusters available.
                      </div>
                    ) : (
                      clusters.map((c: any) => (
                        <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Namespace</Label>
                <Input value={formData.namespace} onChange={(e) => setFormData({ ...formData, namespace: e.target.value })} placeholder="e.g., production" className="bg-muted border-border font-mono text-sm" />
              </div>
              <div className="space-y-2">
                <Label>PVC Name</Label>
                <Input value={formData.pvcName} onChange={(e) => setFormData({ ...formData, pvcName: e.target.value })} placeholder="e.g., postgres-data-0" className="bg-muted border-border font-mono text-sm" />
              </div>
              <div className="space-y-2">
                <Label>Backup Type</Label>
                <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val })}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="full">Full</SelectItem>
                    <SelectItem value="incremental">Incremental</SelectItem>
                    <SelectItem value="snapshot">Snapshot</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Backup Time</Label>
                  <Input type="datetime-local" value={formData.startedAt} onChange={(e) => setFormData({ ...formData, startedAt: e.target.value })} className="bg-muted border-border font-mono text-sm" />
                </div>
                <div className="space-y-2">
                  <Label>Retention (Days)</Label>
                  <Input type="number" value={formData.retentionDays} onChange={(e) => setFormData({ ...formData, retentionDays: e.target.value })} placeholder="30" className="bg-muted border-border font-mono text-sm" />
                </div>
              </div>
              <Button onClick={handleStartBackup} disabled={mutation.isPending} className="w-full">
                {mutation.isPending ? "Starting..." : "Start Backup"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search backups..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-muted border-border font-mono text-sm" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-muted border-border">
            <Filter className="w-3 h-3 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-border rounded-lg mt-4 bg-muted/20">
            <HardDrive className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground">No backups found</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              You haven't created any backups yet. Click "New Backup" to secure your cluster data.
            </p>
          </div>
        ) : (
          filtered.map((job, i) => (
            <motion.div key={job.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-4 hover:border-primary/20 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <HardDrive className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium text-foreground">{job.name}</span>
                      {job.encrypted ? <Lock className="w-3 h-3 text-success" /> : <Unlock className="w-3 h-3 text-warning" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {job.cluster} / {job.namespace} / {job.pvcName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase">Started</p>
                    <p className="font-mono text-[10px] text-foreground">{new Date(job.startedAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-xs text-foreground">{job.size}</p>
                    <p className="text-[10px] text-muted-foreground">{job.duration}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[10px] text-muted-foreground uppercase">{job.type}</p>
                    <p className="text-[10px] text-muted-foreground">Retain {job.retentionDays}d</p>
                  </div>
                  <StatusBadge status={job.status} />
                </div>
              </div>
              {job.errorMessage && (
                <div className="mt-3 p-2 rounded bg-destructive/10 border border-destructive/20">
                  <p className="font-mono text-xs text-destructive">{job.errorMessage}</p>
                </div>
              )}
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
};

export default Backups;
