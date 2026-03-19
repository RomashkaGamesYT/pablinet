import { useEvents, useToggleEventRegistration } from "@/hooks/useEvents";
import { useAuth } from "@/contexts/AuthContext";
import { Star, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function EventsPage() {
  const { data: events, isLoading } = useEvents();
  const toggleRegistration = useToggleEventRegistration();
  const { user } = useAuth();

  return (
    <div className="animate-fade-in">
      <div className="px-2 mb-6">
        <h2 className="text-xl font-semibold tracking-tight text-primary">Ивенты</h2>
      </div>

      <div className="flex flex-col gap-4">
        {isLoading ? (
          <p className="text-muted-foreground text-sm text-center py-8">Загрузка...</p>
        ) : events?.filter((e: any) => e.active).length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">Пока нет активных ивентов</p>
        ) : (
          events?.map((event) => {
            const isRegistered = event.event_registrations?.some((r: any) => r.user_id === user?.id);
            const participantCount = event.event_registrations?.length || 0;

            return (
              <div key={event.id} className="relative bg-gradient-to-br from-net-cyan/10 to-net-emerald/10 rounded-3xl p-6 ring-1 ring-net-cyan/20 overflow-hidden group cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-net-cyan/5 to-net-emerald/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-net-cyan/20 text-net-cyan text-xs font-medium mb-4 ring-1 ring-net-cyan/30">
                    <Star size={14} />
                    {event.badge_text || "Регистрация открыта"}
                  </div>
                  <h3 className="text-lg font-semibold text-primary mb-2 tracking-tight">{event.title}</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-sm leading-relaxed">{event.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                      <Calendar size={16} />
                      {format(new Date(event.event_date), "d MMMM, HH:mm", { locale: ru })}
                      <span className="ml-2">· {participantCount} участн.</span>
                    </div>
                    <button
                      onClick={() => toggleRegistration.mutate(event.id)}
                      className={`px-4 py-2 rounded-full text-xs font-medium transition-all shadow-sm active:scale-95 ${
                        isRegistered
                          ? "bg-muted text-foreground ring-1 ring-input hover:bg-muted/80"
                          : "bg-primary text-primary-foreground hover:opacity-90"
                      }`}
                    >
                      {isRegistered ? "Вы участвуете ✓" : "Участвовать"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
