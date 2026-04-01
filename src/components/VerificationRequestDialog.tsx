import { useState } from "react";
import { ShieldCheck, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export default function VerificationRequestDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const [loading, setLoading] = useState(false);

  const { data: existingRequest, refetch } = useQuery({
    queryKey: ["verification-request", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("verification_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);
      return data?.[0] || null;
    },
    enabled: !!user && open,
  });

  const handleSubmit = async () => {
    if (!user || !profile) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("verification_requests").insert({
        user_id: user.id,
        site_username: profile.username,
        status: "pending",
        telegram_chat_id: 0,
      } as any);
      if (error) throw error;
      toast.success("Заявка отправлена!");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Ошибка отправки заявки");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const isPending = existingRequest?.status === "pending";
  const isApproved = existingRequest?.status === "approved";
  const isRejected = existingRequest?.status === "rejected";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-card rounded-[35px] ring-1 ring-border p-6 max-w-sm w-full space-y-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-net-cyan" />
            <h3 className="text-lg font-semibold text-primary">Верификация</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-primary transition-colors cursor-pointer p-1">
            <X size={18} />
          </button>
        </div>

        {profile?.verified ? (
          <div className="text-center py-4 space-y-2">
            <div className="text-3xl">✅</div>
            <p className="text-sm text-foreground/80">Ваш аккаунт уже верифицирован!</p>
          </div>
        ) : isPending ? (
          <div className="text-center py-4 space-y-2">
            <div className="text-3xl">⏳</div>
            <p className="text-sm text-foreground/80">Ваша заявка на рассмотрении</p>
            <p className="text-xs text-muted-foreground">Мы уведомим вас о результате</p>
          </div>
        ) : isApproved ? (
          <div className="text-center py-4 space-y-2">
            <div className="text-3xl">🎉</div>
            <p className="text-sm text-foreground/80">Заявка одобрена!</p>
          </div>
        ) : isRejected ? (
          <div className="space-y-3">
            <div className="text-center py-2 space-y-2">
              <div className="text-3xl">❌</div>
              <p className="text-sm text-foreground/80">Предыдущая заявка отклонена</p>
              {existingRequest?.rejection_reason && (
                <p className="text-xs text-muted-foreground bg-muted rounded-[20px] p-3">
                  Причина: {existingRequest.rejection_reason}
                </p>
              )}
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-3 rounded-[35px] text-sm font-semibold hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              Подать повторно
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-foreground/80 leading-relaxed">
              Подайте заявку на верификацию аккаунта. После проверки вы получите галочку ✓ рядом с именем.
            </p>
            <div className="bg-muted rounded-[20px] p-3 text-xs text-muted-foreground space-y-1">
              <p>📋 Что проверяется:</p>
              <p>• Активность на платформе</p>
              <p>• Заполненность профиля</p>
              <p>• Уникальность аккаунта</p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-3 rounded-[35px] text-sm font-semibold hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              Подать заявку
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
