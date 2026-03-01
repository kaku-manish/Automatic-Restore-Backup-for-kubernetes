import { motion } from "framer-motion";
import { RotateCcw, Search, Play } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchRestores, createRestore, fetchBackups, fetchClusters } from "@/api/client";
import { toast } from "sonner";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RestoreJob, BackupJob, Cluster } from "@/types/backup";

const Restore = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    backupId: "",
    targetCluster: "",
    targetNamespace: "",
    targetPVC: ""
  });

  const { data: restores = [], isLoading: isLoadingRestores } = useQuery<RestoreJob[]>({
    queryKey: ['restores'],
    queryFn: fetchRestores
  });

  const { data: backups = [] } = useQuery<BackupJob[]>({
    queryKey: ['backups'],
    queryFn: fetchBackups
  });

  const { data: clusters = [] } = useQuery<Cluster[]>({
    queryKey: ['clusters'],
    queryFn: fetchClusters
  });

  const mutation = useMutation({
    mutationFn: createRestore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restores'] });
      setIsDialogOpen(false);
      setFormData({ backupId: "", targetCluster: "", targetNamespace: "", targetPVC: "" });
      toast.success("Restore job initiated successfully.");
    },
    onError: () => {
      toast.error("Failed to start restore job.");
    }
  });

  const handleStartRestore = () => {
    if (!formData.backupId || !formData.targetCluster || !formData.targetNamespace || !formData.targetPVC) {
      toast.error("Please fill in all fields.");
      return;
    }
    mutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Restore</h1>
          <p className="text-sm text-muted-foreground mt-1">Restore volumes from backup snapshots</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Play className="w-4 h-4" />
              New Restore
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Restore from Backup</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Source Backup</Label>
                <Select value={formData.backupId} onValueChange={(val) => setFormData({ ...formData, backupId: val })}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Select backup" /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {backups.filter(b => b.status === "completed").map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name} ({b.size})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Target Cluster</Label>
                <Select value={formData.targetCluster} onValueChange={(val) => setFormData({ ...formData, targetCluster: val })}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Select cluster" /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {clusters.map(c => (
                      <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Target Namespace</Label>
                <Input value={formData.targetNamespace} onChange={(e) => setFormData({ ...formData, targetNamespace: e.target.value })} placeholder="e.g., production" className="bg-muted border-border font-mono text-sm" />
              </div>
              <div className="space-y-2">
                <Label>Target PVC Name</Label>
                <Input value={formData.targetPVC} onChange={(e) => setFormData({ ...formData, targetPVC: e.target.value })} placeholder="e.g., postgres-data-restored" className="bg-muted border-border font-mono text-sm" />
              </div>
              <div className="p-3 rounded bg-warning/10 border border-warning/20">
                <p className="text-xs text-warning font-medium">⚠ This will overwrite the target PVC if it exists.</p>
              </div>
              <Button onClick={handleStartRestore} disabled={mutation.isPending} className="w-full">
                {mutation.isPending ? "Starting Restore..." : "Start Restore"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {restores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-border rounded-lg mt-4 bg-muted/20">
            <RotateCcw className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground">No restore jobs yet</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              You haven't initiated any restore jobs. Click "New Restore" to recover data from a backup.
            </p>
          </div>
        ) : (
          restores.map((job: RestoreJob, i: number) => (
            <motion.div key={job.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent border border-border flex items-center justify-center">
                    <RotateCcw className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <span className="font-mono text-sm font-medium text-foreground">{job.backupName}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      → {job.targetCluster} / {job.targetNamespace} / {job.targetPVC}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Initiated by</p>
                    <p className="font-mono text-xs text-foreground">{job.initiatedBy}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Started</p>
                    <p className="font-mono text-xs text-foreground">{new Date(job.startedAt).toLocaleString()}</p>
                  </div>
                  <StatusBadge status={job.status} />
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default Restore;
