// Icon names are resolved to Lucide components in ToolCard.tsx
export interface ToolData {
  name: string;
  url: string;
  description: string;
  icon: string;
}

export interface CategoryData {
  title: string;
  tools: ToolData[];
}

export const WEB_TOOLS: CategoryData[] = [
  {
    title: "DASHBOARDS",
    tools: [
      {
        name: "MAIN Dashboard",
        url: "#",
        description: "Primary network overview.",
        icon: "Layout",
      },
      {
        name: "NASA CM Dashboard",
        url: "#",
        description: "Configuration management portal.",
        icon: "Database",
      },
      {
        name: "ARTIS 2.0 Dashboard",
        url: "#",
        description: "Advanced reporting tool.",
        icon: "BarChart3",
      },
    ],
  },
  {
    title: "OPERATIONS",
    tools: [
      {
        name: "OPS Contacts",
        url: "#",
        description: "Escalera contact directory.",
        icon: "Phone",
      },
      {
        name: "OPS Adv Support",
        url: "#",
        description: "AppSheet support portal.",
        icon: "Zap",
      },
      {
        name: "Workvivo",
        url: "#",
        description: "SIELO (RSC) communication.",
        icon: "MessageSquare",
      },
      {
        name: "Workday",
        url: "#",
        description: "HR and payroll management.",
        icon: "Users",
      },
      {
        name: "Worktools",
        url: "#",
        description: "Internal utility suite.",
        icon: "Terminal",
      },
    ],
  },
  {
    title: "NETWORK MGMT",
    tools: [
      {
        name: "NetAct (VIS/MIN)",
        url: "#",
        description: "Nokia network management.",
        icon: "Monitor",
      },
      {
        name: "ZTE UME",
        url: "#",
        description: "ZTE element management.",
        icon: "Monitor",
      },
      {
        name: "MAE (NLZ/NCR)",
        url: "#",
        description: "Huawei network management.",
        icon: "Monitor",
      },
      {
        name: "NCE-Super",
        url: "#",
        description: "Next-gen network controller.",
        icon: "Cpu",
      },
    ],
  },
  {
    title: "SERVICE MGMT",
    tools: [
      {
        name: "ServiceNow",
        url: "#",
        description: "IT service management.",
        icon: "ShieldCheck",
      },
      {
        name: "OSS Maximo",
        url: "#",
        description: "Asset management portal.",
        icon: "Database",
      },
      {
        name: "ICD Ticket",
        url: "#",
        description: "Public ticketing system.",
        icon: "MessageSquare",
      },
      {
        name: "Netcool",
        url: "#",
        description: "Event management system.",
        icon: "Zap",
      },
    ],
  },
];
