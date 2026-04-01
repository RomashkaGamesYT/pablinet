import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useFollowStats, useUpdateProfile } from "@/hooks/useProfile";
import { usePosts } from "@/hooks/usePosts";
import { useUserBadges } from "@/hooks/useAdmin";
import { useProfileAssetUpload } from "@/hooks/useProfileAssets";
import { Calendar, Settings, Smile, Trash2, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import EmojiPicker from "@/components/EmojiPicker";
import FollowListModal from "@/components/FollowListModal";
import BadgeDisplay from "@/components/BadgeDisplay";
import VerifiedBadge from "@/components/VerifiedBadge";
import PostCard from "@/components/PostCard";
import VerificationRequestDialog from "@/components/VerificationRequestDialog";
import { useRef } from "react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const { data: stats } = useFollowStats();
  const { data: allPosts } = usePosts();
  const { data: userBadges } = useUserBadges(user?.id);
  const updateProfile = useUpdateProfile();
  const { uploadAsset, removeAsset } = useProfileAssetUpload();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editEmoji, setEditEmoji] = useState("");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "likes">("posts");
  const [followListType, setFollowListType] = useState<"followers" | "following" | null>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [showVerification, setShowVerification] = useState(false);

  if (isLoading) {
    return <div className="text-muted-foreground text-sm text-center py-8">Загрузка...</div>;
  }

  const myPosts = allPosts?.filter((p: any) => p.user_id === user?.id) || [];
  const likedPosts = allPosts?.filter((p: any) => p.likes?.some((l: any) => l.user_id === user?.id)) || [];

  const startEdit = () => {
    setEditName(profile?.display_name || "");
    setEditBio(profile?.bio || "");
    setEditEmoji(profile?.avatar_emoji || "🐊");
    setEditing(true);
  };

  const saveEdit = async () => {
    await updateProfile.mutateAsync({
      display_name: editName,
      bio: editBio,
      avatar_emoji: editEmoji,
    });
    setEditing(false);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadAsset(file, "banner");
    } catch {
      toast.error("Ошибка загрузки баннера");
    }
  };

  const handleBannerRemove = async () => {
    try {
      await removeAsset("banner");
    } catch {
      toast.error("Ошибка удаления баннера");
    }
  };

  const sortedMyPosts = [...myPosts].sort((a: any, b: any) => {
    if (a.pinned_in_profile && !b.pinned_in_profile) return -1;
    if (!a.pinned_in_profile && b.pinned_in_profile) return 1;
    return 0;
  });

  const displayPosts = activeTab === "posts" ? sortedMyPosts : likedPosts;

  return (
    <div className="animate-fade-in">
      {/* Banner & Avatar */}
      <div className="relative w-full mb-14">
        <div className="relative bg-gradient-to-br from-muted to-card rounded-[35px] w-full ring-1 ring-border overflow-hidden" style={{ aspectRatio: "736/335" }}>
          {(profile as any)?.banner_url ? (
            <img src={(profile as any).banner_url} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none" style={{
              backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')"
            }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
          {/* Banner action buttons */}
          <div className="absolute top-3 right-3 flex gap-2 z-10">
            <button
              onClick={() => bannerInputRef.current?.click()}
              className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <Smile size={16} />
            </button>
            {(profile as any)?.banner_url && (
              <button
                onClick={handleBannerRemove}
                className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
        </div>

        <div className="absolute -bottom-10 left-6 z-20">
          <div className="relative group/avatar cursor-pointer" onClick={editing ? undefined : startEdit}>
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-b from-muted to-card rounded-full flex items-center justify-center ring-4 ring-background shadow-xl relative z-10 overflow-hidden transition-transform duration-300 group-hover/avatar:scale-105">
              <div className="ring-inset ring-input ring-1 rounded-full absolute inset-0" />
              {(profile as any)?.logo_url ? (
                <img src={(profile as any).logo_url} alt="Logo" className="w-full h-full object-cover rounded-full relative z-10" />
              ) : (
                <span className="text-2xl sm:text-3xl drop-shadow-md relative z-10">{profile?.avatar_emoji || "🐊"}</span>
              )}
            </div>
            <div className="absolute bottom-0.5 right-0.5 sm:bottom-1 sm:right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-net-emerald rounded-full border-[3px] border-background shadow-[0_0_8px_rgba(16,185,129,0.4)] z-20" />
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-2 mb-6">
        {editing ? (
          <div className="space-y-3 bg-card rounded-[35px] p-4 sm:p-5 ring-1 ring-border">
            <div className="flex items-start gap-3">
              <EmojiPicker
                value={editEmoji}
                onChange={setEditEmoji}
                isOpen={emojiPickerOpen}
                onToggle={() => setEmojiPickerOpen(!emojiPickerOpen)}
              />
              <div className="flex-1 space-y-3">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Ваше имя"
                  className="w-full bg-muted ring-1 ring-input rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:ring-primary/30"
                />
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="О себе..."
                  className="w-full bg-muted ring-1 ring-input rounded-xl px-4 py-2.5 text-sm text-foreground outline-none resize-none h-16 focus:ring-primary/30"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={saveEdit} disabled={updateProfile.isPending} className="bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 cursor-pointer">
                Сохранить
              </button>
              <button onClick={() => setEditing(false)} className="bg-muted text-foreground px-5 py-2 rounded-full text-sm font-medium ring-1 ring-input hover:bg-muted/80 transition-all cursor-pointer">
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight text-primary">
                    {profile?.display_name}
                  </h1>
                  {profile?.verified && <VerifiedBadge size={18} />}
                  {userBadges && <BadgeDisplay badges={userBadges as any} size="md" />}
                </div>
                <span className="text-sm text-muted-foreground font-medium">@{profile?.username}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!profile?.verified && (
                  <button
                    onClick={() => setShowVerification(true)}
                    className="bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-2 rounded-full text-xs font-medium transition-all duration-200 active:scale-95 cursor-pointer ring-1 ring-border flex items-center gap-1.5"
                    title="Подать заявку на верификацию"
                  >
                    <ShieldCheck size={14} />
                    <span className="hidden sm:inline">Верификация</span>
                  </button>
                )}
                <button
                  onClick={startEdit}
                  className="bg-primary hover:opacity-90 text-primary-foreground px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 active:scale-95 cursor-pointer"
                >
                  Редактировать
                </button>
              </div>
            </div>

            {profile?.bio && (
              <p className="text-sm text-foreground/70 mt-3 leading-relaxed">{profile.bio}</p>
            )}

            <div className="flex flex-col gap-3 mt-4">
              <div className="flex items-center gap-5 text-sm">
                <button onClick={() => setFollowListType("followers")} className="flex items-center gap-1.5 cursor-pointer group">
                  <span className="text-primary font-bold">{stats?.followers || 0}</span>
                  <span className="text-muted-foreground group-hover:text-foreground/70 transition-colors">подписчиков</span>
                </button>
                <button onClick={() => setFollowListType("following")} className="flex items-center gap-1.5 cursor-pointer group">
                  <span className="text-primary font-bold">{stats?.following || 0}</span>
                  <span className="text-muted-foreground group-hover:text-foreground/70 transition-colors">подписок</span>
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Calendar size={16} className="opacity-80" />
                <span className="font-medium opacity-80">
                  Регистрация: {profile?.created_at ? format(new Date(profile.created_at), "LLLL yyyy 'г.'", { locale: ru }) : ""}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Tabs: Posts / Likes */}
      {!editing && (
        <>
          <div className="flex border-b border-border mb-4">
            <button
              onClick={() => setActiveTab("posts")}
              className={`flex-1 py-3 text-sm font-medium text-center transition-colors relative cursor-pointer ${
                activeTab === "posts" ? "text-primary" : "text-muted-foreground hover:text-foreground/70"
              }`}
            >
              Посты
              {activeTab === "posts" && <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full" />}
            </button>
            <button
              onClick={() => setActiveTab("likes")}
              className={`flex-1 py-3 text-sm font-medium text-center transition-colors relative cursor-pointer ${
                activeTab === "likes" ? "text-primary" : "text-muted-foreground hover:text-foreground/70"
              }`}
            >
              Лайки
              {activeTab === "likes" && <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full" />}
            </button>
          </div>

          <div className="flex flex-col">
            {displayPosts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-3xl mb-3">{activeTab === "posts" ? "📝" : "❤️"}</div>
                <p className="text-muted-foreground text-sm">
                  {activeTab === "posts" ? "Пока нет записей" : "Нет понравившихся записей"}
                </p>
              </div>
            ) : (
              displayPosts.map((post: any) => (
                <PostCard key={post.id} post={post} context="profile" />
              ))
            )}
          </div>
        </>
      )}
      {followListType && user && (
        <FollowListModal userId={user.id} type={followListType} onClose={() => setFollowListType(null)} />
      )}
      <VerificationRequestDialog open={showVerification} onClose={() => setShowVerification(false)} />
    </div>
  );
}
