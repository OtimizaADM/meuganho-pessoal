import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MonthPickerProps {
  value: string; // "YYYY-MM"
  onChange: (value: string) => void;
}

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function MonthPicker({ value, onChange }: MonthPickerProps) {
  const [year, month] = value.split("-").map(Number);

  const prev = () => {
    const d = new Date(year, month - 2, 1);
    onChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const next = () => {
    const d = new Date(year, month, 1);
    onChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  return (
    <div className="flex items-center gap-1 bg-white border border-border rounded-xl px-3 py-1.5 shadow-sm">
      <Calendar className="w-4 h-4 text-muted-foreground mr-1" />
      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={prev}>
        <ChevronLeft className="w-4 h-4" />
      </Button>
      <span className="text-sm font-semibold text-foreground min-w-[130px] text-center">
        {MONTHS[month - 1]} {year}
      </span>
      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={next}>
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
