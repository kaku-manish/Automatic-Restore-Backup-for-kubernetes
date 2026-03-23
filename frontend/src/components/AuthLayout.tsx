import { ReactNode } from "react";
import { Server, Database, Cloud } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="relative min-h-screen bg-[#020817] flex font-sans tracking-tight overflow-hidden">
      
      {/* LEFT PANEL - Branding & Thematic Background */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 border-r border-slate-800 z-10">
        {/* Deep background gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-slate-900 to-[#020817] -z-20" />
        
        {/* Animated Grid */}
        <div 
          className="absolute inset-0 opacity-[0.2] -z-10 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px]" 
          style={{ maskImage: "radial-gradient(ellipse at left center, black 40%, transparent 80%)", WebkitMaskImage: "radial-gradient(ellipse at left center, black 40%, transparent 80%)" }}
        />
        
        {/* Glowing Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen animate-pulse -z-10 duration-1000" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] mix-blend-screen animate-pulse -z-10 delay-200" />

        {/* Kubmanger Branding */}
        <div className="flex items-center space-x-3 select-none">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/20">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-400">
            Kubmanger
          </span>
        </div>

        {/* Thematic Content - Kubernetes / Clusters */}
        <div className="my-auto space-y-8 animate-in fade-in slide-in-from-left duration-700">
          <div>
            <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
              Secure Cloud <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                Backup & Restore
              </span>
            </h1>
            <p className="text-slate-400 text-lg max-w-md">
              Enterprise-grade data protection for your Kubernetes clusters. Manage, scale, and recover your infrastructure effortlessly.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-md">
             <div className="flex items-center space-x-3 bg-white/5 border border-white/5 p-3 rounded-xl backdrop-blur-md">
                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><Server size={20} /></div>
                <div className="text-sm font-medium text-slate-200">Cluster Management</div>
             </div>
             <div className="flex items-center space-x-3 bg-white/5 border border-white/5 p-3 rounded-xl backdrop-blur-md">
                <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400"><Database size={20} /></div>
                <div className="text-sm font-medium text-slate-200">Automated Backups</div>
             </div>
             <div className="flex items-center space-x-3 bg-white/5 border border-white/5 p-3 rounded-xl backdrop-blur-md">
                <div className="p-2 bg-sky-500/20 rounded-lg text-sky-400"><Cloud size={20} /></div>
                <div className="text-sm font-medium text-slate-200">Disaster Recovery</div>
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-slate-600 text-sm font-medium">
          &copy; {new Date().getFullYear()} Kubmanger Platform. All rights reserved.
        </div>
      </div>

      {/* RIGHT PANEL - Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 relative">
        {/* Mobile Branding (only shows on smaller screens) */}
        <div className="lg:hidden absolute top-8 left-8 flex items-center space-x-3 select-none">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
          <span className="text-xl font-bold text-white">Kubmanger</span>
        </div>

        {/* Mobile Background Elements */}
        <div className="lg:hidden absolute inset-0 bg-[#020817] -z-20" />
        <div className="lg:hidden absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] mix-blend-screen -z-10" />

        <div className="w-full max-w-[420px] relative z-10 animate-in fade-in zoom-in-95 duration-500">
           {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
