import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Building2 } from "lucide-react";
import { useCompanyProfile } from "@/hooks/use-company-profile";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { profile, refetch } = useCompanyProfile();
  const [form, setForm] = useState({
    company_name: "",
    address: "",
    phone: "",
    email: "",
    logo_url: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile) {
      setForm({
        company_name: profile.company_name ?? "",
        address: profile.address ?? "",
        phone: profile.phone ?? "",
        email: profile.email ?? "",
        logo_url: profile.logo_url ?? "",
      });
    }
  }, [profile]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    setMessage(null);

    const ext = file.name.split(".").pop();
    const path = `${user.id}/logo-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("company-logos").upload(path, file, {
      upsert: true,
      contentType: file.type,
    });
    if (upErr) {
      setMessage({ type: "error", text: upErr.message });
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("company-logos").getPublicUrl(path);
    setForm((f) => ({ ...f, logo_url: data.publicUrl }));
    setUploading(false);
    setMessage({ type: "success", text: "Logo uploaded. Click Save to apply." });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage(null);

    const payload = {
      user_id: user.id,
      company_name: form.company_name,
      address: form.address || null,
      phone: form.phone || null,
      email: form.email || null,
      logo_url: form.logo_url || null,
    };

    const { error } = await supabase
      .from("company_profiles")
      .upsert(payload, { onConflict: "user_id" });

    setSaving(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Company profile saved." });
      refetch();
    }
  };

  if (loading || !user) return null;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your company branding for receipts, quotations, and invoices</p>
      </div>

      <div className="max-w-2xl rounded-xl border border-border bg-card p-6">
        <div className="mb-6 flex items-center gap-3">
          <Building2 className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-lg font-semibold text-foreground">Company Profile</h2>
        </div>

        {message && (
          <div
            className={`mb-4 rounded-lg p-3 text-sm ${
              message.type === "success" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <Label className="text-foreground">Logo</Label>
            <div className="mt-2 flex items-center gap-4">
              {form.logo_url ? (
                <img
                  src={form.logo_url}
                  alt="Company logo"
                  className="h-20 w-20 rounded-lg border border-border object-contain bg-background p-1"
                />
              ) : (
                <div className="h-20 w-20 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground">
                  <Building2 className="h-8 w-8" />
                </div>
              )}
              <label className="cursor-pointer">
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                <span className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary">
                  <Upload className="h-4 w-4" />
                  {uploading ? "Uploading..." : form.logo_url ? "Change Logo" : "Upload Logo"}
                </span>
              </label>
            </div>
          </div>

          <div>
            <Label className="text-foreground">Company Name *</Label>
            <Input
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              required
              className="mt-1 bg-input border-border text-foreground"
            />
          </div>

          <div>
            <Label className="text-foreground">Address</Label>
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="123 Main St, City, Country"
              className="mt-1 bg-input border-border text-foreground"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-foreground">Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 555 0000"
                className="mt-1 bg-input border-border text-foreground"
              />
            </div>
            <div>
              <Label className="text-foreground">Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="hello@company.com"
                className="mt-1 bg-input border-border text-foreground"
              />
            </div>
          </div>

          <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground">
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
}
