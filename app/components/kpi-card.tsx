import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export type KpiTrend = "up" | "down" | "neutral";

export interface KpiCardProps {
  title: string;
  value: string;
  trend?: KpiTrend;
  trendValue?: string;
}

export function KpiCard({ title, value, trend, trendValue }: KpiCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-3.5 h-3.5" />;
      case "down":
        return <TrendingDown className="w-3.5 h-3.5" />;
      default:
        return <Minus className="w-3.5 h-3.5" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-success bg-success/10";
      case "down":
        return "text-danger bg-danger/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  // Sparkline mockup using SVG based on the design
  const Sparkline = () => {
    const isUp = trend === "up";
    const strokeColor = isUp ? "#22c55e" : trend === "down" ? "#ef4444" : "#94a3b8";
    
    return (
      <svg className="w-16 h-8 ml-auto" viewBox="0 0 64 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        {isUp ? (
          <path d="M2 28L18 16L32 20L48 8L62 12" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        ) : trend === "down" ? (
          <path d="M2 8L18 20L32 16L48 28L62 24" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M2 16L18 14L32 18L48 16L62 16" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    );
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 hover-effect">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">{title}</h3>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-semibold text-foreground leading-none mb-2">
            {value}
          </div>
          {trend && trendValue && (
            <div className="flex items-center gap-1.5">
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${getTrendColor()}`}>
                {getTrendIcon()}
                {trendValue}
              </span>
            </div>
          )}
        </div>
        <Sparkline />
      </div>
    </div>
  );
}
