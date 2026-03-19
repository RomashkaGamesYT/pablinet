import { useState, useRef, useEffect } from "react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: posts, isLoading } = usePosts();
  const createPost = useCreatePost();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: allUserBadges } = useAllUserBadges();
  const { data: followingIds } = useFollowingIds();

  const cookieConsent = typeof window !== "undefined" ? localStorage.getItem("cookie-consent") : null;

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

  // Sort: pinned first, then if cookies accepted → following users' posts first
  const sortedPosts = [...(posts || [])].sort((a: any, b: any) => {
    if (a.pinned_in_feed && !b.pinned_in_feed) return -1;
    if (!a.pinned_in_feed && b.pinned_in_feed) return 1;

    if (cookieConsent === "accepted" && followingIds && followingIds.length > 0) {
      const aFollowed = followingIds.includes(a.user_id);
      const bFollowed = followingIds.includes(b.user_id);
      if (aFollowed && !bFollowed) return -1;
      if (!aFollowed && bFollowed) return 1;
    }

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

        {imagePreview && (
          <div className="relative mt-3 ml-12">
            <img src={imagePreview} alt="preview" className="max-h-48 rounded-2xl object-cover ring-1 ring-border" />
            <button
              onClick={removeImage}
              className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-foreground rounded-full p-1 hover:bg-black/80 transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
          <div className="flex gap-2 text-muted-foreground">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="hover:text-primary transition-colors p-1 flex items-center cursor-pointer"
            >
              <Image size={20} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
            <button className="hover:text-primary transition-colors p-1 flex items-center cursor-pointer"><Smile size={20} /></button>
          </div>
          <button
            onClick={handlePost}
            disabled={(!newPost.trim() && !imageFile) || createPost.isPending}
            className="bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-xs font-medium hover:opacity-90 transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {createPost.isPending ? "..." : "Опубликовать"}
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
