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
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 text-destructive">
            <Heart size={18} fill="currentColor" />
          </div>
        );
      case "follow":
        return (
          <div className="w-10 h-10 rounded-full bg-net-cyan/10 flex items-center justify-center shrink-0 text-net-cyan">
            <UserPlus size={18} />
          </div>
        );
      case "comment":
        return (
          <div className="w-10 h-10 rounded-full bg-net-emerald/10 flex items-center justify-center shrink-0 text-net-emerald">
            <MessageCircle size={18} />
          </div>
        );
      case "mention":
        return (
          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0 text-accent">
            <AtSign size={18} />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
            <Heart size={18} />
          </div>
        );
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
      <div className="px-3 mb-4">
        <h2 className="text-xl font-semibold tracking-tight text-primary">🔔 Уведомления</h2>
      </div>

      <div className="flex flex-col gap-2 px-3">
        {isLoading ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <div className="text-3xl animate-pulse">🔔</div>
            <p className="text-muted-foreground text-sm">Загрузка...</p>
          </div>
        ) : notifications?.length === 0 ? (
          <div className="rounded-[35px] bg-card/60 backdrop-blur-md ring-1 ring-border/50 p-8 flex flex-col items-center gap-3">
            <div className="text-4xl">😴</div>
            <p className="text-muted-foreground text-sm">Нет уведомлений</p>
            <p className="text-muted-foreground/60 text-xs text-center">Когда кто-то оценит запись или подпишется — вы увидите это тут</p>
          </div>
        ) : (
          notifications?.map((n: any) => (
            <div
              key={n.id}
              onClick={() => {
                if (n.actor_id) navigate(`/user/${n.actor_id}`);
              }}
              className={`flex items-center gap-3 p-4 rounded-[24px] backdrop-blur-md transition-all duration-300 cursor-pointer group ${
                !n.read
                  ? "bg-card/70 ring-1 ring-border/60 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.3)]"
                  : "bg-card/40 ring-1 ring-border/30 hover:bg-card/60"
              }`}
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full bg-muted ring-1 ring-border flex items-center justify-center overflow-hidden">
                  {n.actor?.avatar_emoji ? (
                    <span className="text-lg">{n.actor.avatar_emoji}</span>
                  ) : (
                    <span className="text-lg">🐊</span>
                  )}
                </div>
              </div>
              {/* Icon */}
              {getIcon(n.type)}
              <div className="flex-1 min-w-0">
                <div className="text-sm text-foreground/80 group-hover:text-foreground transition-colors">{getText(n)}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
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
