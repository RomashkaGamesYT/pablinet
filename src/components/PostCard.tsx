import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Pin, Trash2, MoreHorizontal, Eye, Plus, Repeat2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { useToggleLike, useDeletePost, useTogglePin } from "@/hooks/usePosts";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useFollow, useIsFollowing } from "@/hooks/useFollow";
import BadgeDisplay from "@/components/BadgeDisplay";
import VerifiedBadge from "@/components/VerifiedBadge";
import CommentsSection from "@/components/CommentsSection";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PostCardProps {
  post: any;
  badges?: any[];
  context?: "feed" | "profile";
}

function renderContentWithHashtags(content: string) {
  const parts = content.split(/(#[a-zA-Zа-яА-ЯёЁ0-9_]+|@[a-zA-Zа-яА-ЯёЁ0-9_]+)/g);
  return parts.map((part, i) => {
    if (/^#[a-zA-Zа-яА-ЯёЁ0-9_]+$/.test(part)) {
      return (
        <span key={i} className="text-blue-500 dark:text-blue-400 hover:underline cursor-pointer">
          {part}
        </span>
      );
    }
    if (/^@[a-zA-Zа-яА-ЯёЁ0-9_]+$/.test(part)) {
      return (
        <span key={i} className="text-blue-500 dark:text-blue-400 hover:underline cursor-pointer font-medium">
          {part}
        </span>
      );
    }
    return part;
  });
}

export default function PostCard({ post, badges = [], context = "feed" }: PostCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toggleLike = useToggleLike();
  const deletePost = useDeletePost();
  const togglePin = useTogglePin();
  const { data: isAdmin } = useIsAdmin();
  const { data: isFollowing } = useIsFollowing(post.user_id);
  const follow = useFollow();
  const [showComments, setShowComments] = useState(false);

  const isLiked = post.likes?.some((l: any) => l.user_id === user?.id);
  const likesCount = post.likes?.length || 0;
  const postProfile = post.profile;
  const isOwner = user?.id === post.user_id;
  const isPinnedFeed = post.pinned_in_feed;
  const isPinnedProfile = post.pinned_in_profile;
  const showFollowButton = !isOwner && !isFollowing && user;
  const hasPepePlus = postProfile?.has_pepe_plus;

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Ссылка скопирована");
    } catch {
      toast.error("Не удалось скопировать");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Удалить статью?")) return;
    await deletePost.mutateAsync(post.id);
    toast.success("Статья удалена");
  };

  const handlePinProfile = async () => {
    await togglePin.mutateAsync({ postId: post.id, field: "pinned_in_profile" });
    toast.success(isPinnedProfile ? "Откреплено" : "Закреплено в профиле");
  };

  const handlePinFeed = async () => {
    await togglePin.mutateAsync({ postId: post.id, field: "pinned_in_feed" });
    toast.success(isPinnedFeed ? "Откреплено из ленты" : "Закреплено в ленте");
  };

  const handleFollow = () => {
    if (!post.user_id) return;
    follow.mutate({ targetUserId: post.user_id, isFollowing: false });
  };

  return (
    <article className="bg-card rounded-[24px] p-5 border border-border shadow-sm dark:shadow-none flex flex-col gap-3 transition-colors duration-300">
      {(isPinnedFeed || isPinnedProfile) && (
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Pin size={14} strokeWidth={2} />
          <span className="text-xs font-medium">Закреплённая статья</span>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0 cursor-pointer overflow-hidden"
            onClick={() => navigate(`/user/${post.user_id}`)}
          >
            {postProfile?.logo_url ? (
              <img src={postProfile.logo_url} alt="" className="w-full h-full object-cover rounded-full" />
            ) : (
              <User size={20} className="text-muted-foreground" />
            )}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span
                className={`text-sm font-medium cursor-pointer hover:underline ${hasPepePlus ? "gradient-name" : "text-foreground"}`}
                onClick={() => navigate(`/user/${post.user_id}`)}
              >
                {postProfile?.display_name || "Пользователь"}
              </span>
              {postProfile?.verified && <VerifiedBadge size={16} />}
              {badges.length > 0 && <BadgeDisplay badges={badges} size="sm" />}
              {showFollowButton && (
                <button
                  onClick={handleFollow}
                  className="w-5 h-5 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all cursor-pointer ml-0.5"
                >
                  <Plus size={12} strokeWidth={2.5} />
                </button>
              )}
              <span className="text-muted-foreground text-xs ml-1">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: false, locale: ru })}
              </span>
            </div>
          </div>
        </div>

        {(isOwner || isAdmin) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer">
                <MoreHorizontal size={20} strokeWidth={1.5} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border border-border rounded-2xl min-w-[160px]">
              {isOwner && (
                <DropdownMenuItem onClick={handlePinProfile} className="cursor-pointer text-sm gap-2">
                  <Pin size={14} /> {isPinnedProfile ? "Открепить из профиля" : "Закрепить в профиле"}
                </DropdownMenuItem>
              )}
              {isAdmin && (
                <DropdownMenuItem onClick={handlePinFeed} className="cursor-pointer text-sm gap-2">
                  <Pin size={14} /> {isPinnedFeed ? "Открепить из ленты" : "Закрепить в ленте"}
                </DropdownMenuItem>
              )}
              {(isOwner || isAdmin) && (
                <DropdownMenuItem onClick={handleDelete} className="cursor-pointer text-sm gap-2 text-destructive focus:text-destructive">
                  <Trash2 size={14} /> Удалить
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Content */}
      <div className="pl-[52px]">
        <div className="text-base text-foreground leading-relaxed whitespace-pre-wrap">
          {renderContentWithHashtags(post.content)}
        </div>

        {post.image_url && (
          <div className="mt-3">
            <img
              src={post.image_url}
              alt="Изображение"
              className="w-full rounded-2xl object-cover max-h-96 border border-border"
              loading="lazy"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between text-muted-foreground mt-4">
          <div className="flex items-center gap-6">
            <button
              onClick={() => toggleLike.mutate(post.id)}
              className={`flex items-center gap-1.5 transition-colors cursor-pointer ${isLiked ? "text-pink-500" : "hover:text-pink-500"}`}
            >
              <Heart size={16} fill={isLiked ? "currentColor" : "none"} strokeWidth={1.5} className={isLiked ? "heart-anim" : ""} />
              <span className="text-sm">{likesCount || ""}</span>
            </button>
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer"
            >
              <MessageCircle size={16} strokeWidth={1.5} />
              <span className="text-sm">{post.comment_count || 0}</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 hover:text-accent transition-colors cursor-pointer"
            >
              <Repeat2 size={16} strokeWidth={1.5} />
              <span className="text-sm">0</span>
            </button>
          </div>
          <div className="flex items-center gap-1.5 opacity-50">
            <Eye size={14} strokeWidth={1.5} />
            <span className="text-xs">{post.view_count || 1}</span>
          </div>
        </div>
      </div>

      {showComments && <CommentsSection postId={post.id} />}
    </article>
  );
}

// Need this import for the fallback avatar
import { User } from "lucide-react";
