import { useInView, useMotionValue, useSpring } from "framer-motion";
import { useCallback, useEffect, useRef } from "react";

interface CountUpProps {
  to: number;
  from?: number;
  direction?: "up" | "down";
  delay?: number;
  duration?: number;
  className?: string;
  startWhen?: boolean;
  locale?: string;
  formatOptions?: Intl.NumberFormatOptions;
}

export function CountUp({
  to,
  from = 0,
  direction = "up",
  delay = 0,
  duration = 1.5,
  className = "",
  startWhen = true,
  locale = "pt-BR",
  formatOptions,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(direction === "down" ? to : from);

  const damping = 20 + 40 * (1 / duration);
  const stiffness = 100 * (1 / duration);

  const springValue = useSpring(motionValue, { damping, stiffness });
  const isInView = useInView(ref, { once: true, margin: "0px" });

  const formatValue = useCallback(
    (latest: number) => {
      if (formatOptions) {
        return new Intl.NumberFormat(locale, formatOptions).format(latest);
      }
      return new Intl.NumberFormat(locale).format(Math.round(latest));
    },
    [locale, formatOptions]
  );

  useEffect(() => {
    if (ref.current) {
      ref.current.textContent = formatValue(direction === "down" ? to : from);
    }
  }, [from, to, direction, formatValue]);

  useEffect(() => {
    if (isInView && startWhen) {
      const id = setTimeout(() => {
        motionValue.set(direction === "down" ? from : to);
      }, delay * 1000);
      return () => clearTimeout(id);
    }
  }, [isInView, startWhen, motionValue, direction, from, to, delay]);

  useEffect(() => {
    const unsub = springValue.on("change", (latest) => {
      if (ref.current) ref.current.textContent = formatValue(latest);
    });
    return unsub;
  }, [springValue, formatValue]);

  return <span className={className} ref={ref} />;
}

const BRL_FORMAT: Intl.NumberFormatOptions = {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

interface CurrencyCountUpProps {
  value: number;
  className?: string;
  duration?: number;
  startWhen?: boolean;
}

export function CurrencyCountUp({
  value,
  className,
  duration = 1.5,
  startWhen = true,
}: CurrencyCountUpProps) {
  return (
    <span className={className}>
      {value < 0 && "-"}
      <CountUp
        to={Math.abs(value)}
        duration={duration}
        startWhen={startWhen}
        locale="pt-BR"
        formatOptions={BRL_FORMAT}
      />
    </span>
  );
}
