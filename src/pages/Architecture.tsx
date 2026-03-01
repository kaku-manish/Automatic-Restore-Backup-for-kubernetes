import { motion } from "framer-motion";
import { Box, ArrowRight, Database, Server, Shield, Cloud, HardDrive, Eye, Lock, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const archComponents = [
  { icon: Server, name: "Kubernetes Cluster", desc: "Hosts workloads with PVCs attached to StatefulSets and Deployments. CSI driver enables volume snapshot capabilities." },
  { icon: HardDrive, name: "CSI Volume Snapshot Controller", desc: "Watches for VolumeSnapshot CRDs and coordinates with the CSI driver to create point-in-time snapshots at the storage layer." },
  { icon: Shield, name: "Velero Server", desc: "Orchestrates backup/restore operations. Runs as a Deployment in the velero namespace with CRDs for schedules, backups, and restores." },
  { icon: Cloud, name: "Object Storage (S3)", desc: "Stores backup artifacts including volume snapshots, resource manifests, and metadata. Supports S3, GCS, Azure Blob, and MinIO." },
  { icon: Lock, name: "IAM / RBAC", desc: "Service accounts with IRSA (AWS), Workload Identity (GCP), or AAD Pod Identity (Azure). Velero RBAC limits cluster-wide permissions." },
  { icon: Eye, name: "Monitoring Stack", desc: "Prometheus scrapes Velero metrics. Grafana dashboards visualize backup health. Alertmanager fires on failures or missed schedules." },
  { icon: Database, name: "etcd / API Server", desc: "Stores Kubernetes resource definitions. Velero backs up API objects alongside volume data for full application-consistent recovery." },
  { icon: RefreshCw, name: "Disaster Recovery Controller", desc: "Cross-cluster restore orchestrator. Reads backup metadata from shared object storage and recreates workloads on target cluster." },
];

const flowSteps = [
  { step: "1", title: "Application Writes Data", desc: "Pods write to PVCs backed by CSI-provisioned Persistent Volumes" },
  { step: "2", title: "Schedule Triggers Velero", desc: "Cron-based Schedule CRD triggers Velero to create a new Backup resource" },
  { step: "3", title: "CSI Snapshot API Called", desc: "Velero's CSI plugin creates VolumeSnapshot CRDs for each targeted PVC" },
  { step: "4", title: "Storage-Level Snapshot", desc: "CSI driver coordinates with storage backend (EBS, PD, Azure Disk) for point-in-time snapshot" },
  { step: "5", title: "Upload to Object Storage", desc: "Snapshot metadata + Kubernetes resource manifests uploaded to S3-compatible storage" },
  { step: "6", title: "Backup Logs & Metrics", desc: "Velero emits Prometheus metrics and stores detailed logs for audit trail" },
  { step: "7", title: "Restore Workflow", desc: "Velero recreates namespace → PVC → VolumeSnapshot → Pod with data intact on target cluster" },
];

const yamlSnippets = {
  backupStorageLocation: `apiVersion: velero.io/v1
kind: BackupStorageLocation
metadata:
  name: default
  namespace: velero
spec:
  provider: aws
  objectStorage:
    bucket: k8s-backups-prod
    prefix: velero
  config:
    region: us-east-1
    s3ForcePathStyle: "false"
  credential:
    name: cloud-credentials
    key: cloud`,
  volumeSnapshotLocation: `apiVersion: velero.io/v1
kind: VolumeSnapshotLocation
metadata:
  name: default
  namespace: velero
spec:
  provider: aws
  config:
    region: us-east-1`,
  scheduledBackup: `apiVersion: velero.io/v1
kind: Schedule
metadata:
  name: daily-production-backup
  namespace: velero
spec:
  schedule: "0 2 * * *"
  template:
    includedNamespaces:
      - production
      - monitoring
    snapshotVolumes: true
    storageLocation: default
    volumeSnapshotLocations:
      - default
    ttl: 720h0m0s  # 30 days retention
    defaultVolumesToFsBackup: false
    csiSnapshotTimeout: 10m0s`,
  restoreExample: `apiVersion: velero.io/v1
kind: Restore
metadata:
  name: restore-production
  namespace: velero
spec:
  backupName: daily-production-backup-20260221020000
  includedNamespaces:
    - production
  restorePVs: true
  preserveNodePorts: true
  existingResourcePolicy: update`,
};

const Architecture = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Architecture</h1>
        <p className="text-sm text-muted-foreground mt-1">System architecture, data flow, and Velero configuration reference</p>
      </div>

      <Tabs defaultValue="components" className="space-y-6">
        <TabsList className="bg-muted border border-border">
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="flow">Data Flow</TabsTrigger>
          <TabsTrigger value="configs">YAML Configs</TabsTrigger>
          <TabsTrigger value="install">Installation</TabsTrigger>
        </TabsList>

        <TabsContent value="components">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {archComponents.map((comp, i) => (
              <motion.div key={comp.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="glass-card p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <comp.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-mono text-sm font-semibold text-foreground">{comp.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{comp.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="flow">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
            <h2 className="text-sm font-semibold text-foreground mb-6">Backup & Restore Data Flow</h2>
            <div className="space-y-0">
              {flowSteps.map((s, i) => (
                <div key={s.step} className="flex items-start gap-4 relative">
                  {i < flowSteps.length - 1 && (
                    <div className="absolute left-5 top-10 w-px h-full bg-border" />
                  )}
                  <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0 z-10">
                    <span className="font-mono text-xs font-bold text-primary">{s.step}</span>
                  </div>
                  <div className="pb-8">
                    <h4 className="font-mono text-sm font-medium text-foreground">{s.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="configs">
          <div className="space-y-4">
            {Object.entries(yamlSnippets).map(([key, yaml]) => (
              <motion.div key={key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
                <h3 className="font-mono text-xs font-semibold text-primary mb-3 uppercase tracking-wider">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </h3>
                <pre className="bg-background/60 rounded-md p-4 overflow-x-auto text-xs font-mono text-foreground leading-relaxed border border-border/50">
                  {yaml}
                </pre>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="install">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="glass-card p-5">
              <h3 className="font-mono text-xs font-semibold text-primary mb-3 uppercase tracking-wider">1. Install Velero CLI</h3>
              <pre className="bg-background/60 rounded-md p-4 text-xs font-mono text-foreground border border-border/50">{`# macOS
brew install velero

# Linux
wget https://github.com/vmware-tanzu/velero/releases/download/v1.13.0/velero-v1.13.0-linux-amd64.tar.gz
tar -xvf velero-v1.13.0-linux-amd64.tar.gz
sudo mv velero-v1.13.0-linux-amd64/velero /usr/local/bin/`}</pre>
            </div>

            <div className="glass-card p-5">
              <h3 className="font-mono text-xs font-semibold text-primary mb-3 uppercase tracking-wider">2. Install via Helm</h3>
              <pre className="bg-background/60 rounded-md p-4 text-xs font-mono text-foreground border border-border/50">{`helm repo add vmware-tanzu https://vmware-tanzu.github.io/helm-charts
helm repo update

helm install velero vmware-tanzu/velero \\
  --namespace velero \\
  --create-namespace \\
  --set configuration.provider=aws \\
  --set configuration.backupStorageLocation.bucket=k8s-backups-prod \\
  --set configuration.backupStorageLocation.config.region=us-east-1 \\
  --set configuration.volumeSnapshotLocation.config.region=us-east-1 \\
  --set credentials.useSecret=true \\
  --set credentials.secretContents.cloud="$(cat /path/to/credentials)" \\
  --set deployNodeAgent=true \\
  --set features=EnableCSI`}</pre>
            </div>

            <div className="glass-card p-5">
              <h3 className="font-mono text-xs font-semibold text-primary mb-3 uppercase tracking-wider">3. Configure IAM (AWS IRSA)</h3>
              <pre className="bg-background/60 rounded-md p-4 text-xs font-mono text-foreground border border-border/50">{`# Create IAM policy
aws iam create-policy \\
  --policy-name VeleroBackupPolicy \\
  --policy-document file://velero-policy.json

# Associate with service account
eksctl create iamserviceaccount \\
  --name velero \\
  --namespace velero \\
  --cluster production \\
  --attach-policy-arn arn:aws:iam::ACCOUNT:policy/VeleroBackupPolicy \\
  --approve`}</pre>
            </div>

            <div className="glass-card p-5">
              <h3 className="font-mono text-xs font-semibold text-primary mb-3 uppercase tracking-wider">4. Enable CSI Snapshots</h3>
              <pre className="bg-background/60 rounded-md p-4 text-xs font-mono text-foreground border border-border/50">{`# Install snapshot CRDs
kubectl apply -f https://raw.githubusercontent.com/kubernetes-csi/external-snapshotter/master/client/config/crd/snapshot.storage.k8s.io_volumesnapshotclasses.yaml
kubectl apply -f https://raw.githubusercontent.com/kubernetes-csi/external-snapshotter/master/client/config/crd/snapshot.storage.k8s.io_volumesnapshots.yaml
kubectl apply -f https://raw.githubusercontent.com/kubernetes-csi/external-snapshotter/master/client/config/crd/snapshot.storage.k8s.io_volumesnapshotcontents.yaml

# Install snapshot controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes-csi/external-snapshotter/master/deploy/kubernetes/snapshot-controller/rbac-snapshot-controller.yaml
kubectl apply -f https://raw.githubusercontent.com/kubernetes-csi/external-snapshotter/master/deploy/kubernetes/snapshot-controller/setup-snapshot-controller.yaml`}</pre>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Architecture;
