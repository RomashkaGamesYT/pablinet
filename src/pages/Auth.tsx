import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

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
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  const inputClass = "w-full bg-secondary border border-border rounded-2xl p-4 text-sm outline-none text-foreground placeholder-muted-foreground focus:border-accent/50 transition-colors";
  const btnClass = "w-full bg-primary text-primary-foreground py-3 rounded-full text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50";

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
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName, username },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        if (data.user && !data.session) {
          setEmailSent(true);
          return;
        }
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

  if (emailSent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto">
            <span className="text-2xl">📧</span>
          </div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Подтвердите email</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Мы отправили письмо на <span className="text-foreground font-medium">{email}</span>. Перейдите по ссылке в письме, чтобы активировать аккаунт.
          </p>
          <div className="bg-card rounded-2xl p-4 border border-border text-xs text-muted-foreground">
            Не получили письмо? Проверьте папку «Спам» или попробуйте снова.
          </div>
          <button
            onClick={() => { setEmailSent(false); setIsLogin(true); }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            ← Войти в аккаунт
          </button>
        </div>
      </div>
    );
  }

  if (showReset) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-foreground tracking-tight">нэт</h1>
          </div>
          {resetSent ? (
            <div className="text-center space-y-3">
              <div className="text-4xl">📧</div>
              <p className="text-sm text-foreground/80">Письмо отправлено на {email}</p>
              <button onClick={() => { setShowReset(false); setResetSent(false); }} className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                ← Назад ко входу
              </button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">Введите email для сброса пароля</p>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className={inputClass} />
              {error && <p className="text-destructive text-xs">{error}</p>}
              <button type="submit" disabled={loading} className={btnClass}>
                {loading ? "..." : "Отправить"}
              </button>
              <button type="button" onClick={() => setShowReset(false)} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-center">
                ← Назад
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">нэт</h1>
          <p className="text-muted-foreground text-sm">
            {isLogin ? "С возвращением" : "Присоединяйтесь"}
          </p>
        </div>

        {/* Method tabs */}
        <div className="flex bg-secondary rounded-2xl p-1 gap-1 border border-border">
          <button
            onClick={() => { setAuthMethod("email"); setError(""); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              authMethod === "email"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Email
          </button>
          <button
            onClick={() => { setAuthMethod("phone"); setError(""); setPhoneStep("phone"); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              authMethod === "phone"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Телефон
          </button>
        </div>

        {/* Forms */}
        {authMethod === "email" ? (
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            {!isLogin && (
              <>
                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Имя" required className={inputClass} />
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Юзернейм" required className={inputClass} />
              </>
            )}
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className={inputClass} />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Пароль" required minLength={6} className={inputClass} />
            {error && <p className="text-destructive text-xs bg-destructive/10 rounded-2xl px-4 py-2">{error}</p>}
            <button type="submit" disabled={loading} className={btnClass}>
              {loading ? "..." : isLogin ? "Войти" : "Создать аккаунт"}
            </button>
            <div className="flex justify-between text-xs pt-1">
              <button type="button" onClick={() => { setIsLogin(!isLogin); setError(""); }} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                {isLogin ? "Нет аккаунта?" : "Уже есть аккаунт?"}
              </button>
              {isLogin && (
                <button type="button" onClick={() => setShowReset(true)} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  Забыли пароль?
                </button>
              )}
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            {phoneStep === "phone" ? (
              <form onSubmit={handleRequestCode} className="space-y-3">
                {!isLogin && (
                  <>
                    <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Имя" required className={inputClass} />
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Юзернейм" required className={inputClass} />
                  </>
                )}
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 999 123 45 67" required className={inputClass} />
                {error && <p className="text-destructive text-xs bg-destructive/10 rounded-2xl px-4 py-2">{error}</p>}
                <button type="submit" disabled={loading} className={btnClass}>
                  {loading ? "..." : "Получить код"}
                </button>
                <p className="text-xs text-center text-muted-foreground">Код придёт в Telegram-бота</p>
                <div className="text-xs text-center">
                  <button type="button" onClick={() => { setIsLogin(!isLogin); setError(""); }} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    {isLogin ? "Нет аккаунта?" : "Уже есть аккаунт?"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="text-center space-y-3">
                  <p className="text-sm text-foreground/80">Код отправлен в бота</p>
                  <a
                    href={tgDeepLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#0088cc] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-all active:scale-95"
                  >
                    Открыть Telegram →
                  </a>
                </div>
                <input
                  type="text"
                  value={phoneCode}
                  onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="• • • • • •"
                  required
                  maxLength={6}
                  className={`${inputClass} text-center text-lg tracking-[0.5em] font-mono`}
                />
                {error && <p className="text-destructive text-xs bg-destructive/10 rounded-2xl px-4 py-2">{error}</p>}
                <button type="submit" disabled={loading || phoneCode.length !== 6} className={btnClass}>
                  {loading ? "..." : "Подтвердить"}
                </button>
                <button
                  type="button"
                  onClick={() => { setPhoneStep("phone"); setPhoneCode(""); setError(""); }}
                  className="w-full flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <ArrowLeft size={14} /> Назад
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
