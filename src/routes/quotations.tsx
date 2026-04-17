import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Printer, Plus, Trash2, Search } from "lucide-react";
import { useCompanyProfile } from "@/hooks/use-company-profile";
import { printDocument } from "@/lib/print-document";

interface Quotation {
  id: string;
  client_name: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  notes?: string;
  created_at: string;
  created_by: string;
}

export const Route = createFileRoute("/quotations")({
  component: QuotationsPage,
});

function QuotationsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { profile } = useCompanyProfile();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [selected, setSelected] = useState<Quotation | null>(null);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    client_name: "",
    product_name: "",
    quantity: "",
    unit_price: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  const fetchQuotations = async () => {
    const { data } = await supabase
      .from("quotations")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setQuotations(data as Quotation[]);
  };

  useEffect(() => {
    if (user) fetchQuotations();
  }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.client_name || !form.product_name || !form.quantity || !form.unit_price) return;
    
    setSubmitting(true);
    const total = Number(form.quantity) * Number(form.unit_price);
    
    await supabase.from("quotations").insert({
      client_name: form.client_name,
      product_name: form.product_name,
      quantity: Number(form.quantity),
      unit_price: Number(form.unit_price),
      total_amount: total,
      notes: form.notes || null,
      created_by: user.id,
    });
    
    setForm({ client_name: "", product_name: "", quantity: "", unit_price: "", notes: "" });
    setShowForm(false);
    setSubmitting(false);
    fetchQuotations();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("quotations").delete().eq("id", id);
    setSelected(null);
    fetchQuotations();
  };

  const handlePrint = (q: Quotation) => {
    printDocument(
      {
        type: "QUOTATION",
        number: q.id.slice(0, 8).toUpperCase(),
        date: new Date(q.created_at).toLocaleDateString(),
        bill_to: { name: q.client_name },
        items: [{
          description: q.product_name,
          quantity: q.quantity,
          unit_price: Number(q.unit_price),
          total: Number(q.total_amount),
        }],
        notes: q.notes,
        footer_message: "This is a quotation. Valid for 30 days from issue date.",
      },
      profile
    );
  };

  const filtered = quotations.filter(
    (q) =>
      q.client_name.toLowerCase().includes(search.toLowerCase()) ||
      q.product_name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading || !user) return null;

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Quotations</h1>
          <p className="text-muted-foreground">{quotations.length} quotations</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-input border-border text-foreground w-48"
            />
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="bg-primary text-primary-foreground">
            <Plus className="h-4 w-4 mr-1" /> New
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl border border-border bg-card p-6 max-w-lg">
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <Label className="text-foreground">Client Name</Label>
              <Input
                value={form.client_name}
                onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                required
                className="mt-1 bg-input border-border text-foreground"
              />
            </div>
            <div>
              <Label className="text-foreground">Product Name</Label>
              <Input
                value={form.product_name}
                onChange={(e) => setForm({ ...form, product_name: e.target.value })}
                required
                className="mt-1 bg-input border-border text-foreground"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground">Quantity</Label>
                <Input
                  type="number"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  required
                  className="mt-1 bg-input border-border text-foreground"
                />
              </div>
              <div>
                <Label className="text-foreground">Unit Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.unit_price}
                  onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
                  required
                  className="mt-1 bg-input border-border text-foreground"
                />
              </div>
            </div>
            <div>
              <Label className="text-foreground">Notes (Optional)</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="mt-1 bg-input border-border text-foreground"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={submitting} className="bg-primary text-primary-foreground">
                {submitting ? "Saving..." : "Create Quotation"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-card">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Client</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Product</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Total</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((q) => (
                <tr key={q.id} className="border-b border-border hover:bg-secondary/30 transition-colors cursor-pointer">
                  <td className="px-4 py-3 text-sm text-foreground">{q.client_name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{q.product_name}</td>
                  <td className="px-4 py-3 text-sm text-right text-foreground">${Number(q.total_amount).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => setSelected(q)}>
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-6 text-center text-muted-foreground">No quotations found</div>
          )}
        </div>

        {selected && (
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-semibold text-foreground">Quotation Details</h2>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handlePrint(selected)} className="bg-primary text-primary-foreground">
                  <Printer className="h-4 w-4 mr-1" /> Print
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(selected.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Date:</span><span className="text-foreground">{new Date(selected.created_at).toLocaleDateString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Client:</span><span className="text-foreground font-medium">{selected.client_name}</span></div>
              <hr className="border-border my-2" />
              <div className="flex justify-between"><span className="text-muted-foreground">Product:</span><span className="text-foreground">{selected.product_name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Qty × Unit:</span><span className="text-foreground">{selected.quantity} × ${Number(selected.unit_price).toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-border"><span className="text-foreground">TOTAL:</span><span className="text-primary">${Number(selected.total_amount).toFixed(2)}</span></div>
              {selected.notes && <p className="pt-2 text-muted-foreground text-xs">Notes: {selected.notes}</p>}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
