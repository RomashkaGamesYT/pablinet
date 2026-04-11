import { NavLink } from "@/components/NavLink";
import CookieBanner from "@/components/CookieBanner";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useEvents } from "@/hooks/useEvents";
import { useUnreadCount } from "@/hooks/useMessages";
import { useUnreadNotificationCount } from "@/hooks/useNotifications";
import { useSettings } from "@/hooks/useSettings";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Search, Bell, User, Star, Shield, MessageCircle, Radio, Settings, LogOut, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Custom SVG icons matching Mood reference
const FeedIcon = ({ size = 24 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path fill="currentColor" fillRule="evenodd" d="M20.689 10.968a2.806 2.806 0 0 0-2.244-1.108H5.555c-.887 0-1.705.404-2.244 1.107a2.808 2.808 0 0 0-.485 2.455l1.65 6.112a2.83 2.83 0 0 0 2.729 2.09h9.589a2.832 2.832 0 0 0 2.729-2.09l1.65-6.111a2.804 2.804 0 0 0-.484-2.455ZM8.436 3.875h7.125a.75.75 0 0 0 0-1.5H8.436a.75.75 0 0 0 0 1.5ZM5.682 7.253h12.634a.75.75 0 0 0 0-1.5H5.682a.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
  </svg>
);

const NotifIcon = ({ size = 24 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path fill="currentColor" fillRule="evenodd" d="M19.742 13.807c-.86-1.832-.837-2.52-.798-3.773.01-.296.02-.617.02-.986C18.964 6.122 16.804 2 12 2 7.197 2 5.036 6.122 5.036 9.048c0 .368.01.69.02.986.04 1.252.062 1.941-.807 3.797-.372.928-.327 1.73.135 2.382C5.492 17.783 8.7 18 12 18s6.508-.216 7.616-1.787c.463-.653.508-1.454.125-2.406Zm-4.686 5.198c-1.848.193-3.852.192-6.13-.002a.873.873 0 0 0-.835.437.763.763 0 0 0 .125.893C9.236 21.407 10.578 22 11.994 22h.002c1.42 0 2.765-.592 3.788-1.667a.765.765 0 0 0 .122-.9c-.162-.294-.495-.458-.85-.428Z" clipRule="evenodd" />
  </svg>
);

const ProfileIcon = ({ size = 24 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path fill="currentColor" fillRule="evenodd" d="M11.998 11a3.996 3.996 0 0 0 4-4c.084-2.213-1.702-4-4-4A3.995 3.995 0 0 0 8 7c0 2.213 1.787 4 3.998 4Zm6.94 6.878c-.3-1.04-.9-1.986-2.097-2.743C15.843 14.473 14.246 14 12.05 14c-4.292 0-6.39 1.892-6.987 3.878-.2.568.1 1.136.598 1.42C7.458 20.431 9.654 21 12.05 21c2.296 0 4.492-.662 6.288-1.703.5-.284.8-.851.6-1.419Z" clipRule="evenodd" />
  </svg>
);

export default function AppLayout() {
  const { signOut } = useAuth();
  const { data: profile } = useProfile();
  const { data: isAdmin } = useIsAdmin();
  const { data: events } = useEvents();
  const { data: unreadCount } = useUnreadCount();
  const { data: unreadNotifs } = useUnreadNotificationCount();
  const { data: userSettings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();

  const hasActiveEvents = events?.some((e: any) => e.active);
  const showEventsTab = hasActiveEvents && (userSettings?.show_events_tab ?? true);
  const showNotificationsTab = userSettings?.show_notifications_tab ?? true;

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  // Mobile nav items
  const mobileNavItems: any[] = [
    { to: "/", label: "Лента", icon: <FeedIcon size={24} /> },
    { to: "/search", label: "Поиск", icon: <Search size={24} strokeWidth={1.5} /> },
  ];
  if (showNotificationsTab) {
    mobileNavItems.push({ to: "/notifications", label: "Уведы", icon: <NotifIcon size={24} />, badge: unreadNotifs });
  }
  mobileNavItems.push({ to: "/profile", label: "Профиль", icon: <ProfileIcon size={24} /> });

  // Desktop nav items
  const desktopNavItems: any[] = [
    { to: "/", label: "Лента", icon: <FeedIcon size={24} /> },
    { to: "/search", label: "Поиск", icon: <Search size={24} strokeWidth={1.5} /> },
    { to: "/broadcasts", label: "Эфир", icon: <Radio size={20} strokeWidth={1.5} /> },
    { to: "/messages", label: "Сообщения", icon: <MessageCircle size={20} strokeWidth={1.5} />, badge: unreadCount },
  ];
  if (showNotificationsTab) {
    desktopNavItems.push({ to: "/notifications", label: "Уведомления", icon: <NotifIcon size={20} />, badge: unreadNotifs });
  }
  desktopNavItems.push({ to: "/profile", label: "Профиль", icon: <ProfileIcon size={20} /> });

  return (
    <div className="min-h-screen bg-background text-foreground flex justify-center transition-colors duration-300">
      <div className="flex w-full max-w-[1200px] h-screen relative">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 flex-col justify-between py-6 h-full shrink-0">
          <div className="flex flex-col gap-6 px-4">
            {/* Logo */}
            <div className="flex items-center gap-3 px-4 mb-2">
              <span className="text-xl font-semibold tracking-tight text-foreground">нэт</span>
            </div>

            {/* Nav */}
            <nav className="flex flex-col gap-2 w-full">
              {desktopNavItems.map((item: any) => {
                const isActive = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    className={`flex items-center gap-4 p-3 px-4 rounded-2xl transition-colors w-full text-left cursor-pointer ${
                      isActive
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:bg-secondary/50"
                    }`}
                    activeClassName=""
                  >
                    <div className="relative shrink-0 w-6 h-6 flex items-center justify-center">
                      {item.icon}
                      {item.badge > 0 && (
                        <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-accent text-[9px] font-bold text-accent-foreground flex items-center justify-center">
                          {item.badge > 9 ? "9+" : item.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-base font-medium">{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Bottom */}
          <div className="px-4 flex flex-col gap-2">
            {isAdmin && (
              <button
                onClick={() => navigate("/admin")}
                className="flex items-center gap-4 p-3 px-4 rounded-2xl text-muted-foreground hover:bg-secondary/50 transition-colors w-full text-left cursor-pointer"
              >
                <Shield size={20} strokeWidth={1.5} />
                <span className="text-base font-medium">Админка</span>
              </button>
            )}
            <button
              onClick={() => navigate("/settings")}
              className="flex items-center gap-4 p-3 px-4 rounded-2xl text-muted-foreground hover:bg-secondary/50 transition-colors w-full text-left cursor-pointer"
            >
              <Settings size={20} strokeWidth={1.5} />
              <span className="text-base font-medium">Настройки</span>
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-4 p-3 px-4 rounded-2xl text-muted-foreground hover:bg-secondary/50 transition-colors w-full text-left cursor-pointer"
            >
              <LogOut size={20} strokeWidth={1.5} />
              <span className="text-base font-medium">Выйти</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 h-full overflow-y-auto scroll-smooth flex justify-center pb-[140px] md:pb-8">
          <div className="w-full max-w-[600px] flex flex-col gap-4 py-6 px-4 relative">
            <Outlet />
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="hidden lg:flex w-[300px] flex-col pl-8 pt-6 h-full shrink-0">
          <div className="flex flex-col gap-3 text-sm">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Статус серверов</a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Конфиденциальность</a>
          </div>
        </aside>
      </div>

      {/* Mobile Navigation Dock */}
      <div className="md:hidden fixed bottom-6 left-0 right-0 px-4 z-40 pointer-events-none flex flex-col items-end gap-4 max-w-[440px] mx-auto w-full">
        {/* FAB */}
        <button
          onClick={() => navigate("/")}
          className="w-[52px] h-[52px] bg-gradient-to-b from-muted-foreground/80 to-muted-foreground/60 dark:from-secondary dark:to-card rounded-full flex items-center justify-center text-primary-foreground dark:text-foreground shadow-xl border border-border/50 hover:opacity-90 transition-transform active:scale-95 pointer-events-auto mr-1 cursor-pointer"
        >
          <Plus size={24} strokeWidth={1.5} />
        </button>

        {/* Dock */}
        <nav className="w-full bg-card/90 dark:bg-card/85 backdrop-blur-xl border border-border/50 rounded-full flex justify-between items-center p-1.5 shadow-2xl pointer-events-auto transition-colors duration-300">
          {mobileNavItems.map((item: any) => {
            const isActive = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-full transition-all cursor-pointer ${
                  isActive
                    ? "text-foreground bg-secondary/50 dark:bg-secondary/30"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                activeClassName=""
              >
                <div className="relative">
                  {item.icon}
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-2 min-w-[14px] h-[14px] rounded-full bg-accent text-[8px] font-bold text-accent-foreground flex items-center justify-center px-0.5">
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium tracking-wide">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <CookieBanner />
    </div>
  );
}
