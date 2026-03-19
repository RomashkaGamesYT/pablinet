import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function usePosts() {
  return useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const { data: posts, error } = await supabase
        .from("posts")
        .select("*, likes(id, user_id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!posts || posts.length === 0) return [];

      // Get unique user_ids and fetch their profiles
      const userIds = [...new Set(posts.map((p) => p.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, avatar_emoji, verified")
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
    mutationFn: async (content: string) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("posts")
        .insert({ content, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
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
