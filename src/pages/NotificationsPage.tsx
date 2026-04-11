import { useNotifications, useMarkNotificationsRead } from "@/hooks/useNotifications";
import { Heart, UserPlus, MessageCircle, AtSign, User } from "lucide-react";
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
        return <Heart size={16} fill="currentColor" className="text-pink-500" />;
      case "follow":
        return <UserPlus size={16} className="text-accent" />;
      case "comment":
        return <MessageCircle size={16} className="text-blue-500" />;
      case "mention":
        return <AtSign size={16} className="text-accent" />;
      default:
        return <Heart size={16} />;
    }
  };

  const getText = (n: any) => {
    const actor = n.actor as any;
    const name = actor?.display_name || "Кто-то";
    switch (n.type) {
      case "like": return (<><span className="font-medium text-foreground">{name}</span> оценил(а) вашу статью</>);
      case "follow": return (<><span className="font-medium text-foreground">{name}</span> подписался на вас</>);
      case "comment": return (<><span className="font-medium text-foreground">{name}</span> оставил(а) комментарий</>);
      case "mention": return (<><span className="font-medium text-foreground">{name}</span> отметил(а) вас!</>);
      default: return "Новое уведомление";
    }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-4">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">Уведомления</h2>

      {isLoading ? (
        <div className="text-center text-muted-foreground text-sm py-8">Загрузка...</div>
      ) : notifications?.length === 0 ? (
        <div className="bg-card rounded-[24px] border border-border p-8 text-center">
          <p className="text-muted-foreground text-sm">Нет уведомлений</p>
          <p className="text-muted-foreground/60 text-xs mt-1">Когда кто-то оценит статью или подпишется — вы увидите это тут</p>
        </div>
      ) : (
        notifications?.map((n: any) => (
          <div
            key={n.id}
            onClick={() => n.actor_id && navigate(`/user/${n.actor_id}`)}
            className={`flex items-center gap-3 p-4 rounded-[24px] border transition-colors duration-300 cursor-pointer ${
              !n.read
                ? "bg-card border-border shadow-sm"
                : "bg-card/50 border-border/50 hover:bg-card"
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
              {n.actor?.logo_url ? (
                <img src={n.actor.logo_url} alt="" className="w-full h-full object-cover rounded-full" />
              ) : (
                <User size={20} className="text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {getIcon(n.type)}
                <span className="text-sm text-muted-foreground">{getText(n)}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ru })}
              </div>
            </div>
            {!n.read && (
              <div className="w-2 h-2 rounded-full bg-accent shrink-0" />
            )}
          </div>
        ))
      )}
    </div>
  );
}
