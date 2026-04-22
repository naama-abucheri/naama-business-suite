import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Pencil, Search } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/inventory")({
  component: InventoryPage,
});

function InventoryPage() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Tables<"products">[]>([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", category: "", buying_price: 0, selling_price: 0, stock_quantity: 0 });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (data) setProducts(data);
  };

  useEffect(() => {
    if (user) fetchProducts();
  }, [user]);

  const handleDelete = async (id: string) => {
    await supabase.from("products").delete().eq("id", id);
    fetchProducts();
  };

  const handleUpdate = async (id: string) => {
    setError("");

    const name = editForm.name.trim();
    if (!name) {
      setError("Product name is required.");
      return;
    }
    if (Number.isNaN(editForm.buying_price) || editForm.buying_price < 0) {
      setError("Buying price must be a valid non-negative number.");
      return;
    }
    if (Number.isNaN(editForm.selling_price) || editForm.selling_price < 0) {
      setError("Selling price must be a valid non-negative number.");
      return;
    }
    if (!Number.isInteger(editForm.stock_quantity) || editForm.stock_quantity < 0) {
      setError("Stock quantity must be a whole number 0 or higher.");
      return;
    }

    await supabase.from("products").update({
      name,
      category: editForm.category,
      buying_price: editForm.buying_price,
      selling_price: editForm.selling_price,
      stock_quantity: editForm.stock_quantity,
    }).eq("id", id);
    setEditingId(null);
    fetchProducts();
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category ?? "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading || !user) return null;

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground">{products.length} products</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-input border-border text-foreground"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-card">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Category</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Buy Price</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Sell Price</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Stock</th>
              {role === "employer" && (
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                {editingId === p.id ? (
                  <>
                    <td className="px-4 py-3">
                      <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="bg-input border-border text-foreground h-8" />
                    </td>
                    <td className="px-4 py-3">
                      <Input value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} className="bg-input border-border text-foreground h-8" />
                    </td>
                    <td className="px-4 py-3">
                      <Input type="number" value={editForm.buying_price} onChange={(e) => setEditForm({ ...editForm, buying_price: +e.target.value })} className="bg-input border-border text-foreground h-8 text-right" />
                    </td>
                    <td className="px-4 py-3">
                      <Input type="number" value={editForm.selling_price} onChange={(e) => setEditForm({ ...editForm, selling_price: +e.target.value })} className="bg-input border-border text-foreground h-8 text-right" />
                    </td>
                    <td className="px-4 py-3">
                      <Input type="number" value={editForm.stock_quantity} onChange={(e) => setEditForm({ ...editForm, stock_quantity: +e.target.value })} className="bg-input border-border text-foreground h-8 text-right" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" onClick={() => handleUpdate(p.id)} className="bg-primary text-primary-foreground mr-1">Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 text-sm text-foreground font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{p.category ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-right text-muted-foreground">${Number(p.buying_price).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right text-foreground">${Number(p.selling_price).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={`font-medium ${p.stock_quantity < 10 ? "text-destructive" : "text-foreground"}`}>
                        {p.stock_quantity}
                      </span>
                    </td>
                    {role === "employer" && (
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setEditingId(p.id);
                            setEditForm({
                              name: p.name,
                              category: p.category ?? "",
                              buying_price: Number(p.buying_price),
                              selling_price: Number(p.selling_price),
                              stock_quantity: p.stock_quantity,
                            });
                          }}
                          className="mr-2 text-muted-foreground hover:text-accent transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </>
                )}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No products found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
