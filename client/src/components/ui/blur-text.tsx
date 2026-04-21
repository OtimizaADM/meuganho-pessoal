import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BlurTextProps {
  text: string;
  className?: string;
  /** seconds between each word animation */
  delay?: number;
  /** total animation duration per word */
  duration?: number;
}

export function BlurText({ text, className, delay = 0.08, duration = 0.5 }: BlurTextProps) {
  const words = text.split(" ");
  return (
    <span aria-label={text} className={cn("inline", className)}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          className="inline-block"
          initial={{ opacity: 0, filter: "blur(10px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration, delay: i * delay, ease: [0.22, 1, 0.36, 1] }}
        >
          {word}
          {i < words.length - 1 && " "}
        </motion.span>
      ))}
    </span>
  );
}
