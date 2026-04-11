import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBadges, useAllProfiles, useAllUserBadges } from "@/hooks/useAdmin";
import { useEvents } from "@/hooks/useEvents";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Upload, Award, Users, ArrowLeft, X, Shield, CheckCircle, Calendar, Play, Pause, MessageCircle, Check, XCircle, Crown, Edit2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";

export default function AdminPage() {
  const { data: badges, isLoading: badgesLoading } = useBadges();
  const { data: profiles } = useAllProfiles();
  const { data: allUserBadges } = useAllUserBadges();
  const { data: events } = useEvents();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"badges" | "assign" | "verify" | "events" | "tg-verify" | "pepe-plus">("badges");
  const [creating, setCreating] = useState(false);
  const [badgeName, setBadgeName] = useState("");
  const [badgeDesc, setBadgeDesc] = useState("");
  const [gifFile, setGifFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [assignBadgeId, setAssignBadgeId] = useState("");
  const [assignUserId, setAssignUserId] = useState("");

  // Badge editing state
  const [editingBadgeId, setEditingBadgeId] = useState<string | null>(null);
  const [editBadgeName, setEditBadgeName] = useState("");
  const [editBadgeDesc, setEditBadgeDesc] = useState("");

  // Event creation state
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventBadgeText, setEventBadgeText] = useState("");

  const handleCreateBadge = async () => {
    if (!badgeName || !badgeDesc || !gifFile) return;
    setUploading(true);
    try {
      const ext = gifFile.name.split(".").pop();
      const filePath = `${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("badges").upload(filePath, gifFile);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("badges").getPublicUrl(filePath);
      const { error } = await supabase.from("badges").insert({ name: badgeName, description: badgeDesc, icon_url: publicUrl });
      if (error) throw error;
      setBadgeName(""); setBadgeDesc(""); setGifFile(null); setCreating(false);
      queryClient.invalidateQueries({ queryKey: ["badges"] });
      toast.success("Бейдж создан");
    } catch (err: any) { toast.error("Ошибка: " + err.message); } finally { setUploading(false); }
  };

  const handleEditBadge = async (badgeId: string) => {
    if (!editBadgeName || !editBadgeDesc) return;
    try {
      const { error } = await supabase.from("badges").update({
        name: editBadgeName,
        description: editBadgeDesc,
      } as any).eq("id", badgeId);
      if (error) throw error;
      setEditingBadgeId(null);
      queryClient.invalidateQueries({ queryKey: ["badges"] });
      toast.success("Бейдж обновлён");
    } catch (err: any) { toast.error("Ошибка: " + err.message); }
  };

  const handleDeleteBadge = async (id: string) => {
    if (!confirm("Удалить бейдж?")) return;
    await supabase.from("user_badges").delete().eq("badge_id", id);
    await supabase.from("badges").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["badges"] });
    queryClient.invalidateQueries({ queryKey: ["all-user-badges"] });
    toast.success("Бейдж удалён");
  };

  const handleAssignBadge = async () => {
    if (!assignBadgeId || !assignUserId) return;
    const { error } = await supabase.from("user_badges").insert({ user_id: assignUserId, badge_id: assignBadgeId });
    if (error) { toast.error(error.message.includes("duplicate") ? "Бейдж уже назначен" : error.message); return; }
    setAssignBadgeId(""); setAssignUserId("");
    queryClient.invalidateQueries({ queryKey: ["user-badges"] });
    queryClient.invalidateQueries({ queryKey: ["all-user-badges"] });
    toast.success("Бейдж назначен");
  };

  const handleRemoveUserBadge = async (userId: string, badgeId: string) => {
    await supabase.from("user_badges").delete().eq("user_id", userId).eq("badge_id", badgeId);
    queryClient.invalidateQueries({ queryKey: ["user-badges"] });
    queryClient.invalidateQueries({ queryKey: ["all-user-badges"] });
  };

  const handleToggleVerify = async (userId: string, currentVerified: boolean) => {
    await supabase.from("profiles").update({ verified: !currentVerified } as any).eq("user_id", userId);
    queryClient.invalidateQueries({ queryKey: ["all-profiles"] });
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    toast.success(currentVerified ? "Верификация снята" : "Пользователь верифицирован");
  };

  const handleTogglePepePlus = async (userId: string, current: boolean) => {
    await supabase.from("profiles").update({ has_pepe_plus: !current } as any).eq("user_id", userId);
    queryClient.invalidateQueries({ queryKey: ["all-profiles"] });
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    toast.success(current ? "Pepe+ отключен" : "Pepe+ активирован!");
  };

  const handleCreateEvent = async () => {
    if (!eventTitle || !eventDate) return;
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("events").insert({
        title: eventTitle,
        description: eventDesc || null,
        event_date: eventDate,
        badge_text: eventBadgeText || "Регистрация открыта",
        created_by: user.id,
        active: false,
      } as any);
      if (error) throw error;
      setEventTitle(""); setEventDesc(""); setEventDate(""); setEventBadgeText(""); setCreatingEvent(false);
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Ивент создан");
    } catch (err: any) { toast.error("Ошибка: " + err.message); } finally { setUploading(false); }
  };

  const handleToggleEventActive = async (eventId: string, currentActive: boolean) => {
    await supabase.from("events").update({ active: !currentActive } as any).eq("id", eventId);
    queryClient.invalidateQueries({ queryKey: ["events"] });
    toast.success(currentActive ? "Ивент остановлен" : "Ивент запущен!");
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Удалить ивент?")) return;
    await supabase.from("event_registrations").delete().eq("event_id", id);
    await supabase.from("events").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["events"] });
    toast.success("Ивент удалён");
  };

  // Verification requests
  const { data: verificationRequests, isLoading: vrLoading } = useQuery({
    queryKey: ["verification-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("verification_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const [processingVR, setProcessingVR] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleVerifyAction = async (requestId: string, action: "approve" | "reject", reason?: string) => {
    setProcessingVR(requestId);
    try {
      const { error } = await supabase.functions.invoke("verify-blogger", {
        body: { requestId, action, rejectionReason: reason || undefined },
      });
      if (error) throw error;
      toast.success(action === "approve" ? "Заявка одобрена" : "Заявка отклонена");
      queryClient.invalidateQueries({ queryKey: ["verification-requests"] });
      setRejectingId(null);
      setRejectionReason("");
    } catch (err: any) {
      toast.error("Ошибка: " + err.message);
    } finally {
      setProcessingVR(null);
    }
  };

  const inputClass = "w-full bg-secondary border border-border rounded-2xl px-4 py-2.5 text-sm text-foreground outline-none focus:border-accent/50 placeholder-muted-foreground transition-colors";

  const tabs = [
    { key: "badges" as const, label: "Бейджи", icon: <Award size={16} /> },
    { key: "assign" as const, label: "Назначить", icon: <Users size={16} /> },
    { key: "pepe-plus" as const, label: "Pepe+", icon: <Crown size={16} /> },
    { key: "verify" as const, label: "Верификация", icon: <Shield size={16} /> },
    { key: "tg-verify" as const, label: "TG Заявки", icon: <MessageCircle size={16} /> },
    { key: "events" as const, label: "Ивенты", icon: <Calendar size={16} /> },
  ];

  return (
    <div className="animate-fade-in flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Админка</h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap cursor-pointer ${activeTab === tab.key ? "text-foreground" : "text-muted-foreground"}`}
          >
            {tab.icon} {tab.label}
            {activeTab === tab.key && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-accent rounded-full" />}
          </button>
        ))}
      </div>

      {/* BADGES TAB */}
      {activeTab === "badges" && (
        <div className="space-y-4">
          {!creating ? (
            <button onClick={() => setCreating(true)} className="w-full bg-card rounded-2xl p-4 border border-border text-sm text-muted-foreground hover:text-foreground hover:border-accent/30 transition-all flex items-center justify-center gap-2 cursor-pointer">
              <Plus size={18} /> Создать бейдж
            </button>
          ) : (
            <div className="bg-card rounded-2xl p-5 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">Новый бейдж</h3>
                <button onClick={() => setCreating(false)} className="text-muted-foreground hover:text-foreground cursor-pointer"><X size={16} /></button>
              </div>
              <input value={badgeName} onChange={(e) => setBadgeName(e.target.value)} placeholder="Название" className={inputClass} />
              <input value={badgeDesc} onChange={(e) => setBadgeDesc(e.target.value)} placeholder="Описание (при наведении)" className={inputClass} />
              <label className="flex items-center gap-2 cursor-pointer bg-secondary border border-border rounded-2xl px-4 py-2.5 text-sm text-muted-foreground hover:border-accent/30 transition-all">
                <Upload size={16} /> {gifFile ? gifFile.name : "Загрузить GIF/PNG"}
                <input type="file" accept="image/gif,image/png,image/webp" className="hidden" onChange={(e) => setGifFile(e.target.files?.[0] || null)} />
              </label>
              {gifFile && (
                <div className="flex items-center gap-2">
                  <img src={URL.createObjectURL(gifFile)} alt="preview" className="w-8 h-8 rounded object-contain bg-secondary" />
                  <span className="text-xs text-muted-foreground">{gifFile.name}</span>
                </div>
              )}
              <button onClick={handleCreateBadge} disabled={!badgeName || !badgeDesc || !gifFile || uploading} className="bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer">
                {uploading ? "Загрузка..." : "Создать"}
              </button>
            </div>
          )}
          <div className="space-y-2">
            {badgesLoading ? <p className="text-muted-foreground text-sm text-center py-4">Загрузка...</p> : badges?.length === 0 ? <p className="text-muted-foreground text-sm text-center py-4">Нет бейджей</p> : badges?.map((badge) => (
              <div key={badge.id} className="flex items-center gap-3 bg-card rounded-2xl p-4 border border-border">
                <img src={badge.icon_url} alt={badge.name} className="w-8 h-8 rounded object-contain" />
                {editingBadgeId === badge.id ? (
                  <div className="flex-1 space-y-2">
                    <input value={editBadgeName} onChange={(e) => setEditBadgeName(e.target.value)} className={inputClass} />
                    <input value={editBadgeDesc} onChange={(e) => setEditBadgeDesc(e.target.value)} className={inputClass} />
                    <div className="flex gap-2">
                      <button onClick={() => handleEditBadge(badge.id)} className="bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-90">Сохранить</button>
                      <button onClick={() => setEditingBadgeId(null)} className="text-muted-foreground text-xs cursor-pointer hover:text-foreground">Отмена</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{badge.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{badge.description}</p>
                    </div>
                    <button onClick={() => { setEditingBadgeId(badge.id); setEditBadgeName(badge.name); setEditBadgeDesc(badge.description); }} className="text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer"><Edit2 size={14} /></button>
                    <button onClick={() => handleDeleteBadge(badge.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0 cursor-pointer"><Trash2 size={14} /></button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ASSIGN TAB */}
      {activeTab === "assign" && (
        <div className="space-y-4">
          <div className="bg-card rounded-2xl p-5 border border-border space-y-3">
            <h3 className="text-sm font-medium text-foreground">Назначить бейдж</h3>
            <select value={assignBadgeId} onChange={(e) => setAssignBadgeId(e.target.value)} className={inputClass + " cursor-pointer"}>
              <option value="">Выберите бейдж</option>
              {badges?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select value={assignUserId} onChange={(e) => setAssignUserId(e.target.value)} className={inputClass + " cursor-pointer"}>
              <option value="">Выберите пользователя</option>
              {profiles?.map((p) => <option key={p.user_id} value={p.user_id}>{p.display_name} (@{p.username})</option>)}
            </select>
            <button onClick={handleAssignBadge} disabled={!assignBadgeId || !assignUserId} className="bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer">Назначить</button>
          </div>
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-tight px-1">Текущие назначения</h3>
            {allUserBadges?.length === 0 ? <p className="text-muted-foreground text-sm text-center py-4">Нет назначений</p> : allUserBadges?.map((ub: any) => {
              const userProfile = profiles?.find((p) => p.user_id === ub.user_id);
              return (
                <div key={ub.user_id + "-" + ub.badge?.id} className="flex items-center gap-3 bg-card rounded-2xl p-3 border border-border">
                  <img src={ub.badge?.icon_url} alt="" className="w-6 h-6 rounded object-contain" />
                  <span className="text-sm text-foreground flex-1">{userProfile?.display_name || "?"} — {ub.badge?.name}</span>
                  <button onClick={() => handleRemoveUserBadge(ub.user_id, ub.badge?.id)} className="text-muted-foreground hover:text-destructive cursor-pointer"><X size={14} /></button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PEPE+ TAB */}
      {activeTab === "pepe-plus" && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-accent/10 to-accent/5 rounded-2xl p-5 border border-accent/20">
            <div className="flex items-center gap-3 mb-3">
              <Crown size={24} className="text-accent" />
              <div>
                <h3 className="text-base font-semibold text-foreground">Pepe+ Подписка</h3>
                <p className="text-xs text-muted-foreground">Тестовый режим · Выдача вручную</p>
              </div>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>✅ Тестирование ЛС</p>
              <p>✅ Тестирование Эфира</p>
              <p>✅ Градиентный ник (зелёный)</p>
              <p>✅ Бейдж Pepe-96</p>
            </div>
          </div>

          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-tight px-1">Управление подписками</h3>
          {profiles?.map((p) => (
            <div key={p.user_id} className="flex items-center gap-3 bg-card rounded-2xl p-4 border border-border">
              <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                {(p as any).logo_url ? (
                  <img src={(p as any).logo_url} alt="" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span className="text-sm">{p.avatar_emoji}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-sm font-medium truncate ${(p as any).has_pepe_plus ? "gradient-name" : "text-foreground"}`}>{p.display_name}</span>
                  {(p as any).has_pepe_plus && <Crown size={14} className="text-accent shrink-0" />}
                </div>
                <span className="text-xs text-muted-foreground">@{p.username}</span>
              </div>
              <button
                onClick={() => handleTogglePepePlus(p.user_id, (p as any).has_pepe_plus)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  (p as any).has_pepe_plus
                    ? "bg-accent/10 text-accent border border-accent/20 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
                    : "bg-primary text-primary-foreground hover:opacity-90"
                }`}
              >
                {(p as any).has_pepe_plus ? "Отключить" : "Выдать Pepe+"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* VERIFY TAB */}
      {activeTab === "verify" && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-tight px-1 mb-3">Верификация пользователей</h3>
          {profiles?.map((p) => (
            <div key={p.user_id} className="flex items-center gap-3 bg-card rounded-2xl p-4 border border-border">
              <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                {(p as any).logo_url ? (
                  <img src={(p as any).logo_url} alt="" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span className="text-sm">{p.avatar_emoji}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-foreground truncate">{p.display_name}</span>
                  {p.verified && <CheckCircle size={14} className="text-accent shrink-0" />}
                </div>
                <span className="text-xs text-muted-foreground">@{p.username}</span>
              </div>
              <button
                onClick={() => handleToggleVerify(p.user_id, p.verified)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${p.verified ? "bg-secondary text-muted-foreground border border-border hover:text-destructive" : "bg-primary text-primary-foreground hover:opacity-90"}`}
              >
                {p.verified ? "Снять ✓" : "Верифицировать"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* EVENTS TAB */}
      {activeTab === "events" && (
        <div className="space-y-4">
          {!creatingEvent ? (
            <button onClick={() => setCreatingEvent(true)} className="w-full bg-card rounded-2xl p-4 border border-border text-sm text-muted-foreground hover:text-foreground hover:border-accent/30 transition-all flex items-center justify-center gap-2 cursor-pointer">
              <Plus size={18} /> Создать ивент
            </button>
          ) : (
            <div className="bg-card rounded-2xl p-5 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">Новый ивент</h3>
                <button onClick={() => setCreatingEvent(false)} className="text-muted-foreground hover:text-foreground cursor-pointer"><X size={16} /></button>
              </div>
              <input value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="Название ивента" className={inputClass} />
              <textarea value={eventDesc} onChange={(e) => setEventDesc(e.target.value)} placeholder="Описание" className={inputClass + " resize-none h-20"} />
              <input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className={inputClass} />
              <input value={eventBadgeText} onChange={(e) => setEventBadgeText(e.target.value)} placeholder="Текст бейджа (по умолчанию: Регистрация открыта)" className={inputClass} />
              <button onClick={handleCreateEvent} disabled={!eventTitle || !eventDate || uploading} className="bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer">
                {uploading ? "Создание..." : "Создать"}
              </button>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-tight px-1">Все ивенты</h3>
            {events?.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Нет ивентов</p>
            ) : (
              events?.map((event: any) => (
                <div key={event.id} className={`bg-card rounded-2xl p-4 border ${event.active ? "border-accent/30" : "border-border"} space-y-2`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${event.active ? "bg-accent" : "bg-muted-foreground/40"}`} />
                      <h4 className="text-sm font-medium text-foreground truncate">{event.title}</h4>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => handleToggleEventActive(event.id, event.active)} className={`p-2 rounded-full transition-all cursor-pointer ${event.active ? "text-accent hover:bg-accent/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
                        {event.active ? <Pause size={16} /> : <Play size={16} />}
                      </button>
                      <button onClick={() => handleDeleteEvent(event.id)} className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  {event.description && <p className="text-xs text-muted-foreground line-clamp-2">{event.description}</p>}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {format(new Date(event.event_date), "d MMM yyyy, HH:mm", { locale: ru })}</span>
                    <span>{event.event_registrations?.length || 0} участн.</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${event.active ? "bg-accent/20 text-accent" : "bg-secondary text-muted-foreground"}`}>
                      {event.active ? "Активен" : "Не запущен"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TG VERIFY TAB */}
      {activeTab === "tg-verify" && (
        <div className="space-y-4">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-tight px-1 mb-3">Заявки из Telegram</h3>
          {vrLoading ? (
            <p className="text-muted-foreground text-sm text-center py-4">Загрузка...</p>
          ) : !verificationRequests?.length ? (
            <p className="text-muted-foreground text-sm text-center py-8">Нет заявок</p>
          ) : (
            <div className="space-y-2">
              {verificationRequests.map((vr: any) => (
                <div key={vr.id} className="bg-card rounded-2xl p-4 border border-border space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">@{vr.site_username}</p>
                      <p className="text-xs text-muted-foreground">
                        TG: {vr.telegram_username ? `@${vr.telegram_username}` : `ID ${vr.telegram_chat_id}`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(vr.created_at), "d MMM yyyy, HH:mm", { locale: ru })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {vr.status === "pending" ? (
                        <>
                          <button onClick={() => handleVerifyAction(vr.id, "approve")} disabled={processingVR === vr.id} className="p-2 rounded-full bg-accent/10 text-accent hover:bg-accent/20 transition-all cursor-pointer disabled:opacity-50"><Check size={16} /></button>
                          <button onClick={() => setRejectingId(rejectingId === vr.id ? null : vr.id)} disabled={processingVR === vr.id} className="p-2 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all cursor-pointer disabled:opacity-50"><XCircle size={16} /></button>
                        </>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${vr.status === "approved" ? "bg-accent/20 text-accent" : "bg-destructive/20 text-destructive"}`}>
                          {vr.status === "approved" ? "Одобрено ✓" : "Отклонено"}
                        </span>
                      )}
                    </div>
                  </div>
                  {rejectingId === vr.id && (
                    <div className="flex gap-2 pt-1">
                      <input
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Причина отклонения..."
                        className={inputClass + " flex-1"}
                        onKeyDown={(e) => e.key === "Enter" && handleVerifyAction(vr.id, "reject", rejectionReason)}
                      />
                      <button onClick={() => handleVerifyAction(vr.id, "reject", rejectionReason)} disabled={processingVR === vr.id} className="px-4 py-2 rounded-2xl bg-destructive text-destructive-foreground text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer">
                        Отклонить
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
