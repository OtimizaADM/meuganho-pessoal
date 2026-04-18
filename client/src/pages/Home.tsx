import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function Home() {
  return (
    <AuthLayout
      footer={
        <span>
          Já tem conta?{" "}
          <Link to="/login" className="text-foreground font-medium hover:underline underline-offset-4">
            Entrar
          </Link>
        </span>
      }
    >
      <div className="space-y-8">
        <div>
          <h2 className="font-display text-[34px] lg:text-[40px] font-semibold tracking-tighter leading-[1.05]">
            Comece em 30 segundos.
          </h2>
          <p className="mt-3 text-[15px] text-muted-foreground leading-relaxed">
            Sem cartão de crédito. Sem complicação. Crie sua conta e veja todas as suas finanças em um só lugar.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            to="/register"
            className="group inline-flex w-full items-center justify-center gap-2 h-12 rounded-lg bg-[hsl(225_45%_8%)] text-white text-[14px] font-medium hover:bg-[hsl(225_45%_14%)] transition-colors"
          >
            Criar conta gratuita
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
          </Link>

          <button
            type="button"
            className="inline-flex w-full items-center justify-center gap-2.5 h-12 rounded-lg border border-border bg-background text-foreground text-[14px] font-medium hover:bg-muted/60 transition-colors"
          >
            <GoogleIcon className="w-[18px] h-[18px]" />
            Continuar com Google
          </button>
        </div>

        <div className="pt-2 grid grid-cols-3 gap-4 text-center">
          <Stat label="Usuários" value="12k+" />
          <Stat label="Avaliação" value="4.9★" />
          <Stat label="Grátis" value="100%" />
        </div>
      </div>
    </AuthLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-display text-lg font-semibold tracking-tight tabular">{value}</p>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5 font-medium">{label}</p>
    </div>
  );
}

export function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0012 23z" fill="#34A853" />
      <path d="M5.84 14.1A6.6 6.6 0 015.5 12c0-.73.13-1.44.34-2.1V7.07H2.18a10.97 10.97 0 000 9.86l3.66-2.83z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.46 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z" fill="#EA4335" />
    </svg>
  );
}
