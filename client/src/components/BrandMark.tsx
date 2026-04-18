import logoLight from "@/assets/logo-meu-ganho-light.png";
import logoDark from "@/assets/logo-meu-ganho-dark.png";
import logoIcon from "@/assets/logo-meu-ganho-icon.png";

/**
 * Marca oficial Meu Ganho.
 * - <BrandMark /> renderiza apenas o ícone (G chat-bubble verde), pra usos compactos
 * - <BrandLogo variant="light|dark" /> renderiza o wordmark completo
 */

export function BrandMark({ className }: { className?: string }) {
  return <img src={logoIcon} alt="Meu Ganho" className={className} />;
}

export function BrandLogo({
  variant = "light",
  className,
}: {
  variant?: "light" | "dark";
  className?: string;
}) {
  return (
    <img
      src={variant === "dark" ? logoDark : logoLight}
      alt="Meu Ganho"
      className={className}
    />
  );
}

/** Lockup compacto usado no header/sidebar */
export function BrandLockup({ className }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <BrandMark className="w-7 h-7 object-contain" />
      <span className="font-display font-semibold text-[15px] tracking-tight">
        meu <span className="text-foreground">Ganho</span>
      </span>
    </div>
  );
}
