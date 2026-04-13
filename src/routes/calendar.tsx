import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DaySales {
  count: number;
  revenue: number;
}

export const Route = createFileRoute("/calendar")({
  component: CalendarPage,
});

function CalendarPage() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [salesByDate, setSalesByDate] = useState<Record<string, DaySales>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [daySales, setDaySales] = useState<{ product: string; qty: number; total: number }[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
    if (!loading && role !== "employer") navigate({ to: "/dashboard" });
  }, [user, role, loading, navigate]);

  useEffect(() => {
    if (user && role === "employer") {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const start = new Date(year, month, 1).toISOString().split("T")[0];
      const end = new Date(year, month + 1, 0).toISOString().split("T")[0];

      supabase
        .from("sales")
        .select("sale_date, total_amount")
        .gte("sale_date", start)
        .lte("sale_date", end)
        .then(({ data }) => {
          const map: Record<string, DaySales> = {};
          data?.forEach((s) => {
            if (!map[s.sale_date]) map[s.sale_date] = { count: 0, revenue: 0 };
            map[s.sale_date].count++;
            map[s.sale_date].revenue += Number(s.total_amount);
          });
          setSalesByDate(map);
        });
    }
  }, [user, role, currentDate]);

  const loadDaySales = async (date: string) => {
    setSelectedDate(date);
    const { data } = await supabase
      .from("sales")
      .select("quantity_sold, total_amount, products(name)")
      .eq("sale_date", date);
    if (data) {
      setDaySales(
        data.map((s: { quantity_sold: number; total_amount: number; products: { name: string } | null }) => ({
          product: s.products?.name ?? "Unknown",
          qty: s.quantity_sold,
          total: Number(s.total_amount),
        }))
      );
    }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  if (loading || !user || role !== "employer") return null;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold text-foreground">Calendar</h1>
        <p className="text-muted-foreground">Sales by date</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentDate(new Date(year, month - 1))} className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="font-heading text-lg font-semibold text-foreground">{monthName}</h2>
            <button onClick={() => setCurrentDate(new Date(year, month + 1))} className="text-muted-foreground hover:text-foreground">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const info = salesByDate[dateStr];
              const isSelected = selectedDate === dateStr;

              return (
                <button
                  key={day}
                  onClick={() => loadDaySales(dateStr)}
                  className={`rounded-lg p-2 text-sm transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : info
                      ? "bg-accent/10 text-accent hover:bg-accent/20"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <div className="font-medium">{day}</div>
                  {info && <div className="text-[10px] mt-0.5">{info.count} sales</div>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground mb-4">
            {selectedDate ? `Sales on ${selectedDate}` : "Select a date"}
          </h2>
          {selectedDate && daySales.length === 0 && (
            <p className="text-muted-foreground text-sm">No sales on this date.</p>
          )}
          {daySales.map((s, i) => (
            <div key={i} className="flex items-center justify-between border-b border-border py-3 last:border-0">
              <div>
                <p className="text-sm font-medium text-foreground">{s.product}</p>
                <p className="text-xs text-muted-foreground">Qty: {s.qty}</p>
              </div>
              <p className="text-sm font-medium text-accent">${s.total.toFixed(2)}</p>
            </div>
          ))}
          {selectedDate && daySales.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border flex justify-between">
              <span className="text-sm font-medium text-foreground">Total</span>
              <span className="text-sm font-bold text-accent">
                ${daySales.reduce((s, d) => s + d.total, 0).toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
