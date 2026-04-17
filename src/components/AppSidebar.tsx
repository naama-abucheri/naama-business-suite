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
  FileText,
  ChevronDown,
  FileCheck,
  Settings,
} from "lucide-react";
import { useState } from "react";

type SimpleLink = { kind: "link"; to: string; label: string; icon: typeof Receipt };
type DropdownItem = { to: string; label: string; icon: typeof Receipt };
type Dropdown = { kind: "dropdown"; label: string; icon: typeof Receipt; items: DropdownItem[] };
type NavEntry = SimpleLink | Dropdown;

const documentsDropdown: Dropdown = {
  kind: "dropdown",
  label: "Documents",
  icon: Receipt,
  items: [
    { to: "/receipts", label: "Receipts", icon: Receipt },
    { to: "/quotations", label: "Quotations", icon: FileText },
    { to: "/invoices", label: "Invoices", icon: FileCheck },
  ],
};

const employerLinks: NavEntry[] = [
  { kind: "link", to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { kind: "link", to: "/inventory", label: "Inventory", icon: Package },
  { kind: "link", to: "/add-product", label: "Add Product", icon: PackagePlus },
  { kind: "link", to: "/clients", label: "Clients", icon: Users },
  { kind: "link", to: "/sales", label: "Sales", icon: ShoppingCart },
  documentsDropdown,
  { kind: "link", to: "/calendar", label: "Calendar", icon: CalendarDays },
  { kind: "link", to: "/settings", label: "Settings", icon: Settings },
];

const employeeLinks: NavEntry[] = [
  { kind: "link", to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { kind: "link", to: "/inventory", label: "Inventory", icon: Package },
  { kind: "link", to: "/add-product", label: "Add Stock", icon: PackagePlus },
  { kind: "link", to: "/clients", label: "Clients", icon: Users },
  documentsDropdown,
];

export function AppSidebar() {
  const { role, signOut } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const links = role === "employer" ? employerLinks : employeeLinks;
  const docPaths = documentsDropdown.items.map((i) => i.to);
  const [docsOpen, setDocsOpen] = useState(docPaths.includes(location.pathname));

  const linkClass = (active: boolean) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
      active
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
    }`;

  const nav = (
    <nav className="flex flex-col gap-1 p-4 h-full">
      <div className="mb-8 px-3">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-primary">
          Naama
        </h1>
        <p className="text-xs text-muted-foreground mt-1 capitalize">{role}</p>
      </div>
      {links.map((entry) => {
        if (entry.kind === "link") {
          const isActive = location.pathname === entry.to;
          return (
            <Link
              key={entry.to}
              to={entry.to}
              onClick={() => setOpen(false)}
              className={linkClass(isActive)}
            >
              <entry.icon className="h-4 w-4" />
              {entry.label}
            </Link>
          );
        }
        // Dropdown
        const anyActive = entry.items.some((i) => i.to === location.pathname);
        return (
          <div key={entry.label}>
            <button
              type="button"
              onClick={() => setDocsOpen((v) => !v)}
              className={`${linkClass(anyActive)} w-full justify-between`}
            >
              <span className="flex items-center gap-3">
                <entry.icon className="h-4 w-4" />
                {entry.label}
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${docsOpen ? "rotate-180" : ""}`} />
            </button>
            {docsOpen && (
              <div className="ml-3 mt-1 flex flex-col gap-1 border-l border-border pl-3">
                {entry.items.map((item) => {
                  const isActive = location.pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className={linkClass(isActive)}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
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
        } overflow-y-auto`}
      >
        <div className="flex h-full flex-col justify-between">{nav}</div>
      </aside>
    </>
  );
}
