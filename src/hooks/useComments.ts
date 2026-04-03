import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useComments(postId: string) {
  return useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => {
      const { data: comments, error } = await supabase
        .from("comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      if (!comments || comments.length === 0) return [];

      const userIds = [...new Set(comments.map((c) => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, avatar_emoji")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));

      return comments.map((c) => ({
        ...c,
        profile: profileMap.get(c.user_id) || null,
      }));
    },
    enabled: !!postId,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("comments")
        .insert({ post_id: postId, user_id: user.id, content })
        .select()
        .single();
      if (error) throw error;

      // Send notification to post owner
      const { data: post } = await supabase.from("posts").select("user_id").eq("id", postId).single();
      if (post && post.user_id !== user.id) {
        await supabase.from("notifications").insert({
          user_id: post.user_id,
          actor_id: user.id,
          type: "comment" as any,
          post_id: postId,
        });
      }

      // Detect @mentions in comment and send notifications
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
                type: "mention" as any,
                post_id: postId,
              });
            }
          }
        }
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comments", variables.postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, postId }: { commentId: string; postId: string }) => {
      const { error } = await supabase.from("comments").delete().eq("id", commentId);
      if (error) throw error;
      return postId;
    },
    onSuccess: (postId) => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    },
  });
}

export function useCommentCount(postId: string) {
  return useQuery({
    queryKey: ["comment-count", postId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("comments")
        .select("*", { count: "exact", head: true })
        .eq("post_id", postId);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!postId,
  });
}
