import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          event_registrations (id, user_id)
        `)
        .order("event_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useToggleEventRegistration() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (eventId: string) => {
      if (!user) throw new Error("Not authenticated");

      const { data: existing } = await supabase
        .from("event_registrations")
        .select("id")
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        await supabase.from("event_registrations").delete().eq("id", existing.id);
        return { registered: false };
      } else {
        await supabase.from("event_registrations").insert({ event_id: eventId, user_id: user.id });
        return { registered: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}
