import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}

const StatCard = ({ label, value, icon, trend, trendUp, className }: StatCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn("glass-card p-5", className)}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="data-label">{label}</span>
        <div className="text-muted-foreground">{icon}</div>
      </div>
      <div className="stat-value text-foreground">{value}</div>
      {trend && (
        <p className={cn("text-xs mt-2 font-medium", trendUp ? "text-success" : "text-destructive")}>
          {trend}
        </p>
      )}
    </motion.div>
  );
};

export default StatCard;
