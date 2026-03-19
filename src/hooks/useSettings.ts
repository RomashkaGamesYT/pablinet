import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserSettings {
  id: string;
  user_id: string;
  dm_enabled: boolean;
  show_events_tab: boolean;
  show_notifications_tab: boolean;
}

export function useSettings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-settings", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_settings" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return (data as any as UserSettings) || null;
    },
    enabled: !!user,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (settings: Partial<Pick<UserSettings, "dm_enabled" | "show_events_tab" | "show_notifications_tab">>) => {
      if (!user) throw new Error("Not authenticated");

      // Upsert settings
      const { data: existing } = await supabase
        .from("user_settings" as any)
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if ((existing as any)?.id) {
        const { error } = await supabase
          .from("user_settings" as any)
          .update({ ...settings, updated_at: new Date().toISOString() } as any)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_settings" as any)
          .insert({ user_id: user.id, ...settings } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-settings"] });
    },
  });
}

export function useTargetUserSettings(userId?: string) {
  return useQuery({
    queryKey: ["user-settings", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("user_settings" as any)
        .select("dm_enabled")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data as any as { dm_enabled: boolean } | null;
    },
    enabled: !!userId,
  });
}
