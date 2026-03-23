import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Share2, Pin, Trash2, MoreHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { useToggleLike, useDeletePost, useTogglePin } from "@/hooks/usePosts";
import { useIsAdmin } from "@/hooks/useAdmin";
import BadgeDisplay from "@/components/BadgeDisplay";
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
  
  // Check if post author is an admin (has logo_url or banner_url as indicator)
  const isAuthorAdmin = postProfile?.logo_url || postProfile?.banner_url;
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
    <div className={`bg-card/50 rounded-3xl p-4 sm:p-5 ring-1 ring-border transition-colors hover:bg-card/80 ${(isPinnedFeed || isPinnedProfile) ? "ring-primary/20" : ""}`}>
      {(isPinnedFeed || isPinnedProfile) && (
        <div className="flex items-center gap-1.5 text-xs text-primary/60 mb-2 pl-12">
          <Pin size={12} /> Закреплено
        </div>
      )}
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-net-cyan/20 to-net-emerald/20 flex items-center justify-center ring-1 ring-input shrink-0 cursor-pointer"
          onClick={() => navigate(`/user/${post.user_id}`)}
        >
          <span className="text-sm">{postProfile?.avatar_emoji || "🐊"}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="text-sm font-medium text-primary tracking-tight cursor-pointer hover:underline"
              onClick={() => navigate(`/user/${post.user_id}`)}
            >
              {postProfile?.display_name || "Пользователь"}
            </span>
            {postProfile?.verified && (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" className="shrink-0 text-[hsl(217,91%,60%)] drop-shadow-[0_2px_6px_rgba(59,130,246,0.5)]">
                <path fill="currentColor" fillRule="evenodd" d="M9.592 3.2a6 6 0 0 1-.495.399c-.298.2-.633.338-.985.408c-.153.03-.313.043-.632.068c-.801.064-1.202.096-1.536.214a2.71 2.71 0 0 0-1.655 1.655c-.118.334-.15.735-.214 1.536a6 6 0 0 1-.068.632c-.07.352-.208.687-.408.985c-.087.13-.191.252-.399.495c-.521.612-.782.918-.935 1.238c-.353.74-.353 1.6 0 2.34c.153.32.414.626.935 1.238c.208.243.312.365.399.495c.2.298.338.633.408.985c.03.153.043.313.068.632c.064.801.096 1.202.214 1.536a2.71 2.71 0 0 0 1.655 1.655c.334.118.735.15 1.536.214c.319.025.479.038.632.068c.352.07.687.209.985.408c.13.087.252.191.495.399c.612.521.918.782 1.238.935c.74.353 1.6.353 2.34 0c.32-.153.626-.414 1.238-.935c.243-.208.365-.312.495-.399c.298-.2.633-.338.985-.408c.153-.03.313-.043.632-.068c.801-.064 1.202-.096 1.536-.214a2.71 2.71 0 0 0 1.655-1.655c.118-.334.15-.735.214-1.536c.025-.319.038-.479.068-.632c.07-.352.209-.687.408-.985c.087-.13.191-.252.399-.495c.521-.612.782-.918.935-1.238c.353-.74.353-1.6 0-2.34c-.153-.32-.414-.626-.935-1.238a6 6 0 0 1-.399-.495a2.7 2.7 0 0 1-.408-.985a6 6 0 0 1-.068-.632c-.064-.801-.096-1.202-.214-1.536a2.71 2.71 0 0 0-1.655-1.655c-.334-.118-.735-.15-1.536-.214a6 6 0 0 1-.632-.068a2.7 2.7 0 0 1-.985-.408a6 6 0 0 1-.495-.399c-.612-.521-.918-.782-1.238-.935a2.71 2.71 0 0 0-2.34 0c-.32.153-.626.414-1.238.935m6.781 6.663a.814.814 0 0 0-1.15-1.15l-4.85 4.85l-1.596-1.595a.814.814 0 0 0-1.15 1.15l2.17 2.17a.814.814 0 0 0 1.15 0z" clipRule="evenodd" />
              </svg>
            )}
            {badges.length > 0 && <BadgeDisplay badges={badges} size="sm" />}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ru })}
          </div>
        </div>

        {/* Post menu */}
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

      <div className="text-sm text-foreground/80 leading-relaxed mb-3 whitespace-pre-wrap">
        {renderContentWithHashtags(post.content)}
      </div>

      {post.image_url && (
        <div className="mb-3 -mx-1">
          <img
            src={post.image_url}
            alt="Изображение поста"
            className="w-full rounded-2xl object-cover max-h-96 ring-1 ring-border"
            loading="lazy"
          />
        </div>
      )}

      <div className="flex items-center gap-5 pt-3 border-t border-border">
        <button
          onClick={() => toggleLike.mutate(post.id)}
          className={`flex items-center gap-2 transition-colors cursor-pointer ${isLiked ? "text-destructive" : "text-muted-foreground hover:text-destructive"}`}
        >
          <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
          <span className="text-xs font-medium">{likesCount}</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
        >
          <MessageCircle size={18} />
          <span className="text-xs font-medium">{post.comment_count || 0}</span>
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors ml-auto cursor-pointer"
        >
          <Share2 size={18} />
        </button>
      </div>

      {showComments && <CommentsSection postId={post.id} />}
    </div>
  );
}
