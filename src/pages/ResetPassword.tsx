import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (hashParams.get("type") !== "recovery") {
      navigate("/auth");
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => navigate("/"), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-primary font-montserrat tracking-tight">нэт</h1>
          <p className="text-muted-foreground text-sm mt-2">Новый пароль</p>
        </div>
        {success ? (
          <div className="bg-card rounded-3xl p-6 ring-1 ring-border text-center">
            <p className="text-sm text-foreground">Пароль обновлён! Перенаправляем...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-card rounded-3xl p-6 ring-1 ring-border space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Новый пароль"
              required
              minLength={6}
              className="w-full bg-muted ring-1 ring-input rounded-2xl px-4 py-3 text-sm text-foreground outline-none focus:ring-primary/30 transition-shadow placeholder-muted-foreground"
            />
            {error && <p className="text-destructive text-xs">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground py-3 rounded-full text-sm font-medium hover:opacity-90 transition-opacity active:scale-95 disabled:opacity-50">
              {loading ? "Сохранение..." : "Сохранить пароль"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
