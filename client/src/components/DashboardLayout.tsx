import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard,
  LineChart,
  LogOut,
  PanelLeft,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  TrendingDown,
  CreditCard,
  ShoppingCart,
  BarChart3,
  RefreshCw,
  Target,
  Check,
} from "lucide-react";
import React, { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { BlurText } from "./ui/blur-text";
import { ShinyText } from "./ui/shiny-text";
import { Threads } from "./ui/threads";
import { Logo, GBubbleIcon } from "./Logo";

const THREADS_GREEN = "#22C55E";

// ─── Auth Feature (left side) ────────────────────────────────────────────────

function AuthFeature({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-white/[0.06] border border-white/10 grid place-items-center shrink-0 mt-0.5">
        <Icon className="w-[17px] h-[17px] text-white/80" strokeWidth={1.75} />
      </div>
      <div>
        <p className="font-medium text-[14px] text-white">{title}</p>
        <p className="text-[13px] text-white/50 leading-relaxed mt-0.5">{children}</p>
      </div>
    </li>
  );
}

// ─── Magnetic submit button (inline, no shadcn deps) ─────────────────────────

function SubmitButton({
  loading,
  label,
}: {
  loading: boolean;
  label: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [xy, setXy] = useState({ x: 0, y: 0 });

  return (
    <button
      ref={ref}
      type="submit"
      disabled={loading}
      className="w-full h-14 bg-foreground text-[15px] font-semibold rounded-xl
                 transition-all duration-150 ease-out hover:opacity-90 active:scale-[0.99]
                 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      style={{
        transform: `translate(${xy.x}px, ${xy.y}px)`,
        color: THREADS_GREEN,
      }}
      onMouseMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        setXy({
          x: (e.clientX - r.left - r.width / 2) * 0.28,
          y: (e.clientY - r.top - r.height / 2) * 0.28,
        });
      }}
      onMouseLeave={() => setXy({ x: 0, y: 0 })}
    >
      {loading ? (
        <span className="opacity-60">Aguarde...</span>
      ) : (
        <>{label} →</>
      )}
    </button>
  );
}

// ─── Auth screen (full login + register) ─────────────────────────────────────

type AuthMode = "login" | "register";

function AuthScreen({ onSuccess }: { onSuccess: () => void }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function switchMode(next: AuthMode) {
    setMode(next);
    setError("");
    setName("");
    setPassword("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body =
        mode === "login"
          ? { email, password }
          : { name, email, password };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro inesperado. Tente novamente.");
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full border-0 border-b border-border bg-transparent pb-3 pt-1 text-[15px] " +
    "text-foreground placeholder:text-muted-foreground/40 focus:outline-none " +
    "focus:border-foreground transition-colors duration-200";

  const labelClass = "block text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-1.5";

  return (
    <div className="min-h-screen w-full bg-background grid grid-cols-1 lg:grid-cols-[1.1fr_1fr]">

      {/* ── LEFT: brand + Threads ── */}
      <aside
        className="relative overflow-hidden text-white px-6 py-10 lg:px-14 lg:py-14
                   lg:flex lg:flex-col lg:justify-between min-h-[240px] lg:min-h-screen"
        style={{ background: "var(--sidebar)" }}
      >
        {/* Threads 3D background */}
        <div aria-hidden className="absolute inset-0">
          <Threads
            color={[34, 197, 94]}
            amplitude={0.55}
            distance={30}
            enableMouseInteraction={true}
          />
        </div>
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, rgba(0,0,0,0.5) 0%, transparent 55%, rgba(0,0,0,0.3) 100%)",
          }}
        />

        {/* Logo */}
        <div className="relative">
          <Logo variant="white" size="lg" />
        </div>

        {/* Desktop: headline + features */}
        <div className="relative hidden lg:block max-w-[440px]">
          <h1 className="text-[52px] xl:text-[60px] leading-[1.02] font-bold tracking-tighter text-white">
            Suas finanças.
            <br />
            <span style={{ color: THREADS_GREEN }}>Sob controle.</span>
          </h1>
          <p className="mt-5 text-[14px] text-white/55 leading-relaxed max-w-xs">
            Acompanhe receitas, despesas, cartões e metas em um único lugar — com a clareza de um banco premium.
          </p>
          <ul className="mt-10 space-y-4">
            <AuthFeature icon={LineChart} title="Visão clara">
              Gráficos minimais que mostram exatamente para onde vai o seu dinheiro.
            </AuthFeature>
            <AuthFeature icon={ShieldCheck} title="Privado por padrão">
              Seus dados são seus. Criptografia ponta-a-ponta, sempre.
            </AuthFeature>
            <AuthFeature icon={Sparkles} title="Insights inteligentes">
              Descubra padrões e oportunidades de economia automaticamente.
            </AuthFeature>
          </ul>
        </div>

        {/* Mobile: headline */}
        <div className="relative lg:hidden mt-8">
          <h1 className="text-3xl font-bold tracking-tight leading-tight text-white">
            Suas finanças.
            <br />
            <span style={{ color: THREADS_GREEN }}>Sob controle.</span>
          </h1>
        </div>

        {/* Footer */}
        <div className="relative hidden lg:block">
          <p className="text-[11px] text-white/30">© 2025 Meu Ganho Pessoal · Feito com cuidado</p>
        </div>
      </aside>

      {/* ── RIGHT: form ── */}
      <main className="relative flex flex-col bg-background min-h-screen">

        {/* Top nav: mode toggle */}
        <div className="flex items-center justify-between px-8 py-6">
          {/* Mobile logo */}
          <div className="lg:hidden">
            <Logo variant="dark" size="sm" />
          </div>
          <div className="hidden lg:block" />

          <p className="text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                Novo aqui?{" "}
                <button
                  onClick={() => switchMode("register")}
                  className="font-semibold hover:underline underline-offset-2 transition-colors"
                  style={{ color: THREADS_GREEN }}
                >
                  Criar conta
                </button>
              </>
            ) : (
              <>
                Já tem conta?{" "}
                <button
                  onClick={() => switchMode("login")}
                  className="font-semibold hover:underline underline-offset-2 transition-colors"
                  style={{ color: THREADS_GREEN }}
                >
                  Entrar
                </button>
              </>
            )}
          </p>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-8 pb-10">
          <div className="w-full max-w-[400px]">

            {/* Heading — BlurText reanimates on mode change */}
            <div className="mb-8">
              <h2 className="text-[40px] lg:text-[48px] font-bold tracking-tighter leading-[1.05]" style={{ color: THREADS_GREEN }}>
                <BlurText
                  key={mode}
                  text={mode === "login" ? "Bem-vindo de volta." : "Crie sua conta."}
                  delay={0.06}
                  className="text-inherit"
                />
              </h2>
              <p className="mt-3 text-[14px] text-muted-foreground leading-relaxed">
                {mode === "login"
                  ? "Acesse sua conta e continue de onde parou."
                  : "Em menos de um minuto você está dentro. Sem cartão, sem ruído."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-7">

              {mode === "register" && (
                <div>
                  <label className={labelClass}>Nome</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    required
                    autoComplete="name"
                    className={inputClass}
                  />
                </div>
              )}

              <div>
                <label className={labelClass}>E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@email.com"
                  required
                  autoComplete="email"
                  className={inputClass}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={cn(labelClass, "mb-0")}>Senha</label>
                  {mode === "login" && (
                    <span className="text-[12px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                      Esqueci
                    </span>
                  )}
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "login" ? "••••••••" : "Crie uma senha forte"}
                  required
                  minLength={mode === "register" ? 8 : undefined}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className={inputClass}
                />
              </div>

              {error && (
                <p className="text-[13px] text-destructive -mt-2">{error}</p>
              )}

              <div className="pt-1">
                <SubmitButton loading={loading} label={mode === "login" ? "Entrar" : "Criar conta"} />
              </div>

              {mode === "register" && (
                <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  Grátis para sempre
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Bottom terms */}
        <p className="px-8 pb-6 text-[11px] text-muted-foreground/60">
          Ao continuar, você concorda com os{" "}
          <span className="hover:underline underline-offset-2 cursor-pointer">Termos</span> e a{" "}
          <span className="hover:underline underline-offset-2 cursor-pointer">Política de Privacidade</span>.
        </p>
      </main>
    </div>
  );
}

// ─── Menu items ───────────────────────────────────────────────────────────────

const menuItems = [
  {
    group: "Visão Geral",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/" },
      { icon: BarChart3, label: "Relatórios", path: "/relatorios" },
    ],
  },
  {
    group: "Finanças",
    items: [
      { icon: TrendingUp, label: "Receitas", path: "/receitas" },
      { icon: TrendingDown, label: "Despesas", path: "/despesas" },
    ],
  },
  {
    group: "Crédito",
    items: [
      { icon: CreditCard, label: "Cartão de Crédito", path: "/cartao" },
      { icon: ShoppingCart, label: "Parcelamentos", path: "/parcelamentos" },
    ],
  },
  {
    group: "Planejamento",
    items: [
      { icon: RefreshCw, label: "Recorrentes", path: "/recorrentes" },
      { icon: Target, label: "Metas", path: "/metas" },
    ],
  },
];

const SIDEBAR_WIDTH_KEY = "mgp-sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 360;

// ─── Main layout ──────────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user, refresh } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) return <AuthScreen onSuccess={refresh} />;

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

// ─── Dashboard layout content (authenticated) ────────────────────────────────

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: {
  children: React.ReactNode;
  setSidebarWidth: (w: number) => void;
}) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const activeItem = menuItems.flatMap((g) => g.items).find((i) => i.path === location);

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const left = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - left;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r-0" disableTransition={isResizing}>
          {/* Header */}
          <SidebarHeader className="h-16 justify-center border-b border-sidebar-border">
            <div className="flex items-center gap-3 px-2">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-sidebar-accent rounded-lg transition-colors focus:outline-none shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-sidebar-muted-foreground" />
              </button>
              {isCollapsed ? (
                <GBubbleIcon className="w-5 h-6 shrink-0" />
              ) : (
                <div className="flex items-center gap-2 min-w-0">
                  <GBubbleIcon className="w-5 h-6 shrink-0" />
                  <ShinyText
                    text="Meu Ganho Pessoal"
                    className="font-semibold text-sm tracking-tight truncate"
                    color="oklch(0.75 0 0)"
                    shineColor="oklch(1 0 0)"
                    speed={4}
                    spread={100}
                  />
                </div>
              )}
            </div>
          </SidebarHeader>

          {/* Navigation */}
          <SidebarContent className="py-3">
            {menuItems.map((group) => (
              <SidebarGroup key={group.group} className="px-2 py-0 mb-1">
                {!isCollapsed && (
                  <SidebarGroupLabel className="text-xs font-medium text-sidebar-muted-foreground px-2 mb-1 uppercase tracking-wider">
                    {group.group}
                  </SidebarGroupLabel>
                )}
                <SidebarMenu>
                  {group.items.map((item) => {
                    const isActive = location === item.path;
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => setLocation(item.path)}
                          tooltip={item.label}
                          className="h-9 transition-all font-normal"
                        >
                          <item.icon className={`h-4 w-4 ${isActive ? "text-sidebar-primary" : "text-sidebar-muted-foreground"}`} />
                          <span className={isActive ? "font-medium" : ""}>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroup>
            ))}
          </SidebarContent>

          {/* Footer */}
          <SidebarFooter className="p-3 border-t border-sidebar-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-sidebar-accent transition-colors w-full text-left focus:outline-none group-data-[collapsible=icon]:justify-center">
                  <Avatar className="h-8 w-8 shrink-0 border border-sidebar-border">
                    <AvatarFallback className="text-xs font-semibold bg-sidebar-primary text-sidebar-primary-foreground">
                      {user?.name?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium text-sidebar-foreground truncate leading-none">
                      {user?.name || "Usuário"}
                    </p>
                    <p className="text-xs text-sidebar-muted-foreground truncate mt-1">
                      {user?.email || ""}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Resize handle */}
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-4 backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-9 w-9 rounded-lg" />
              <span className="font-semibold text-sm">{activeItem?.label ?? "Menu"}</span>
            </div>
          </div>
        )}
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </>
  );
}
