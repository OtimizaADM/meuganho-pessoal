import { ReactNode, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  CreditCard,
  CalendarClock,
  Repeat,
  Target,
  PieChart,
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  Eye,
  EyeOff,
  LogOut,
} from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { formatBRL, summary } from "@/lib/finance-data";

const nav = [
  { to: "/app", label: "Visão geral", icon: LayoutDashboard },
  { to: "/receitas", label: "Receitas", icon: TrendingUp },
  { to: "/despesas", label: "Despesas", icon: TrendingDown },
  { to: "/cartao", label: "Cartões", icon: CreditCard },
  { to: "/parcelamentos", label: "Parcelamentos", icon: CalendarClock },
  { to: "/recorrentes", label: "Recorrentes", icon: Repeat },
  { to: "/metas", label: "Metas", icon: Target },
  { to: "/relatorios", label: "Relatórios", icon: PieChart },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const current = nav.find((n) => (n.to === "/app" ? location.pathname === "/app" : location.pathname.startsWith(n.to)));

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-60 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <SidebarInner />
      </aside>

      {/* Sidebar mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="relative w-72 bg-sidebar text-sidebar-foreground flex flex-col animate-slide-in border-r border-sidebar-border">
            <SidebarInner onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar — minimal glass */}
        <header className="sticky top-0 z-40 glass border-b border-border/60">
          <div className="flex items-center gap-3 px-4 lg:px-10 h-16">
            <Button variant="ghost" size="icon" className="lg:hidden -ml-2" onClick={() => setOpen(true)}>
              <Menu className="h-5 w-5" strokeWidth={1.75} />
            </Button>

            <div className="flex-1 min-w-0">
              <h1 className="font-display text-[15px] font-semibold truncate tracking-tight">
                {current?.label ?? "Visão geral"}
              </h1>
              <p className="text-[11px] text-muted-foreground -mt-0.5">Olá, Pedro</p>
            </div>

            <div className="hidden md:flex items-center gap-2 px-3.5 h-9 rounded-full bg-muted border border-transparent hover:border-border w-72 transition-colors">
              <Search className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
              <input
                placeholder="Buscar transações..."
                className="flex-1 bg-transparent outline-none text-[13px] placeholder:text-muted-foreground"
              />
            </div>

            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Alternar tema" className="rounded-full">
              {theme === "dark" ? <Sun className="h-[18px] w-[18px]" strokeWidth={1.75} /> : <Moon className="h-[18px] w-[18px]" strokeWidth={1.75} />}
            </Button>
            <Button variant="ghost" size="icon" className="relative rounded-full">
              <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-primary" />
            </Button>
            <div className="hidden sm:flex items-center gap-3 pl-3 ml-1 border-l border-border">
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Saldo</p>
                <button onClick={() => setShowBalance((s) => !s)} className="font-display font-semibold text-[13px] flex items-center gap-1.5 tabular hover:text-primary transition-colors">
                  {showBalance ? formatBRL(summary.balance) : "R$ ••••••"}
                  {showBalance ? <Eye className="h-3 w-3 opacity-60" strokeWidth={1.75} /> : <EyeOff className="h-3 w-3 opacity-60" strokeWidth={1.75} />}
                </button>
              </div>
              <div className="w-9 h-9 rounded-full bg-primary grid place-items-center text-primary-foreground text-[13px] font-semibold ring-2 ring-background">
                P
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 lg:px-10 py-6 lg:py-10 max-w-[1400px] w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarInner({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <div className="px-6 pt-7 pb-8">
        <div className="flex items-center gap-2.5">
          <BrandMark className="w-8 h-8 object-contain shrink-0" />
          <div className="leading-none">
            <p className="font-display font-semibold text-[15px] tracking-tight">
              meu <span className="text-foreground">Ganho</span>
            </p>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">Personal finance</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto scrollbar-thin">
        <p className="px-3 text-[10px] uppercase tracking-widest text-muted-foreground/70 mb-2 font-medium">Menu</p>
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/app"}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className="h-[17px] w-[17px] shrink-0" strokeWidth={isActive ? 2 : 1.75} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition">
          <LogOut className="h-[17px] w-[17px]" strokeWidth={1.75} />
          Sair
        </button>
      </div>
    </>
  );
}
