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
import { getLoginUrl } from "@/const";
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
  Wallet,
  RefreshCw,
  Target,
} from "lucide-react";
import React, { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { BlurText } from "./ui/blur-text";
import { MagneticButton } from "./ui/magnetic-button";
import { ShinyText } from "./ui/shiny-text";
import { TiltCard } from "./ui/tilt-card";
import { Threads } from "./ui/threads";

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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="min-h-screen w-full bg-background grid grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
        {/* Brand side — dark navy */}
        <aside
          className="relative overflow-hidden text-white px-6 py-10 lg:px-14 lg:py-14 lg:flex lg:flex-col lg:justify-between min-h-[260px] lg:min-h-screen"
          style={{ background: "var(--sidebar)" }}
        >
          {/* Threads — background 3D animado */}
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
            style={{ background: "linear-gradient(135deg, rgba(0,0,0,0.45) 0%, transparent 50%, rgba(0,0,0,0.25) 100%)" }}
          />

          {/* Logo */}
          <div className="relative flex items-center gap-2.5">
            <img src="/logo-white.svg" alt="Meu Ganho Pessoal" className="w-9 h-9 shrink-0" />
            <span className="font-semibold text-[16px] tracking-tight text-white">
              Meu Ganho <span className="text-white/50">Pessoal</span>
            </span>
          </div>

          {/* Desktop headline + features */}
          <div className="relative hidden lg:block max-w-md mt-16">
            <h1 className="text-[44px] xl:text-[50px] leading-[1.05] font-semibold tracking-tighter text-white">
              Suas finanças.
              <br />
              <span className="text-white/50">Sob controle.</span>
            </h1>
            <p className="mt-5 text-[15px] text-white/60 leading-relaxed max-w-sm">
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

          {/* Mobile headline */}
          <div className="relative lg:hidden mt-8">
            <h1 className="text-3xl font-semibold tracking-tight leading-tight text-white">
              Suas finanças.
              <br />
              <span className="text-white/50">Sob controle.</span>
            </h1>
          </div>

          {/* Brand footer */}
          <div className="relative hidden lg:block">
            <p className="text-[12px] text-white/35">© 2025 Meu Ganho Pessoal · Feito com cuidado</p>
          </div>
        </aside>

        {/* Form side — light */}
        <main className="relative flex flex-col px-6 py-10 lg:px-16 lg:py-14 bg-background">
          <div className="flex-1 flex items-center justify-center py-10 lg:py-0">
            <TiltCard className="w-full max-w-[380px]">
              <div className="flex flex-col items-center gap-8 rounded-2xl border bg-card p-8 shadow-sm">
                <div className="flex flex-col items-center gap-4 text-center">
                  <img src="/logo.svg" alt="Meu Ganho Pessoal" className="w-14 h-14" />
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight">
                      <BlurText text="Bem-vindo de volta" />
                    </h2>
                    <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                      Faça login para acessar seu painel financeiro pessoal.
                    </p>
                  </div>
                </div>
                <MagneticButton
                  onClick={() => { window.location.href = getLoginUrl(); }}
                  size="lg"
                  className="w-full h-12 text-base font-medium"
                >
                  Entrar na plataforma
                </MagneticButton>
              </div>
            </TiltCard>
          </div>
          <p className="text-[11px] text-muted-foreground text-center lg:text-left">
            Ao continuar, você concorda com os{" "}
            <span className="underline-offset-2 hover:underline cursor-pointer">Termos</span> e a{" "}
            <span className="underline-offset-2 hover:underline cursor-pointer">Política de Privacidade</span>.
          </p>
        </main>
      </div>
    );
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

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
              {!isCollapsed && (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-sidebar-primary flex items-center justify-center shrink-0">
                    <Wallet className="w-3.5 h-3.5 text-sidebar-primary-foreground" />
                  </div>
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
