import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Share2, Pin, Trash2, MoreHorizontal, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { useToggleLike, useDeletePost, useTogglePin } from "@/hooks/usePosts";
import { useIsAdmin } from "@/hooks/useAdmin";
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
  const parts = content.split(/(#[a-zA-Zа-яА-ЯёЁ0-9_]+)/g);
  return parts.map((part, i) => {
    if (/^#[a-zA-Zа-яА-ЯёЁ0-9_]+$/.test(part)) {
      const isPedro = part === "#Педро88";
      return (
        <span
          key={i}
          className={
            isPedro
              ? "font-bold bg-gradient-to-r from-[hsl(340,82%,52%)] via-[hsl(280,80%,55%)] to-[hsl(200,90%,50%)] bg-clip-text text-transparent animate-pulse cursor-pointer"
              : "text-net-cyan hover:underline cursor-pointer"
          }
        >
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
  const [showComments, setShowComments] = useState(false);

  const isLiked = post.likes?.some((l: any) => l.user_id === user?.id);
  const likesCount = post.likes?.length || 0;
  const postProfile = post.profile;
  const isOwner = user?.id === post.user_id;
  const isPinnedFeed = post.pinned_in_feed;
  const isPinnedProfile = post.pinned_in_profile;
  
  const isAuthorAdmin = postProfile?.logo_url || postProfile?.banner_url;

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
    if (!confirm("Удалить пост?")) return;
    await deletePost.mutateAsync(post.id);
    toast.success("Пост удалён");
  };

  const handlePinProfile = async () => {
    await togglePin.mutateAsync({ postId: post.id, field: "pinned_in_profile" });
    toast.success(isPinnedProfile ? "Пост откреплён" : "Пост закреплён в профиле");
  };

  const handlePinFeed = async () => {
    await togglePin.mutateAsync({ postId: post.id, field: "pinned_in_feed" });
    toast.success(isPinnedFeed ? "Пост откреплён из ленты" : "Пост закреплён в ленте");
  };

  return (
    <div className={`rounded-[20px] p-4 transition-colors ${
      isAuthorAdmin 
        ? "bg-gradient-to-br from-net-cyan/[0.06] to-net-emerald/[0.04] ring-1 ring-net-cyan/20 hover:ring-net-cyan/30" 
        : `bg-card/60 hover:bg-card/80 ${(isPinnedFeed || isPinnedProfile) ? "ring-1 ring-primary/20" : ""}`
    }`}>
      {(isPinnedFeed || isPinnedProfile) && (
        <div className="flex items-center gap-1.5 text-xs text-primary/60 mb-2 pl-12">
          <Pin size={12} /> Закреплено
        </div>
      )}
      <div className="flex items-start gap-3 mb-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 cursor-pointer overflow-hidden ${
            isAuthorAdmin 
              ? "bg-gradient-to-tr from-net-cyan/30 to-net-emerald/30 ring-2 ring-net-cyan/30 shadow-[0_0_12px_rgba(34,211,238,0.2)]" 
              : "bg-muted ring-1 ring-border"
          }`}
          onClick={() => navigate(`/user/${post.user_id}`)}
        >
          {postProfile?.logo_url ? (
            <img src={postProfile.logo_url} alt="" className="w-full h-full object-cover rounded-full" />
          ) : (
            <span className="text-base">{postProfile?.avatar_emoji || "🐊"}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="text-[15px] font-semibold text-primary cursor-pointer hover:underline"
              onClick={() => navigate(`/user/${post.user_id}`)}
            >
              {postProfile?.display_name || "Пользователь"}
            </span>
            {postProfile?.verified && <VerifiedBadge size={16} />}
            {badges.length > 0 && <BadgeDisplay badges={badges} size="sm" />}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ru })}
          </div>
        </div>

        {(isOwner || isAdmin) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-muted-foreground hover:text-primary transition-colors p-1 cursor-pointer">
                <MoreHorizontal size={18} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card ring-1 ring-border rounded-xl min-w-[160px]">
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

      <div className="text-[15px] text-foreground/90 leading-relaxed mb-3 whitespace-pre-wrap">
        {renderContentWithHashtags(post.content)}
      </div>

      {post.image_url && (
        <div className="mb-3 -mx-1">
          <img
            src={post.image_url}
            alt="Изображение поста"
            className="w-full rounded-xl object-cover max-h-96"
            loading="lazy"
          />
        </div>
      )}

      <div className="flex items-center gap-1 pt-3 border-t border-border/50">
        <button
          onClick={() => toggleLike.mutate(post.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors cursor-pointer text-sm ${isLiked ? "text-destructive bg-destructive/10" : "text-muted-foreground hover:text-destructive hover:bg-destructive/5"}`}
        >
          <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
          <span className="text-xs font-medium">{likesCount}</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer"
        >
          <MessageCircle size={16} />
          <span className="text-xs font-medium">{post.comment_count || 0}</span>
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors ml-auto cursor-pointer"
        >
          <Share2 size={16} />
        </button>
      </div>

      {showComments && <CommentsSection postId={post.id} />}
    </div>
  );
}
