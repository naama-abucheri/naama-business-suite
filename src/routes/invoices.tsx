import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Printer, Plus, Trash2, Search, FileCheck } from "lucide-react";
import { useCompanyProfile } from "@/hooks/use-company-profile";
import { printDocument } from "@/lib/print-document";

interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  client_address: string | null;
  client_phone: string | null;
  client_email: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  status: string;
  due_date: string | null;
  notes: string | null;
  created_at: string;
  created_by: string;
}

export const Route = createFileRoute("/invoices")({
  component: InvoicesPage,
});

function InvoicesPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { profile } = useCompanyProfile();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    client_name: "",
    client_address: "",
    client_phone: "",
    client_email: "",
    product_name: "",
    quantity: "",
    unit_price: "",
    due_date: "",
    notes: "",
  });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  const fetchInvoices = async () => {
    const { data } = await supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setInvoices(data as Invoice[]);
  };

  useEffect(() => {
    if (user) fetchInvoices();
  }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    const total = Number(form.quantity) * Number(form.unit_price);
    const number = `INV-${Date.now().toString().slice(-6)}`;
    await supabase.from("invoices").insert({
      invoice_number: number,
      client_name: form.client_name,
      client_address: form.client_address || null,
      client_phone: form.client_phone || null,
      client_email: form.client_email || null,
      product_name: form.product_name,
      quantity: Number(form.quantity),
      unit_price: Number(form.unit_price),
      total_amount: total,
      due_date: form.due_date || null,
      notes: form.notes || null,
      status: "unpaid",
      created_by: user.id,
    });
    setForm({
      client_name: "", client_address: "", client_phone: "", client_email: "",
      product_name: "", quantity: "", unit_price: "", due_date: "", notes: "",
    });
    setShowForm(false);
    setSubmitting(false);
    fetchInvoices();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("invoices").delete().eq("id", id);
    setSelected(null);
    fetchInvoices();
  };

  const toggleStatus = async (inv: Invoice) => {
    const newStatus = inv.status === "paid" ? "unpaid" : "paid";
    await supabase.from("invoices").update({ status: newStatus }).eq("id", inv.id);
    setSelected({ ...inv, status: newStatus });
    fetchInvoices();
  };

  const handlePrint = (inv: Invoice) => {
    printDocument(
      {
        type: "INVOICE",
        number: inv.invoice_number,
        date: new Date(inv.created_at).toLocaleDateString(),
        due_date: inv.due_date,
        status: inv.status,
        bill_to: {
          name: inv.client_name,
          address: inv.client_address,
          phone: inv.client_phone,
          email: inv.client_email,
        },
        items: [{
          description: inv.product_name,
          quantity: inv.quantity,
          unit_price: Number(inv.unit_price),
          total: Number(inv.total_amount),
        }],
        notes: inv.notes,
        footer_message: inv.status === "paid" ? "Payment received — thank you!" : "Please remit payment by the due date.",
      },
      profile
    );
  };

  const filtered = invoices.filter(
    (q) =>
      q.client_name.toLowerCase().includes(search.toLowerCase()) ||
      q.product_name.toLowerCase().includes(search.toLowerCase()) ||
      q.invoice_number.toLowerCase().includes(search.toLowerCase())
  );

  if (loading || !user) return null;

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">Invoices</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{invoices.length} invoices</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-input border-border text-foreground w-full sm:w-48"
            />
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="bg-primary text-primary-foreground">
            <Plus className="h-4 w-4 mr-1" /> New
          </Button>
        </div>
      </div>

      {!profile?.company_name && (
        <div className="mb-4 rounded-lg border border-accent/30 bg-accent/10 p-3 text-sm text-foreground">
          ⚠ Set up your <a href="/settings" className="underline font-medium">company profile</a> for branded invoices.
        </div>
      )}

      {showForm && (
        <div className="mb-6 rounded-xl border border-border bg-card p-4 sm:p-6 max-w-full lg:max-w-2xl">
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-foreground">Client Name *</Label>
                <Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} required className="mt-1 bg-input border-border text-foreground" />
              </div>
              <div>
                <Label className="text-foreground">Client Email</Label>
                <Input type="email" value={form.client_email} onChange={(e) => setForm({ ...form, client_email: e.target.value })} className="mt-1 bg-input border-border text-foreground" />
              </div>
              <div>
                <Label className="text-foreground">Client Phone</Label>
                <Input value={form.client_phone} onChange={(e) => setForm({ ...form, client_phone: e.target.value })} className="mt-1 bg-input border-border text-foreground" />
              </div>
              <div>
                <Label className="text-foreground">Client Address (Optional)</Label>
                <Input value={form.client_address} onChange={(e) => setForm({ ...form, client_address: e.target.value })} className="mt-1 bg-input border-border text-foreground" />
              </div>
            </div>
            <div>
              <Label className="text-foreground">Product/Service *</Label>
              <Input value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })} required className="mt-1 bg-input border-border text-foreground" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-foreground">Quantity *</Label>
                <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required className="mt-1 bg-input border-border text-foreground" />
              </div>
              <div>
                <Label className="text-foreground">Unit Price *</Label>
                <Input type="number" step="0.01" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} required className="mt-1 bg-input border-border text-foreground" />
              </div>
              <div>
                <Label className="text-foreground">Due Date</Label>
                <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="mt-1 bg-input border-border text-foreground" />
              </div>
            </div>
            <div>
              <Label className="text-foreground">Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1 bg-input border-border text-foreground" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={submitting} className="bg-primary text-primary-foreground">
                {submitting ? "Saving..." : "Create Invoice"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-border bg-card">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Invoice #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Client</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Total</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((q) => (
                <tr key={q.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 text-sm text-foreground font-mono">{q.invoice_number}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{q.client_name}</td>
                  <td className="px-4 py-3 text-sm text-right text-foreground">${Number(q.total_amount).toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${q.status === "paid" ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"}`}>
                      {q.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => setSelected(q)}>View</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-6 text-center text-muted-foreground">
              <FileCheck className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No invoices yet
            </div>
          )}
        </div>

        {selected && (
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h2 className="font-heading text-lg font-semibold text-foreground">{selected.invoice_number}</h2>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => toggleStatus(selected)}>
                  Mark {selected.status === "paid" ? "Unpaid" : "Paid"}
                </Button>
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
              {selected.due_date && <div className="flex justify-between"><span className="text-muted-foreground">Due:</span><span className="text-foreground">{selected.due_date}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Bill To:</span><span className="text-foreground font-medium">{selected.client_name}</span></div>
              {selected.client_email && <div className="flex justify-between"><span className="text-muted-foreground">Email:</span><span className="text-foreground">{selected.client_email}</span></div>}
              {selected.client_phone && <div className="flex justify-between"><span className="text-muted-foreground">Phone:</span><span className="text-foreground">{selected.client_phone}</span></div>}
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
