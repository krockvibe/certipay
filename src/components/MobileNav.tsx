import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Plus, Search, Shield, Home, LogOut, FileText } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const NAV_ITEMS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/create", label: "Create Receipt", icon: Plus },
  { to: "/track", label: "Track Transfer", icon: Search },
  { to: "/dashboard", label: "Dashboard", icon: Shield },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, signOut } = useAuth();

  // Any navigation closes the drawer, including back/forward history moves.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Lock body scroll while the drawer is open so the page behind it
  // does not scroll under the overlay on iOS.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const handleSignOut = () => {
    setOpen(false);
    signOut();
    navigate("/");
  };

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-nav-drawer"
        className="p-2 rounded-lg text-foreground hover:bg-muted transition-colors"
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 top-16 bg-foreground/40 backdrop-blur-[2px] z-40 animate-fade-in"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <nav
            id="mobile-nav-drawer"
            aria-label="Mobile navigation"
            className="fixed top-16 inset-x-0 bottom-0 z-50 bg-background border-t border-border overflow-y-auto animate-slide-in"
          >
            <div className="p-4">
              {isAuthenticated && (
                <div className="mb-4 p-3 rounded-xl bg-muted">
                  <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              )}

              <ul className="flex flex-col gap-1">
                {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
                  const active = location.pathname === to;
                  return (
                    <li key={to}>
                      <Link
                        to={to}
                        aria-current={active ? "page" : undefined}
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl text-base font-medium transition-colors ${
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        {label}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {!isAuthenticated && (
                <div className="mt-4 pt-4 border-t border-border flex flex-col gap-2">
                  <Link
                    to="/signin"
                    className="flex items-center justify-center px-3 py-3 rounded-xl border border-border text-base font-medium text-foreground"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="flex items-center justify-center px-3 py-3 rounded-xl bg-primary text-primary-foreground text-base font-medium"
                  >
                    Sign Up
                  </Link>
                </div>
              )}

              {isAuthenticated && (
                <div className="mt-4 pt-4 border-t border-border">
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-base font-medium text-foreground hover:bg-muted"
                  >
                    <FileText className="h-5 w-5" />
                    My Receipts
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-base font-medium text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
