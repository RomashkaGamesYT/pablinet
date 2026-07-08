import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const EPOCH = new Date(0).toISOString();

export function useClientSupportUnread() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["support-unread-client", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { data: c } = await supabase
        .from("support_conversations" as any)
        .select("id, read_by_user_at")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!c) return 0;
      const conv = c as any;
      const { count } = await supabase
        .from("support_messages" as any)
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", conv.id)
        .neq("role", "user")
        .gt("created_at", conv.read_by_user_at || EPOCH);
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 15000,
  });
}

export function useAdminSupportUnread() {
  return useQuery({
    queryKey: ["support-unread-admin"],
    queryFn: async () => {
      const { data: convs } = await supabase
        .from("support_conversations" as any)
        .select("id, read_by_admin_at, needs_specialist, last_message_at");
      if (!convs) return 0;
      let n = 0;
      for (const c of convs as any[]) {
        const readAt = c.read_by_admin_at || EPOCH;
        const hasNew = new Date(c.last_message_at) > new Date(readAt);
        if (c.needs_specialist && hasNew) {
          n++;
          continue;
        }
        if (hasNew) {
          const { data: last } = await supabase
            .from("support_messages" as any)
            .select("role")
            .eq("conversation_id", c.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if ((last as any)?.role === "user") n++;
        }
      }
      return n;
    },
    refetchInterval: 15000,
  });
}
