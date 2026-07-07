import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, LifeBuoy, Bot, ShieldAlert, User as UserIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function SupportPage() {
  const { user } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!adminLoading && isAdmin) navigate("/admin");
  }, [isAdmin, adminLoading, navigate]);

  const { data: conversation } = useQuery({
    queryKey: ["support-conv", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data: existing } = await supabase
        .from("support_conversations" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (existing) return existing as any;
      const { data: created, error } = await supabase
        .from("support_conversations" as any)
        .insert({ user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return created as any;
    },
    enabled: !!user && !isAdmin,
  });

  const { data: messages } = useQuery({
    queryKey: ["support-msgs", conversation?.id],
    queryFn: async () => {
      if (!conversation?.id) return [];
      const { data } = await supabase
        .from("support_messages" as any)
        .select("*")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true });
      return (data || []) as any[];
    },
    enabled: !!conversation?.id,
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || !user || !conversation) return;
    const content = text.trim();
    setText("");
    setSending(true);
    try {
      const { error: insErr } = await supabase.from("support_messages" as any).insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        role: "user",
        content,
      });
      if (insErr) throw insErr;
      qc.invalidateQueries({ queryKey: ["support-msgs", conversation.id] });

      if (conversation.ai_active) {
        const { error } = await supabase.functions.invoke("support-chat", {
          body: { conversationId: conversation.id },
        });
        if (error) console.error(error);
        qc.invalidateQueries({ queryKey: ["support-msgs", conversation.id] });
        qc.invalidateQueries({ queryKey: ["support-conv", user.id] });
      }
    } catch (e: any) {
      toast.error(e.message || "Ошибка отправки");
    } finally {
      setSending(false);
    }
  };

  if (adminLoading || !conversation) {
    return <div className="text-center text-muted-foreground text-sm py-8">Загрузка...</div>;
  }

  return (
    <div className="animate-fade-in flex flex-col gap-4">
      <div className="flex items-center gap-3 px-2">
        <LifeBuoy size={22} className="text-accent" />
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Поддержка pablinet</h2>
          <p className="text-xs text-muted-foreground">
            {conversation.ai_active ? "На связи ИИ-ассистент" : "На связи специалист"}
            {conversation.needs_specialist && " · Ожидание специалиста"}
          </p>
        </div>
      </div>

      <div className="bg-card rounded-[24px] ring-1 ring-border overflow-hidden flex flex-col">
        <div ref={scrollRef} className="h-[440px] overflow-y-auto p-5 space-y-3">
          {(!messages || messages.length === 0) && (
            <div className="text-center text-muted-foreground text-sm py-16">
              Опишите проблему — ИИ ответит сразу. Если понадобится, он вызовет специалиста.
            </div>
          )}
          {messages?.map((m: any) => {
            const mine = m.role === "user";
            const Icon = m.role === "assistant" ? Bot : m.role === "admin" ? ShieldAlert : UserIcon;
            return (
              <div key={m.id} className={`flex gap-2 ${mine ? "justify-end" : ""}`}>
                {!mine && (
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <Icon size={14} className="text-muted-foreground" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    mine
                      ? "bg-primary text-primary-foreground"
                      : m.role === "admin"
                      ? "bg-accent/15 text-foreground ring-1 ring-accent/30"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {m.role === "admin" && <div className="text-[10px] uppercase text-accent mb-1 font-semibold">Специалист</div>}
                  {m.content}
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-border p-3 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Опишите ваш вопрос..."
            className="flex-1 bg-muted rounded-xl px-4 py-2.5 text-sm ring-1 ring-input focus:outline-none focus:ring-accent/50"
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
            disabled={sending}
          />
          <button
            onClick={handleSend}
            disabled={sending || !text.trim()}
            className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 cursor-pointer"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
