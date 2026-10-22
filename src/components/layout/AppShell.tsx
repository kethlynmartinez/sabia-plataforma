import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Award,
  BarChart3,
  BookOpen,
  ChevronsLeft,
  ChevronsRight,
  ClipboardCheck,
  Globe,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Palette,
  RotateCcw,
  Settings,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTheme } from "@/hooks/useDocumentTheme";
import { CompanyLogo } from "@/components/brand/CompanyLogo";
import { BrandMark } from "@/components/brand/BrandLogo";
import { DemoResetDialog } from "@/components/DemoResetButton";
import { Avatar } from "@/components/kit";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

const NAV: Record<Role, { section: string; items: NavItem[] }> = {
  admin: {
    section: "Gestão",
    items: [
      { label: "Visão geral", to: "/empresa/dashboard", icon: LayoutDashboard },
      { label: "Colaboradores", to: "/empresa/colaboradores", icon: Users },
      { label: "Cursos", to: "/empresa/cursos", icon: BookOpen },
      { label: "Avaliações", to: "/empresa/avaliacoes", icon: ClipboardCheck },
      { label: "Relatórios", to: "/empresa/relatorios", icon: BarChart3 },
      { label: "Personalização", to: "/empresa/personalizacao", icon: Palette },
      { label: "Configurações", to: "/empresa/configuracoes", icon: Settings },
    ],
  },
  aluno: {
    section: "Aprendizado",
    items: [
      { label: "Início", to: "/aluno/dashboard", icon: Home },
      { label: "Meus cursos", to: "/aluno/cursos", icon: BookOpen },
      { label: "Certificados", to: "/aluno/certificados", icon: Award },
      { label: "Meu perfil", to: "/aluno/perfil", icon: UserRound },
    ],
  },
};

const COLLAPSE_KEY = "sabia:sidebar-collapsed";

export const AppShell = ({ role }: { role: Role }) => {
  const { user, company, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === "1";
    } catch {
      return false;
    }
  });

  useDocumentTheme(company?.theme.primary, company?.theme.highlight);

  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch {
      /* preferência apenas local */
    }
  }, [collapsed]);

  if (!user || !company) return null;
  const nav = NAV[role];
  const doLogout = () => navigate(logout(), { replace: true });

  const sidebar = (isMobile: boolean) => {
    const mini = collapsed && !isMobile;
    return (
      <div className="flex h-full flex-col">
        <div className={cn("flex h-16 items-center border-b border-border px-4", mini ? "justify-center" : "justify-between")}>
          <Link to={nav.items[0].to} className="flex min-w-0 overflow-hidden" aria-label="Início">
            <CompanyLogo theme={company.theme} compact={mini} />
          </Link>
          {isMobile && (
            <button className="icon-btn" onClick={() => setMobileOpen(false)} aria-label="Fechar menu">
              <X />
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin" aria-label="Navegação principal">
          {!mini && <p className="eyebrow mb-2 px-3 text-muted-foreground">{nav.section}</p>}
          <ul className="space-y-1">
            {nav.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  title={mini ? item.label : undefined}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center gap-3 rounded-[10px] px-3 py-2.5 font-dm text-sm font-medium transition-colors",
                      mini && "justify-center px-0",
                      isActive
                        ?"bg-primary text-primary-foreground shadow-glow"
                        : "text-foreground/70 hover:bg-primary-soft hover:text-primary",
                    )
                  }
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  {!mini && <span className="truncate">{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-border p-3">
          <Link
            to="/"
            title="Ir para o site da plataforma"
            className={cn(
              "mb-1 flex items-center gap-2 rounded-[10px] px-3 py-2 font-dm text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              mini && "justify-center px-0",
            )}
          >
            <BrandMark className="h-5 w-5" />
            {!mini && "Site da plataforma"}
          </Link>
          <button
            onClick={doLogout}
            title={mini ? "Sair" : undefined}
            className={cn(
              "flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 font-dm text-sm font-medium text-foreground/70 transition-colors hover:bg-destructive/10 hover:text-destructive",
              mini && "justify-center px-0",
            )}
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            {!mini && "Sair"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar desktop */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r border-border bg-white transition-[width] duration-300 lg:block",
          collapsed ? "w-[76px]" : "w-[256px]",
        )}
      >
        {sidebar(false)}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="absolute -right-3 top-[22px] flex h-6 w-6 items-center justify-center rounded-full border border-border bg-white text-muted-foreground shadow-card transition-colors hover:text-primary"
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
        </button>
      </aside>

      {/* Drawer mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-[2px] animate-in fade-in-0" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] bg-white shadow-card-lg animate-in slide-in-from-left">
            {sidebar(true)}
          </aside>
        </div>
      )}

      <div className={cn("transition-[padding] duration-300", collapsed ? "lg:pl-[76px]" : "lg:pl-[256px]")}>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-white/85 px-4 backdrop-blur-md md:px-8">
          <button className="icon-btn lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Abrir menu">
            <Menu />
          </button>
          <div className="lg:hidden">
            <CompanyLogo theme={company.theme} compact />
          </div>
          <span className="hidden font-dm text-sm text-muted-foreground md:inline">
            {role === "admin" ? (
              <>
                Painel de <strong className="font-semibold text-foreground">{company.name}</strong>
              </>
            ) : (
              <strong className="font-semibold text-foreground">{company.theme.displayName}</strong>
            )}
          </span>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden rounded-full border border-dashed border-highlight/50 bg-highlight-soft px-2.5 py-1 font-dm text-[11px] font-semibold text-foreground/70 sm:inline">
              Demo · dados fictícios
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-full p-1 pr-1 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 md:pr-3">
                <Avatar name={user.name} size="sm" />
                <span className="hidden text-left md:block">
                  <span className="block max-w-[160px] truncate font-sora text-[13px] font-semibold leading-tight text-foreground">{user.name}</span>
                  <span className="block font-dm text-[11px] leading-tight text-muted-foreground">{role === "admin" ? "Administrador(a)" : user.position}</span>
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 rounded-xl">
                <DropdownMenuLabel className="font-dm">
                  <span className="block truncate text-sm">{user.name}</span>
                  <span className="block truncate text-xs font-normal text-muted-foreground">{user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => navigate(role === "admin" ? "/empresa/configuracoes" : "/aluno/perfil")}>
                  <UserRound className="mr-2 h-4 w-4" /> {role === "admin" ? "Configurações da conta" : "Meu perfil"}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate("/")}>
                  <Globe className="mr-2 h-4 w-4" /> Site da plataforma
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setResetOpen(true)}>
                  <RotateCcw className="mr-2 h-4 w-4" /> Restaurar dados da demo
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={doLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main key={location.pathname} className="mx-auto w-full max-w-[1240px] animate-fade-up px-4 py-6 md:px-8 md:py-9">
          <Outlet />
        </main>
      </div>
      <DemoResetDialog open={resetOpen} onOpenChange={setResetOpen} />
    </div>
  );
};
