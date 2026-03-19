import { NavLink } from "@/components/NavLink";
import CookieBanner from "@/components/CookieBanner";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useEvents } from "@/hooks/useEvents";
import { useUnreadCount } from "@/hooks/useMessages";
import { useSettings } from "@/hooks/useSettings";
import { Outlet, useNavigate } from "react-router-dom";
import { Search, Bell, User, LogOut, Star, Shield, MessageCircle } from "lucide-react";

export default function AppLayout() {
  const { signOut } = useAuth();
  const { data: profile } = useProfile();
  const { data: isAdmin } = useIsAdmin();
  const { data: events } = useEvents();
  const { data: unreadCount } = useUnreadCount();
  const { data: userSettings } = useSettings();
  const navigate = useNavigate();

  const hasActiveEvents = events?.some((e: any) => e.active);
  const showEventsTab = hasActiveEvents && (userSettings?.show_events_tab ?? true);
  const showNotificationsTab = userSettings?.show_notifications_tab ?? true;
  

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const baseNavItems = [
    {
      to: "/",
      label: "Лента",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path fill="currentColor" fillRule="evenodd" d="M20.689 10.968a2.806 2.806 0 0 0-2.244-1.108H5.555c-.887 0-1.705.404-2.244 1.107a2.808 2.808 0 0 0-.485 2.455l1.65 6.112a2.83 2.83 0 0 0 2.729 2.09h9.589a2.832 2.832 0 0 0 2.729-2.09l1.65-6.111a2.804 2.804 0 0 0-.484-2.455ZM8.436 3.875h7.125a.75.75 0 0 0 0-1.5H8.436a.75.75 0 0 0 0 1.5ZM5.682 7.253h12.634a.75.75 0 0 0 0-1.5H5.682a.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
        </svg>
      ),
      mobileIcon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path fill="currentColor" fillRule="evenodd" d="M20.689 10.968a2.806 2.806 0 0 0-2.244-1.108H5.555c-.887 0-1.705.404-2.244 1.107a2.808 2.808 0 0 0-.485 2.455l1.65 6.112a2.83 2.83 0 0 0 2.729 2.09h9.589a2.832 2.832 0 0 0 2.729-2.09l1.65-6.111a2.804 2.804 0 0 0-.484-2.455ZM8.436 3.875h7.125a.75.75 0 0 0 0-1.5H8.436a.75.75 0 0 0 0 1.5ZM5.682 7.253h12.634a.75.75 0 0 0 0-1.5H5.682a.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
        </svg>
      ),
    },
    { to: "/search", label: "Поиск", icon: <Search size={20} />, mobileIcon: <Search size={22} /> },
  ];

  // Conditionally add events tab
  if (showEventsTab) {
    baseNavItems.push({
      to: "/events",
      label: "Ивент",
      special: true,
      icon: <Star size={14} className="text-primary" />,
      mobileIcon: <Star size={16} className="text-primary" />,
    } as any);
  }

  const navItems: any[] = [
    ...baseNavItems,
  ];

  navItems.push({
    to: "/messages",
    label: "ЛС",
    icon: <MessageCircle size={20} />,
    mobileIcon: <MessageCircle size={22} />,
    badge: unreadCount,
  });

  if (showNotificationsTab) {
    navItems.push({ to: "/notifications", label: "Уведомления", icon: <Bell size={20} />, mobileIcon: <Bell size={22} /> });
  }

  navItems.push(
    { to: "/profile", label: "Профиль", icon: <User size={20} />, mobileIcon: <User size={22} /> },
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex justify-center selection:bg-muted selection:text-primary">
      <div className="w-full max-w-[1200px] flex gap-6 px-4 sm:px-8 py-4 sm:py-8 relative">
        {/* Desktop Sidebar */}
        <nav className="hidden md:flex flex-col w-[220px] shrink-0 sticky top-8 h-[calc(100vh-4rem)]">
          <div className="flex items-center gap-3 px-4 mb-10">
            <span className="flex items-center text-2xl font-semibold text-primary tracking-tight font-montserrat">нэт</span>
            <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-1 rounded-md ring-1 ring-input">v1.1 beta</span>
          </div>

          <ul className="flex flex-col gap-1">
            {navItems.map((item: any) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === "/"}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted hover:text-primary transition-all duration-300 ease-out group cursor-pointer"
                  activeClassName="bg-muted text-primary shadow-sm ring-1 ring-input"
                >
                  {item.special ? (
                    <div className="relative flex items-center justify-center">
                      <div className="absolute inset-0 bg-net-cyan/30 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-net-cyan to-net-emerald flex items-center justify-center relative z-10 shadow-[0_0_12px_rgba(34,211,238,0.4)] ring-1 ring-input group-hover:scale-105 transition-transform duration-300">
                        {item.icon}
                      </div>
                    </div>
                  ) : (
                    <div className="relative flex items-center justify-center transition-colors duration-300">
                      {item.icon}
                      {item.badge > 0 && (
                        <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-net-cyan text-[9px] font-bold text-background flex items-center justify-center">
                          {item.badge > 9 ? "9+" : item.badge}
                        </span>
                      )}
                    </div>
                  )}
                  <span className="text-sm font-medium">{item.label}</span>
                </NavLink>
              </li>
            ))}

            {isAdmin && (
              <li>
                <NavLink
                  to="/admin"
                  className="flex items-center gap-4 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted hover:text-primary transition-all duration-300 ease-out group cursor-pointer"
                  activeClassName="bg-muted text-primary shadow-sm ring-1 ring-input"
                >
                  <Shield size={20} />
                  <span className="text-sm font-medium">Админка</span>
                </NavLink>
              </li>
            )}
          </ul>

          <div className="mt-auto mb-4">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-4 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted hover:text-destructive transition-all duration-300 ease-out w-full cursor-pointer"
            >
              <LogOut size={20} />
              <span className="text-sm font-medium">Выйти</span>
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 min-w-0 max-w-[640px] w-full mx-auto pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Dock */}
      <nav className="fixed bottom-4 left-3 right-3 md:hidden z-50">
        <div className="bg-card/80 backdrop-blur-[20px] backdrop-saturate-[1.8] rounded-[20px] shadow-[0_8px_40px_rgba(0,0,0,0.25)] ring-1 ring-border">
          <div className="flex justify-around items-center h-[60px] px-1">
            {navItems.map((item: any) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className="relative flex flex-col items-center justify-center gap-[2px] w-[56px] h-[50px] rounded-xl text-muted-foreground transition-all duration-300 cursor-pointer"
                activeClassName="text-primary bg-muted/60 backdrop-blur-sm shadow-sm"
              >
                {item.special ? (
                  <>
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-net-cyan to-net-emerald flex items-center justify-center shadow-[0_0_16px_rgba(34,211,238,0.45)] ring-1 ring-white/10">
                      {item.mobileIcon}
                    </div>
                    <span className="text-[9px] font-semibold tracking-wide">{item.label}</span>
                  </>
                ) : (
                  <>
                    <div className="relative">
                      {item.mobileIcon}
                      {item.badge > 0 && (
                        <span className="absolute -top-1 -right-2 min-w-[14px] h-[14px] rounded-full bg-net-cyan text-[8px] font-bold text-background flex items-center justify-center px-0.5 shadow-[0_0_6px_rgba(34,211,238,0.5)]">
                          {item.badge > 9 ? "9+" : item.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] font-semibold tracking-wide">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>

      <CookieBanner />
    </div>
  );
}
