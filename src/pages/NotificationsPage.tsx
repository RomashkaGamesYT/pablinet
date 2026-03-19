import { useNotifications, useMarkNotificationsRead } from "@/hooks/useNotifications";
import { Heart, UserPlus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { useEffect } from "react";

export default function NotificationsPage() {
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationsRead();

  useEffect(() => {
    if (notifications && notifications.some((n: any) => !n.read)) {
      markRead.mutate();
    }
  }, [notifications]);

  const getIcon = (type: string) => {
    switch (type) {
      case "like":
        return (
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 text-destructive ring-1 ring-destructive/20">
            <Heart size={20} />
          </div>
        );
      case "follow":
        return (
          <div className="w-10 h-10 rounded-full bg-net-cyan/10 flex items-center justify-center shrink-0 text-net-cyan ring-1 ring-net-cyan/20">
            <UserPlus size={20} />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0 text-muted-foreground ring-1 ring-input">
            <Heart size={20} />
          </div>
        );
    }
  };

  const getText = (n: any) => {
    const actor = n.actor as any;
    const name = actor?.display_name || "Кто-то";
    switch (n.type) {
      case "like":
        return (<><span className="font-medium text-primary">{name}</span> оценил(а) вашу запись</>);
      case "follow":
        return (<><span className="font-medium text-primary">{name}</span> подписался на вас</>);
      case "mention":
        return (<><span className="font-medium text-primary">{name}</span> упомянул(а) вас</>);
      default:
        return "Новое уведомление";
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="px-2 mb-6">
        <h2 className="text-xl font-semibold tracking-tight text-primary">Уведомления</h2>
      </div>

      <div className="flex flex-col gap-1">
        {isLoading ? (
          <p className="text-muted-foreground text-sm text-center py-8">Загрузка...</p>
        ) : notifications?.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">Нет уведомлений</p>
        ) : (
          notifications?.map((n: any) => (
            <div key={n.id} className={`flex items-start gap-4 p-4 rounded-2xl hover:bg-muted transition-colors cursor-pointer ${!n.read ? "bg-muted/50" : ""}`}>
              {getIcon(n.type)}
              <div className="pt-0.5">
                <div className="text-sm text-foreground/80">{getText(n)}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ru })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
