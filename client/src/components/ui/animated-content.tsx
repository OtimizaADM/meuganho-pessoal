import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface AnimatedContentProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
  direction?: "up" | "down" | "left" | "right";
  duration?: number;
  initialOpacity?: number;
  threshold?: number;
}

export function AnimatedContent({
  children,
  className,
  delay = 0,
  distance = 20,
  direction = "up",
  duration = 0.5,
  initialOpacity = 0,
  threshold = 0.08,
}: AnimatedContentProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: threshold });

  const offset = {
    up: { y: distance, x: 0 },
    down: { y: -distance, x: 0 },
    left: { x: distance, y: 0 },
    right: { x: -distance, y: 0 },
  }[direction];

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: initialOpacity, ...offset }}
      animate={isInView ? { opacity: 1, y: 0, x: 0 } : { opacity: initialOpacity, ...offset }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
