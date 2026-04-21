import { AlertTriangle, Bell, CreditCard } from "lucide-react";

type DueAlertItem = {
  card: {
    id: number | string;
    name: string;
    color: string;
  };
  daysUntilDue: number;
};

type DueAlertsCardProps = {
  dueAlerts: DueAlertItem[];
};

export default function DueAlertsCard({ dueAlerts }: DueAlertsCardProps) {
  if (dueAlerts.length === 0) {
    return null;
  }

  return (
    <div
      className="card-premium overflow-hidden border-amber-200/60"
      style={{ borderColor: "oklch(0.84 0.12 80 / 0.5)" }}
    >
      <div className="flex items-center gap-2 px-5 py-3 border-b border-amber-100">
        <Bell className="w-3.5 h-3.5 text-amber-600" />
        <h2 className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
          Alertas de vencimento
        </h2>
      </div>

      <div className="flex flex-wrap gap-2.5 px-5 py-3">
        {dueAlerts.map(({ card, daysUntilDue }) => {
          const isToday = daysUntilDue === 0;
          const isUrgent = daysUntilDue <= 2;

          return (
            <div
              key={card.id}
              className="flex items-center gap-2 bg-amber-50/70 border border-amber-100 rounded-xl px-3 py-2"
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${card.color}20` }}
              >
                <CreditCard className="w-3.5 h-3.5" style={{ color: card.color }} />
              </div>

              <div>
                <p className="text-xs font-semibold text-foreground">{card.name}</p>

                {isToday ? (
                  <p className="text-xs font-bold text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Vence hoje!
                  </p>
                ) : isUrgent ? (
                  <p className="text-xs text-orange-600">
                    {daysUntilDue === 1 ? "Vence amanhã" : `${daysUntilDue} dias`}
                  </p>
                ) : (
                  <p className="text-xs text-amber-600">
                    Vence em {daysUntilDue} dias
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
