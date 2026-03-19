import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useConversations, useMessages, useSendMessage, useMarkAsRead, useStartConversation } from "@/hooks/useMessages";
import { ArrowLeft, Send, MessageCircle, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

function useAllUsers() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["all-users", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, avatar_emoji, verified")
        .neq("user_id", user.id)
        .order("display_name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export default function MessagesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: conversations, isLoading } = useConversations();
  const { data: allUsers, isLoading: usersLoading } = useAllUsers();
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const { data: messages } = useMessages(activeConvId || undefined);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkAsRead();
  const startConversation = useStartConversation();
  const [newMsg, setNewMsg] = useState("");
  const [tab, setTab] = useState<"chats" | "all">("chats");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations?.find((c: any) => c.id === activeConvId);

  useEffect(() => {
    if (activeConvId) {
      markAsRead.mutate(activeConvId);
    }
  }, [activeConvId, messages?.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMsg.trim() || !activeConvId) return;
    await sendMessage.mutateAsync({ conversationId: activeConvId, content: newMsg });
    setNewMsg("");
  };

  const handleStartChat = async (targetUserId: string) => {
    const convId = await startConversation.mutateAsync(targetUserId);
    setActiveConvId(convId);
    setTab("chats");
  };

  const filteredUsers = allUsers?.filter((u: any) =>
    !searchQuery.trim() ||
    u.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Conversation list view
  if (!activeConvId) {
    return (
      <div className="animate-fade-in">
        <div className="px-2 mb-4">
          <h2 className="text-xl font-semibold tracking-tight text-primary">Сообщения</h2>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border mb-4">
          <button
            onClick={() => setTab("chats")}
            className={`flex-1 py-3 text-sm font-medium text-center transition-colors relative cursor-pointer ${
              tab === "chats" ? "text-primary" : "text-muted-foreground hover:text-foreground/70"
            }`}
          >
            Мои чаты
            {tab === "chats" && <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full" />}
          </button>
          <button
            onClick={() => setTab("all")}
            className={`flex-1 py-3 text-sm font-medium text-center transition-colors relative cursor-pointer ${
              tab === "all" ? "text-primary" : "text-muted-foreground hover:text-foreground/70"
            }`}
          >
            Все
            {tab === "all" && <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full" />}
          </button>
        </div>

        {tab === "chats" ? (
          <>
            {isLoading ? (
              <div className="text-muted-foreground text-sm text-center py-8">Загрузка...</div>
            ) : !conversations || conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <MessageCircle size={40} className="text-muted-foreground/30" />
                <p className="text-muted-foreground text-sm">Нет сообщений</p>
                <button
                  onClick={() => setTab("all")}
                  className="text-xs text-net-cyan hover:underline cursor-pointer"
                >
                  Найти собеседника →
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {conversations.map((conv: any) => (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    className="flex items-center gap-3 p-3 rounded-2xl hover:bg-muted/40 transition-all cursor-pointer text-left w-full group"
                  >
                    <div className="w-11 h-11 rounded-full bg-gradient-to-b from-muted to-card flex items-center justify-center ring-1 ring-input text-lg shrink-0">
                      {conv.otherUser?.avatar_emoji || "👤"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-primary truncate">
                          {conv.otherUser?.display_name || "Пользователь"}
                        </span>
                        {conv.lastMessage && (
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {formatDistanceToNow(new Date(conv.lastMessage.created_at), { addSuffix: false, locale: ru })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground truncate flex-1">
                          {conv.lastMessage
                            ? (conv.lastMessage.sender_id === user?.id ? "Вы: " : "") + conv.lastMessage.content
                            : "Начните диалог"
                          }
                        </span>
                        {conv.unreadCount > 0 && (
                          <span className="w-5 h-5 rounded-full bg-net-cyan text-[10px] font-bold text-background flex items-center justify-center shrink-0">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Search */}
            <div className="mb-3 px-1">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Найти пользователя..."
                  className="w-full bg-muted ring-1 ring-input rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground outline-none focus:ring-primary/30 placeholder-muted-foreground"
                />
              </div>
            </div>

            {usersLoading ? (
              <div className="text-muted-foreground text-sm text-center py-8">Загрузка...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-sm">Пользователи не найдены</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {filteredUsers.map((u: any) => (
                  <button
                    key={u.user_id}
                    onClick={() => handleStartChat(u.user_id)}
                    disabled={startConversation.isPending}
                    className="flex items-center gap-3 p-3 rounded-2xl hover:bg-muted/40 transition-all cursor-pointer text-left w-full disabled:opacity-50"
                  >
                    <div className="w-11 h-11 rounded-full bg-gradient-to-b from-muted to-card flex items-center justify-center ring-1 ring-input text-lg shrink-0">
                      {u.avatar_emoji || "👤"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-primary truncate">{u.display_name}</span>
                        {u.verified && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" className="shrink-0 text-[hsl(217,91%,60%)]">
                            <title>Подтверждённый аккаунт</title>
                            <path fill="currentColor" fillRule="evenodd" d="M9.592 3.2a6 6 0 0 1-.495.399c-.298.2-.633.338-.985.408c-.153.03-.313.043-.632.068c-.801.064-1.202.096-1.536.214a2.71 2.71 0 0 0-1.655 1.655c-.118.334-.15.735-.214 1.536a6 6 0 0 1-.068.632c-.07.352-.208.687-.408.985c-.087.13-.191.252-.399.495c-.521.612-.782.918-.935 1.238c-.353.74-.353 1.6 0 2.34c.153.32.414.626.935 1.238c.208.243.312.365.399.495c.2.298.338.633.408.985c.03.153.043.313.068.632c.064.801.096 1.202.214 1.536a2.71 2.71 0 0 0 1.655 1.655c.334.118.735.15 1.536.214c.319.025.479.038.632.068c.352.07.687.209.985.408c.13.087.252.191.495.399c.612.521.918.782 1.238.935c.74.353 1.6.353 2.34 0c.32-.153.626-.414 1.238-.935c.243-.208.365-.312.495-.399c.298-.2.633-.338.985-.408c.153-.03.313-.043.632-.068c.801-.064 1.202-.096 1.536-.214a2.71 2.71 0 0 0 1.655-1.655c.118-.334.15-.735.214-1.536c.025-.319.038-.479.068-.632c.07-.352.209-.687.408-.985c.087-.13.191-.252.399-.495c.521-.612.782-.918.935-1.238c.353-.74.353-1.6 0-2.34c-.153-.32-.414-.626-.935-1.238a6 6 0 0 1-.399-.495a2.7 2.7 0 0 1-.408-.985a6 6 0 0 1-.068-.632c-.064-.801-.096-1.202-.214-1.536a2.71 2.71 0 0 0-1.655-1.655c-.334-.118-.735-.15-1.536-.214a6 6 0 0 1-.632-.068a2.7 2.7 0 0 1-.985-.408a6 6 0 0 1-.495-.399c-.612-.521-.918-.782-1.238-.935a2.71 2.71 0 0 0-2.34 0c-.32.153-.626.414-1.238.935m6.781 6.663a.814.814 0 0 0-1.15-1.15l-4.85 4.85l-1.596-1.595a.814.814 0 0 0-1.15 1.15l2.17 2.17a.814.814 0 0 0 1.15 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">@{u.username}</span>
                    </div>
                    <MessageCircle size={16} className="text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // Chat view
  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border shrink-0">
        <button onClick={() => setActiveConvId(null)} className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
          <ArrowLeft size={20} />
        </button>
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => activeConv?.otherUser && navigate(`/user/${activeConv.otherUser.user_id}`)}
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-b from-muted to-card flex items-center justify-center ring-1 ring-input text-sm">
            {activeConv?.otherUser?.avatar_emoji || "👤"}
          </div>
          <div>
            <span className="text-sm font-medium text-primary">{activeConv?.otherUser?.display_name || "Пользователь"}</span>
            <div className="text-xs text-muted-foreground">@{activeConv?.otherUser?.username}</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-2">
        {messages?.map((msg: any) => {
          const isMine = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                  isMine
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground ring-1 ring-input rounded-bl-md"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                <p className={`text-[10px] mt-1 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ru })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          <input
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            placeholder="Написать сообщение..."
            className="flex-1 bg-muted ring-1 ring-input rounded-2xl px-4 py-3 text-sm text-foreground outline-none focus:ring-primary/30 placeholder-muted-foreground"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            onClick={handleSend}
            disabled={!newMsg.trim() || sendMessage.isPending}
            className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
