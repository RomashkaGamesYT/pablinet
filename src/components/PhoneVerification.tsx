import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Phone, Check } from "lucide-react";
import { toast } from "sonner";
import { useUpdateProfile } from "@/hooks/useProfile";

const TG_BOT_USERNAME = "flame_veritification_bot";

type Step = "input" | "code" | "done";

export default function PhoneVerification({ currentPhone }: { currentPhone?: string | null }) {
  const [step, setStep] = useState<Step>("input");
  const [phone, setPhone] = useState(currentPhone || "");
  const [code, setCode] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const updateProfile = useUpdateProfile();

  const handleRequestCode = async () => {
    if (!phone.trim() || phone.trim().length < 10) {
      setError("Введите корректный номер телефона");
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
      // Verify the code via edge function
      const normalizedPhone = phone.trim().replace(/\D/g, "");
      const { data, error: fnErr } = await supabase
        .from("phone_auth_codes" as any)
        .select("*")
        .eq("phone", normalizedPhone)
        .eq("code", code)
        .eq("used", false)
        .maybeSingle();

      // We can't query phone_auth_codes from client (RLS blocks it).
      // Instead, use a dedicated verify action in the edge function.
      const res = await supabase.functions.invoke("phone-auth", {
        body: { action: "verify_settings_code", phone: phone.trim(), code },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);

      // Code verified — save phone to profile
      await updateProfile.mutateAsync({ phone: phone.trim() } as any);
      setStep("done");
      toast.success("Номер телефона подтверждён и сохранён");
      setTimeout(() => setStep("input"), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const tgDeepLink = `https://t.me/${TG_BOT_USERNAME}?start=verify_${token}`;

  const inputClass =
    "flex-1 bg-muted ring-1 ring-input rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:ring-primary/30 transition-shadow placeholder-muted-foreground";
  const btnClass =
    "bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-medium hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5";

  return (
    <div className="p-4 rounded-2xl bg-card ring-1 ring-border">
      <div className="flex items-center gap-4">
        <div className="text-muted-foreground">
          <Phone size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-primary mb-1">Номер телефона</div>
          <div className="text-xs text-muted-foreground mb-2">
            {currentPhone
              ? `Текущий: ${currentPhone}`
              : "Для входа по телефону через Telegram"}
          </div>

          {step === "input" && (
            <div className="flex gap-2">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 999 123 45 67"
                className={inputClass}
              />
              <button onClick={handleRequestCode} disabled={loading} className={btnClass}>
                {loading ? "Отправка..." : "Получить код"}
              </button>
            </div>
          )}

          {step === "code" && (
            <div className="space-y-3">
              <div className="text-xs text-foreground/70">
                Откройте бота, чтобы получить код подтверждения:
              </div>
              <a
                href={tgDeepLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[hsl(200,80%,45%)] text-white px-4 py-2 rounded-xl text-xs font-medium hover:opacity-90 transition-all active:scale-95"
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
                  disabled={loading || code.length !== 6}
                  className={btnClass}
                >
                  {loading ? "Проверка..." : "Подтвердить"}
                </button>
              </div>
              <button
                onClick={() => { setStep("input"); setCode(""); setError(""); }}
                className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              >
                Назад
              </button>
            </div>
          )}

          {step === "done" && (
            <div className="flex items-center gap-2 text-sm text-net-emerald">
              <Check size={16} /> Номер подтверждён
            </div>
          )}

          {error && <p className="text-destructive text-xs mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
}
