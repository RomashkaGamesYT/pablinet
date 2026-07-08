import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole =
  | "admin"
  | "moderator"
  | "support"
  | "verifier"
  | "events_manager"
  | "pepe_manager"
  | "badge_manager"
  | "user_manager";

export const SUB_ROLE_LABELS: Record<AppRole, string> = {
  admin: "Полный админ",
  moderator: "Модератор",
  support: "Поддержка",
  verifier: "Верификация",
  events_manager: "Ивенты",
  pepe_manager: "Pepe+",
  badge_manager: "Бейджи",
  user_manager: "Пользователи",
};

export function useIsAdmin() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      return !!data;
    },
    enabled: !!user,
  });
}

export function useMyRoles() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-roles", user?.id],
    queryFn: async () => {
      if (!user) return [] as AppRole[];
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      return ((data || []) as any[]).map((r) => r.role as AppRole);
    },
    enabled: !!user,
  });
}

export function useHasAnyAdminRole() {
  const { data: roles } = useMyRoles();
  return (roles?.length || 0) > 0;
}

export function useAdminUserIds() {
  return useQuery({
    queryKey: ["admin-user-ids"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
      return new Set(((data || []) as any[]).map((r) => r.user_id as string));
    },
    staleTime: 60000,
  });
}

export function useAllUserRoles() {
  return useQuery({
    queryKey: ["all-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id, role, id");
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useBadges() {
  return useQuery({
    queryKey: ["badges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("badges")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useUserBadges(userId?: string) {
  return useQuery({
    queryKey: ["user-badges", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("user_badges")
        .select("*, badge:badge_id(*)")
        .eq("user_id", userId);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useAllUserBadges() {
  return useQuery({
    queryKey: ["all-user-badges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_badges")
        .select("user_id, badge:badge_id(*)");
      if (error) throw error;
      return data;
    },
  });
}

export function useAllProfiles() {
  return useQuery({
    queryKey: ["all-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
