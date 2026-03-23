import { NavLink } from "@/components/NavLink";
import { Link, useNavigate } from "react-router-dom";
import {
  Database,
  HardDrive,
  RotateCcw,
  Server,
  Settings,
  LayoutDashboard,
  Calendar,
  Shield,
  Box,
  Activity,
  AlertTriangle,
  UploadCloud,
  LogOut,
  User,
} from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/backups", icon: HardDrive, label: "Backups" },
  { to: "/schedules", icon: Calendar, label: "Schedules" },
  { to: "/restore", icon: RotateCcw, label: "Restore" },
  { to: "/clusters", icon: Server, label: "Clusters" },
  { to: "/architecture", icon: Box, label: "Architecture" },
  { to: "/monitoring", icon: Activity, label: "Monitoring" },
  { to: "/disaster-recovery", icon: AlertTriangle, label: "Disaster Recovery" },
  { to: "/upload-demo", icon: UploadCloud, label: "Data Source (Upload)" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

const AppSidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    navigate("/login");
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col z-50">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Kubmanger</h1>
            <p className="text-[10px] font-mono text-muted-foreground">BACKUP • RESTORE • PROTECT</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-hide">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            activeClassName="bg-sidebar-accent text-primary font-medium"
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-4">
        {/* System Online Status */}
        <div className="glass-card p-3 rounded-md">
          <div className="flex items-center gap-2 mb-1">
            <div className="status-dot-success" />
            <span className="text-xs font-medium text-foreground">System Online</span>
          </div>
          <p className="text-[10px] font-mono text-muted-foreground">6 clusters connected</p>
        </div>

        {/* User Profile Section */}
        <div className="flex items-center justify-between p-3 bg-sidebar-accent/30 rounded-lg border border-sidebar-border hover:bg-sidebar-accent/50 transition-colors">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
              <User className="h-4 w-4" />
            </div>
            <div className="truncate flex flex-col">
              <span className="text-sm font-medium text-foreground truncate">Admin User</span>
              <Link to="/settings" className="text-[10px] text-muted-foreground hover:text-blue-400 transition-colors truncate">
                Edit Profile
              </Link>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all active:scale-95 shrink-0"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
