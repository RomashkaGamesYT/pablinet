import { useState } from "react";
import { usePosts, useCreatePost } from "@/hooks/usePosts";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useAllUserBadges } from "@/hooks/useAdmin";
import { Image, Smile } from "lucide-react";
import PostCard from "@/components/PostCard";

export default function FeedPage() {
  const [newPost, setNewPost] = useState("");
  const { data: posts, isLoading } = usePosts();
  const createPost = useCreatePost();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: allUserBadges } = useAllUserBadges();

  const handlePost = async () => {
    if (!newPost.trim()) return;
    await createPost.mutateAsync(newPost);
    setNewPost("");
  };

  const getUserBadges = (userId: string) => {
    return allUserBadges?.filter((ub: any) => ub.user_id === userId) || [];
  };

  // Sort: pinned_in_feed first
  const sortedPosts = [...(posts || [])].sort((a: any, b: any) => {
    if (a.pinned_in_feed && !b.pinned_in_feed) return -1;
    if (!a.pinned_in_feed && b.pinned_in_feed) return 1;
    return 0;
  });

  return (
    <div className="animate-fade-in">
      <div className="px-2 mb-6">
        <h2 className="text-xl font-semibold tracking-tight text-primary">Лента</h2>
      </div>

      {/* Create Post */}
      <div className="bg-card/80 backdrop-blur-md rounded-3xl p-4 ring-1 ring-border mb-6 shadow-sm">
        <div className="flex gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-b from-muted to-card flex items-center justify-center shrink-0 ring-1 ring-input shadow-inner">
            <span className="text-sm">{profile?.avatar_emoji || "🐊"}</span>
          </div>
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Что нового?"
            className="w-full bg-transparent text-sm outline-none text-foreground placeholder-muted-foreground pt-2 sm:pt-2.5 resize-none h-10"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handlePost();
              }
            }}
          />
        </div>
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
          <div className="flex gap-2 text-muted-foreground">
            <button className="hover:text-primary transition-colors p-1 flex items-center cursor-pointer"><Image size={20} /></button>
            <button className="hover:text-primary transition-colors p-1 flex items-center cursor-pointer"><Smile size={20} /></button>
          </div>
          <button
            onClick={handlePost}
            disabled={!newPost.trim() || createPost.isPending}
            className="bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-xs font-medium hover:opacity-90 transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            Опубликовать
          </button>
        </div>
      </div>

      {/* Posts */}
      <div className="flex flex-col gap-3 sm:gap-4">
        {isLoading ? (
          <div className="text-center text-muted-foreground text-sm py-8">Загрузка...</div>
        ) : sortedPosts.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">Пока нет постов. Будьте первым!</div>
        ) : (
          sortedPosts.map((post: any) => (
            <PostCard key={post.id} post={post} badges={getUserBadges(post.user_id)} context="feed" />
          ))
        )}
      </div>
    </div>
  );
}
