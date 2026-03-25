type ServiceIconKey = "brain" | "monitor" | "cpu" | "bot" | "trending-up" | "layers" | "fallback";

const ICON_ALIASES: Record<string, ServiceIconKey> = {
  brain: "brain",
  estrategia: "brain",
  "estrategia-digital": "brain",
  strategy: "brain",
  monitor: "monitor",
  display: "monitor",
  web: "monitor",
  "desarrollo-web": "monitor",
  cpu: "cpu",
  automation: "cpu",
  automatizacion: "cpu",
  sistemas: "cpu",
  bot: "bot",
  robot: "bot",
  ia: "bot",
  ai: "bot",
  "trending-up": "trending-up",
  growth: "trending-up",
  crecimiento: "trending-up",
  optimizacion: "trending-up",
  layers: "layers",
  custom: "layers",
  medida: "layers",
  "proyectos-a-medida": "layers",
};

function normalizeIconName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\s]+/g, "-");
}

export function resolveServiceIconKey(iconName: string | null | undefined): ServiceIconKey {
  if (!iconName) return "fallback";

  const normalized = normalizeIconName(iconName);
  if (ICON_ALIASES[normalized]) {
    return ICON_ALIASES[normalized];
  }

  if (normalized.includes("brain") || normalized.includes("estrateg")) return "brain";
  if (
    normalized.includes("monitor") ||
    normalized.includes("web") ||
    normalized.includes("display")
  ) {
    return "monitor";
  }
  if (
    normalized.includes("cpu") ||
    normalized.includes("automat") ||
    normalized.includes("system")
  ) {
    return "cpu";
  }
  if (normalized.includes("bot") || normalized.includes("robot") || normalized.includes("ia")) {
    return "bot";
  }
  if (
    normalized.includes("trend") ||
    normalized.includes("growth") ||
    normalized.includes("crecim") ||
    normalized.includes("optimiz")
  ) {
    return "trending-up";
  }
  if (normalized.includes("layer") || normalized.includes("medida") || normalized.includes("custom")) {
    return "layers";
  }

  return "fallback";
}

export function CmsServiceIcon({
  iconName,
  className = "h-5 w-5",
}: {
  iconName: string | null | undefined;
  className?: string;
}) {
  const icon = resolveServiceIconKey(iconName);
  const common = {
    viewBox: "0 0 24 24",
    className,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    "aria-hidden": true,
  } as const;

  if (icon === "brain") {
    return (
      <svg {...common}>
        <path d="M9 6.2A3 3 0 0 0 4.7 8.9a2.8 2.8 0 0 0 .7 5.5h.1A3.1 3.1 0 0 0 9 17.8V6.2Z" />
        <path d="M15 6.2a3 3 0 0 1 4.3 2.7 2.8 2.8 0 0 1-.7 5.5h-.1a3.1 3.1 0 0 1-3.5 3.4V6.2Z" />
        <path d="M9 10h6M9 14h6" />
      </svg>
    );
  }

  if (icon === "monitor") {
    return (
      <svg {...common}>
        <rect x="3.5" y="5.2" width="17" height="11.8" rx="2.1" />
        <path d="M8.8 19.4h6.4M12 17v2.4" />
      </svg>
    );
  }

  if (icon === "cpu") {
    return (
      <svg {...common}>
        <rect x="7" y="7" width="10" height="10" rx="1.8" />
        <path d="M10.5 10.5h3v3h-3z" />
        <path d="M9 3.5v2.3M15 3.5v2.3M9 18.2v2.3M15 18.2v2.3M3.5 9h2.3M3.5 15h2.3M18.2 9h2.3M18.2 15h2.3" />
      </svg>
    );
  }

  if (icon === "bot") {
    return (
      <svg {...common}>
        <rect x="5.5" y="8" width="13" height="10" rx="3" />
        <path d="M12 4.2v2.1M9.2 12h.1M14.7 12h.1M9 15h6" />
      </svg>
    );
  }

  if (icon === "trending-up") {
    return (
      <svg {...common}>
        <path d="M4.5 16.4 10 11l3.3 3.2 6.2-6.2" />
        <path d="M14.9 8h4.6v4.6" />
      </svg>
    );
  }

  if (icon === "layers") {
    return (
      <svg {...common}>
        <path d="m12 4.6 7.6 3.9L12 12.4 4.4 8.5 12 4.6Z" />
        <path d="m4.4 12.1 7.6 3.9 7.6-3.9M4.4 15.7l7.6 3.9 7.6-3.9" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="m12 4.7 1.9 3.8 4.2.6-3 2.9.7 4.2-3.8-2-3.8 2 .7-4.2-3-2.9 4.2-.6L12 4.7Z" />
    </svg>
  );
}
