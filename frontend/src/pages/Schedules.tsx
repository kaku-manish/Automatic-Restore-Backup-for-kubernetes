import { motion } from "framer-motion";
import { Calendar, Play, Pause, Plus, Clock } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchSchedules, createSchedule, fetchClusters } from "@/api/client";
import { toast } from "sonner";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BackupSchedule, Cluster } from "@/types/backup";

const Schedules = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    cluster: "",
    namespace: "",
    cron: "0 0 * * *",
    pvcSelector: "*"
  });

  const { data: schedules = [], isLoading } = useQuery<BackupSchedule[]>({
    queryKey: ['schedules'],
    queryFn: fetchSchedules
  });

  const { data: clusters = [] } = useQuery<Cluster[]>({
    queryKey: ['clusters'],
    queryFn: fetchClusters
  });

  const mutation = useMutation({
    mutationFn: createSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      setIsDialogOpen(false);
      setFormData({ name: "", cluster: "", namespace: "", cron: "0 0 * * *", pvcSelector: "*" });
      toast.success("Schedule created successfully.");
    },
    onError: () => {
      toast.error("Failed to create schedule.");
    }
  });

  const handleCreateSchedule = () => {
    if (!formData.name || !formData.cluster || !formData.namespace) {
      toast.error("Please fill in all required fields.");
      return;
    }
    mutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Backup Schedules</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure automated backup schedules</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Create New Schedule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Schedule Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., daily-postgres-backup" className="bg-muted border-border font-mono text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cluster</Label>
                  <Select value={formData.cluster} onValueChange={(val) => setFormData({ ...formData, cluster: val })}>
                    <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Select cluster" /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {clusters.length === 0 ? (
                        <div className="p-2 text-xs text-muted-foreground text-center italic">
                          No clusters available. Please add a cluster first.
                        </div>
                      ) : (
                        clusters.map(c => (
                          <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Namespace</Label>
                  <Input value={formData.namespace} onChange={(e) => setFormData({ ...formData, namespace: e.target.value })} placeholder="e.g., database" className="bg-muted border-border font-mono text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cron Expression</Label>
                  <Input value={formData.cron} onChange={(e) => setFormData({ ...formData, cron: e.target.value })} placeholder="0 0 * * *" className="bg-muted border-border font-mono text-sm" />
                </div>
                <div className="space-y-2">
                  <Label>PVC Selector</Label>
                  <Input value={formData.pvcSelector} onChange={(e) => setFormData({ ...formData, pvcSelector: e.target.value })} placeholder="e.g., app=postgres" className="bg-muted border-border font-mono text-sm" />
                </div>
              </div>
              <Button onClick={handleCreateSchedule} disabled={mutation.isPending} className="w-full">
                {mutation.isPending ? "Creating Schedule..." : "Create Schedule"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {schedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-border rounded-lg mt-4 bg-muted/20">
            <Calendar className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground">No schedules created</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              You haven't created any backup schedules yet. Click "New Schedule" to automate your backups.
            </p>
          </div>
        ) : (
          schedules.map((schedule: any, i: number) => (
            <motion.div key={schedule.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <span className="font-mono text-sm font-medium text-foreground">{schedule.name}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {schedule.cluster} / {schedule.namespace}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <p className="data-label mb-1">Cron</p>
                    <code className="font-mono text-xs text-foreground bg-muted px-2 py-1 rounded">{schedule.cron}</code>
                  </div>
                  <div className="text-center">
                    <p className="data-label mb-1">PVC Selector</p>
                    <code className="font-mono text-xs text-muted-foreground">{schedule.pvcSelector}</code>
                  </div>
                  <div className="text-center">
                    <p className="data-label mb-1">Next Run</p>
                    <p className="font-mono text-xs text-muted-foreground">{schedule.nextRun === "—" ? "Disabled" : new Date(schedule.nextRun).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={schedule.enabled} />
                    <span className="text-xs text-muted-foreground">{schedule.enabled ? "Active" : "Paused"}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default Schedules;
