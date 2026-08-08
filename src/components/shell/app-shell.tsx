import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Banknote,
  Bell,
  Building2,
  ChevronsLeft,
  ChevronsRight,
  GitBranch,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  ScrollText,
  Search,
  Settings,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { currentUser, pendingLoanCount, tenant } from "@/lib/mock-data";
import { toast } from "sonner";
import { ApiError, clearStoredToken, getStoredToken, useAuthMeQuery } from "@/lib/backend-api";

const navItems = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Loans", to: "/loans", icon: Banknote, badge: pendingLoanCount },
  { label: "KYC Verification", to: "/kyc", icon: ShieldCheck },
  { label: "Messages", to: "/messages", icon: MessageSquare, dot: true },
  { label: "Workflows", to: "/workflows", icon: GitBranch },
  { label: "Analytics", to: "/analytics", icon: BarChart3 },
  { label: "Settings", to: "/settings", icon: Settings },
  { label: "Audit Logs", to: "/audit", icon: ScrollText },
] as const;

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex h-16 items-center gap-2.5 px-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
        <Zap className="size-5" />
      </span>
      {!collapsed ? (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight">ShadowSpark</p>
          <p className="truncate text-[10px] tracking-wider text-subtle uppercase">Fintech OS</p>
        </div>
      ) : null}
    </div>
  );
}

function NavList({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: (() => void) | undefined;
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <nav className="flex flex-1 flex-col gap-1 px-2 py-2">
      {navItems.map((item) => {
        const active = pathname === item.to;
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            title={item.label}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-primary/12 font-medium text-primary"
                : "text-muted-foreground hover:bg-elevated hover:text-foreground",
            )}
          >
            {active ? (
              <span className="absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-r bg-primary" />
            ) : null}
            <span className="relative shrink-0">
              <Icon className="size-4.5" />
              {"dot" in item && item.dot ? (
                <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-primary" />
              ) : null}
            </span>
            {!collapsed ? (
              <>
                <span className="truncate">{item.label}</span>
                {"badge" in item && item.badge ? (
                  <span className="num ml-auto rounded-md bg-elevated px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {item.badge}
                  </span>
                ) : null}
              </>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

function UserMenu({
  collapsed,
  name,
  role,
  initials,
  onLogout,
}: {
  collapsed: boolean;
  name: string;
  role: string;
  initials: string;
  onLogout: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-elevated",
            collapsed && "justify-center",
          )}
        >
          <span className="num grid size-9 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
            {initials}
          </span>
          {!collapsed ? (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{name}</span>
              <span className="block truncate text-[11px] text-muted-foreground">{role}</span>
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>{name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings">Account settings</Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            onLogout();
            toast.success("Signed out of ShadowSpark");
          }}
        >
          <LogOut className="size-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SidebarBody({
  collapsed,
  onToggle,
  onNavigate,
  userName,
  userRole,
  userInitials,
  onLogout,
}: {
  collapsed: boolean;
  onToggle?: (() => void) | undefined;
  onNavigate?: (() => void) | undefined;
  userName: string;
  userRole: string;
  userInitials: string;
  onLogout: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-sidebar">
      <Brand collapsed={collapsed} />
      <NavList collapsed={collapsed} onNavigate={onNavigate} />
      <div className="space-y-1 border-t border-sidebar-border p-2">
        <UserMenu
          collapsed={collapsed}
          name={userName}
          role={userRole}
          initials={userInitials}
          onLogout={onLogout}
        />
        {onToggle ? (
          <button
            onClick={onToggle}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground",
              collapsed && "justify-center",
            )}
          >
            {collapsed ? (
              <ChevronsRight className="size-4" />
            ) : (
              <>
                <ChevronsLeft className="size-4" />
                Collapse sidebar
              </>
            )}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function AppShell({
  title,
  breadcrumb,
  actions,
  children,
}: {
  title: string;
  breadcrumb?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const tokenPresent = typeof window !== "undefined" && Boolean(getStoredToken());
  const { data: session, error: sessionError } = useAuthMeQuery();

  useEffect(() => {
    if (!tokenPresent && pathname !== "/login") {
      navigate({ to: "/login", replace: true });
    }
  }, [navigate, pathname, tokenPresent]);

  useEffect(() => {
    if (sessionError instanceof ApiError && sessionError.status === 401) {
      clearStoredToken();
      navigate({ to: "/login", replace: true });
    }
  }, [navigate, sessionError]);

  const tenantName = session?.tenant.name ?? tenant.name;
  const userName =
    session?.user.firstName && session?.user.lastName
      ? `${session.user.firstName} ${session.user.lastName}`
      : currentUser.name;
  const userRole = session?.user.role ?? currentUser.role;
  const userInitials = userName
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const handleLogout = () => {
    clearStoredToken();
    navigate({ to: "/login", replace: true });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "hidden shrink-0 border-r border-sidebar-border transition-[width] duration-200 lg:block",
          collapsed ? "w-[72px]" : "w-[260px]",
        )}
      >
        <div className="sticky top-0 h-screen">
          <SidebarBody
            collapsed={collapsed}
            onToggle={() => setCollapsed((v) => !v)}
            userName={userName}
            userRole={userRole}
            userInitials={userInitials}
            onLogout={handleLogout}
          />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur md:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[260px] border-sidebar-border p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarBody
                collapsed={false}
                onNavigate={() => setMobileOpen(false)}
                userName={userName}
                userRole={userRole}
                userInitials={userInitials}
                onLogout={handleLogout}
              />
            </SheetContent>
          </Sheet>

          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold sm:text-base">{title}</h1>
            <p className="num hidden truncate text-[11px] text-subtle sm:block">
              {breadcrumb ?? `ShadowSpark / ${title}`}
            </p>
          </div>

          <div className="relative mx-auto hidden max-w-md flex-1 xl:block">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
            <Input
              placeholder="Search loans, applicants, messages..."
              className="h-9 rounded-md border-border bg-card pr-14 pl-9"
            />
            <kbd className="num absolute top-1/2 right-2 -translate-y-1/2 rounded border border-border px-1.5 py-0.5 text-[10px] text-subtle">
              ⌘K
            </kbd>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="size-4.5" />
              <span className="absolute top-2 right-2 size-1.5 rounded-full bg-primary" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="hidden max-w-[190px] md:flex">
                  <Building2 className="size-4 text-primary" />
                  <span className="truncate">{tenantName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Switch tenant</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Sparklend Microfinance</DropdownMenuItem>
                <DropdownMenuItem>Kano Trust Credit</DropdownMenuItem>
                <DropdownMenuItem>Accra Bridge Finance</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {actions ?? (
              <Button size="sm" onClick={() => toast.success("New loan draft created")}>
                <Plus className="size-4" />
                <span className="hidden sm:inline">New Loan</span>
              </Button>
            )}
          </div>
        </header>

        <main className="scroll-slim min-w-0 flex-1 px-4 py-5 md:px-6 md:py-6">{children}</main>
      </div>
    </div>
  );
}
