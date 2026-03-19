import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
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

  if (showReset) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-primary font-montserrat tracking-tight">нэт</h1>
            <p className="text-muted-foreground text-sm mt-2">Сброс пароля</p>
          </div>
          {resetSent ? (
            <div className="bg-card rounded-3xl p-6 ring-1 ring-border text-center">
              <p className="text-sm text-foreground">Письмо для сброса отправлено на {email}</p>
              <button onClick={() => { setShowReset(false); setResetSent(false); }} className="mt-4 text-sm text-muted-foreground hover:text-primary transition-colors">
                Вернуться к входу
              </button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="bg-card rounded-3xl p-6 ring-1 ring-border space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full bg-muted ring-1 ring-input rounded-2xl px-4 py-3 text-sm text-foreground outline-none focus:ring-primary/30 transition-shadow placeholder-muted-foreground"
              />
              {error && <p className="text-destructive text-xs">{error}</p>}
              <button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground py-3 rounded-full text-sm font-medium hover:opacity-90 transition-opacity active:scale-95 disabled:opacity-50">
                {loading ? "Отправка..." : "Отправить ссылку"}
              </button>
              <button type="button" onClick={() => setShowReset(false)} className="w-full text-sm text-muted-foreground hover:text-primary transition-colors">
                Назад
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-primary font-montserrat tracking-tight">нэт</h1>
          <p className="text-muted-foreground text-sm mt-2">{isLogin ? "Войти в аккаунт" : "Создать аккаунт"}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-3xl p-6 ring-1 ring-border space-y-4">
          {!isLogin && (
            <>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Имя"
                required
                className="w-full bg-muted ring-1 ring-input rounded-2xl px-4 py-3 text-sm text-foreground outline-none focus:ring-primary/30 transition-shadow placeholder-muted-foreground"
              />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Юзернейм"
                required
                className="w-full bg-muted ring-1 ring-input rounded-2xl px-4 py-3 text-sm text-foreground outline-none focus:ring-primary/30 transition-shadow placeholder-muted-foreground"
              />
            </>
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full bg-muted ring-1 ring-input rounded-2xl px-4 py-3 text-sm text-foreground outline-none focus:ring-primary/30 transition-shadow placeholder-muted-foreground"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
            required
            minLength={6}
            className="w-full bg-muted ring-1 ring-input rounded-2xl px-4 py-3 text-sm text-foreground outline-none focus:ring-primary/30 transition-shadow placeholder-muted-foreground"
          />
          {error && <p className="text-destructive text-xs">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground py-3 rounded-full text-sm font-medium hover:opacity-90 transition-opacity active:scale-95 disabled:opacity-50">
            {loading ? "Загрузка..." : isLogin ? "Войти" : "Зарегистрироваться"}
          </button>
          <div className="flex justify-between text-xs">
            <button type="button" onClick={() => { setIsLogin(!isLogin); setError(""); }} className="text-muted-foreground hover:text-primary transition-colors">
              {isLogin ? "Создать аккаунт" : "Уже есть аккаунт?"}
            </button>
            {isLogin && (
              <button type="button" onClick={() => setShowReset(true)} className="text-muted-foreground hover:text-primary transition-colors">
                Забыли пароль?
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
