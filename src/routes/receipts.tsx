import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

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
  const [sales, setSales] = useState<SaleWithDetails[]>([]);
  const [selected, setSelected] = useState<SaleWithDetails | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
    if (!loading && role !== "employer") navigate({ to: "/dashboard" });
  }, [user, role, loading, navigate]);

  useEffect(() => {
    if (user && role === "employer") {
      supabase
        .from("sales")
        .select("id, quantity_sold, selling_price, total_amount, profit, sale_date, sale_time, products(name), clients(client_name, phone_number, email)")
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          if (data) setSales(data as SaleWithDetails[]);
        });
    }
  }, [user, role]);

  const handlePrint = () => {
    if (!receiptRef.current) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<html><head><title>Receipt</title><style>
      body { font-family: monospace; padding: 20px; max-width: 400px; margin: auto; color: #333; }
      h2 { text-align: center; }
      hr { border: 1px dashed #ccc; }
      .row { display: flex; justify-content: space-between; margin: 4px 0; }
    </style></head><body>${receiptRef.current.innerHTML}</body></html>`);
    win.document.close();
    win.print();
  };

  if (loading || !user || role !== "employer") return null;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold text-foreground">Receipts</h1>
        <p className="text-muted-foreground">View and print sale receipts</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-card">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Product</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Total</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">View</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id} className="border-b border-border hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => setSelected(s)}>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{s.sale_date}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{s.products?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-right text-foreground">${Number(s.total_amount).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => setSelected(s)}>View</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selected && (
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-semibold text-foreground">Receipt</h2>
              <Button size="sm" onClick={handlePrint} className="bg-primary text-primary-foreground">
                <Printer className="h-4 w-4 mr-1" /> Print
              </Button>
            </div>
            <div ref={receiptRef}>
              <h2 style={{ textAlign: "center" }}>NAAMA</h2>
              <hr />
              <div className="row" style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Date:</span><span>{selected.sale_date}</span>
              </div>
              <div className="row" style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Time:</span><span>{selected.sale_time}</span>
              </div>
              <hr />
              {selected.clients && (
                <>
                  <div className="row" style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Client:</span><span>{selected.clients.client_name}</span>
                  </div>
                  {selected.clients.phone_number && (
                    <div className="row" style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Phone:</span><span>{selected.clients.phone_number}</span>
                    </div>
                  )}
                  <hr />
                </>
              )}
              <div className="row" style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Product:</span><span>{selected.products?.name}</span>
              </div>
              <div className="row" style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Qty:</span><span>{selected.quantity_sold}</span>
              </div>
              <div className="row" style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Unit Price:</span><span>${Number(selected.selling_price).toFixed(2)}</span>
              </div>
              <hr />
              <div className="row" style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
                <span>TOTAL:</span><span>${Number(selected.total_amount).toFixed(2)}</span>
              </div>
              <hr />
              <p style={{ textAlign: "center", marginTop: "12px", fontSize: "12px" }}>Thank you for your business!</p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
