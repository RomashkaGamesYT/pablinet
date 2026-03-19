import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useConversations, useMessages, useSendMessage, useMarkAsRead } from "@/hooks/useMessages";
import { ArrowLeft, Send, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

export default function MessagesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: conversations, isLoading } = useConversations();
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const { data: messages } = useMessages(activeConvId || undefined);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkAsRead();
  const [newMsg, setNewMsg] = useState("");
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

  // Conversation list view
  if (!activeConvId) {
    return (
      <div className="animate-fade-in">
        <div className="px-2 mb-6">
          <h2 className="text-xl font-semibold tracking-tight text-primary">Сообщения</h2>
        </div>

        {isLoading ? (
          <div className="text-muted-foreground text-sm text-center py-8">Загрузка...</div>
        ) : !conversations || conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <MessageCircle size={40} className="text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">Нет сообщений</p>
            <p className="text-muted-foreground/60 text-xs">Напишите кому-нибудь с его профиля</p>
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
