import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import type { ComponentPropsWithRef } from "react";

type BaseButtonProps = ComponentPropsWithRef<typeof Button>;

interface MagneticButtonProps extends Omit<BaseButtonProps, "ref"> {
  /** Attraction strength — fraction of distance moved (0–1) */
  strength?: number;
}

export function MagneticButton({
  children,
  className,
  strength = 0.35,
  style,
  onMouseMove,
  onMouseLeave,
  ...props
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setTranslate({
      x: (e.clientX - rect.left - rect.width / 2) * strength,
      y: (e.clientY - rect.top - rect.height / 2) * strength,
    });
    onMouseMove?.(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    setTranslate({ x: 0, y: 0 });
    onMouseLeave?.(e);
  };

  return (
    <Button
      ref={ref}
      className={cn("transition-transform duration-150 ease-out", className)}
      style={{ transform: `translate(${translate.x}px, ${translate.y}px)`, ...style }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </Button>
  );
}
