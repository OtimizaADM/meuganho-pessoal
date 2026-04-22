import { useRef, useState, type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type SpotlightCardProps = ComponentPropsWithoutRef<"div"> & {
  spotlightColor?: string;
};

export function SpotlightCard({
  children,
  className,
  spotlightColor = "rgba(99, 102, 241, 0.07)",
  onMouseMove,
  onMouseEnter,
  onMouseLeave,
  ...props
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    onMouseMove?.(e);
  };

  return (
    <div
      ref={ref}
      className={cn("card-premium relative overflow-hidden", className)}
      onMouseMove={handleMouseMove}
      onMouseEnter={(e) => {
        setActive(true);
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setActive(false);
        onMouseLeave?.(e);
      }}
      {...props}
    >
      <div
        className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
        style={{
          opacity: active ? 1 : 0,
          background: `radial-gradient(380px circle at ${pos.x}px ${pos.y}px, ${spotlightColor}, transparent 80%)`,
        }}
      />
      {children}
    </div>
  );
}
