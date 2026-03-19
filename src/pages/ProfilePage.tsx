import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useFollowStats, useUpdateProfile } from "@/hooks/useProfile";
import { usePosts } from "@/hooks/usePosts";
import { useUserBadges } from "@/hooks/useAdmin";
import { Calendar, Palette } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useState } from "react";
import EmojiPicker from "@/components/EmojiPicker";
import FollowListModal from "@/components/FollowListModal";
import BadgeDisplay from "@/components/BadgeDisplay";
import PostCard from "@/components/PostCard";

export default function ProfilePage() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const { data: stats } = useFollowStats();
  const { data: allPosts } = usePosts();
  const { data: userBadges } = useUserBadges(user?.id);
  const updateProfile = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editEmoji, setEditEmoji] = useState("");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "likes">("posts");
  const [followListType, setFollowListType] = useState<"followers" | "following" | null>(null);

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

  // Sort: pinned_in_profile first for "posts" tab
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
        <div className="relative bg-gradient-to-br from-[#1c1c1e] to-card h-40 sm:h-56 rounded-3xl w-full ring-1 ring-border overflow-hidden group">
          <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none" style={{
            backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')"
          }} />
          <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
          <button className="absolute bottom-4 right-4 bg-black/40 hover:bg-black/60 backdrop-blur-md p-2.5 rounded-full text-foreground/70 hover:text-primary transition-all duration-300 ring-1 ring-input opacity-0 group-hover:opacity-100 hover:scale-105 shadow-md cursor-pointer">
            <Palette size={18} />
          </button>
        </div>

        <div className="absolute -bottom-10 left-6 z-20">
          <div className="relative group/avatar cursor-pointer" onClick={editing ? undefined : startEdit}>
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-b from-[#1c1c1e] to-card rounded-full flex items-center justify-center ring-4 ring-background shadow-xl relative z-10 overflow-hidden transition-transform duration-300 group-hover/avatar:scale-105">
              <div className="ring-inset ring-input ring-1 rounded-full absolute inset-0" />
              <span className="text-2xl sm:text-3xl drop-shadow-md relative z-10">{profile?.avatar_emoji || "🐊"}</span>
            </div>
            <div className="absolute bottom-0.5 right-0.5 sm:bottom-1 sm:right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-net-emerald rounded-full border-[3px] border-background shadow-[0_0_8px_rgba(16,185,129,0.4)] z-20" />
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-2 mb-6">
        {editing ? (
          <div className="space-y-3 bg-card rounded-3xl p-4 sm:p-5 ring-1 ring-border">
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
                  <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-primary">
                    {profile?.display_name}
                  </h1>
                  {profile?.verified && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" className="shrink-0 drop-shadow-[0_2px_6px_rgba(59,130,246,0.5)] text-[hsl(217,91%,60%)]" aria-label="Подтверждённый аккаунт">
                      <path fill="currentColor" fillRule="evenodd" d="M9.592 3.2a6 6 0 0 1-.495.399c-.298.2-.633.338-.985.408c-.153.03-.313.043-.632.068c-.801.064-1.202.096-1.536.214a2.71 2.71 0 0 0-1.655 1.655c-.118.334-.15.735-.214 1.536a6 6 0 0 1-.068.632c-.07.352-.208.687-.408.985c-.087.13-.191.252-.399.495c-.521.612-.782.918-.935 1.238c-.353.74-.353 1.6 0 2.34c.153.32.414.626.935 1.238c.208.243.312.365.399.495c.2.298.338.633.408.985c.03.153.043.313.068.632c.064.801.096 1.202.214 1.536a2.71 2.71 0 0 0 1.655 1.655c.334.118.735.15 1.536.214c.319.025.479.038.632.068c.352.07.687.209.985.408c.13.087.252.191.495.399c.612.521.918.782 1.238.935c.74.353 1.6.353 2.34 0c.32-.153.626-.414 1.238-.935c.243-.208.365-.312.495-.399c.298-.2.633-.338.985-.408c.153-.03.313-.043.632-.068c.801-.064 1.202-.096 1.536-.214a2.71 2.71 0 0 0 1.655-1.655c.118-.334.15-.735.214-1.536c.025-.319.038-.479.068-.632c.07-.352.209-.687.408-.985c.087-.13.191-.252.399-.495c.521-.612.782-.918.935-1.238c.353-.74.353-1.6 0-2.34c-.153-.32-.414-.626-.935-1.238a6 6 0 0 1-.399-.495a2.7 2.7 0 0 1-.408-.985a6 6 0 0 1-.068-.632c-.064-.801-.096-1.202-.214-1.536a2.71 2.71 0 0 0-1.655-1.655c-.334-.118-.735-.15-1.536-.214a6 6 0 0 1-.632-.068a2.7 2.7 0 0 1-.985-.408a6 6 0 0 1-.495-.399c-.612-.521-.918-.782-1.238-.935a2.71 2.71 0 0 0-2.34 0c-.32.153-.626.414-1.238.935m6.781 6.663a.814.814 0 0 0-1.15-1.15l-4.85 4.85l-1.596-1.595a.814.814 0 0 0-1.15 1.15l2.17 2.17a.814.814 0 0 0 1.15 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {userBadges && <BadgeDisplay badges={userBadges as any} size="md" />}
                </div>
                <span className="text-sm text-muted-foreground font-medium">@{profile?.username}</span>
              </div>
              <button
                onClick={startEdit}
                className="bg-primary hover:opacity-90 text-primary-foreground px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 active:scale-95 shadow-[0_2px_8px_rgba(255,255,255,0.15)] ring-1 ring-inset ring-black/5 shrink-0 cursor-pointer"
              >
                Редактировать
              </button>
            </div>

            {profile?.bio && (
              <p className="text-sm text-foreground/70 mt-3 leading-relaxed">{profile.bio}</p>
            )}

            <div className="flex flex-col gap-3 mt-4">
              <div className="flex items-center gap-5 text-sm">
                <div className="flex items-center gap-1.5 cursor-pointer group">
                  <span className="text-primary font-semibold">{stats?.followers || 0}</span>
                  <span className="text-muted-foreground group-hover:text-foreground/70 transition-colors">подписчиков</span>
                </div>
                <div className="flex items-center gap-1.5 cursor-pointer group">
                  <span className="text-primary font-semibold">{stats?.following || 0}</span>
                  <span className="text-muted-foreground group-hover:text-foreground/70 transition-colors">подписок</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Calendar size={16} className="opacity-80" />
                <span className="font-medium opacity-80">
                  Регистрация: {profile?.created_at ? format(new Date(profile.created_at), "LLLL yyyy", { locale: ru }) : ""}
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
              Записи
              {activeTab === "posts" && <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full" />}
            </button>
            <button
              onClick={() => setActiveTab("likes")}
              className={`flex-1 py-3 text-sm font-medium text-center transition-colors relative cursor-pointer ${
                activeTab === "likes" ? "text-primary" : "text-muted-foreground hover:text-foreground/70"
              }`}
            >
              Нравится
              {activeTab === "likes" && <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full" />}
            </button>
          </div>

          <div className="flex flex-col gap-4">
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
    </div>
  );
}
