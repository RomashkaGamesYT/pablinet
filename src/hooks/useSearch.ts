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
          .select(`*, profiles:user_id (display_name, username, avatar_emoji)`)
          .ilike("content", `%${query}%`)
          .limit(10),
      ]);

      return {
        users: usersRes.data || [],
        posts: postsRes.data || [],
      };
    },
    enabled: query.trim().length > 0,
  });
}
