import { useAuth } from "@/contexts/AuthContext";
import { Ban } from "lucide-react";

export default function BannedScreen() {
  const { clearBanned } = useAuth();
  return (
    <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-24 h-24 rounded-full bg-destructive/10 ring-1 ring-destructive/30 flex items-center justify-center">
          <Ban size={48} className="text-destructive" />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-destructive/80">Ошибка 6767</p>
          <h1 className="text-4xl font-bold tracking-tight text-destructive">ВАС ЗАБАНИЛИ!</h1>
          <p className="text-sm text-muted-foreground pt-2">
            Ваш аккаунт заблокирован администрацией pablinet.
            <br />
            По вопросам разбана обратитесь на{" "}
            <a href="mailto:owner@pablinet.ru" className="text-accent underline">owner@pablinet.ru</a>
          </p>
        </div>
        <button
          onClick={clearBanned}
          className="bg-secondary text-foreground px-6 py-2.5 rounded-full text-sm font-medium hover:bg-secondary/70 cursor-pointer"
        >
          Понятно
        </button>
      </div>
    </div>
  );
}
