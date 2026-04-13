import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { DollarSign, Package, TrendingUp, Users, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalClients: 0,
    totalRevenue: 0,
    totalProfit: 0,
    lowStockCount: 0,
  });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const { count: productCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });

      const { count: clientCount } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true });

      const { data: lowStock } = await supabase
        .from("products")
        .select("id")
        .lt("stock_quantity", 10);

      let totalRevenue = 0;
      let totalProfit = 0;

      if (role === "employer") {
        const { data: sales } = await supabase.from("sales").select("total_amount, profit");
        if (sales) {
          totalRevenue = sales.reduce((sum, s) => sum + Number(s.total_amount), 0);
          totalProfit = sales.reduce((sum, s) => sum + Number(s.profit), 0);
        }
      }

      setStats({
        totalProducts: productCount ?? 0,
        totalClients: clientCount ?? 0,
        totalRevenue,
        totalProfit,
        lowStockCount: lowStock?.length ?? 0,
      });
    };
    fetchStats();
  }, [user, role]);

  if (loading || !user) return null;

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Welcome back to Naama</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Products" value={stats.totalProducts} icon={Package} />
        <StatCard title="Clients" value={stats.totalClients} icon={Users} />
        {role === "employer" && (
          <>
            <StatCard
              title="Revenue"
              value={`$${stats.totalRevenue.toFixed(2)}`}
              icon={DollarSign}
            />
            <StatCard
              title="Profit"
              value={`$${stats.totalProfit.toFixed(2)}`}
              icon={TrendingUp}
            />
          </>
        )}
        {stats.lowStockCount > 0 && (
          <StatCard
            title="Low Stock"
            value={stats.lowStockCount}
            icon={AlertTriangle}
            subtitle="Items below 10 units"
          />
        )}
      </div>
    </DashboardLayout>
  );
}
