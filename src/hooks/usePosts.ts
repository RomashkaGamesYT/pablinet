import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function usePosts() {
  return useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      // Fetch posts first
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
        .select("user_id, display_name, username, avatar_emoji")
        .in("user_id", userIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.user_id, p])
      );

      return posts.map((post) => ({
        ...post,
        profile: profileMap.get(post.user_id) || null,
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
