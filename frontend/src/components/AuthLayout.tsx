import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="relative min-h-screen bg-slate-900 overflow-hidden flex items-center justify-center font-sans tracking-tight">
      
      {/* 🌌 BACKGROUND DESIGN */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 -z-20" />

      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.25] -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" 
        style={{ maskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)", WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)" }}
      />
      
      {/* Animated Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse -z-10 duration-1000" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse -z-10 delay-200" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[150px] mix-blend-screen -z-10 animate-pulse delay-500" />

      {/* Floating Network Nodes (Abstract subtle detail) */}
      <div className="absolute inset-0 -z-10 overflow-hidden opacity-30">
        <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20%" cy="30%" r="2" fill="currentColor" className="text-blue-400" />
          <circle cx="80%" cy="40%" r="2" fill="currentColor" className="text-indigo-400" />
          <circle cx="30%" cy="80%" r="2" fill="currentColor" className="text-sky-400" />
          <circle cx="70%" cy="70%" r="2" fill="currentColor" className="text-slate-400" />
          <line x1="20%" y1="30%" x2="80%" y2="40%" stroke="currentColor" strokeWidth="0.5" className="text-slate-500/20" />
          <line x1="20%" y1="30%" x2="30%" y2="80%" stroke="currentColor" strokeWidth="0.5" className="text-slate-500/20" />
          <line x1="80%" y1="40%" x2="70%" y2="70%" stroke="currentColor" strokeWidth="0.5" className="text-slate-500/20" />
          <line x1="30%" y1="80%" x2="70%" y2="70%" stroke="currentColor" strokeWidth="0.5" className="text-slate-500/20" />
        </svg>
      </div>

      {/* Platform Branding Top Left */}
      <div className="absolute top-8 left-8 flex items-center space-x-3 select-none">
        <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-400">
          Kubmanger
        </span>
      </div>

      {/* Main Content Area (Form) */}
      <div className="w-full max-w-md p-8 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        {/* Glassmorphism Auth Card backdrop */}
        <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl -z-10" />
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
