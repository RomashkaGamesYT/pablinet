import { useState, useRef } from "react";
import { usePosts, useCreatePost } from "@/hooks/usePosts";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useAllUserBadges } from "@/hooks/useAdmin";
import { Image, Smile, X } from "lucide-react";
import PostCard from "@/components/PostCard";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

function useFollowingIds() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["following-ids", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);
      return (data || []).map((f) => f.following_id);
    },
    enabled: !!user,
  });
}

export default function FeedPage() {
  const [newPost, setNewPost] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"foryou" | "following">("foryou");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: posts, isLoading } = usePosts();
  const createPost = useCreatePost();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: allUserBadges } = useAllUserBadges();
  const { data: followingIds } = useFollowingIds();

  const handlePost = async () => {
    if (!newPost.trim() && !imageFile) return;
    await createPost.mutateAsync({ content: newPost || "", imageFile });
    setNewPost("");
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getUserBadges = (userId: string) => {
    return allUserBadges?.filter((ub: any) => ub.user_id === userId) || [];
  };

  const sortedPosts = [...(posts || [])].sort((a: any, b: any) => {
    if (a.pinned_in_feed && !b.pinned_in_feed) return -1;
    if (!a.pinned_in_feed && b.pinned_in_feed) return 1;
    return 0;
  });

  const filteredPosts = activeTab === "following" && followingIds && followingIds.length > 0
    ? sortedPosts.filter((p: any) => followingIds.includes(p.user_id) || p.user_id === user?.id)
    : sortedPosts;

  return (
    <div className="animate-fade-in">
      {/* Tabs */}
      <div className="flex items-center gap-2 px-2 mb-4">
        <button
          onClick={() => setActiveTab("foryou")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer ${
            activeTab === "foryou"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Для вас
        </button>
        <button
          onClick={() => setActiveTab("following")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer ${
            activeTab === "following"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Подписки
        </button>
      </div>

      {/* Create Post */}
      <div className="px-3 py-2">
        <div className="rounded-[35px] bg-card/60 backdrop-blur-md ring-1 ring-border/50 p-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0 ring-1 ring-border overflow-hidden">
              {(profile as any)?.logo_url ? (
                <img src={(profile as any).logo_url} alt="" className="w-full h-full object-cover rounded-full" />
              ) : (
                <span className="text-sm">{profile?.avatar_emoji || "🐊"}</span>
              )}
            </div>
            <div className="flex-1">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="Что нового?"
                className="w-full bg-transparent text-sm outline-none text-foreground placeholder-muted-foreground pt-2 resize-none h-10"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handlePost();
                  }
                }}
              />

              {imagePreview && (
                <div className="relative mt-2">
                  <img src={imagePreview} alt="preview" className="max-h-48 rounded-[24px] object-cover ring-1 ring-border/30" />
                  <button
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-background/60 backdrop-blur-sm text-foreground rounded-full p-1 hover:bg-background/80 transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/30">
                <div className="flex gap-2 text-muted-foreground">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="hover:text-primary transition-colors p-1 cursor-pointer"
                  >
                    <Image size={18} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                  <button className="hover:text-primary transition-colors p-1 cursor-pointer"><Smile size={18} /></button>
                </div>
                <button
                  onClick={handlePost}
                  disabled={(!newPost.trim() && !imageFile) || createPost.isPending}
                  className="bg-primary text-primary-foreground px-5 py-1.5 rounded-full text-sm font-medium hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {createPost.isPending ? "..." : "Опубликовать"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="flex flex-col">
        {isLoading ? (
          <div className="text-center text-muted-foreground text-sm py-8">Загрузка...</div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">Пока нет постов. Будьте первым!</div>
        ) : (
          filteredPosts.map((post: any) => (
            <PostCard key={post.id} post={post} badges={getUserBadges(post.user_id)} context="feed" />
          ))
        )}
      </div>
    </div>
  );
}
