import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Receitas from "./pages/Receitas";
import Despesas from "./pages/Despesas";
import Cartao from "./pages/Cartao";
import Parcelamentos from "./pages/Parcelamentos";
import Relatorios from "./pages/Relatorios";
import Recorrentes from "./pages/Recorrentes";
import Metas from "./pages/Metas";

function Router() {
  return (
    <DashboardLayout>
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
