import { useState } from "react";
import { usePosts, useCreatePost, useToggleLike } from "@/hooks/usePosts";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Heart, MessageCircle, Share2, Image, Smile } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

export default function FeedPage() {
  const [newPost, setNewPost] = useState("");
  const { data: posts, isLoading } = usePosts();
  const createPost = useCreatePost();
  const toggleLike = useToggleLike();
  const { user } = useAuth();
  const { data: profile } = useProfile();

  const handlePost = async () => {
    if (!newPost.trim()) return;
    await createPost.mutateAsync(newPost);
    setNewPost("");
  };

  return (
    <div className="animate-fade-in">
      <div className="px-2 mb-6">
        <h2 className="text-xl font-semibold tracking-tight text-primary">Лента</h2>
      </div>

      {/* Create Post */}
      <div className="bg-card/80 backdrop-blur-md rounded-3xl p-4 ring-1 ring-border mb-6 shadow-sm">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-b from-muted to-card flex items-center justify-center shrink-0 ring-1 ring-input shadow-inner">
            <span className="text-sm">{profile?.avatar_emoji || "🐊"}</span>
          </div>
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Что нового?"
            className="w-full bg-transparent text-sm outline-none text-foreground placeholder-muted-foreground pt-2.5 resize-none h-10"
          />
        </div>
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
          <div className="flex gap-2 text-muted-foreground">
            <button className="hover:text-primary transition-colors p-1 flex items-center"><Image size={20} /></button>
            <button className="hover:text-primary transition-colors p-1 flex items-center"><Smile size={20} /></button>
          </div>
          <button
            onClick={handlePost}
            disabled={!newPost.trim() || createPost.isPending}
            className="bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-xs font-medium hover:opacity-90 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            Опубликовать
          </button>
        </div>
      </div>

      {/* Posts */}
      <div className="flex flex-col gap-4">
        {isLoading ? (
          <div className="text-center text-muted-foreground text-sm py-8">Загрузка...</div>
        ) : posts?.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">Пока нет постов. Будьте первым!</div>
        ) : (
          posts?.map((post) => {
            const isLiked = post.likes?.some((l: any) => l.user_id === user?.id);
            const likesCount = post.likes?.length || 0;
            const postProfile = post.profiles as any;

            return (
              <div key={post.id} className="bg-card/50 rounded-3xl p-5 ring-1 ring-border transition-colors hover:bg-card/80 cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-net-cyan/20 to-net-emerald/20 flex items-center justify-center ring-1 ring-input">
                    <span className="text-sm">{postProfile?.avatar_emoji || "🐊"}</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-primary tracking-tight">{postProfile?.display_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ru })}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>
                <div className="flex items-center gap-6 pt-4 border-t border-border">
                  <button
                    onClick={() => toggleLike.mutate(post.id)}
                    className={`flex items-center gap-2 transition-colors ${isLiked ? "text-destructive" : "text-muted-foreground hover:text-destructive"}`}
                  >
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
    </div>
  );
}
