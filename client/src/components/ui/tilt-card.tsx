import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  perspective?: number;
}

export function TiltCard({ children, className, maxTilt = 6, perspective = 1000 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [rot, setRot] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    setRot({ x: (0.5 - ny) * maxTilt * 2, y: (nx - 0.5) * maxTilt * 2 });
    setActive(true);
  };

  const handleMouseLeave = () => {
    setRot({ x: 0, y: 0 });
    setActive(false);
  };

  return (
    <div
      ref={ref}
      className={cn("will-change-transform", className)}
      style={{
        transform: `perspective(${perspective}px) rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
        transition: active ? "transform 0.1s ease" : "transform 0.4s ease",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}
