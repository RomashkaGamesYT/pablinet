import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function usePosts() {
  return useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      // First get total count
      const { count } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true });

      const total = count || 0;
      const limit = 20;

      // If more than 20 posts, pick a random offset to show different posts on refresh
      let offset = 0;
      if (total > limit) {
        offset = Math.floor(Math.random() * (total - limit));
      }

      const { data: posts, error } = await supabase
        .from("posts")
        .select("*, likes(id, user_id)")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) throw error;
      if (!posts || posts.length === 0) return [];

      // Get unique user_ids and fetch their profiles
      const userIds = [...new Set(posts.map((p) => p.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, avatar_emoji, verified, logo_url, banner_url")
        .in("user_id", userIds);

      // Get comment counts
      const postIds = posts.map((p) => p.id);
      const { data: commentCounts } = await supabase
        .from("comments")
        .select("post_id")
        .in("post_id", postIds);

      const countMap = new Map<string, number>();
      (commentCounts || []).forEach((c) => {
        countMap.set(c.post_id, (countMap.get(c.post_id) || 0) + 1);
      });

      const profileMap = new Map(
        (profiles || []).map((p) => [p.user_id, p])
      );

      return posts.map((post) => ({
        ...post,
        profile: profileMap.get(post.user_id) || null,
        comment_count: countMap.get(post.id) || 0,
      }));
    },
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ content, imageFile }: { content: string; imageFile?: File | null }) => {
      if (!user) throw new Error("Not authenticated");

      let image_url: string | null = null;

      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const filePath = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("post-images").upload(filePath, imageFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from("post-images").getPublicUrl(filePath);
        image_url = publicUrl;
      }

      const { data, error } = await supabase
        .from("posts")
        .insert({ content, user_id: user.id, image_url })
        .select()
        .single();
      if (error) throw error;

      // Detect @mentions and send notifications
      const mentionRegex = /@([a-zA-Zа-яА-ЯёЁ0-9_]+)/g;
      const mentions = [...content.matchAll(mentionRegex)].map(m => m[1]);
      if (mentions.length > 0) {
        const { data: mentionedProfiles } = await supabase
          .from("profiles")
          .select("user_id, username")
          .in("username", mentions);
        if (mentionedProfiles) {
          for (const mp of mentionedProfiles) {
            if (mp.user_id !== user.id) {
              await supabase.from("notifications").insert({
                user_id: mp.user_id,
                actor_id: user.id,
                type: "mention" as const,
                post_id: data.id,
              });
            }
          }
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useToggleLike() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!user) throw new Error("Not authenticated");

      const { data: existing } = await supabase
        .from("likes")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        await supabase.from("likes").delete().eq("id", existing.id);
        return { liked: false };
      } else {
        await supabase.from("likes").insert({ post_id: postId, user_id: user.id });
        const { data: post } = await supabase.from("posts").select("user_id").eq("id", postId).single();
        if (post && post.user_id !== user.id) {
          await supabase.from("notifications").insert({
            user_id: post.user_id,
            actor_id: user.id,
            type: "like" as const,
            post_id: postId,
          });
        }
        return { liked: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from("posts").delete().eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useTogglePin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, field }: { postId: string; field: "pinned_in_feed" | "pinned_in_profile" }) => {
      const { data: post } = await supabase.from("posts").select(field).eq("id", postId).single();
      if (!post) throw new Error("Post not found");
      const currentVal = (post as any)[field];
      const { error } = await supabase.from("posts").update({ [field]: !currentVal } as any).eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}
