import { useNotifications, useMarkNotificationsRead } from "@/hooks/useNotifications";
import { Heart, UserPlus, MessageCircle, AtSign } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function NotificationsPage() {
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationsRead();
  const navigate = useNavigate();

  useEffect(() => {
    if (notifications && notifications.some((n: any) => !n.read)) {
      markRead.mutate();
    }
  }, [notifications]);

  const getIcon = (type: string) => {
    switch (type) {
      case "like":
        return (
          <div className="w-11 h-11 rounded-2xl bg-destructive/10 flex items-center justify-center shrink-0 text-destructive ring-1 ring-destructive/20">
            <Heart size={20} fill="currentColor" />
          </div>
        );
      case "follow":
        return (
          <div className="w-11 h-11 rounded-2xl bg-net-cyan/10 flex items-center justify-center shrink-0 text-net-cyan ring-1 ring-net-cyan/20">
            <UserPlus size={20} />
          </div>
        );
      case "comment":
        return (
          <div className="w-11 h-11 rounded-2xl bg-net-emerald/10 flex items-center justify-center shrink-0 text-net-emerald ring-1 ring-net-emerald/20">
            <MessageCircle size={20} />
          </div>
        );
      case "mention":
        return (
          <div className="w-11 h-11 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0 text-accent ring-1 ring-accent/20">
            <AtSign size={20} />
          </div>
        );
      default:
        return (
          <div className="w-11 h-11 rounded-2xl bg-muted flex items-center justify-center shrink-0 text-muted-foreground ring-1 ring-input">
            <Heart size={20} />
          </div>
        );
    }
  };

  const getEmoji = (type: string) => {
    switch (type) {
      case "like": return "❤️";
      case "follow": return "🤝";
      case "comment": return "💬";
      case "mention": return "📢";
      default: return "🔔";
    }
  };

  const getText = (n: any) => {
    const actor = n.actor as any;
    const name = actor?.display_name || "Кто-то";
    switch (n.type) {
      case "like":
        return (<><span className="font-semibold text-primary">{name}</span> оценил(а) вашу запись</>);
      case "follow":
        return (<><span className="font-semibold text-primary">{name}</span> подписался на вас</>);
      case "comment":
        return (<><span className="font-semibold text-primary">{name}</span> оставил(а) комментарий</>);
      case "mention":
        return (<><span className="font-semibold text-primary">{name}</span> отметил(а) вас!</>);
      default:
        return "Новое уведомление";
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="px-2 mb-6">
        <h2 className="text-xl font-semibold tracking-tight text-primary">🔔 Уведомления</h2>
      </div>

      <div className="flex flex-col gap-2">
        {isLoading ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <div className="text-3xl animate-pulse">🔔</div>
            <p className="text-muted-foreground text-sm">Загрузка...</p>
          </div>
        ) : notifications?.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <div className="text-4xl">😴</div>
            <p className="text-muted-foreground text-sm">Нет уведомлений</p>
            <p className="text-muted-foreground/60 text-xs">Когда кто-то оценит запись или подпишется — вы увидите это тут</p>
          </div>
        ) : (
          notifications?.map((n: any) => (
            <div
              key={n.id}
              onClick={() => {
                if (n.type === "follow" && n.actor_id) navigate(`/user/${n.actor_id}`);
                else if (n.actor_id) navigate(`/user/${n.actor_id}`);
              }}
              className={`flex items-center gap-4 p-4 rounded-[20px] hover:bg-muted/80 transition-all duration-200 cursor-pointer group ${
                !n.read ? "bg-card ring-1 ring-border" : ""
              }`}
            >
              {/* Avatar of actor */}
              <div className="relative">
                <div className="w-11 h-11 rounded-full bg-muted ring-1 ring-border flex items-center justify-center shrink-0 overflow-hidden">
                  {n.actor?.avatar_emoji ? (
                    <span className="text-lg">{n.actor.avatar_emoji}</span>
                  ) : (
                    <span className="text-lg">🐊</span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 text-xs">{getEmoji(n.type)}</div>
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="text-sm text-foreground/80 group-hover:text-foreground transition-colors">{getText(n)}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ru })}
                </div>
              </div>
              {!n.read && (
                <div className="w-2 h-2 rounded-full bg-net-cyan shrink-0 shadow-[0_0_6px_rgba(34,211,238,0.5)]" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
