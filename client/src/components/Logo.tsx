import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "dark" | "white";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: { fontSize: "13px", iconW: 16, iconH: 18 },
  md: { fontSize: "19px", iconW: 23, iconH: 26 },
  lg: { fontSize: "34px", iconW: 42, iconH: 47 },
};

export function GBubbleIcon({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 32 36"
      fill="none"
      className={className}
      style={style}
    >
      {/* Speech bubble with bottom-left tail */}
      <path
        d="M6 0H26C29.3 0 32 2.7 32 6V22C32 25.3 29.3 28 26 28H17L3 36L8 28H6C2.7 28 0 25.3 0 22V6C0 2.7 2.7 0 6 0Z"
        fill="#22c55e"
      />
      {/* White G letterform */}
      <path
        d="M21 7H13C10.2 7 8 9.2 8 12V18C8 20.8 10.2 23 13 23H21C23.8 23 26 20.8 26 18V15H18V17H22V21H13V9H26V7H21Z"
        fill="white"
      />
    </svg>
  );
}

export function Logo({ variant = "dark", size = "md", className }: LogoProps) {
  const { fontSize, iconW, iconH } = sizes[size];
  const color = variant === "white" ? "#ffffff" : "#0f172a";

  return (
    <div
      className={cn("inline-flex flex-col select-none", className)}
      style={{
        fontFamily: "'Sora', 'Inter', system-ui, sans-serif",
        fontWeight: 700,
        lineHeight: 1.05,
        letterSpacing: "-0.02em",
        gap: 0,
      }}
    >
      <span style={{ fontSize, color }}>meu</span>
      <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
        <GBubbleIcon
          style={{ width: iconW, height: iconH, flexShrink: 0, marginTop: 1 }}
        />
        <span style={{ fontSize, color }}>anho</span>
      </div>
    </div>
  );
}
