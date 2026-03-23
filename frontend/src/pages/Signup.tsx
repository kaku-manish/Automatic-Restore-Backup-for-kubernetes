import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, Shield, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<"user" | "admin">("user");
  const navigate = useNavigate();

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      navigate("/login"); 
    }, 1500);
  };

  return (
    <AuthLayout>
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-8 py-6 rounded-3xl shadow-2xl max-w-lg w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Create Account</h1>
          <p className="text-slate-400 text-sm">Join Kubmanger and secure your cloud</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          
          {/* Name input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Full Name</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none group-focus-within:text-blue-500 text-slate-500 transition-colors">
                <User className="h-5 w-5" />
              </div>
              <input
                type="text"
                className="w-full bg-[#020817]/50 border border-slate-700/50 text-white rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 placeholder:text-slate-600 block shadow-inner"
                placeholder="John Doe"
                required
              />
            </div>
          </div>

          {/* Email input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Email Address</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none group-focus-within:text-blue-500 text-slate-500 transition-colors">
                <Mail className="h-5 w-5" />
              </div>
              <input
                type="email"
                className="w-full bg-[#020817]/50 border border-slate-700/50 text-white rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 placeholder:text-slate-600 block shadow-inner"
                placeholder="admin@domain.com"
                required
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none group-focus-within:text-blue-500 text-slate-500 transition-colors">
                <Lock className="h-5 w-5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                className="w-full bg-[#020817]/50 border border-slate-700/50 text-white rounded-xl py-2.5 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 placeholder:text-slate-600 block shadow-inner"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-2 pt-2">
            <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Account Role</label>
            <div className="grid grid-cols-2 gap-3">
              {/* User Role Card */}
              <div 
                onClick={() => setRole("user")}
                className={`cursor-pointer rounded-2xl border p-4 transition-all duration-300 flex flex-col items-start gap-2 relative overflow-hidden ${
                  role === "user" 
                    ? "bg-blue-500/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/50" 
                    : "bg-[#020817]/50 border-slate-700/50 hover:bg-slate-800/50"
                }`}
              >
                {role === "user" && <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/20 blur-xl -mr-4 -mt-4 rounded-full" />}
                
                <div className="flex items-center justify-between w-full relative z-10">
                  <div className={`p-2 rounded-xl border ${role === "user" ? "bg-blue-500/20 border-blue-400/20 text-blue-400" : "bg-slate-800 border-slate-700 text-slate-400"}`}>
                    <User className="h-4 w-4" />
                  </div>
                  <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center transition-colors ${role === "user" ? "border-blue-500 bg-transparent" : "border-slate-600 bg-transparent"}`}>
                    <div className={`h-2 w-2 rounded-full transition-transform duration-200 ${role === "user" ? "bg-blue-500 scale-100" : "bg-transparent scale-0"}`} />
                  </div>
                </div>
                
                <div className="relative z-10 w-full mt-1">
                  <h3 className={`font-semibold text-sm transition-colors ${role === "user" ? "text-blue-100" : "text-slate-300"}`}>Standard User</h3>
                  <ul className="text-[10px] sm:text-[11px] text-slate-500 mt-2 space-y-1 list-disc pl-3">
                    <li>View assigned clusters</li>
                    <li>Monitor backup status</li>
                    <li>On-demand backups</li>
                  </ul>
                </div>
              </div>

              {/* Admin Role Card */}
              <div 
                onClick={() => setRole("admin")}
                className={`cursor-pointer rounded-2xl border p-4 transition-all duration-300 flex flex-col items-start gap-2 relative overflow-hidden ${
                  role === "admin" 
                    ? "bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/50" 
                    : "bg-[#020817]/50 border-slate-700/50 hover:bg-slate-800/50"
                }`}
              >
                {role === "admin" && <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/20 blur-xl -mr-4 -mt-4 rounded-full" />}

                <div className="flex items-center justify-between w-full relative z-10">
                  <div className={`p-2 rounded-xl border ${role === "admin" ? "bg-indigo-500/20 border-indigo-400/20 text-indigo-400" : "bg-slate-800 border-slate-700 text-slate-400"}`}>
                    <Shield className="h-4 w-4" />
                  </div>
                  <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center transition-colors ${role === "admin" ? "border-indigo-500 bg-transparent" : "border-slate-600 bg-transparent"}`}>
                    <div className={`h-2 w-2 rounded-full transition-transform duration-200 ${role === "admin" ? "bg-indigo-500 scale-100" : "bg-transparent scale-0"}`} />
                  </div>
                </div>
                
                <div className="relative z-10 w-full mt-1">
                   <h3 className={`font-semibold text-sm transition-colors ${role === "admin" ? "text-indigo-100" : "text-slate-300"}`}>Cluster Admin</h3>
                   <ul className="text-[10px] sm:text-[11px] text-slate-500 mt-2 space-y-1 list-disc pl-3">
                      <li>Manage all clusters</li>
                      <li>Configure schedules</li>
                      <li>Full system restores</li>
                      <li>Manage user access</li>
                   </ul>
                </div>
              </div>
            </div>
            
            {/* Context Message */}
            <div className="text-[11px] text-slate-500 mt-2 px-1">
              {role === "admin" ? "Admin access enables full administrative privileges. Requires verification." : "Standard access is perfect for developers needing backup visibility."}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-medium shadow-[0_0_20px_rgba(37,99,235,0.25)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center disabled:opacity-70 disabled:hover:translate-y-0 group"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span className="flex items-center gap-2">Sign Up <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></span>}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-400 relative">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
            Sign in
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
