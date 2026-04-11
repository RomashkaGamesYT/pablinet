import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useFollowStats } from "@/hooks/useProfile";
import { useFollow, useIsFollowing } from "@/hooks/useFollow";
import { usePosts } from "@/hooks/usePosts";
import { useUserBadges } from "@/hooks/useAdmin";
import { ArrowLeft, MessageCircle, User, Plus } from "lucide-react";
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

  const hasPepePlus = (profile as any)?.has_pepe_plus;

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
    <div className="animate-fade-in flex flex-col gap-4">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors cursor-pointer">
        <ArrowLeft size={18} /> Назад
      </button>

      <div className="bg-card rounded-[24px] overflow-hidden border border-border shadow-sm dark:shadow-none transition-colors duration-300">
        {/* Banner */}
        <div className="h-28 bg-gradient-to-r from-accent/20 to-secondary w-full relative">
          {(profile as any)?.banner_url ? (
            <img src={(profile as any).banner_url} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
          ) : null}
        </div>

        <div className="px-5 pb-5 relative">
          {/* Avatar */}
          <div className="absolute -top-10 left-5 w-20 h-20 rounded-full border-4 border-card bg-secondary flex items-center justify-center overflow-hidden">
            {(profile as any)?.logo_url ? (
              <img src={(profile as any).logo_url} alt="" className="w-full h-full object-cover rounded-full" />
            ) : (
              <User size={32} className="text-muted-foreground" />
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-3 gap-2">
            <button
              onClick={handleMessage}
              disabled={startConversation.isPending}
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center bg-secondary hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
            >
              <MessageCircle size={16} />
            </button>
            <button
              onClick={handleFollowToggle}
              disabled={follow.isPending || followLoading}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer disabled:opacity-50 ${
                isFollowing
                  ? "border border-border text-foreground hover:border-destructive hover:text-destructive"
                  : "bg-primary text-primary-foreground hover:opacity-90"
              }`}
            >
              {isFollowing ? "Отписаться" : "Подписаться"}
            </button>
          </div>

          {/* Info */}
          <div className="mt-2">
            <h1 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
              <span className={hasPepePlus ? "gradient-name" : ""}>{profile.display_name}</span>
              {profile.verified && <VerifiedBadge size={18} />}
              {userBadges && <BadgeDisplay badges={userBadges as any} size="md" />}
            </h1>
            <span className="text-sm text-muted-foreground">@{profile.username}</span>

            {profile.bio && (
              <p className="mt-3 text-sm text-muted-foreground">{profile.bio}</p>
            )}

            <div className="flex gap-4 mt-4 text-sm">
              <button onClick={() => setFollowListType("following")} className="flex gap-1.5 cursor-pointer group">
                <span className="font-medium text-foreground">{stats?.following || 0}</span>
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">Подписки</span>
              </button>
              <button onClick={() => setFollowListType("followers")} className="flex gap-1.5 cursor-pointer group">
                <span className="font-medium text-foreground">{stats?.followers || 0}</span>
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">Подписчики</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-border">
          <button className="flex-1 py-3 text-sm font-medium text-foreground border-b-2 border-accent">Статьи</button>
          <button className="flex-1 py-3 text-sm font-normal text-muted-foreground hover:bg-secondary/30 transition-colors cursor-pointer">Ответы</button>
        </div>
      </div>

      {/* Posts */}
      <div className="flex flex-col gap-4">
        {sortedPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">Пока нет статей</p>
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
