import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Phone, Check } from "lucide-react";
import { toast } from "sonner";
import { useUpdateProfile } from "@/hooks/useProfile";

const TG_BOT_USERNAME = "flame_veritification_bot";

type Step = "view" | "input" | "code" | "done";

export default function PhoneVerification({ currentPhone }: { currentPhone?: string | null }) {
  const [step, setStep] = useState<Step>(currentPhone ? "view" : "input");
  const [phone, setPhone] = useState(currentPhone || "");
  const [code, setCode] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const updateProfile = useUpdateProfile();

  useEffect(() => {
    setPhone(currentPhone || "");
    setCode("");
    setToken("");
    setError("");
    setStep(currentPhone ? "view" : "input");
  }, [currentPhone]);

  const isBusy = loading || updateProfile.isPending;

  const handleRequestCode = async () => {
    if (!phone.trim() || phone.trim().length < 10) {
      setError("Введите корректный номер телефона");
      return;
    }

    if (currentPhone && phone.trim() === currentPhone.trim()) {
      setStep("view");
      setError("");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await supabase.functions.invoke("phone-auth", {
        body: { action: "request_code", phone: phone.trim() },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      setToken(res.data.token);
      setStep("code");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6) return;

    setError("");
    setLoading(true);
    try {
      const res = await supabase.functions.invoke("phone-auth", {
        body: { action: "verify_settings_code", phone: phone.trim(), code },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);

      await updateProfile.mutateAsync({ phone: phone.trim() });
      setStep("done");
      toast.success("Номер телефона подтверждён и сохранён");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePhone = async () => {
    setError("");
    try {
      await updateProfile.mutateAsync({ phone: null });
      toast.success("Номер телефона отвязан");
    } catch (err: any) {
      setError(err.message || "Не удалось отвязать номер");
    }
  };

  const tgDeepLink = `https://t.me/${TG_BOT_USERNAME}?start=verify_${token}`;

  const inputClass =
    "flex-1 bg-muted ring-1 ring-input rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:ring-primary/30 transition-shadow placeholder-muted-foreground";
  const primaryBtnClass =
    "bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-medium hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5";
  const secondaryBtnClass =
    "bg-muted text-foreground px-4 py-2 rounded-xl text-xs font-medium ring-1 ring-input hover:bg-muted/80 transition-all disabled:opacity-50 cursor-pointer";

  return (
    <div className="p-4 rounded-2xl bg-card ring-1 ring-border">
      <div className="flex items-center gap-4">
        <div className="text-muted-foreground">
          <Phone size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-primary mb-1">Номер телефона</div>
          <div className="text-xs text-muted-foreground mb-2">
            {currentPhone ? "Подтверждённый номер для входа через Telegram" : "Для входа по телефону через Telegram"}
          </div>

          {step === "view" && currentPhone && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-primary">
                <Check size={16} />
                <span>{currentPhone}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setStep("input")} disabled={isBusy} className={secondaryBtnClass}>
                  Изменить
                </button>
                <button onClick={handleRemovePhone} disabled={isBusy} className={secondaryBtnClass}>
                  {updateProfile.isPending ? "Удаление..." : "Отвязать"}
                </button>
              </div>
            </div>
          )}

          {step === "input" && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 999 123 45 67"
                  className={inputClass}
                />
                <button onClick={handleRequestCode} disabled={isBusy} className={primaryBtnClass}>
                  {loading ? "Отправка..." : currentPhone ? "Сменить" : "Получить код"}
                </button>
              </div>
              {currentPhone && (
                <button
                  onClick={() => {
                    setPhone(currentPhone);
                    setError("");
                    setStep("view");
                  }}
                  disabled={isBusy}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  Отмена
                </button>
              )}
            </div>
          )}

          {step === "code" && (
            <div className="space-y-3">
              <div className="text-xs text-foreground/70">Откройте бота, чтобы получить код подтверждения:</div>
              <a
                href={tgDeepLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-medium hover:opacity-90 transition-all active:scale-95"
              >
                📱 Открыть Telegram
              </a>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="6-значный код"
                  maxLength={6}
                  className={`${inputClass} text-center tracking-[0.3em] font-mono`}
                />
                <button
                  onClick={handleVerifyCode}
                  disabled={isBusy || code.length !== 6}
                  className={primaryBtnClass}
                >
                  {loading ? "Проверка..." : "Подтвердить"}
                </button>
              </div>
              <button
                onClick={() => {
                  setCode("");
                  setError("");
                  setStep(currentPhone ? "view" : "input");
                }}
                className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              >
                Назад
              </button>
            </div>
          )}

          {step === "done" && (
            <div className="flex items-center gap-2 text-sm text-primary">
              <Check size={16} /> Номер подтверждён
            </div>
          )}

          {error && <p className="text-destructive text-xs mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
}
