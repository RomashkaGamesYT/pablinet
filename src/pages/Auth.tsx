import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Phone, Mail } from "lucide-react";

type AuthMethod = "email" | "phone";
type PhoneStep = "phone" | "code";

const TG_BOT_USERNAME = "flame_veritification_bot";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [authMethod, setAuthMethod] = useState<AuthMethod>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneStep, setPhoneStep] = useState<PhoneStep>("phone");
  const [phoneToken, setPhoneToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();

  const inputClass = "w-full bg-white/[0.06] ring-1 ring-white/[0.08] rounded-2xl px-4 py-3.5 text-sm text-foreground outline-none focus:ring-primary/30 focus:bg-white/[0.08] transition-all placeholder-muted-foreground backdrop-blur-sm";
  const btnClass = "w-full bg-primary text-primary-foreground py-3.5 rounded-full text-sm font-semibold hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-[0_4px_20px_rgba(255,255,255,0.1)]";

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName, username },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        navigate("/");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await supabase.functions.invoke("phone-auth", {
        body: { action: "request_code", phone },
      });
      if (res.error) throw new Error(res.error.message);
      const data = res.data;
      if (data.error) throw new Error(data.error);
      setPhoneToken(data.token);
      setPhoneStep("code");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await supabase.functions.invoke("phone-auth", {
        body: {
          action: "verify_code",
          phone,
          code: phoneCode,
          displayName: !isLogin ? displayName : undefined,
          username: !isLogin ? username : undefined,
        },
      });
      if (res.error) throw new Error(res.error.message);
      const data = res.data;
      
      if (data.error) {
        if (data.needsRegistration) {
          setIsLogin(false);
          setPhoneStep("phone");
          throw new Error("Аккаунт не найден. Зарегистрируйтесь.");
        }
        throw new Error(data.error);
      }

      const { error: verifyErr } = await supabase.auth.verifyOtp({
        token_hash: data.hashed_token,
        type: "magiclink",
      });
      if (verifyErr) throw verifyErr;
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const tgDeepLink = `https://t.me/${TG_BOT_USERNAME}?start=verify_${phoneToken}`;

  const cardClass = "bg-white/[0.04] backdrop-blur-xl rounded-3xl p-6 sm:p-8 ring-1 ring-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.3)]";

  if (showReset) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary font-montserrat tracking-tight">нэт</h1>
            <p className="text-muted-foreground text-sm mt-2">Сброс пароля</p>
          </div>
          {resetSent ? (
            <div className={`${cardClass} text-center`}>
              <div className="text-2xl mb-3">📧</div>
              <p className="text-sm text-foreground">Письмо для сброса отправлено на {email}</p>
              <button onClick={() => { setShowReset(false); setResetSent(false); }} className="mt-4 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                Вернуться к входу
              </button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className={`${cardClass} space-y-4`}>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className={inputClass} />
              {error && <p className="text-destructive text-xs">{error}</p>}
              <button type="submit" disabled={loading} className={btnClass}>
                {loading ? "Отправка..." : "Отправить ссылку"}
              </button>
              <button type="button" onClick={() => setShowReset(false)} className="w-full text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                Назад
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary font-montserrat tracking-tight">нэт</h1>
          <p className="text-muted-foreground text-sm mt-2">{isLogin ? "Войти в аккаунт" : "Создать аккаунт"}</p>
        </div>

        {/* Method toggle */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => { setAuthMethod("email"); setError(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium transition-all cursor-pointer ${
              authMethod === "email"
                ? "bg-primary text-primary-foreground shadow-[0_4px_16px_rgba(255,255,255,0.1)]"
                : "bg-white/[0.04] text-muted-foreground ring-1 ring-white/[0.08] hover:text-primary backdrop-blur-sm"
            }`}
          >
            <Mail size={16} /> Email
          </button>
          <button
            onClick={() => { setAuthMethod("phone"); setError(""); setPhoneStep("phone"); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium transition-all cursor-pointer ${
              authMethod === "phone"
                ? "bg-primary text-primary-foreground shadow-[0_4px_16px_rgba(255,255,255,0.1)]"
                : "bg-white/[0.04] text-muted-foreground ring-1 ring-white/[0.08] hover:text-primary backdrop-blur-sm"
            }`}
          >
            <Phone size={16} /> Телефон
          </button>
        </div>

        {authMethod === "email" ? (
          <form onSubmit={handleEmailSubmit} className={`${cardClass} space-y-4`}>
            {!isLogin && (
              <>
                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Имя" required className={inputClass} />
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Юзернейм" required className={inputClass} />
              </>
            )}
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className={inputClass} />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Пароль" required minLength={6} className={inputClass} />
            {error && <p className="text-destructive text-xs bg-destructive/10 rounded-xl px-3 py-2">{error}</p>}
            <button type="submit" disabled={loading} className={btnClass}>
              {loading ? "Загрузка..." : isLogin ? "Войти" : "Зарегистрироваться"}
            </button>
            <div className="flex justify-between text-xs pt-1">
              <button type="button" onClick={() => { setIsLogin(!isLogin); setError(""); }} className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                {isLogin ? "Создать аккаунт" : "Уже есть аккаунт?"}
              </button>
              {isLogin && (
                <button type="button" onClick={() => setShowReset(true)} className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  Забыли пароль?
                </button>
              )}
            </div>
          </form>
        ) : (
          <div className={`${cardClass} space-y-4`}>
            {phoneStep === "phone" ? (
              <form onSubmit={handleRequestCode} className="space-y-4">
                {!isLogin && (
                  <>
                    <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Имя" required className={inputClass} />
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Юзернейм" required className={inputClass} />
                  </>
                )}
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 999 123 45 67"
                  required
                  className={inputClass}
                />
                {error && <p className="text-destructive text-xs bg-destructive/10 rounded-xl px-3 py-2">{error}</p>}
                <button type="submit" disabled={loading} className={btnClass}>
                  {loading ? "Отправка..." : "Получить код в Telegram"}
                </button>
                <div className="text-xs text-center">
                  <button type="button" onClick={() => { setIsLogin(!isLogin); setError(""); }} className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    {isLogin ? "Создать аккаунт" : "Уже есть аккаунт?"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-5">
                <div className="text-center space-y-3">
                  <div className="text-3xl">📱</div>
                  <p className="text-sm text-foreground/80">
                    Код отправлен в Telegram-бота
                  </p>
                  <a
                    href={tgDeepLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[hsl(200,80%,45%)] text-white px-5 py-3 rounded-full text-sm font-medium hover:opacity-90 transition-all active:scale-95 shadow-[0_4px_16px_rgba(34,211,238,0.3)]"
                  >
                    Открыть Telegram
                  </a>
                </div>
                <input
                  type="text"
                  value={phoneCode}
                  onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="• • • • • •"
                  required
                  maxLength={6}
                  className={`${inputClass} text-center text-xl tracking-[0.6em] font-mono py-4`}
                />
                {error && <p className="text-destructive text-xs bg-destructive/10 rounded-xl px-3 py-2">{error}</p>}
                <button type="submit" disabled={loading || phoneCode.length !== 6} className={btnClass}>
                  {loading ? "Проверка..." : "Подтвердить"}
                </button>
                <button
                  type="button"
                  onClick={() => { setPhoneStep("phone"); setPhoneCode(""); setError(""); }}
                  className="w-full text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  Назад
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
