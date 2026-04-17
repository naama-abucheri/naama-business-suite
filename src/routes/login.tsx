import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [role, setRole] = useState<"employer" | "employee">("employer");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    navigate({ to: "/dashboard" });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (isSignUp) {
        await signUp(email, password, fullName, role, role === "employer" ? {
          company_name: companyName,
          address: companyAddress,
          phone: companyPhone,
          email,
        } : undefined);
      } else {
        await signIn(email, password);
      }
      navigate({ to: "/dashboard" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-4xl font-bold text-primary">Naama</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Smart Inventory Management
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-8">
          <h2 className="mb-6 font-heading text-xl font-semibold text-foreground">
            {isSignUp ? "Create Account" : "Sign In"}
          </h2>

          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <Label htmlFor="fullName" className="text-foreground">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="mt-1 bg-input border-border text-foreground"
                />
              </div>
            )}

            <div>
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 bg-input border-border text-foreground"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1 bg-input border-border text-foreground"
              />
            </div>

            {isSignUp && (
              <div>
                <Label className="text-foreground">Role</Label>
                <div className="mt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("employer")}
                    className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                      role === "employer"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    👑 Employer
                    <span className="block text-xs mt-1 opacity-70">Full access</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("employee")}
                    className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                      role === "employee"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    👩‍💼 Employee
                    <span className="block text-xs mt-1 opacity-70">Limited access</span>
                  </button>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {submitting ? "Please wait..." : isSignUp ? "Sign Up" : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
              className="text-sm text-accent hover:underline"
            >
              {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
