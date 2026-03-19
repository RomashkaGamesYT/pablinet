import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useFollowStats } from "@/hooks/useProfile";
import { useFollow, useIsFollowing } from "@/hooks/useFollow";
import { usePosts } from "@/hooks/usePosts";
import { useUserBadges } from "@/hooks/useAdmin";
import { Calendar, ArrowLeft, MessageCircle } from "lucide-react";
import { useStartConversation } from "@/hooks/useMessages";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useState } from "react";
import BadgeDisplay from "@/components/BadgeDisplay";
import PostCard from "@/components/PostCard";
import FollowListModal from "@/components/FollowListModal";

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile(userId);
  const { data: stats } = useFollowStats(userId);
  const { data: allPosts } = usePosts();
  const { data: userBadges } = useUserBadges(userId);
  const { data: isFollowing, isLoading: followLoading } = useIsFollowing(userId);
  const follow = useFollow();
  const [followListType, setFollowListType] = useState<"followers" | "following" | null>(null);

  const isOwnProfile = user?.id === userId;

  if (isOwnProfile) {
    navigate("/profile", { replace: true });
    return null;
  }

  if (isLoading) {
    return <div className="text-muted-foreground text-sm text-center py-8">Загрузка...</div>;
  }

  if (!profile) {
    return <div className="text-muted-foreground text-sm text-center py-8">Пользователь не найден</div>;
  }

  const userPosts = allPosts?.filter((p: any) => p.user_id === userId) || [];
  const sortedPosts = [...userPosts].sort((a: any, b: any) => {
    if (a.pinned_in_profile && !b.pinned_in_profile) return -1;
    if (!a.pinned_in_profile && b.pinned_in_profile) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const handleFollowToggle = () => {
    if (!userId) return;
    follow.mutate({ targetUserId: userId, isFollowing: !!isFollowing });
  };

  return (
    <div className="animate-fade-in">
      {/* Back button */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-primary text-sm mb-4 transition-colors cursor-pointer">
        <ArrowLeft size={18} />
        Назад
      </button>

      {/* Banner & Avatar */}
      <div className="relative w-full mb-14">
        <div className="relative bg-gradient-to-br from-[#1c1c1e] to-card h-40 sm:h-56 rounded-3xl w-full ring-1 ring-border overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none" style={{
            backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')"
          }} />
          <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
        </div>

        <div className="absolute -bottom-10 left-6 z-20">
          <div className="relative">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-b from-[#1c1c1e] to-card rounded-full flex items-center justify-center ring-4 ring-background shadow-xl relative z-10 overflow-hidden">
              <div className="ring-inset ring-input ring-1 rounded-full absolute inset-0" />
              <span className="text-2xl sm:text-3xl drop-shadow-md relative z-10">{profile.avatar_emoji || "🐊"}</span>
            </div>
            <div className="absolute bottom-0.5 right-0.5 sm:bottom-1 sm:right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-net-emerald rounded-full border-[3px] border-background shadow-[0_0_8px_rgba(16,185,129,0.4)] z-20" />
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-2 mb-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-primary">
                {profile.display_name}
              </h1>
              {profile.verified && (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" className="shrink-0 drop-shadow-[0_2px_6px_rgba(59,130,246,0.5)] text-[hsl(217,91%,60%)]" aria-label="Подтверждённый аккаунт">
                  <path fill="currentColor" fillRule="evenodd" d="M9.592 3.2a6 6 0 0 1-.495.399c-.298.2-.633.338-.985.408c-.153.03-.313.043-.632.068c-.801.064-1.202.096-1.536.214a2.71 2.71 0 0 0-1.655 1.655c-.118.334-.15.735-.214 1.536a6 6 0 0 1-.068.632c-.07.352-.208.687-.408.985c-.087.13-.191.252-.399.495c-.521.612-.782.918-.935 1.238c-.353.74-.353 1.6 0 2.34c.153.32.414.626.935 1.238c.208.243.312.365.399.495c.2.298.338.633.408.985c.03.153.043.313.068.632c.064.801.096 1.202.214 1.536a2.71 2.71 0 0 0 1.655 1.655c.334.118.735.15 1.536.214c.319.025.479.038.632.068c.352.07.687.209.985.408c.13.087.252.191.495.399c.612.521.918.782 1.238.935c.74.353 1.6.353 2.34 0c.32-.153.626-.414 1.238-.935c.243-.208.365-.312.495-.399c.298-.2.633-.338.985-.408c.153-.03.313-.043.632-.068c.801-.064 1.202-.096 1.536-.214a2.71 2.71 0 0 0 1.655-1.655c.118-.334.15-.735.214-1.536c.025-.319.038-.479.068-.632c.07-.352.209-.687.408-.985c.087-.13.191-.252.399-.495c.521-.612.782-.918.935-1.238c.353-.74.353-1.6 0-2.34c-.153-.32-.414-.626-.935-1.238a6 6 0 0 1-.399-.495a2.7 2.7 0 0 1-.408-.985a6 6 0 0 1-.068-.632c-.064-.801-.096-1.202-.214-1.536a2.71 2.71 0 0 0-1.655-1.655c-.334-.118-.735-.15-1.536-.214a6 6 0 0 1-.632-.068a2.7 2.7 0 0 1-.985-.408a6 6 0 0 1-.495-.399c-.612-.521-.918-.782-1.238-.935a2.71 2.71 0 0 0-2.34 0c-.32.153-.626.414-1.238.935m6.781 6.663a.814.814 0 0 0-1.15-1.15l-4.85 4.85l-1.596-1.595a.814.814 0 0 0-1.15 1.15l2.17 2.17a.814.814 0 0 0 1.15 0z" clipRule="evenodd" />
                </svg>
              )}
              {userBadges && <BadgeDisplay badges={userBadges as any} size="md" />}
            </div>
            <span className="text-sm text-muted-foreground font-medium">@{profile.username}</span>
          </div>
          <button
            onClick={handleFollowToggle}
            disabled={follow.isPending || followLoading}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 active:scale-95 shrink-0 cursor-pointer disabled:opacity-50 ${
              isFollowing
                ? "bg-muted text-foreground ring-1 ring-input hover:ring-destructive hover:text-destructive"
                : "bg-primary text-primary-foreground hover:opacity-90 shadow-[0_2px_8px_rgba(255,255,255,0.15)] ring-1 ring-inset ring-black/5"
            }`}
          >
            {isFollowing ? "Отписаться" : "Подписаться"}
          </button>
        </div>

        {profile.bio && (
          <p className="text-sm text-foreground/70 mt-3 leading-relaxed">{profile.bio}</p>
        )}

        <div className="flex flex-col gap-3 mt-4">
          <div className="flex items-center gap-5 text-sm">
            <button onClick={() => setFollowListType("followers")} className="flex items-center gap-1.5 cursor-pointer group">
              <span className="text-primary font-semibold">{stats?.followers || 0}</span>
              <span className="text-muted-foreground group-hover:text-foreground/70 transition-colors">подписчиков</span>
            </button>
            <button onClick={() => setFollowListType("following")} className="flex items-center gap-1.5 cursor-pointer group">
              <span className="text-primary font-semibold">{stats?.following || 0}</span>
              <span className="text-muted-foreground group-hover:text-foreground/70 transition-colors">подписок</span>
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Calendar size={16} className="opacity-80" />
            <span className="font-medium opacity-80">
              Регистрация: {profile.created_at ? format(new Date(profile.created_at), "LLLL yyyy", { locale: ru }) : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="flex border-b border-border mb-4">
        <div className="flex-1 py-3 text-sm font-medium text-center text-primary relative">
          Записи
          <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full" />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {sortedPosts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-3xl mb-3">📝</div>
            <p className="text-muted-foreground text-sm">Пока нет записей</p>
          </div>
        ) : (
          sortedPosts.map((post: any) => (
            <PostCard key={post.id} post={post} context="profile" />
          ))
        )}
      </div>
      {followListType && userId && (
        <FollowListModal userId={userId} type={followListType} onClose={() => setFollowListType(null)} />
      )}
    </div>
  );
}
