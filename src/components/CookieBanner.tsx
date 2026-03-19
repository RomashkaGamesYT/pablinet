import { useState, useEffect } from "react";
import { Cookie } from "lucide-react";

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
      <div className="bg-card/95 backdrop-blur-xl rounded-2xl ring-1 ring-border shadow-[0_8px_30px_rgba(0,0,0,0.4)] p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0 ring-1 ring-input">
            <Cookie size={16} className="text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-primary mb-1">Мы используем cookies</p>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              Для персонализации ленты и улучшения работы приложения мы собираем данные о ваших предпочтениях.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleAccept}
                className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-all active:scale-95 cursor-pointer"
              >
                Я согласен
              </button>
              <button
                onClick={handleDecline}
                className="px-4 py-2 rounded-full bg-muted text-foreground text-xs font-medium ring-1 ring-input hover:bg-muted/80 transition-all cursor-pointer"
              >
                Я не согласен
              </button>
            </div>
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
