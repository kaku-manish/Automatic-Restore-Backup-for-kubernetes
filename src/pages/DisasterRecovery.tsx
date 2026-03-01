import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, Clock, Target, Shield, Zap, Server, RefreshCw, Trash2, XCircle } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const drScenarios = [
  {
    id: 1,
    title: "Accidental Namespace Deletion",
    severity: "High",
    rpo: "6 hours",
    rto: "15 minutes",
    description: "A team member accidentally runs `kubectl delete namespace production`. All deployments, services, PVCs, and data are destroyed.",
    recovery: [
      "Identify the most recent backup for the production namespace",
      "Run: velero restore create --from-backup daily-production-backup --include-namespaces production",
      "Velero recreates namespace, PVCs, deployments, services, and configmaps",
      "CSI snapshots restore volume data to the point-in-time of the backup",
      "Verify application health and data integrity",
    ],
    lastTested: "2026-02-18",
    status: "completed" as const,
  },
  {
    id: 2,
    title: "Node Failure (Stateful Workload)",
    severity: "Medium",
    rpo: "2 hours",
    rto: "10 minutes",
    description: "A node running PostgreSQL StatefulSet fails. The PV becomes inaccessible due to node-level storage failure.",
    recovery: [
      "Kubernetes detects node failure and marks pods as Unknown",
      "Force delete stuck pods: kubectl delete pod postgres-0 --force --grace-period=0",
      "If PV is zone-locked, restore from backup: velero restore create --from-backup prod-postgres --include-resources pvc,pv",
      "StatefulSet scheduler reschedules pod to healthy node with restored PVC",
      "Verify database connectivity and run integrity checks",
    ],
    lastTested: "2026-02-15",
    status: "completed" as const,
  },
  {
    id: 3,
    title: "Full Cluster Failure",
    severity: "Critical",
    rpo: "6 hours",
    rto: "45 minutes",
    description: "Complete cluster becomes unrecoverable due to control plane failure, cloud provider outage, or infrastructure corruption.",
    recovery: [
      "Provision new Kubernetes cluster in DR region (Terraform/eksctl)",
      "Install Velero on new cluster with same BackupStorageLocation config",
      "Velero discovers existing backups from shared S3 bucket",
      "Run: velero restore create --from-backup latest-full-backup",
      "Update DNS records to point to new cluster's ingress",
      "Verify all workloads, run smoke tests, and validate data",
    ],
    lastTested: "2026-02-10",
    status: "completed" as const,
  },
  {
    id: 4,
    title: "Data Corruption (Application Bug)",
    severity: "High",
    rpo: "Depends on backup frequency",
    rto: "20 minutes",
    description: "A bad deployment corrupts database records. Need to restore to a pre-corruption state while keeping the cluster running.",
    recovery: [
      "Identify the last known-good backup timestamp",
      "Create a restore to a new namespace: velero restore create --from-backup pre-corruption-backup --namespace-mappings production:production-restored",
      "Verify restored data integrity in the temporary namespace",
      "Swap traffic to restored workloads or migrate data back",
      "Clean up temporary namespace after verification",
    ],
    lastTested: "2026-02-12",
    status: "completed" as const,
  },
];

const securityChecklist = [
  { item: "TLS enabled for Velero <-> S3 communication", done: true },
  { item: "S3 bucket encryption at rest (AES-256 / SSE-KMS)", done: true },
  { item: "RBAC policies restrict Velero access to velero namespace", done: true },
  { item: "IAM roles used instead of static access keys (IRSA)", done: true },
  { item: "Encryption key rotation every 90 days", done: true },
  { item: "Immutable backups enabled (Object Lock)", done: false },
  { item: "Network policies restrict Velero pod egress", done: true },
  { item: "Backup logs audited and retained for 1 year", done: true },
  { item: "Cross-region replication enabled for S3 bucket", done: false },
  { item: "Air-gapped backup copy maintained offline", done: false },
];

const costRecommendations = [
  { tip: "Use S3 Intelligent-Tiering for backup storage", impact: "~30% cost reduction", priority: "High" },
  { tip: "Enable incremental snapshots instead of full for frequent backups", impact: "~60% storage reduction", priority: "High" },
  { tip: "Set lifecycle policies: move backups older than 30d to Glacier", impact: "~70% cost reduction on old data", priority: "Medium" },
  { tip: "Use spot instances for restore-testing clusters", impact: "~65% compute cost reduction", priority: "Medium" },
  { tip: "Deduplicate identical volumes before backup", impact: "~20% storage reduction", priority: "Low" },
];

const DisasterRecovery = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Disaster Recovery</h1>
        <p className="text-sm text-muted-foreground mt-1">DR scenarios, security hardening, and production best practices</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
          <div className="flex items-start justify-between mb-3">
            <span className="data-label">RPO Target</span>
            <Target className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="stat-value text-foreground">≤ 6h</div>
          <p className="text-xs mt-2 text-success font-medium">On target</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-5">
          <div className="flex items-start justify-between mb-3">
            <span className="data-label">RTO Target</span>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="stat-value text-foreground">≤ 45m</div>
          <p className="text-xs mt-2 text-success font-medium">On target</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
          <div className="flex items-start justify-between mb-3">
            <span className="data-label">DR Tests (30d)</span>
            <Zap className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="stat-value text-foreground">12</div>
          <p className="text-xs mt-2 text-success font-medium">All passed</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-5">
          <div className="flex items-start justify-between mb-3">
            <span className="data-label">Security Score</span>
            <Shield className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="stat-value text-foreground">7/10</div>
          <p className="text-xs mt-2 text-warning font-medium">3 items pending</p>
        </motion.div>
      </div>

      <Tabs defaultValue="scenarios" className="space-y-6">
        <TabsList className="bg-muted border border-border">
          <TabsTrigger value="scenarios">DR Scenarios</TabsTrigger>
          <TabsTrigger value="security">Security Checklist</TabsTrigger>
          <TabsTrigger value="cost">Cost Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="scenarios">
          <div className="space-y-4">
            {drScenarios.map((scenario, i) => (
              <motion.div key={scenario.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {scenario.severity === "Critical" ? <XCircle className="w-5 h-5 text-destructive" /> :
                     scenario.severity === "High" ? <AlertTriangle className="w-5 h-5 text-warning" /> :
                     <AlertTriangle className="w-5 h-5 text-primary" />}
                    <div>
                      <h3 className="font-mono text-sm font-semibold text-foreground">{scenario.title}</h3>
                      <span className={`text-[10px] font-mono uppercase tracking-wider ${
                        scenario.severity === "Critical" ? "text-destructive" :
                        scenario.severity === "High" ? "text-warning" : "text-primary"
                      }`}>{scenario.severity} severity</span>
                    </div>
                  </div>
                  <StatusBadge status={scenario.status} />
                </div>

                <p className="text-xs text-muted-foreground mb-4">{scenario.description}</p>

                <div className="flex items-center gap-6 mb-4">
                  <div className="flex items-center gap-2">
                    <Target className="w-3 h-3 text-primary" />
                    <span className="text-xs text-muted-foreground">RPO: <span className="font-mono text-foreground">{scenario.rpo}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-primary" />
                    <span className="text-xs text-muted-foreground">RTO: <span className="font-mono text-foreground">{scenario.rto}</span></span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Last tested: {scenario.lastTested}</span>
                </div>

                <div className="bg-background/60 rounded-md p-4 border border-border/50">
                  <h4 className="text-xs font-semibold text-foreground mb-2">Recovery Steps</h4>
                  <ol className="space-y-1.5">
                    {scenario.recovery.map((step, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="font-mono text-primary shrink-0">{j + 1}.</span>
                        <span className="font-mono">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="security">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
            <h2 className="text-sm font-semibold text-foreground mb-2">Security Hardening Checklist</h2>
            <p className="text-xs text-muted-foreground mb-6">{securityChecklist.filter(c => c.done).length} of {securityChecklist.length} items completed</p>
            <Progress value={(securityChecklist.filter(c => c.done).length / securityChecklist.length) * 100} className="mb-6 h-2" />
            <div className="space-y-2">
              {securityChecklist.map((check, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-md border ${check.done ? 'border-border/30 bg-muted/20' : 'border-warning/30 bg-warning/5'}`}>
                  {check.done ? <CheckCircle className="w-4 h-4 text-success shrink-0" /> : <AlertTriangle className="w-4 h-4 text-warning shrink-0" />}
                  <span className={`text-xs font-mono ${check.done ? 'text-muted-foreground' : 'text-foreground'}`}>{check.item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="cost">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
            <h2 className="text-sm font-semibold text-foreground mb-6">Cost Optimization Recommendations</h2>
            <div className="space-y-3">
              {costRecommendations.map((rec, i) => (
                <div key={i} className="flex items-start justify-between p-4 rounded-md bg-background/60 border border-border/50">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground">{rec.tip}</p>
                    <p className="text-[10px] text-success font-mono mt-1">Impact: {rec.impact}</p>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    rec.priority === "High" ? "bg-destructive/10 text-destructive" :
                    rec.priority === "Medium" ? "bg-warning/10 text-warning" :
                    "bg-muted text-muted-foreground"
                  }`}>{rec.priority}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DisasterRecovery;
