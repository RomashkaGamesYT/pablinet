import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { useIsAdmin } from "@/hooks/useAdmin";
import { Settings, MessageCircle, Bell, Star, Palette, Sun, Moon, Monitor, Users, UserX, LogOut, ArrowLeft } from "lucide-react";
import PhoneVerification from "@/components/PhoneVerification";
import AdminProfileCustomization from "@/components/AdminProfileCustomization";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";

export default function SettingsPage() {
  const { signOut } = useAuth();
  const { data: profile } = useProfile();
  const { data: settings, isLoading } = useSettings();
  const { data: isAdmin } = useIsAdmin();
  const updateSettings = useUpdateSettings();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const showEvents = settings?.show_events_tab ?? true;
  const showNotifications = settings?.show_notifications_tab ?? true;
  const dmPrivacy = (settings as any)?.dm_privacy ?? "everyone";

  const toggleSetting = (key: "show_events_tab" | "show_notifications_tab", current: boolean) => {
    updateSettings.mutate({ [key]: !current });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (isLoading) {
    return <div className="text-muted-foreground text-sm text-center py-8">Загрузка...</div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="px-2 mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-primary text-sm mb-4 transition-colors cursor-pointer">
          <ArrowLeft size={18} />
          Назад
        </button>
        <div className="flex items-center gap-3">
          <Settings size={20} className="text-muted-foreground" />
          <h2 className="text-xl font-semibold tracking-tight text-primary">Настройки</h2>
        </div>
      </div>

      <div className="space-y-2">
        <PhoneVerification currentPhone={profile?.phone} />

        {isAdmin && (
          <AdminProfileCustomization
            bannerUrl={(profile as any)?.banner_url}
            logoUrl={(profile as any)?.logo_url}
          />
        )}

        {/* Theme selector */}
        <div className="w-full flex items-center gap-4 p-4 rounded-[35px] bg-card ring-1 ring-border text-left">
          <div className="text-muted-foreground"><Palette size={18} /></div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-primary">Тема</div>
            <div className="text-xs text-muted-foreground">Оформление приложения</div>
          </div>
          <div className="flex gap-1 bg-muted rounded-xl p-1 ring-1 ring-input">
            {([
              { value: "dark", icon: <Moon size={14} />, label: "Тёмная" },
              { value: "light", icon: <Sun size={14} />, label: "Светлая" },
              { value: "system", icon: <Monitor size={14} />, label: "Авто" },
            ] as const).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  theme === opt.value
                    ? "bg-card text-primary ring-1 ring-border shadow-sm"
                    : "text-muted-foreground hover:text-foreground/70"
                }`}
              >
                {opt.icon}
                <span className="hidden sm:inline">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* DM Privacy */}
        <div className="w-full flex items-center gap-4 p-4 rounded-[35px] bg-card ring-1 ring-border text-left">
          <div className="text-muted-foreground"><MessageCircle size={18} /></div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-primary">Кто может писать</div>
            <div className="text-xs text-muted-foreground">Ограничить входящие ЛС</div>
          </div>
          <div className="flex gap-1 bg-muted rounded-xl p-1 ring-1 ring-input">
            {([
              { value: "everyone", icon: <Users size={14} />, label: "Все" },
              { value: "followers", icon: <UserX size={14} />, label: "Подписчики" },
              { value: "nobody", icon: <UserX size={14} />, label: "Никто" },
            ] as const).map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateSettings.mutate({ dm_privacy: opt.value } as any)}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  dmPrivacy === opt.value
                    ? "bg-card text-primary ring-1 ring-border shadow-sm"
                    : "text-muted-foreground hover:text-foreground/70"
                }`}
              >
                {opt.icon}
                <span className="hidden sm:inline">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <SettingToggle
          icon={<Star size={18} />}
          label="Вкладка Ивенты"
          description="Показывать вкладку ивентов в навигации"
          checked={showEvents}
          onChange={() => toggleSetting("show_events_tab", showEvents)}
          disabled={updateSettings.isPending}
        />
        <SettingToggle
          icon={<Bell size={18} />}
          label="Вкладка Уведомления"
          description="Показывать вкладку уведомлений в навигации"
          checked={showNotifications}
          onChange={() => toggleSetting("show_notifications_tab", showNotifications)}
          disabled={updateSettings.isPending}
        />

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-4 p-4 rounded-[35px] bg-card ring-1 ring-border hover:bg-destructive/10 transition-all cursor-pointer text-left group mt-4"
        >
          <div className="text-muted-foreground group-hover:text-destructive transition-colors"><LogOut size={18} /></div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-primary group-hover:text-destructive transition-colors">Выйти</div>
            <div className="text-xs text-muted-foreground">Выйти из аккаунта</div>
          </div>
        </button>
      </div>
    </div>
  );
}

function SettingToggle({
  icon, label, description, checked, onChange, disabled,
}: {
  icon: React.ReactNode; label: string; description: string;
  checked: boolean; onChange: () => void; disabled?: boolean;
}) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className="w-full flex items-center gap-4 p-4 rounded-[35px] bg-card ring-1 ring-border hover:bg-muted/40 transition-all cursor-pointer disabled:opacity-50 text-left"
    >
      <div className="text-muted-foreground">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-primary">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <div
        className={`w-11 h-6 rounded-full transition-colors duration-200 relative shrink-0 ${
          checked ? "bg-net-cyan" : "bg-muted ring-1 ring-input"
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-primary shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </div>
    </button>
  );
}
