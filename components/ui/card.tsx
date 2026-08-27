import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/icon";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`.trim()}>{children}</section>;
}

export function MetricCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: number | string;
  hint: string;
  icon?: IconName;
  tone?: "default" | "danger" | "warning" | "success" | "info";
}) {
  return (
    <Card className={`metric-card metric-card--${tone}`}>
      <div className="metric-card__top">
        <p className="metric-card__label">{label}</p>
        {icon ? <span className="metric-card__icon"><Icon name={icon} size={18} /></span> : null}
      </div>
      <p className="metric-card__value">{value}</p>
      <p className="metric-card__hint">{hint}</p>
    </Card>
  );
}
