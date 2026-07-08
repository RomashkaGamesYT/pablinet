import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Send, Bot, ShieldAlert, User as UserIcon, Play, Pause, AlertCircle, Search, ArrowDownUp } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

type SortMode = "recent" | "oldest";

export default function AdminChatsTab() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("recent");
  const [onlySpecialist, setOnlySpecialist] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: conversations } = useQuery({
    queryKey: ["admin-support-convs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("support_conversations" as any)
        .select("*")
        .order("last_message_at", { ascending: false });
      if (!data) return [];
      const userIds = [...new Set((data as any[]).map((c: any) => c.user_id))];
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, logo_url")
        .in("user_id", userIds);
      const map = new Map((profs || []).map((p: any) => [p.user_id, p]));
      return (data as any[]).map((c: any) => ({ ...c, profile: map.get(c.user_id) }));
    },
    refetchInterval: 5000,
  });

  const filtered = useMemo(() => {
    if (!conversations) return [];
    let list = [...conversations];
    if (onlySpecialist) list = list.filter((c: any) => c.needs_specialist);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((c: any) => {
        const u = (c.profile?.username || "").toLowerCase();
        const d = (c.profile?.display_name || "").toLowerCase();
        const id = String(c.user_id).toLowerCase();
        return u.includes(q) || d.includes(q) || id.includes(q);
      });
    }
    list.sort((a: any, b: any) => {
      const ta = new Date(a.last_message_at).getTime();
      const tb = new Date(b.last_message_at).getTime();
      return sort === "recent" ? tb - ta : ta - tb;
    });
    return list;
  }, [conversations, query, sort, onlySpecialist]);

  const { data: messages } = useQuery({
    queryKey: ["admin-support-msgs", activeId],
    queryFn: async () => {
      if (!activeId) return [];
      const { data } = await supabase
        .from("support_messages" as any)
        .select("*")
        .eq("conversation_id", activeId)
        .order("created_at", { ascending: true });
      return (data || []) as any[];
    },
    enabled: !!activeId,
    refetchInterval: 3000,
  });

  // Mark conversation read by admin when opened / when new msgs arrive
  useEffect(() => {
    if (!activeId) return;
    supabase
      .from("support_conversations" as any)
      .update({ read_by_admin_at: new Date().toISOString() })
      .eq("id", activeId)
      .then(() => {
        qc.invalidateQueries({ queryKey: ["support-unread-admin"] });
      });
  }, [activeId, messages?.length, qc]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const active = filtered?.find((c: any) => c.id === activeId) || conversations?.find((c: any) => c.id === activeId);

  const toggleAI = async () => {
    if (!active) return;
    await supabase
      .from("support_conversations" as any)
      .update({ ai_active: !active.ai_active, needs_specialist: false })
      .eq("id", active.id);
    qc.invalidateQueries({ queryKey: ["admin-support-convs"] });
    qc.invalidateQueries({ queryKey: ["support-unread-admin"] });
  };

  const sendAdmin = async () => {
    if (!text.trim() || !active || !user) return;
    const content = text.trim();
    setText("");
    const { error } = await supabase.from("support_messages" as any).insert({
      conversation_id: active.id,
      sender_id: user.id,
      role: "admin",
      content,
    });
    if (error) return toast.error(error.message);
    if (active.ai_active) {
      await supabase
        .from("support_conversations" as any)
        .update({ ai_active: false, needs_specialist: false, last_message_at: new Date().toISOString() })
        .eq("id", active.id);
    } else {
      await supabase
        .from("support_conversations" as any)
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", active.id);
    }
    qc.invalidateQueries({ queryKey: ["admin-support-msgs", active.id] });
    qc.invalidateQueries({ queryKey: ["admin-support-convs"] });
  };

  const unreadOf = (c: any) => {
    // simple visual cue: has new messages after admin read
    return new Date(c.last_message_at).getTime() > new Date(c.read_by_admin_at || 0).getTime();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 min-h-[520px]">
      <div className="space-y-3">
        <div className="space-y-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по нику или ID..."
              className="w-full bg-card rounded-2xl pl-9 pr-3 py-2.5 text-sm ring-1 ring-border focus:outline-none focus:ring-accent/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSort(sort === "recent" ? "oldest" : "recent")}
              className="flex-1 flex items-center justify-center gap-1.5 bg-card rounded-2xl px-3 py-2 text-xs font-medium ring-1 ring-border hover:ring-accent/40 cursor-pointer"
            >
              <ArrowDownUp size={12} /> {sort === "recent" ? "Сначала новые" : "Сначала старые"}
            </button>
            <button
              onClick={() => setOnlySpecialist(!onlySpecialist)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-medium ring-1 cursor-pointer ${
                onlySpecialist
                  ? "bg-destructive/10 text-destructive ring-destructive/30"
                  : "bg-card ring-border hover:ring-accent/40"
              }`}
            >
              <AlertCircle size={12} /> Нужен специалист
            </button>
          </div>
        </div>

        <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
          {filtered.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-8">Нет обращений</p>
          )}
          {filtered.map((c: any) => {
            const isUnread = unreadOf(c);
            return (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`w-full text-left bg-card rounded-2xl p-3 ring-1 transition-all cursor-pointer ${
                  activeId === c.id ? "ring-accent/50" : "ring-border hover:ring-accent/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="relative w-8 h-8 rounded-full bg-secondary overflow-hidden shrink-0 flex items-center justify-center">
                    {c.profile?.logo_url ? (
                      <img src={c.profile.logo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon size={14} className="text-muted-foreground" />
                    )}
                    {isUnread && activeId !== c.id && (
                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-accent ring-2 ring-card" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${isUnread && activeId !== c.id ? "font-semibold" : "font-medium"}`}>
                      @{c.profile?.username || "user"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(c.last_message_at), { addSuffix: true, locale: ru })}
                    </p>
                  </div>
                  {c.needs_specialist && <AlertCircle size={14} className="text-destructive shrink-0" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-card rounded-[24px] ring-1 ring-border overflow-hidden flex flex-col">
        {!active ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Выберите чат слева
          </div>
        ) : (
          <>
            <div className="border-b border-border px-4 py-3 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">@{active.profile?.username}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {active.ai_active ? "ИИ отвечает" : "Отвечает специалист"}
                  {active.needs_specialist && " · нужен человек"}
                  <span className="ml-2 text-[10px] opacity-70">ID: {String(active.user_id).slice(0, 8)}</span>
                </p>
              </div>
              <button
                onClick={toggleAI}
                className={`text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  active.ai_active
                    ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                    : "bg-accent/10 text-accent hover:bg-accent/20"
                }`}
              >
                {active.ai_active ? <><Pause size={12} /> Стоп ИИ</> : <><Play size={12} /> Включить ИИ</>}
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[420px]">
              {messages?.map((m: any) => {
                const isUser = m.role === "user";
                const Icon = m.role === "assistant" ? Bot : m.role === "admin" ? ShieldAlert : UserIcon;
                return (
                  <div key={m.id} className={`flex gap-2 ${!isUser ? "justify-end" : ""}`}>
                    {isUser && (
                      <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        <Icon size={12} className="text-muted-foreground" />
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap ${
                        isUser
                          ? "bg-muted"
                          : m.role === "admin"
                          ? "bg-accent text-accent-foreground"
                          : "bg-secondary"
                      }`}
                    >
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
                placeholder="Ответить как специалист..."
                className="flex-1 bg-muted rounded-xl px-4 py-2.5 text-sm ring-1 ring-input focus:outline-none focus:ring-accent/50"
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendAdmin())}
              />
              <button
                onClick={sendAdmin}
                disabled={!text.trim()}
                className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 cursor-pointer"
              >
                <Send size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
