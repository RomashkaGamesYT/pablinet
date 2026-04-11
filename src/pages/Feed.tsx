import { useState, useRef } from "react";
import { usePosts, useCreatePost } from "@/hooks/usePosts";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useAllUserBadges } from "@/hooks/useAdmin";
import { Image, Smile, X, User } from "lucide-react";
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
    <div className="animate-fade-in flex flex-col gap-4">
      {/* Compose */}
      <div className="bg-card rounded-[24px] p-5 border border-border shadow-sm dark:shadow-none transition-colors duration-300">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/10 dark:bg-accent/20 flex items-center justify-center shrink-0 overflow-hidden">
            {(profile as any)?.logo_url ? (
              <img src={(profile as any).logo_url} alt="" className="w-full h-full object-cover rounded-full" />
            ) : (
              <User size={20} className="text-accent" />
            )}
          </div>
          <div className="flex-1 flex flex-col">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Что такого?"
              className="text-foreground placeholder-muted-foreground outline-none resize-none min-h-[60px] text-base bg-transparent w-full pt-2 pb-2"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handlePost();
                }
              }}
            />

            {imagePreview && (
              <div className="relative mt-2">
                <img src={imagePreview} alt="preview" className="max-h-48 rounded-2xl object-cover border border-border" />
                <button
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-background/60 backdrop-blur-sm text-foreground rounded-full p-1 hover:bg-background/80 transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <div className="flex mt-2 items-center justify-between">
              <div className="flex items-center gap-4 text-muted-foreground">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="hover:text-foreground transition-colors cursor-pointer"
                >
                  <Image size={20} strokeWidth={1.5} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />
                <button className="hover:text-foreground transition-colors cursor-pointer">
                  <Smile size={20} strokeWidth={1.5} />
                </button>
              </div>
              <button
                onClick={handlePost}
                disabled={(!newPost.trim() && !imageFile) || createPost.isPending}
                className="bg-primary dark:bg-primary text-primary-foreground dark:text-primary-foreground hover:opacity-90 transition-colors text-sm font-medium rounded-full px-4 py-2 disabled:opacity-50 cursor-pointer"
              >
                {createPost.isPending ? "..." : "Опубликовать"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
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

      {/* Posts */}
      <div className="flex flex-col gap-4">
        {isLoading ? (
          <div className="text-center text-muted-foreground text-sm py-8">Загрузка...</div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">Пока нет статей. Будьте первым!</div>
        ) : (
          filteredPosts.map((post: any) => (
            <PostCard key={post.id} post={post} badges={getUserBadges(post.user_id)} context="feed" />
          ))
        )}
      </div>
    </div>
  );
}
