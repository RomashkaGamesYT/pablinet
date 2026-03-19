import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBadges, useAllProfiles, useAllUserBadges } from "@/hooks/useAdmin";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Upload, Award, Users, ArrowLeft, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminPage() {
  const { data: badges, isLoading: badgesLoading } = useBadges();
  const { data: profiles } = useAllProfiles();
  const { data: allUserBadges } = useAllUserBadges();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"badges" | "assign">("badges");
  const [creating, setCreating] = useState(false);
  const [badgeName, setBadgeName] = useState("");
  const [badgeDesc, setBadgeDesc] = useState("");
  const [gifFile, setGifFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [assignBadgeId, setAssignBadgeId] = useState("");
  const [assignUserId, setAssignUserId] = useState("");

  const handleCreateBadge = async () => {
    if (!badgeName || !badgeDesc || !gifFile) return;
    setUploading(true);
    try {
      const ext = gifFile.name.split(".").pop();
      const filePath = `${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("badges")
        .upload(filePath, gifFile);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("badges").getPublicUrl(filePath);

      const { error } = await supabase.from("badges").insert({
        name: badgeName,
        description: badgeDesc,
        icon_url: publicUrl,
      });
      if (error) throw error;

      setBadgeName("");
      setBadgeDesc("");
      setGifFile(null);
      setCreating(false);
      queryClient.invalidateQueries({ queryKey: ["badges"] });
    } catch (err: any) {
      alert("Ошибка: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteBadge = async (id: string) => {
    if (!confirm("Удалить бейдж?")) return;
    await supabase.from("user_badges").delete().eq("badge_id", id);
    await supabase.from("badges").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["badges"] });
    queryClient.invalidateQueries({ queryKey: ["user-badges"] });
    queryClient.invalidateQueries({ queryKey: ["all-user-badges"] });
  };

  const handleAssignBadge = async () => {
    if (!assignBadgeId || !assignUserId) return;
    const { error } = await supabase.from("user_badges").insert({
      user_id: assignUserId,
      badge_id: assignBadgeId,
    });
    if (error) {
      alert(error.message.includes("duplicate") ? "Бейдж уже назначен" : error.message);
      return;
    }
    setAssignBadgeId("");
    setAssignUserId("");
    queryClient.invalidateQueries({ queryKey: ["user-badges"] });
    queryClient.invalidateQueries({ queryKey: ["all-user-badges"] });
  };

  const handleRemoveUserBadge = async (userId: string, badgeId: string) => {
    await supabase.from("user_badges").delete().eq("user_id", userId).eq("badge_id", badgeId);
    queryClient.invalidateQueries({ queryKey: ["user-badges"] });
    queryClient.invalidateQueries({ queryKey: ["all-user-badges"] });
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 px-2 mb-6">
        <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-semibold tracking-tight text-primary">Админка</h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-6">
        <button
          onClick={() => setActiveTab("badges")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${activeTab === "badges" ? "text-primary" : "text-muted-foreground"}`}
        >
          <Award size={16} /> Бейджи
          {activeTab === "badges" && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />}
        </button>
        <button
          onClick={() => setActiveTab("assign")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${activeTab === "assign" ? "text-primary" : "text-muted-foreground"}`}
        >
          <Users size={16} /> Назначить
          {activeTab === "assign" && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />}
        </button>
      </div>

      {activeTab === "badges" && (
        <div className="space-y-4">
          {!creating ? (
            <button
              onClick={() => setCreating(true)}
              className="w-full bg-card/80 rounded-2xl p-4 ring-1 ring-border text-sm text-muted-foreground hover:text-primary hover:ring-primary/20 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={18} /> Создать бейдж
            </button>
          ) : (
            <div className="bg-card rounded-2xl p-5 ring-1 ring-border space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-primary">Новый бейдж</h3>
                <button onClick={() => setCreating(false)} className="text-muted-foreground hover:text-primary">
                  <X size={16} />
                </button>
              </div>
              <input
                value={badgeName}
                onChange={(e) => setBadgeName(e.target.value)}
                placeholder="Название (напр. Пережил аномалию дизайна)"
                className="w-full bg-muted ring-1 ring-input rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:ring-primary/30 placeholder-muted-foreground"
              />
              <input
                value={badgeDesc}
                onChange={(e) => setBadgeDesc(e.target.value)}
                placeholder="Описание (при наведении)"
                className="w-full bg-muted ring-1 ring-input rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:ring-primary/30 placeholder-muted-foreground"
              />
              <div>
                <label className="flex items-center gap-2 cursor-pointer bg-muted ring-1 ring-input rounded-xl px-4 py-2.5 text-sm text-muted-foreground hover:ring-primary/30 transition-all">
                  <Upload size={16} />
                  {gifFile ? gifFile.name : "Загрузить GIF/PNG"}
                  <input type="file" accept="image/gif,image/png,image/webp" className="hidden" onChange={(e) => setGifFile(e.target.files?.[0] || null)} />
                </label>
                {gifFile && (
                  <div className="mt-2 flex items-center gap-2">
                    <img src={URL.createObjectURL(gifFile)} alt="preview" className="w-8 h-8 rounded object-contain bg-muted" />
                    <span className="text-xs text-muted-foreground">{gifFile.name}</span>
                  </div>
                )}
              </div>
              <button
                onClick={handleCreateBadge}
                disabled={!badgeName || !badgeDesc || !gifFile || uploading}
                className="bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
              >
                {uploading ? "Загрузка..." : "Создать"}
              </button>
            </div>
          )}

          {/* Badge list */}
          <div className="space-y-2">
            {badgesLoading ? (
              <p className="text-muted-foreground text-sm text-center py-4">Загрузка...</p>
            ) : badges?.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Нет бейджей</p>
            ) : (
              badges?.map((badge) => (
                <div key={badge.id} className="flex items-center gap-3 bg-card/50 rounded-2xl p-4 ring-1 ring-border">
                  <img src={badge.icon_url} alt={badge.name} className="w-8 h-8 rounded object-contain" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary truncate">{badge.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{badge.description}</p>
                  </div>
                  <button onClick={() => handleDeleteBadge(badge.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "assign" && (
        <div className="space-y-4">
          <div className="bg-card rounded-2xl p-5 ring-1 ring-border space-y-3">
            <h3 className="text-sm font-medium text-primary">Назначить бейдж пользователю</h3>
            <select
              value={assignBadgeId}
              onChange={(e) => setAssignBadgeId(e.target.value)}
              className="w-full bg-muted ring-1 ring-input rounded-xl px-4 py-2.5 text-sm text-foreground outline-none"
            >
              <option value="">Выберите бейдж</option>
              {badges?.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <select
              value={assignUserId}
              onChange={(e) => setAssignUserId(e.target.value)}
              className="w-full bg-muted ring-1 ring-input rounded-xl px-4 py-2.5 text-sm text-foreground outline-none"
            >
              <option value="">Выберите пользователя</option>
              {profiles?.map((p) => (
                <option key={p.user_id} value={p.user_id}>{p.display_name} (@{p.username})</option>
              ))}
            </select>
            <button
              onClick={handleAssignBadge}
              disabled={!assignBadgeId || !assignUserId}
              className="bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
            >
              Назначить
            </button>
          </div>

          {/* Current assignments */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-tight px-1">Текущие назначения</h3>
            {allUserBadges?.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Нет назначений</p>
            ) : (
              allUserBadges?.map((ub: any) => {
                const userProfile = profiles?.find((p) => p.user_id === ub.user_id);
                return (
                  <div key={ub.user_id + "-" + ub.badge?.id} className="flex items-center gap-3 bg-card/50 rounded-2xl p-3 ring-1 ring-border">
                    <img src={ub.badge?.icon_url} alt="" className="w-6 h-6 rounded object-contain" />
                    <span className="text-sm text-foreground flex-1">{userProfile?.display_name || "?"} — {ub.badge?.name}</span>
                    <button onClick={() => handleRemoveUserBadge(ub.user_id, ub.badge?.id)} className="text-muted-foreground hover:text-destructive">
                      <X size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
