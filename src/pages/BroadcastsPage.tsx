import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useCanBroadcast,
  useActiveBroadcast,
  useBroadcasterProfile,
  useStartBroadcast,
  useStopBroadcast,
  useSendBroadcastMessage,
  useBroadcastMessages,
} from "@/hooks/useBroadcasts";
import { Radio, Send, StopCircle } from "lucide-react";

export default function BroadcastsPage() {
  const { user } = useAuth();
  const { data: canBroadcast } = useCanBroadcast();
  const { data: activeBroadcast } = useActiveBroadcast();
  const { data: broadcasterProfile } = useBroadcasterProfile(activeBroadcast?.user_id);
  const startBroadcast = useStartBroadcast();
  const stopBroadcast = useStopBroadcast();
  const sendMessage = useSendBroadcastMessage();
  const messages = useBroadcastMessages(activeBroadcast?.id);

  const [title, setTitle] = useState("");
  const [messageText, setMessageText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const isBroadcaster = activeBroadcast?.user_id === user?.id;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleStart = () => {
    if (!title.trim()) return;
    startBroadcast.mutate(title.trim());
    setTitle("");
  };

  const handleStop = () => {
    if (activeBroadcast) stopBroadcast.mutate(activeBroadcast.id);
  };

  const handleSend = () => {
    if (!messageText.trim() || !activeBroadcast || !isBroadcaster) return;
    sendMessage.mutate({ broadcastId: activeBroadcast.id, content: messageText.trim() });
    setMessageText("");
  };

  return (
    <div className="animate-fade-in">
      <div className="px-2 mb-6">
        <h2 className="text-xl font-semibold tracking-tight text-primary">Трансляции</h2>
      </div>

      {/* Start broadcast controls (only for allowed users) */}
      {canBroadcast && !activeBroadcast && (
        <div className="bg-card rounded-3xl p-6 ring-1 ring-border mb-6">
          <p className="text-sm text-muted-foreground mb-4">Запустить текстовую трансляцию</p>
          <div className="flex gap-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Название трансляции..."
              className="flex-1 bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground ring-1 ring-input focus:outline-none focus:ring-primary/50"
              onKeyDown={(e) => e.key === "Enter" && handleStart()}
            />
            <button
              onClick={handleStart}
              disabled={!title.trim() || startBroadcast.isPending}
              className="px-5 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium flex items-center gap-2 hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              <Radio size={16} />
              В эфир
            </button>
          </div>
        </div>
      )}

      {/* Active broadcast */}
      {activeBroadcast ? (
        <div className="bg-card rounded-3xl ring-1 ring-border overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-primary">{activeBroadcast.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {broadcasterProfile?.avatar_emoji} {broadcasterProfile?.display_name || "Стример"}
                </p>
              </div>
            </div>
            {isBroadcaster && (
              <button
                onClick={handleStop}
                className="px-4 py-2 rounded-xl bg-destructive/10 text-destructive text-xs font-medium flex items-center gap-1.5 hover:bg-destructive/20 transition-colors"
              >
                <StopCircle size={14} />
                Завершить
              </button>
            )}
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="h-[400px] overflow-y-auto px-6 py-4 space-y-3">
            {messages.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-12">Трансляция началась. Ожидаем сообщения...</p>
            ) : (
              messages.map((msg: any) => (
                <div key={msg.id} className="text-sm text-foreground leading-relaxed bg-muted/50 rounded-xl px-4 py-3 ring-1 ring-input/50">
                  {msg.content}
                </div>
              ))
            )}
          </div>

          {/* Send message (broadcaster only) */}
          {isBroadcaster && (
            <div className="px-6 py-4 border-t border-border">
              <div className="flex gap-3">
                <input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Написать в эфир..."
                  className="flex-1 bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground ring-1 ring-input focus:outline-none focus:ring-primary/50"
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <button
                  onClick={handleSend}
                  disabled={!messageText.trim() || sendMessage.isPending}
                  className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        !canBroadcast && (
          <div className="text-center py-16">
            <Radio size={40} className="mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-sm">Сейчас нет активных трансляций</p>
            <p className="text-muted-foreground/60 text-xs mt-1">Заходи позже — трансляции запускают @net и @Cooling</p>
          </div>
        )
      )}
    </div>
  );
}
