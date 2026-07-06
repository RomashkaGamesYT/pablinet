import { useState } from "react";
import { useGiveaways, useCanCreateGiveaway, useCreateGiveaway, useDeleteGiveaway, usePickWinner } from "@/hooks/useGiveaways";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useAllProfiles } from "@/hooks/useAdmin";
import { Gift, Plus, Trash2, Trophy, Calendar, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";

export default function GiveawaysPage() {
  const { data: giveaways } = useGiveaways();
  const { data: canCreate } = useCanCreateGiveaway();
  const { data: isAdmin } = useIsAdmin();
  const { data: profiles } = useAllProfiles();
  const createGw = useCreateGiveaway();
  const delGw = useDeleteGiveaway();
  const pickWinner = usePickWinner();

  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [pickForId, setPickForId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!title.trim() || !description.trim() || !endsAt) return;
    try {
      await createGw.mutateAsync({ title: title.trim(), description: description.trim(), ends_at: new Date(endsAt).toISOString(), image });
      setTitle(""); setDescription(""); setEndsAt(""); setImage(null); setCreating(false);
      toast.success("Розыгрыш создан");
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-4">
      <div className="px-2 flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
          <Gift size={22} className="text-accent" /> Розыгрыши
        </h2>
        {canCreate && !creating && (
          <button onClick={() => setCreating(true)} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-accent text-accent-foreground hover:opacity-90 cursor-pointer">
            <Plus size={14} /> Новый
          </button>
        )}
      </div>

      {creating && (
        <div className="bg-card rounded-[24px] p-5 ring-1 ring-border space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Создать розыгрыш</h3>
            <button onClick={() => setCreating(false)} className="text-muted-foreground cursor-pointer"><X size={18} /></button>
          </div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название" className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm ring-1 ring-input focus:outline-none focus:ring-accent/50" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Описание" rows={3} className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm ring-1 ring-input focus:outline-none focus:ring-accent/50 resize-none" />
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Дата окончания</label>
            <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm ring-1 ring-input focus:outline-none focus:ring-accent/50" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Фото (опционально)</label>
            <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} className="text-sm" />
          </div>
          <button onClick={handleCreate} disabled={createGw.isPending} className="w-full py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 cursor-pointer">
            {createGw.isPending ? "Создание..." : "Опубликовать"}
          </button>
        </div>
      )}

      {(!giveaways || giveaways.length === 0) && !creating && (
        <div className="text-center py-16">
          <Gift size={40} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground text-sm">Пока розыгрышей нет</p>
          <p className="text-muted-foreground/60 text-xs mt-1">Розыгрыши устраивает @Cooling</p>
        </div>
      )}

      {giveaways?.map((gw: any) => {
        const ended = new Date(gw.ends_at) < new Date();
        const winnerProfile = gw.winner_user_id ? profiles?.find((p: any) => p.user_id === gw.winner_user_id) : null;
        return (
          <div key={gw.id} className="bg-card rounded-[24px] ring-1 ring-border overflow-hidden">
            {gw.image_url && (
              <img src={gw.image_url} alt={gw.title} className="w-full h-56 object-cover" />
            )}
            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold">{gw.title}</h3>
                {(canCreate || isAdmin) && (
                  <button onClick={() => confirm("Удалить розыгрыш?") && delGw.mutate(gw.id)} className="text-muted-foreground hover:text-destructive cursor-pointer">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{gw.description}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar size={14} />
                {ended ? "Завершён " : "Завершается "}
                {formatDistanceToNow(new Date(gw.ends_at), { locale: ru, addSuffix: true })}
              </div>

              {winnerProfile && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-accent/10 ring-1 ring-accent/20">
                  <Trophy size={16} className="text-accent" />
                  <span className="text-sm font-medium">Победитель: @{winnerProfile.username}</span>
                </div>
              )}

              {isAdmin && !winnerProfile && (
                <div>
                  {pickForId === gw.id ? (
                    <div className="space-y-2">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            pickWinner.mutate({ giveawayId: gw.id, winnerUserId: e.target.value });
                            setPickForId(null);
                          }
                        }}
                        defaultValue=""
                        className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm ring-1 ring-input focus:outline-none focus:ring-accent/50"
                      >
                        <option value="">Выбрать победителя...</option>
                        {profiles?.map((p: any) => (
                          <option key={p.user_id} value={p.user_id}>@{p.username} ({p.display_name})</option>
                        ))}
                      </select>
                      <button onClick={() => setPickForId(null)} className="text-xs text-muted-foreground cursor-pointer">Отмена</button>
                    </div>
                  ) : (
                    <button onClick={() => setPickForId(gw.id)} className="w-full py-2 rounded-xl bg-secondary text-sm font-medium hover:opacity-90 flex items-center justify-center gap-2 cursor-pointer">
                      <Trophy size={14} /> Выбрать победителя
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
