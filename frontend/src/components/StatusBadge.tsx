import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type Status = "completed" | "running" | "failed" | "pending" | "scheduled" | "healthy" | "warning" | "degraded" | "offline" | "online";

const statusConfig: Record<Status, { label: string; className: string; dotClass: string }> = {
  completed: { label: "Completed", className: "bg-success/10 text-success border-success/20", dotClass: "status-dot-success" },
  running: { label: "Running", className: "bg-primary/10 text-primary border-primary/20", dotClass: "bg-primary animate-pulse" },
  failed: { label: "Failed", className: "bg-destructive/10 text-destructive border-destructive/20", dotClass: "status-dot-error" },
  pending: { label: "Pending", className: "bg-muted text-muted-foreground border-border", dotClass: "bg-muted-foreground" },
  scheduled: { label: "Scheduled", className: "bg-primary/10 text-primary border-primary/20", dotClass: "bg-primary" },
  healthy: { label: "Healthy", className: "bg-success/10 text-success border-success/20", dotClass: "status-dot-success" },
  online: { label: "Online", className: "bg-success/10 text-success border-success/20", dotClass: "status-dot-success" },
  warning: { label: "Warning", className: "bg-warning/10 text-warning border-warning/20", dotClass: "status-dot-warning" },
  degraded: { label: "Degraded", className: "bg-destructive/10 text-destructive border-destructive/20", dotClass: "status-dot-error" },
  offline: { label: "Offline", className: "bg-muted text-muted-foreground border-border", dotClass: "bg-muted-foreground" },
};

const StatusBadge = ({ status }: { status: Status | string }) => {
  const config = statusConfig[status as Status] || statusConfig.pending;
  return (
    <Badge variant="outline" className={cn("gap-1.5 font-mono text-[11px]", config.className)}>
      <span className={cn("status-dot", config.dotClass)} />
      {config.label}
    </Badge>
  );
};

export default StatusBadge;
