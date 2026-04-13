import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Search } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/clients")({
  component: ClientsPage,
});

function ClientsPage() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Tables<"clients">[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ client_name: "", phone_number: "", email: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  const fetchClients = async () => {
    const { data } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
    if (data) setClients(data);
  };

  useEffect(() => {
    if (user) fetchClients();
  }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    await supabase.from("clients").insert({
      client_name: form.client_name,
      phone_number: form.phone_number || null,
      email: form.email || null,
      added_by: user.id,
    });
    setForm({ client_name: "", phone_number: "", email: "" });
    setShowForm(false);
    setSubmitting(false);
    fetchClients();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("clients").delete().eq("id", id);
    fetchClients();
  };

  const filtered = clients.filter(
    (c) =>
      c.client_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone_number ?? "").includes(search) ||
      (c.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading || !user) return null;

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Clients</h1>
          <p className="text-muted-foreground">{clients.length} clients</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-input border-border text-foreground w-48" />
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="bg-primary text-primary-foreground">
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl border border-border bg-card p-6 max-w-lg">
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <Label className="text-foreground">Client Name</Label>
              <Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} required className="mt-1 bg-input border-border text-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground">Phone</Label>
                <Input value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} className="mt-1 bg-input border-border text-foreground" />
              </div>
              <div>
                <Label className="text-foreground">Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 bg-input border-border text-foreground" />
              </div>
            </div>
            <Button type="submit" disabled={submitting} className="bg-primary text-primary-foreground">
              {submitting ? "Adding..." : "Add Client"}
            </Button>
          </form>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-card">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Phone</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Added</th>
              {role === "employer" && (
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-foreground">{c.client_name}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{c.phone_number ?? "—"}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{c.email ?? "—"}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</td>
                {role === "employer" && (
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(c.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No clients found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
