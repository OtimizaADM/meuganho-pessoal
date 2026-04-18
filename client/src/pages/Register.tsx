import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { GoogleIcon } from "./Home";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    navigate("/app");
  };

  const strength = passwordStrength(password);

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
            Crie sua conta.
          </h2>
          <p className="mt-3 text-[15px] text-muted-foreground leading-relaxed">
            Em menos de um minuto você está dentro. Sem cartão, sem ruído.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex w-full items-center justify-center gap-2.5 h-12 rounded-lg border border-border bg-background text-foreground text-[14px] font-medium hover:bg-muted/60 transition-colors"
        >
          <GoogleIcon className="w-[18px] h-[18px]" />
          Cadastrar com Google
        </button>

        <div className="relative flex items-center gap-3 text-[12px] text-muted-foreground">
          <div className="flex-1 h-px bg-border" />
          <span className="uppercase tracking-wider">ou com e-mail</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-7">
          <Field label="Nome" type="text" value={name} onChange={setName} placeholder="Seu nome" autoComplete="name" />
          <Field label="E-mail" type="email" value={email} onChange={setEmail} placeholder="voce@email.com" autoComplete="email" />
          <div>
            <Field
              label="Senha"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="Crie uma senha forte"
              autoComplete="new-password"
            />
            {password.length > 0 && (
              <div className="mt-3 flex items-center gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i < strength.score ? strength.color : "bg-border"
                    }`}
                  />
                ))}
                <span className="text-[11px] text-muted-foreground ml-2 w-14">{strength.label}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="group inline-flex w-full items-center justify-center gap-2 h-12 rounded-lg bg-[hsl(225_45%_8%)] text-white text-[14px] font-medium hover:bg-[hsl(225_45%_14%)] transition-colors"
          >
            Criar conta
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
          </button>

          <ul className="space-y-1.5 pt-1">
            {["Grátis para sempre", "Sem cartão de crédito", "Cancele quando quiser"].map((t) => (
              <li key={t} className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-foreground" strokeWidth={2.25} />
                {t}
              </li>
            ))}
          </ul>
        </form>
      </div>
    </AuthLayout>
  );
}

function passwordStrength(p: string) {
  let score = 0;
  if (p.length >= 6) score++;
  if (p.length >= 10) score++;
  if (/[A-Z]/.test(p) && /[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  const colors = ["bg-expense", "bg-warning", "bg-warning", "bg-income"];
  const labels = ["Fraca", "Média", "Boa", "Forte"];
  return {
    score,
    color: colors[Math.max(0, score - 1)] ?? "bg-border",
    label: score === 0 ? "" : labels[score - 1],
  };
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="text-[12px] uppercase tracking-wider text-muted-foreground font-medium">{label}</label>
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
