import { useState, useEffect } from "react";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-3 right-3 md:left-auto md:right-6 md:max-w-sm z-[60] animate-fade-in">
      <div className="bg-card/90 backdrop-blur-2xl rounded-[20px] ring-1 ring-border shadow-[0_8px_40px_rgba(0,0,0,0.5)] p-5">
        <div className="flex flex-col gap-3">
          <div className="text-2xl">🍪</div>
          <div>
            <p className="text-sm font-semibold text-primary mb-1">Cookies & данные</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Мы используем cookies для персонализации ленты и улучшения работы нэт.
            </p>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleAccept}
              className="flex-1 px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all active:scale-95 cursor-pointer"
            >
              Принять ✓
            </button>
            <button
              onClick={handleDecline}
              className="px-4 py-2.5 rounded-full bg-muted text-foreground text-xs font-medium ring-1 ring-input hover:bg-muted/80 transition-all cursor-pointer"
            >
              Нет
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function useCookieConsent() {
  const [consent, setConsent] = useState<string | null>(null);

  useEffect(() => {
    setConsent(localStorage.getItem("cookie-consent"));
    const handler = () => setConsent(localStorage.getItem("cookie-consent"));
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return consent;
}
