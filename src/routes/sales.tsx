import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/sales")({
  component: SalesPage,
});

function SalesPage() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Tables<"products">[]>([]);
  const [clients, setClients] = useState<Tables<"clients">[]>([]);
  const [sales, setSales] = useState<(Tables<"sales"> & { products?: { name: string } | null; clients?: { client_name: string } | null })[]>([]);
  const [form, setForm] = useState({ product_id: "", client_id: "", quantity: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
    if (!loading && role !== "employer") navigate({ to: "/dashboard" });
  }, [user, role, loading, navigate]);

  const fetchData = async () => {
    const [{ data: p }, { data: c }, { data: s }] = await Promise.all([
      supabase.from("products").select("*").gt("stock_quantity", 0).order("name"),
      supabase.from("clients").select("*").order("client_name"),
      supabase.from("sales").select("*, products(name), clients(client_name)").order("created_at", { ascending: false }),
    ]);
    if (p) setProducts(p);
    if (c) setClients(c);
    if (s) setSales(s as typeof sales);
  };

  useEffect(() => {
    if (user && role === "employer") fetchData();
  }, [user, role]);

  const handleSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const product = products.find((p) => p.id === form.product_id);
    if (!product) return;
    const qty = parseInt(form.quantity);
    if (qty <= 0 || qty > product.stock_quantity) return;

    const total = qty * Number(product.selling_price);
    const profit = qty * (Number(product.selling_price) - Number(product.buying_price));

    setSubmitting(true);
    await supabase.from("sales").insert({
      product_id: form.product_id,
      client_id: form.client_id || null,
      quantity_sold: qty,
      buying_price: Number(product.buying_price),
      selling_price: Number(product.selling_price),
      total_amount: total,
      profit,
      created_by: user.id,
    });
    setForm({ product_id: "", client_id: "", quantity: "" });
    setSubmitting(false);
    fetchData();
  };

  if (loading || !user || role !== "employer") return null;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold text-foreground">Sales</h1>
        <p className="text-muted-foreground">Record and view sales</p>
      </div>

      <div className="mb-8 max-w-lg rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 font-heading text-lg font-semibold text-foreground">New Sale</h2>
        <form onSubmit={handleSale} className="space-y-4">
          <div>
            <Label className="text-foreground">Product</Label>
            <select
              value={form.product_id}
              onChange={(e) => setForm({ ...form, product_id: e.target.value })}
              required
              className="mt-1 w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground"
            >
              <option value="">Select product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stock: {p.stock_quantity}, ${Number(p.selling_price).toFixed(2)})
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-foreground">Client (optional)</Label>
            <select
              value={form.client_id}
              onChange={(e) => setForm({ ...form, client_id: e.target.value })}
              className="mt-1 w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground"
            >
              <option value="">No client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.client_name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-foreground">Quantity</Label>
            <Input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required className="mt-1 bg-input border-border text-foreground" />
          </div>
          <Button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground">
            {submitting ? "Processing..." : "Record Sale"}
          </Button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-card">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Product</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Client</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Qty</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Total</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Profit</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                <td className="px-4 py-3 text-sm text-muted-foreground">{s.sale_date}</td>
                <td className="px-4 py-3 text-sm font-medium text-foreground">{s.products?.name ?? "—"}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{s.clients?.client_name ?? "—"}</td>
                <td className="px-4 py-3 text-sm text-right text-foreground">{s.quantity_sold}</td>
                <td className="px-4 py-3 text-sm text-right text-foreground">${Number(s.total_amount).toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-right text-accent">${Number(s.profit).toFixed(2)}</td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No sales yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
