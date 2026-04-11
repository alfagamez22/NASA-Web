"use client";

import {
  Layout,
  Database,
  BarChart3,
  Phone,
  Zap,
  MessageSquare,
  Users,
  Terminal,
  Monitor,
  Cpu,
  ShieldCheck,
  LineChart,
  PieChart,
  Activity,
  TrendingUp,
  Wifi,
  Signal,
  Server,
  Router,
  Globe,
  Network,
  Settings,
  Wrench,
  Sliders,
  MapPin,
  Ticket,


  LucideProps,
} from "lucide-react";
import { ArrowRight } from "lucide-react";
import type { ToolItem } from "@/shared/types";

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  Layout,
  Database,
  BarChart3,
  Phone,
  Zap,
  MessageSquare,
  Users,
  Terminal,
  Monitor,
  Cpu,
  ShieldCheck,
  LineChart,
  PieChart,
  Activity,
  TrendingUp,
  Wifi,
  Signal,
  Server,
  Router,
  Globe,
  Network,
  Settings,
  Wrench,
  Sliders,
  MapPin,
  Ticket
};

interface ToolCardProps {
  tool: ToolItem;
  variant?: "default" | "search";
}

export default function ToolCard({ tool, variant = "default" }: ToolCardProps) {
  const Icon = ICON_MAP[tool.icon] ?? Monitor;

  if (variant === "search") {
    return (
      <a
        href={tool.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center justify-between p-6 hover:bg-nasa-blue hover:bg-opacity-60 transition-colors text-nasa-gray hover:text-nasa-light-cyan rounded"
        style={{ border: "1px solid var(--border-color)" }}
      >
        <div className="flex items-center gap-4">
          <Icon size={20} className="text-white" />
          <div>
            <span className="font-bold text-xl uppercase block text-nasa-cyan">{tool.title}</span>
            <span className="font-mono text-xs uppercase text-nasa-gray">
              {tool.description}
            </span>
          </div>
        </div>
        <ArrowRight
          size={20}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-nasa-light-cyan"
        />
      </a>
    );
  }

  return (
    <a
      href={tool.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center justify-between p-3 hover:bg-nasa-blue hover:bg-opacity-60 transition-colors text-nasa-gray hover:text-nasa-light-cyan rounded"
      style={{ border: "1px solid var(--border-color)" }}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} className="text-white" />
        <span className="font-bold text-sm uppercase text-nasa-cyan">{tool.title}</span>
      </div>
      <ArrowRight
        size={14}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </a>
  );
}
