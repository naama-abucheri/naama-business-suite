import { Link, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Receipt,
  CalendarDays,
  LogOut,
  PackagePlus,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const employerLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/inventory", label: "Inventory", icon: Package },
  { to: "/add-product", label: "Add Product", icon: PackagePlus },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/sales", label: "Sales", icon: ShoppingCart },
  { to: "/receipts", label: "Receipts", icon: Receipt },
  { to: "/quotations", label: "Quotations", icon: ShoppingCart },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
] as const;

const employeeLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/inventory", label: "Inventory", icon: Package },
  { to: "/add-product", label: "Add Stock", icon: PackagePlus },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/receipts", label: "Receipts", icon: Receipt },
  { to: "/quotations", label: "Quotations", icon: ShoppingCart },
] as const;

export function AppSidebar() {
  const { role, signOut } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const links = role === "employer" ? employerLinks : employeeLinks;

  const nav = (
    <nav className="flex flex-col gap-1 p-4">
      <div className="mb-8 px-3">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-primary">
          Naama
        </h1>
        <p className="text-xs text-muted-foreground mt-1 capitalize">{role}</p>
      </div>
      {links.map((link) => {
        const isActive = location.pathname === link.to;
        return (
          <Link
            key={link.to}
            to={link.to}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
      <button
        onClick={signOut}
        className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    </nav>
  );

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 rounded-lg bg-card p-2 text-foreground md:hidden"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-background/80 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-border bg-sidebar transition-transform md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col justify-between">{nav}</div>
      </aside>
    </>
  );
}
