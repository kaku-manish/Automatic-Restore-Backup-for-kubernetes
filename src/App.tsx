import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Backups from "./pages/Backups";
import Schedules from "./pages/Schedules";
import Restore from "./pages/Restore";
import Clusters from "./pages/Clusters";
import SettingsPage from "./pages/Settings";
import Architecture from "./pages/Architecture";
import Monitoring from "./pages/Monitoring";
import DisasterRecovery from "./pages/DisasterRecovery";
import UploadDemo from "./pages/UploadDemo";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/backups" element={<Backups />} />
            <Route path="/schedules" element={<Schedules />} />
            <Route path="/restore" element={<Restore />} />
            <Route path="/clusters" element={<Clusters />} />
            <Route path="/architecture" element={<Architecture />} />
            <Route path="/monitoring" element={<Monitoring />} />
            <Route path="/disaster-recovery" element={<DisasterRecovery />} />
            <Route path="/upload-demo" element={<UploadDemo />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
