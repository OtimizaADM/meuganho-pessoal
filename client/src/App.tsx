import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";

const NotFound = lazy(() => import("./pages/NotFound"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Receitas = lazy(() => import("./pages/Receitas"));
const Despesas = lazy(() => import("./pages/Despesas"));
const Cartao = lazy(() => import("./pages/Cartao"));
const Parcelamentos = lazy(() => import("./pages/Parcelamentos"));
const Relatorios = lazy(() => import("./pages/Relatorios"));
const Recorrentes = lazy(() => import("./pages/Recorrentes"));
const Metas = lazy(() => import("./pages/Metas"));

function RouteLoadingFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary" />
        <div>
          <p className="text-sm font-medium text-foreground">
            Carregando página
          </p>
          <p className="text-sm text-muted-foreground">
            Preparando a interface...
          </p>
        </div>
      </div>
    </div>
  );
}

function Router() {
  return (
    <DashboardLayout>
      <Suspense fallback={<RouteLoadingFallback />}>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/receitas" component={Receitas} />
          <Route path="/despesas" component={Despesas} />
          <Route path="/cartao" component={Cartao} />
          <Route path="/parcelamentos" component={Parcelamentos} />
          <Route path="/relatorios" component={Relatorios} />
          <Route path="/recorrentes" component={Recorrentes} />
          <Route path="/metas" component={Metas} />
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
