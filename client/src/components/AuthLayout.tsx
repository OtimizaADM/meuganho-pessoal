import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { LineChart, ShieldCheck, Sparkles } from "lucide-react";
import { BrandMark, BrandLogo } from "./BrandMark";

/**
 * Layout split-screen premium para auth/onboarding.
 * Desktop: brand à esquerda (deep navy), form à direita (white).
 * Mobile: brand colapsa em hero curto no topo, form full-bleed embaixo.
 */
export default function AuthLayout({
  children,
  footer,
}: {
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-background lg:grid lg:grid-cols-[1.05fr,1fr]">
      {/* Brand side */}
      <aside className="relative overflow-hidden bg-[hsl(225_45%_8%)] text-white px-6 py-10 lg:px-14 lg:py-14 lg:flex lg:flex-col lg:justify-between min-h-[260px] lg:min-h-screen">
        {/* Background pattern abstrato — grid + radial glow */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(142 70% 60% / 0.4) 1px, transparent 1px), linear-gradient(90deg, hsl(142 70% 60% / 0.4) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse 70% 60% at 30% 40%, #000 30%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 30% 40%, #000 30%, transparent 75%)",
          }}
        />
        <div
          aria-hidden
          className="absolute -top-24 -right-20 w-[420px] h-[420px] rounded-full blur-3xl opacity-40"
          style={{ background: "radial-gradient(circle, hsl(245 85% 55%), transparent 60%)" }}
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -left-20 w-[380px] h-[380px] rounded-full blur-3xl opacity-30"
          style={{ background: "radial-gradient(circle, hsl(265 75% 50%), transparent 60%)" }}
        />

        {/* Top — logo */}
        <Link to="/" className="relative inline-flex items-center gap-2.5 group">
          <BrandMark className="w-9 h-9 object-contain shrink-0" />
          <span className="font-display font-semibold text-[16px] tracking-tight">
            meu <span className="text-white">Ganho</span>
          </span>
        </Link>

        {/* Middle — claim (apenas desktop) */}
        <div className="relative hidden lg:block max-w-md mt-16">
          <h1 className="font-display text-[44px] xl:text-[52px] leading-[1.05] font-semibold tracking-tighter">
            Suas finanças.
            <br />
            <span className="text-white/60">Sob controle.</span>
          </h1>
          <p className="mt-5 text-[15px] text-white/65 leading-relaxed max-w-sm">
            Acompanhe receitas, despesas, cartões e metas em um único lugar — com a clareza de um banco premium.
          </p>

          <ul className="mt-10 space-y-4">
            <Feature icon={LineChart} title="Visão clara">
              Gráficos minimais que mostram exatamente para onde vai o seu dinheiro.
            </Feature>
            <Feature icon={ShieldCheck} title="Privado por padrão">
              Seus dados são seus. Criptografia ponta-a-ponta, sempre.
            </Feature>
            <Feature icon={Sparkles} title="Insights inteligentes">
              Descubra padrões e oportunidades de economia automaticamente.
            </Feature>
          </ul>
        </div>

        {/* Mobile — claim curto */}
        <div className="relative lg:hidden mt-8">
          <h1 className="font-display text-3xl font-semibold tracking-tight leading-tight">
            Suas finanças.
            <br />
            <span className="text-white/60">Sob controle.</span>
          </h1>
        </div>

        {/* Bottom — footer brand */}
        <div className="relative hidden lg:block">
          <p className="text-[12px] text-white/40">© 2025 Meu Ganho · Feito com cuidado</p>
        </div>
      </aside>

      {/* Form side */}
      <main className="relative flex flex-col px-6 py-10 lg:px-16 lg:py-14">
        <div className="flex items-center justify-between">
          <Link to="/" className="lg:hidden inline-flex items-center gap-2">
            <BrandMark className="w-7 h-7 object-contain" />
            <span className="font-display font-semibold text-[14px] tracking-tight text-foreground">
              meu <span>Ganho</span>
            </span>
          </Link>
          <div className="ml-auto text-[13px] text-muted-foreground">{footer}</div>
        </div>

        <div className="flex-1 flex items-center justify-center py-10 lg:py-0">
          <div className="w-full max-w-[400px]">{children}</div>
        </div>

        <div className="text-[11px] text-muted-foreground text-center lg:text-left">
          Ao continuar, você concorda com os <a className="underline-offset-2 hover:underline" href="#">Termos</a> e a{" "}
          <a className="underline-offset-2 hover:underline" href="#">Política de Privacidade</a>.
        </div>
      </main>
    </div>
  );
}

function Feature({ icon: Icon, title, children }: { icon: any; title: string; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-white/[0.06] border border-white/10 grid place-items-center shrink-0 mt-0.5">
        <Icon className="w-[17px] h-[17px] text-white/85" strokeWidth={1.75} />
      </div>
      <div>
        <p className="font-medium text-[14px] text-white">{title}</p>
        <p className="text-[13px] text-white/55 leading-relaxed mt-0.5">{children}</p>
      </div>
    </li>
  );
}
