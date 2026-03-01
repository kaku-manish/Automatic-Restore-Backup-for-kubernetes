import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SettingsPage = () => {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure backup policies and system preferences</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-muted border border-border">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 space-y-6">
            <div className="space-y-2">
              <Label>Default Retention Period (days)</Label>
              <Input defaultValue="30" className="bg-muted border-border font-mono max-w-xs" />
            </div>
            <div className="space-y-2">
              <Label>Default Backup Type</Label>
              <Select defaultValue="incremental">
                <SelectTrigger className="bg-muted border-border max-w-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="full">Full</SelectItem>
                  <SelectItem value="incremental">Incremental</SelectItem>
                  <SelectItem value="snapshot">Snapshot</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between max-w-xs">
              <Label>Enable Compression</Label>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between max-w-xs">
              <Label>Auto-retry Failed Backups</Label>
              <Switch defaultChecked />
            </div>
            <Button>Save Changes</Button>
          </motion.div>
        </TabsContent>

        <TabsContent value="storage">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 space-y-6">
            <div className="space-y-2">
              <Label>Storage Provider</Label>
              <Select defaultValue="s3">
                <SelectTrigger className="bg-muted border-border max-w-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="s3">Amazon S3</SelectItem>
                  <SelectItem value="gcs">Google Cloud Storage</SelectItem>
                  <SelectItem value="azure">Azure Blob Storage</SelectItem>
                  <SelectItem value="minio">MinIO (Self-hosted)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Bucket Name</Label>
              <Input defaultValue="k8s-backups" className="bg-muted border-border font-mono max-w-xs" />
            </div>
            <div className="space-y-2">
              <Label>Region</Label>
              <Input defaultValue="us-east-1" className="bg-muted border-border font-mono max-w-xs" />
            </div>
            <Button>Save Changes</Button>
          </motion.div>
        </TabsContent>

        <TabsContent value="security">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 space-y-6">
            <div className="flex items-center justify-between max-w-xs">
              <Label>Encrypt Backups (AES-256)</Label>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between max-w-xs">
              <Label>Enable RBAC</Label>
              <Switch defaultChecked />
            </div>
            <div className="space-y-2">
              <Label>Encryption Key Rotation (days)</Label>
              <Input defaultValue="90" className="bg-muted border-border font-mono max-w-xs" />
            </div>
            <Button>Save Changes</Button>
          </motion.div>
        </TabsContent>

        <TabsContent value="notifications">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 space-y-6">
            <div className="flex items-center justify-between max-w-xs">
              <Label>Email on Failure</Label>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between max-w-xs">
              <Label>Slack Integration</Label>
              <Switch />
            </div>
            <div className="space-y-2">
              <Label>Alert Email</Label>
              <Input defaultValue="devops@company.com" className="bg-muted border-border font-mono max-w-xs" />
            </div>
            <div className="space-y-2">
              <Label>Slack Webhook URL</Label>
              <Input placeholder="https://hooks.slack.com/..." className="bg-muted border-border font-mono max-w-xs" />
            </div>
            <Button>Save Changes</Button>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
