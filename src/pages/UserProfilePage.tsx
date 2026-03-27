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
import VerifiedBadge from "@/components/VerifiedBadge";
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
  const startConversation = useStartConversation();
  const [followListType, setFollowListType] = useState<"followers" | "following" | null>(null);

  const isOwnProfile = user?.id === userId;
  const isOfficialNet = profile?.username === "net";

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

  const handleMessage = async () => {
    if (!userId) return;
    await startConversation.mutateAsync(userId);
    navigate("/messages");
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
        <div className={`relative bg-gradient-to-br from-muted to-card rounded-[35px] w-full ring-1 overflow-hidden ${
          isOfficialNet ? "ring-net-cyan/30" : "ring-border"
        }`} style={{ aspectRatio: "736/335" }}>
          {(profile as any)?.banner_url ? (
            <img src={(profile as any).banner_url} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
          ) : isOfficialNet ? (
            <div className="absolute inset-0 bg-gradient-to-br from-net-cyan/20 via-net-emerald/10 to-primary/5" />
          ) : (
            <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none" style={{
              backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')"
            }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
          {isOfficialNet && (
            <div className="absolute bottom-4 right-4 bg-net-cyan/20 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium text-net-cyan ring-1 ring-net-cyan/30">
              🏢 Официальный аккаунт
            </div>
          )}
        </div>

        <div className="absolute -bottom-10 left-6 z-20">
          <div className="relative">
            <div className={`w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-b from-muted to-card rounded-full flex items-center justify-center ring-4 ring-background shadow-xl relative z-10 overflow-hidden ${
              isOfficialNet ? "shadow-[0_0_20px_rgba(34,211,238,0.3)]" : ""
            }`}>
              <div className="ring-inset ring-input ring-1 rounded-full absolute inset-0" />
              {(profile as any)?.logo_url ? (
                <img src={(profile as any).logo_url} alt="Logo" className="w-full h-full object-cover rounded-full relative z-10" />
              ) : (
                <span className="text-2xl sm:text-3xl drop-shadow-md relative z-10">{profile.avatar_emoji || "🐊"}</span>
              )}
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
              {profile.verified && <VerifiedBadge size={18} />}
              {isOfficialNet && (
                <span className="px-2 py-0.5 rounded-full bg-net-cyan/15 text-net-cyan text-[10px] font-semibold ring-1 ring-net-cyan/20">
                  OFFICIAL
                </span>
              )}
              {userBadges && <BadgeDisplay badges={userBadges as any} size="md" />}
            </div>
            <span className="text-sm text-muted-foreground font-medium">@{profile.username}</span>
            {isOfficialNet && (
              <p className="text-xs text-net-cyan/70 mt-0.5">Команда разработчиков нэт 🚀</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleMessage}
              disabled={startConversation.isPending}
              className="w-9 h-9 rounded-full bg-muted ring-1 ring-input flex items-center justify-center text-muted-foreground hover:text-primary hover:ring-primary/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <MessageCircle size={16} />
            </button>
            <button
              onClick={handleFollowToggle}
              disabled={follow.isPending || followLoading}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-50 ${
                isFollowing
                  ? "bg-muted text-foreground ring-1 ring-input hover:ring-destructive hover:text-destructive"
                  : isOfficialNet
                    ? "bg-gradient-to-r from-net-cyan to-net-emerald text-background font-semibold hover:opacity-90 shadow-[0_2px_12px_rgba(34,211,238,0.3)]"
                    : "bg-primary text-primary-foreground hover:opacity-90 shadow-[0_2px_8px_rgba(255,255,255,0.15)] ring-1 ring-inset ring-black/5"
              }`}
            >
              {isFollowing ? "Отписаться" : "Подписаться"}
            </button>
          </div>
        </div>

        {profile.bio && (
          <p className="text-sm text-foreground/70 mt-3 leading-relaxed">{profile.bio}</p>
        )}
        {isOfficialNet && !profile.bio && (
          <p className="text-sm text-foreground/70 mt-3 leading-relaxed">
            Команда разработчиков нэт 🛠️ Обновления, новости и всё о платформе ✨
          </p>
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
