import { useState, useEffect } from "react";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { Settings, MessageCircle, Bell, Star, Phone, Check } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const { data: profile } = useProfile();
  const updateSettings = useUpdateSettings();
  const updateProfile = useUpdateProfile();
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneSaved, setPhoneSaved] = useState(false);

  useEffect(() => {
    if (profile?.phone) setPhoneInput(profile.phone);
  }, [profile?.phone]);

  const dmEnabled = settings?.dm_enabled ?? true;
  const showEvents = settings?.show_events_tab ?? true;
  const showNotifications = settings?.show_notifications_tab ?? true;

  const toggle = (key: "dm_enabled" | "show_events_tab" | "show_notifications_tab", current: boolean) => {
    updateSettings.mutate({ [key]: !current });
  };

  const handleSavePhone = async () => {
    const cleaned = phoneInput.trim();
    await updateProfile.mutateAsync({ phone: cleaned || undefined } as any);
    setPhoneSaved(true);
    toast.success("Номер телефона сохранён");
    setTimeout(() => setPhoneSaved(false), 2000);
  };

  if (isLoading) {
    return <div className="text-muted-foreground text-sm text-center py-8">Загрузка...</div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="px-2 mb-6">
        <div className="flex items-center gap-3">
          <Settings size={20} className="text-muted-foreground" />
          <h2 className="text-xl font-semibold tracking-tight text-primary">Настройки</h2>
        </div>
      </div>

      <div className="space-y-2">
        {/* Phone number */}
        <div className="p-4 rounded-2xl bg-card ring-1 ring-border">
          <div className="flex items-center gap-4">
            <div className="text-muted-foreground"><Phone size={18} /></div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-primary mb-1">Номер телефона</div>
              <div className="text-xs text-muted-foreground mb-2">Для входа по телефону через Telegram</div>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="+7 999 123 45 67"
                  className="flex-1 bg-muted ring-1 ring-input rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:ring-primary/30 transition-shadow placeholder-muted-foreground"
                />
                <button
                  onClick={handleSavePhone}
                  disabled={updateProfile.isPending}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-medium hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {phoneSaved ? <><Check size={14} /> Готово</> : "Сохранить"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <SettingToggle
          icon={<MessageCircle size={18} />}
          label="Личные сообщения"
          description="Разрешить другим писать вам в ЛС"
          checked={dmEnabled}
          onChange={() => toggle("dm_enabled", dmEnabled)}
          disabled={updateSettings.isPending}
        />
        <SettingToggle
          icon={<Star size={18} />}
          label="Вкладка Ивенты"
          description="Показывать вкладку ивентов в навигации"
          checked={showEvents}
          onChange={() => toggle("show_events_tab", showEvents)}
          disabled={updateSettings.isPending}
        />
        <SettingToggle
          icon={<Bell size={18} />}
          label="Вкладка Уведомления"
          description="Показывать вкладку уведомлений в навигации"
          checked={showNotifications}
          onChange={() => toggle("show_notifications_tab", showNotifications)}
          disabled={updateSettings.isPending}
        />
      </div>
    </div>
  );
}

function SettingToggle({
  icon,
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card ring-1 ring-border hover:bg-muted/40 transition-all cursor-pointer disabled:opacity-50 text-left"
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
