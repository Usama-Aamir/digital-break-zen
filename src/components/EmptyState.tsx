import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, subtitle, action, className = "" }: EmptyStateProps) {
  return (
    <div
      className={`glass-card rounded-2xl p-6 sm:p-8 text-center flex flex-col items-center gap-3 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">{subtitle}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
