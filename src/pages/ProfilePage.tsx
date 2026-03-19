import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useFollowStats, useUpdateProfile } from "@/hooks/useProfile";
import { usePosts } from "@/hooks/usePosts";
import { Calendar, Palette, Heart, MessageCircle, Share2, Settings, MapPin, Link as LinkIcon } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { useState } from "react";

export default function ProfilePage() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const { data: stats } = useFollowStats();
  const { data: allPosts } = usePosts();
  const updateProfile = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editEmoji, setEditEmoji] = useState("");
  const [activeTab, setActiveTab] = useState<"posts" | "likes">("posts");

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

  const displayPosts = activeTab === "posts" ? myPosts : likedPosts;

  return (
    <div className="animate-fade-in">
      {/* Banner & Avatar */}
      <div className="relative w-full mb-14">
        <div className="relative bg-gradient-to-br from-[#1c1c1e] to-card h-48 sm:h-56 rounded-3xl w-full ring-1 ring-border overflow-hidden group">
          <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none" style={{
            backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')"
          }} />
          <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
          <button className="absolute bottom-4 right-4 bg-black/40 hover:bg-black/60 backdrop-blur-md p-2.5 rounded-full text-foreground/70 hover:text-primary transition-all duration-300 ring-1 ring-input opacity-0 group-hover:opacity-100 hover:scale-105 shadow-md">
            <Palette size={18} />
          </button>
        </div>

        <div className="absolute -bottom-10 left-6 z-20">
          <div className="relative group/avatar cursor-pointer" onClick={editing ? undefined : startEdit}>
            <div className="w-24 h-24 bg-gradient-to-b from-[#1c1c1e] to-card rounded-full flex items-center justify-center ring-4 ring-background shadow-xl relative z-10 overflow-hidden transition-transform duration-300 group-hover/avatar:scale-105">
              <div className="ring-inset ring-input ring-1 rounded-full absolute inset-0" />
              <span className="text-3xl drop-shadow-md relative z-10">{profile?.avatar_emoji || "🐊"}</span>
            </div>
            <div className="absolute bottom-1 right-1 w-4 h-4 bg-net-emerald rounded-full border-[3px] border-background shadow-[0_0_8px_rgba(16,185,129,0.4)] z-20" />
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-2 mb-6">
        {editing ? (
          <div className="space-y-3 bg-card rounded-3xl p-5 ring-1 ring-border">
            <div className="flex items-center gap-3">
              <div className="text-center">
                <label className="text-xs text-muted-foreground block mb-1">Аватар</label>
                <input
                  value={editEmoji}
                  onChange={(e) => setEditEmoji(e.target.value)}
                  className="w-16 bg-muted ring-1 ring-input rounded-xl px-2 py-2 text-2xl text-center outline-none focus:ring-primary/30"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground block mb-1">Имя</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Ваше имя"
                  className="w-full bg-muted ring-1 ring-input rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:ring-primary/30"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">О себе</label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Расскажите о себе..."
                className="w-full bg-muted ring-1 ring-input rounded-xl px-4 py-2.5 text-sm text-foreground outline-none resize-none h-20 focus:ring-primary/30"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={saveEdit} disabled={updateProfile.isPending} className="bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-all active:scale-95 disabled:opacity-50">
                Сохранить
              </button>
              <button onClick={() => setEditing(false)} className="bg-muted text-foreground px-5 py-2 rounded-full text-sm font-medium ring-1 ring-input hover:bg-muted/80 transition-all">
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h1 className="text-xl font-semibold tracking-tight text-primary flex items-center gap-2">
                  {profile?.display_name}
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" className="shrink-0 drop-shadow-[0_2px_6px_rgba(0,128,255,0.35)] text-primary" aria-label="Подтверждённый аккаунт">
                    <path fill="currentColor" fillRule="evenodd" d="M9.592 3.2a6 6 0 0 1-.495.399c-.298.2-.633.338-.985.408c-.153.03-.313.043-.632.068c-.801.064-1.202.096-1.536.214a2.71 2.71 0 0 0-1.655 1.655c-.118.334-.15.735-.214 1.536a6 6 0 0 1-.068.632c-.07.352-.208.687-.408.985c-.087.13-.191.252-.399.495c-.521.612-.782.918-.935 1.238c-.353.74-.353 1.6 0 2.34c.153.32.414.626.935 1.238c.208.243.312.365.399.495c.2.298.338.633.408.985c.03.153.043.313.068.632c.064.801.096 1.202.214 1.536a2.71 2.71 0 0 0 1.655 1.655c.334.118.735.15 1.536.214c.319.025.479.038.632.068c.352.07.687.209.985.408c.13.087.252.191.495.399c.612.521.918.782 1.238.935c.74.353 1.6.353 2.34 0c.32-.153.626-.414 1.238-.935c.243-.208.365-.312.495-.399c.298-.2.633-.338.985-.408c.153-.03.313-.043.632-.068c.801-.064 1.202-.096 1.536-.214a2.71 2.71 0 0 0 1.655-1.655c.118-.334.15-.735.214-1.536c.025-.319.038-.479.068-.632c.07-.352.209-.687.408-.985c.087-.13.191-.252.399-.495c.521-.612.782-.918.935-1.238c.353-.74.353-1.6 0-2.34c-.153-.32-.414-.626-.935-1.238a6 6 0 0 1-.399-.495a2.7 2.7 0 0 1-.408-.985a6 6 0 0 1-.068-.632c-.064-.801-.096-1.202-.214-1.536a2.71 2.71 0 0 0-1.655-1.655c-.334-.118-.735-.15-1.536-.214a6 6 0 0 1-.632-.068a2.7 2.7 0 0 1-.985-.408a6 6 0 0 1-.495-.399c-.612-.521-.918-.782-1.238-.935a2.71 2.71 0 0 0-2.34 0c-.32.153-.626.414-1.238.935m6.781 6.663a.814.814 0 0 0-1.15-1.15l-4.85 4.85l-1.596-1.595a.814.814 0 0 0-1.15 1.15l2.17 2.17a.814.814 0 0 0 1.15 0z" clipRule="evenodd" />
                  </svg>
                </h1>
                <span className="text-sm text-muted-foreground font-medium">@{profile?.username}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 mt-0.5">
                <button
                  onClick={startEdit}
                  className="bg-primary hover:opacity-90 text-primary-foreground px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 active:scale-95 shadow-[0_2px_8px_rgba(255,255,255,0.15)] ring-1 ring-inset ring-black/5"
                >
                  Редактировать
                </button>
              </div>
            </div>

            {profile?.bio && (
              <p className="text-sm text-foreground/70 mt-3 leading-relaxed">{profile.bio}</p>
            )}

            <div className="flex flex-col gap-3 mt-4">
              <div className="flex items-center gap-6 text-sm">
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
              className={`flex-1 py-3 text-sm font-medium text-center transition-colors relative ${
                activeTab === "posts" ? "text-primary" : "text-muted-foreground hover:text-foreground/70"
              }`}
            >
              Записи
              {activeTab === "posts" && <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full" />}
            </button>
            <button
              onClick={() => setActiveTab("likes")}
              className={`flex-1 py-3 text-sm font-medium text-center transition-colors relative ${
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
              displayPosts.map((post: any) => {
                const postProfile = post.profile;
                const likesCount = post.likes?.length || 0;
                const isLiked = post.likes?.some((l: any) => l.user_id === user?.id);

                return (
                  <div key={post.id} className="bg-card/50 rounded-3xl p-5 ring-1 ring-border transition-colors hover:bg-card/80">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-net-cyan/20 to-net-emerald/20 flex items-center justify-center ring-1 ring-input">
                        <span className="text-sm">{postProfile?.avatar_emoji || profile?.avatar_emoji || "🐊"}</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-primary tracking-tight">{postProfile?.display_name || profile?.display_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ru })}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>
                    <div className="flex items-center gap-6 pt-4 border-t border-border">
                      <button className={`flex items-center gap-2 transition-colors ${isLiked ? "text-destructive" : "text-muted-foreground"}`}>
                        <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                        <span className="text-xs font-medium">{likesCount}</span>
                      </button>
                      <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                        <MessageCircle size={18} />
                        <span className="text-xs font-medium">0</span>
                      </button>
                      <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors ml-auto">
                        <Share2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
