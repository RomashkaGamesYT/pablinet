import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useIsFollowing(targetUserId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["is-following", user?.id, targetUserId],
    queryFn: async () => {
      if (!user || !targetUserId) return false;
      const { data } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!targetUserId && user.id !== targetUserId,
  });
}

export function useFollow() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ targetUserId, isFollowing }: { targetUserId: string; isFollowing: boolean }) => {
      if (!user) throw new Error("Not authenticated");

      if (isFollowing) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", targetUserId);
      } else {
        await supabase
          .from("follows")
          .insert({ follower_id: user.id, following_id: targetUserId });

        // Send follow notification
        await supabase.from("notifications").insert({
          user_id: targetUserId,
          actor_id: user.id,
          type: "follow" as const,
        });
      }
    },
    onSuccess: (_, { targetUserId }) => {
      queryClient.invalidateQueries({ queryKey: ["is-following", user?.id, targetUserId] });
      queryClient.invalidateQueries({ queryKey: ["follow-stats", targetUserId] });
      queryClient.invalidateQueries({ queryKey: ["follow-stats", user?.id] });
    },
  });
}
