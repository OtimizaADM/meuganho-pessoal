export function formatCurrency(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "R$ 0,00";
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "";
  // Handle Date objects (returned by Drizzle/MySQL via SuperJSON)
  if (dateStr instanceof Date) {
    const y = dateStr.getFullYear();
    const m = String(dateStr.getMonth() + 1).padStart(2, "0");
    const d = String(dateStr.getDate()).padStart(2, "0");
    return `${d}/${m}/${y}`;
  }
  // Handle ISO strings like "2026-03-15" or "2026-03-15T00:00:00.000Z"
  const clean = String(dateStr).split("T")[0];
  const parts = clean.split("-");
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return String(dateStr);
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function getLast6Months(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

export function monthLabel(month: string): string {
  const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const [, m] = month.split("-").map(Number);
  return MONTHS[m - 1] ?? month;
}
