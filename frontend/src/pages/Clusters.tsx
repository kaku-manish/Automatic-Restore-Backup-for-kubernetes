import { motion } from "framer-motion";
import { Server, Plus, Cloud } from "lucide-react";
import { useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClusters, createCluster } from "@/api/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const providerColors: Record<string, string> = {
  AWS: "text-warning",
  GCP: "text-primary",
  Azure: "text-[hsl(190,100%,50%)]",
  "On-Prem": "text-muted-foreground",
};

const Clusters = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    provider: "",
    region: "",
    nodesCount: "3",
    version: "1.28.0"
  });

  const { data: clusters = [], isLoading } = useQuery({
    queryKey: ['clusters'],
    queryFn: fetchClusters
  });

  const mutation = useMutation({
    mutationFn: createCluster,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clusters'] });
      setIsDialogOpen(false);
      setFormData({ name: "", provider: "", region: "", nodesCount: "3", version: "1.28.0" });
      toast.success("Cluster added successfully.");
    },
    onError: (error: any) => {
      toast.error(`Failed to add cluster: ${error.message}`);
    }
  });

  const handleAddCluster = () => {
    if (!formData.name || !formData.provider || !formData.region) {
      toast.error("Please fill in all required fields.");
      return;
    }
    mutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clusters</h1>
          <p className="text-sm text-muted-foreground mt-1">Connected Kubernetes clusters</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Cluster
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Add New Cluster</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Cluster Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., prod-main" className="bg-muted border-border font-mono text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Select value={formData.provider} onValueChange={(val) => setFormData({ ...formData, provider: val })}>
                    <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Select provider" /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="AWS">AWS</SelectItem>
                      <SelectItem value="GCP">GCP</SelectItem>
                      <SelectItem value="Azure">Azure</SelectItem>
                      <SelectItem value="On-Prem">On-Prem</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Region</Label>
                  <Input value={formData.region} onChange={(e) => setFormData({ ...formData, region: e.target.value })} placeholder="e.g., us-east-1" className="bg-muted border-border font-mono text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nodes</Label>
                  <Input type="number" value={formData.nodesCount} onChange={(e) => setFormData({ ...formData, nodesCount: e.target.value })} className="bg-muted border-border font-mono text-sm" />
                </div>
                <div className="space-y-2">
                  <Label>K8s Version</Label>
                  <Input value={formData.version} onChange={(e) => setFormData({ ...formData, version: e.target.value })} className="bg-muted border-border font-mono text-sm" />
                </div>
              </div>
              <Button onClick={handleAddCluster} disabled={mutation.isPending} className="w-full">
                {mutation.isPending ? "Adding Cluster..." : "Add Cluster"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clusters.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-border rounded-lg mt-4 bg-muted/20">
            <Server className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground">No clusters connected</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              You haven't connected any Kubernetes clusters yet. Click "Add Cluster" to get started.
            </p>
          </div>
        ) : (
          clusters.map((cluster: any, i: number) => (
            <motion.div key={cluster.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-5 hover:border-primary/20 transition-colors cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent border border-border flex items-center justify-center">
                    <Server className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-mono text-sm font-medium text-foreground">{cluster.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Cloud className={`w-3 h-3 ${providerColors[cluster.provider]}`} />
                      <span className="text-[10px] text-muted-foreground">{cluster.provider} • {cluster.region}</span>
                    </div>
                  </div>
                </div>
                <StatusBadge status={cluster.status} />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="data-label">Nodes</p>
                  <p className="font-mono text-lg font-semibold text-foreground">{cluster.nodesCount}</p>
                </div>
                <div>
                  <p className="data-label">PVCs</p>
                  <p className="font-mono text-lg font-semibold text-foreground">{cluster.pvcsCount}</p>
                </div>
                <div>
                  <p className="data-label">Schedules</p>
                  <p className="font-mono text-lg font-semibold text-foreground">{cluster.backupSchedules}</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Last backup</span>
                  <span className="font-mono text-foreground">{new Date(cluster.lastBackup).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-muted-foreground">Version</span>
                  <span className="font-mono text-foreground">v{cluster.version}</span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default Clusters;
