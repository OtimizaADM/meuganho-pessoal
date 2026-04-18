import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { GoogleIcon } from "./Home";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // mock — sem backend
    navigate("/app");
  };

  return (
    <AuthLayout
      footer={
        <span>
          Novo aqui?{" "}
          <Link to="/register" className="text-foreground font-medium hover:underline underline-offset-4">
            Criar conta
          </Link>
        </span>
      }
    >
      <div className="space-y-8">
        <div>
          <h2 className="font-display text-[34px] lg:text-[40px] font-semibold tracking-tighter leading-[1.05]">
            Bem-vindo de volta.
          </h2>
          <p className="mt-3 text-[15px] text-muted-foreground leading-relaxed">
            Acesse sua conta e continue de onde parou.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex w-full items-center justify-center gap-2.5 h-12 rounded-lg border border-border bg-background text-foreground text-[14px] font-medium hover:bg-muted/60 transition-colors"
        >
          <GoogleIcon className="w-[18px] h-[18px]" />
          Continuar com Google
        </button>

        <div className="relative flex items-center gap-3 text-[12px] text-muted-foreground">
          <div className="flex-1 h-px bg-border" />
          <span className="uppercase tracking-wider">ou com e-mail</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-7">
          <Field
            label="E-mail"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="voce@email.com"
            autoComplete="email"
          />
          <Field
            label="Senha"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            autoComplete="current-password"
            trailing={
              <a href="#" className="text-[12px] text-muted-foreground hover:text-foreground transition-colors">
                Esqueci
              </a>
            }
          />

          <button
            type="submit"
            className="group inline-flex w-full items-center justify-center gap-2 h-12 rounded-lg bg-[hsl(225_45%_8%)] text-white text-[14px] font-medium hover:bg-[hsl(225_45%_14%)] transition-colors"
          >
            Entrar
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  trailing,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-[12px] uppercase tracking-wider text-muted-foreground font-medium">{label}</label>
        {trailing}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        className="w-full mt-2 bg-transparent border-0 border-b border-border focus:border-foreground focus:ring-0 focus:outline-none px-0 py-2.5 text-[15px] placeholder:text-muted-foreground/60 transition-colors"
      />
    </div>
  );
}
