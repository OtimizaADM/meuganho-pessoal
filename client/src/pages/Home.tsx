import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { BarChart3, Loader2, TrendingUp, Wallet } from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 flex flex-col gap-10">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {user ? `Olá, ${user.name?.split(" ")[0]}` : "Meu Ganho Pessoal"}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground ml-[52px]">
          {isAuthenticated
            ? "Seu painel financeiro está pronto."
            : "Gerencie suas finanças com clareza e inteligência."}
        </p>
      </div>

      {/* Stats placeholders */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { icon: TrendingUp, label: "Receitas", value: "—" },
          { icon: BarChart3, label: "Despesas", value: "—" },
          { icon: Wallet, label: "Saldo", value: "—" },
        ].map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="rounded-xl border bg-card p-4 flex flex-col gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-semibold tracking-tight mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Auth actions */}
      <div className="flex gap-3">
        {isAuthenticated ? (
          <Button variant="outline" onClick={logout} size="sm">
            Sair
          </Button>
        ) : (
          <Button onClick={() => { window.location.href = getLoginUrl(); }} size="sm">
            Entrar na plataforma
          </Button>
        )}
      </div>
    </div>
  );
}
