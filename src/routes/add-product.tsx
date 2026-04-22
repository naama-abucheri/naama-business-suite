import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/add-product")({
  component: AddProductPage,
});

function AddProductPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    category: "",
    buying_price: "",
    selling_price: "",
    stock_quantity: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setError("");

    const name = form.name.trim();
    const buyingPrice = Number(form.buying_price);
    const sellingPrice = Number(form.selling_price);
    const stockQuantity = Number(form.stock_quantity);

    if (!name) {
      setError("Product name is required.");
      return;
    }
    if (Number.isNaN(buyingPrice) || buyingPrice < 0) {
      setError("Buying price must be a valid non-negative number.");
      return;
    }
    if (Number.isNaN(sellingPrice) || sellingPrice < 0) {
      setError("Selling price must be a valid non-negative number.");
      return;
    }
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
      setError("Stock quantity must be a whole number 0 or higher.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("products").insert({
      name,
      category: form.category || null,
      buying_price: buyingPrice,
      selling_price: sellingPrice,
      stock_quantity: stockQuantity,
      added_by: user.id,
    });
    setSubmitting(false);
    if (!error) {
      setSuccess(true);
      setForm({ name: "", category: "", buying_price: "", selling_price: "", stock_quantity: "" });
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  if (loading || !user) return null;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold text-foreground">Add Product</h1>
        <p className="text-muted-foreground">Add a new product to inventory</p>
      </div>

      <div className="max-w-lg rounded-xl border border-border bg-card p-6">
        {success && (
          <div className="mb-4 rounded-lg bg-accent/10 p-3 text-sm text-accent">
            Product added successfully!
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-foreground">Product Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="mt-1 bg-input border-border text-foreground" />
          </div>
          <div>
            <Label className="text-foreground">Category</Label>
            <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1 bg-input border-border text-foreground" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground">Buying Price</Label>
              <Input type="number" step="0.01" value={form.buying_price} onChange={(e) => setForm({ ...form, buying_price: e.target.value })} required className="mt-1 bg-input border-border text-foreground" />
            </div>
            <div>
              <Label className="text-foreground">Selling Price</Label>
              <Input type="number" step="0.01" value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: e.target.value })} required className="mt-1 bg-input border-border text-foreground" />
            </div>
          </div>
          <div>
            <Label className="text-foreground">Stock Quantity</Label>
            <Input type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} required className="mt-1 bg-input border-border text-foreground" />
          </div>
          <Button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            {submitting ? "Adding..." : "Add Product"}
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
}
