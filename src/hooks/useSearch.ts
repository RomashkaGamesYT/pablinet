import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useSearch(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: async () => {
      if (!query.trim()) return { users: [], posts: [] };

      const [usersRes, postsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .or(`display_name.ilike.%${query}%,username.ilike.%${query}%`)
          .limit(10),
        supabase
          .from("posts")
          .select("*")
          .ilike("content", `%${query}%`)
          .limit(10),
      ]);

      const posts = postsRes.data || [];
      let postsWithProfiles = posts;

      if (posts.length > 0) {
        const userIds = [...new Set(posts.map((p) => p.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, username, avatar_emoji")
          .in("user_id", userIds);

        const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
        postsWithProfiles = posts.map((p) => ({ ...p, profile: profileMap.get(p.user_id) }));
      }

      return {
        users: usersRes.data || [],
        posts: postsWithProfiles,
      };
    },
    enabled: query.trim().length > 0,
  });
}
