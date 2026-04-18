import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Printer, Search, Receipt as ReceiptIcon } from "lucide-react";
import { useCompanyProfile } from "@/hooks/use-company-profile";
import { printDocument } from "@/lib/print-document";

interface SaleWithDetails {
  id: string;
  quantity_sold: number;
  selling_price: number;
  total_amount: number;
  profit: number;
  sale_date: string;
  sale_time: string;
  products: { name: string } | null;
  clients: { client_name: string; phone_number: string | null; email: string | null } | null;
}

export const Route = createFileRoute("/receipts")({
  component: ReceiptsPage,
});

function ReceiptsPage() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const { profile } = useCompanyProfile();
  const [sales, setSales] = useState<SaleWithDetails[]>([]);
  const [selected, setSelected] = useState<SaleWithDetails | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      supabase
        .from("sales")
        .select("id, quantity_sold, selling_price, total_amount, profit, sale_date, sale_time, products(name), clients(client_name, phone_number, email)")
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          if (data) setSales(data as SaleWithDetails[]);
        });
    }
  }, [user, role]);

  const handlePrint = (s: SaleWithDetails) => {
    printDocument(
      {
        type: "RECEIPT",
        number: s.id.slice(0, 8).toUpperCase(),
        date: s.sale_date,
        bill_to: {
          name: s.clients?.client_name ?? "Walk-in Customer",
          phone: s.clients?.phone_number,
          email: s.clients?.email,
        },
        items: [{
          description: s.products?.name ?? "Item",
          quantity: s.quantity_sold,
          unit_price: Number(s.selling_price),
          total: Number(s.total_amount),
        }],
        footer_message: "Thank you for your business!",
      },
      profile
    );
  };

  const filtered = sales.filter(
    (s) =>
      (s.products?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (s.clients?.client_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading || !user) return null;

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">Receipts</h1>
          <p className="text-sm sm:text-base text-muted-foreground">View and print sale receipts</p>
        </div>
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-input border-border text-foreground w-full sm:w-48"
          />
        </div>
      </div>

      {!profile?.company_name && (
        <div className="mb-4 rounded-lg border border-accent/30 bg-accent/10 p-3 text-sm text-foreground">
          ⚠ Set up your <a href="/settings" className="underline font-medium">company profile</a> to brand your receipts with your logo and details.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="border-b border-border bg-card">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Client</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Total</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-border hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => setSelected(s)}>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{s.sale_date}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{s.products?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{s.clients?.client_name ?? "Walk-in"}</td>
                  <td className="px-4 py-3 text-sm text-right text-foreground">${Number(s.total_amount).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSelected(s); }}>View</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-6 text-center text-muted-foreground">
              <ReceiptIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No receipts found
            </div>
          )}
        </div>

        {selected && (
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h2 className="font-heading text-lg font-semibold text-foreground">Receipt Preview</h2>
              <Button size="sm" onClick={() => handlePrint(selected)} className="bg-primary text-primary-foreground">
                <Printer className="h-4 w-4 mr-1" /> Print
              </Button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Receipt #:</span><span className="text-foreground font-mono">{selected.id.slice(0, 8).toUpperCase()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Date:</span><span className="text-foreground">{selected.sale_date}</span></div>
              <hr className="border-border my-2" />
              <div className="flex justify-between"><span className="text-muted-foreground">Bill To:</span><span className="text-foreground font-medium">{selected.clients?.client_name ?? "Walk-in"}</span></div>
              {selected.clients?.email && <div className="flex justify-between"><span className="text-muted-foreground">Email:</span><span className="text-foreground">{selected.clients.email}</span></div>}
              {selected.clients?.phone_number && <div className="flex justify-between"><span className="text-muted-foreground">Phone:</span><span className="text-foreground">{selected.clients.phone_number}</span></div>}
              <hr className="border-border my-2" />
              <div className="flex justify-between"><span className="text-muted-foreground">Product:</span><span className="text-foreground">{selected.products?.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Qty × Unit:</span><span className="text-foreground">{selected.quantity_sold} × ${Number(selected.selling_price).toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-border"><span className="text-foreground">TOTAL:</span><span className="text-primary">${Number(selected.total_amount).toFixed(2)}</span></div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
