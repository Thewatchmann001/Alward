import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../contexts/AuthContext";
import {
  LogOut,
  Building2,
  Briefcase,
  RefreshCw,
} from "lucide-react";
import Logo from "./Logo";

const ROLE_LABELS = { student: "Job seeker", founder: "Founder", investor: "Investor" };

export default function Layout({ children }) {
  const { user, logout, isAuthenticated, activeRole, capabilities, switchRole } = useAuth();
  const router = useRouter();

  const role = activeRole || user?.role || "";
  const allowedRoles = capabilities?.allowed_roles || (role ? [role] : []);

  const getNavLinks = () => {
    if (!user) return [];

    const links = [];
    const canInvestor = capabilities?.investor !== false || role === "investor";
    const canFounder = capabilities?.founder === true || role === "founder" || role === "startup";

    if (canInvestor) {
      links.push({ href: "/investor-platform", label: "Investments", icon: Briefcase });
    }
    if (canFounder) {
      links.push({ href: "/startup-dashboard", label: "My Startup", icon: Building2 });
    }

    return links;
  };

  const navLinks = getNavLinks();
  const showRoleSwitcher = Array.isArray(allowedRoles) && allowedRoles.length > 1;

  const handleRoleSwitch = async (newRole) => {
    const result = await switchRole(newRole);
    if (result.success && result.active_role) {
      const path = result.active_role === "founder" ? "/startup-dashboard" : "/investor-platform";
      router.push(path);
    }
  };

  // Don't show nav on landing page
  const isLandingPage = router.pathname === '/';

  return (
    <div className="min-h-screen">
      {isAuthenticated && !isLandingPage && (
        <nav className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Logo size="default" />

              <div className="flex items-center gap-4">
                {showRoleSwitcher && (
                  <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 border border-white/10">
                    <span className="text-xs font-medium text-slate-400 hidden sm:inline">View as</span>
                    <select
                      value={role === "startup" ? "founder" : role}
                      onChange={(e) => handleRoleSwitch(e.target.value)}
                      className="text-sm font-semibold text-white bg-transparent border-0 cursor-pointer focus:ring-0 focus:outline-none py-1 pr-6"
                    >
                      {allowedRoles.map((r) => (
                        <option key={r} value={r} className="bg-[#020617]">{ROLE_LABELS[r] || r}</option>
                      ))}
                    </select>
                    <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                )}
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = router.pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                        isActive
                          ? "text-white border border-white/10 bg-white/10"
                          : "text-slate-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden md:inline">{link.label}</span>
                    </Link>
                  );
                })}

                <div className="flex items-center gap-4 pl-4 border-l border-white/10">
                  <span className="text-sm text-slate-400 font-medium hidden md:inline">
                    {user?.full_name || user?.email}
                  </span>
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors font-bold text-xs uppercase tracking-widest px-3 py-2 rounded-xl hover:bg-red-500/10"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden md:inline">Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>
      )}

      <main>{children}</main>
    </div>
  );
}
