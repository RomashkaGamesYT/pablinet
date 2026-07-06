import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useGiveaways() {
  return useQuery({
    queryKey: ["giveaways"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("giveaways")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    refetchInterval: 30000,
  });
}

export function useCanCreateGiveaway() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["can-create-giveaway", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.from("profiles").select("username").eq("user_id", user.id).single();
      return (data?.username || "").toLowerCase() === "cooling";
    },
    enabled: !!user,
  });
}

export function useCreateGiveaway() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { title: string; description: string; ends_at: string; image?: File | null }) => {
      if (!user) throw new Error("Not authenticated");
      let image_url: string | null = null;
      if (payload.image) {
        const ext = payload.image.name.split(".").pop() || "jpg";
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("giveaway-images").upload(path, payload.image, { upsert: true });
        if (upErr) throw upErr;
        image_url = supabase.storage.from("giveaway-images").getPublicUrl(path).data.publicUrl;
      }
      const { error } = await (supabase as any).from("giveaways").insert({
        creator_id: user.id,
        title: payload.title,
        description: payload.description,
        ends_at: payload.ends_at,
        image_url,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["giveaways"] }),
  });
}

export function usePickWinner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ giveawayId, winnerUserId }: { giveawayId: string; winnerUserId: string }) => {
      const { error } = await (supabase as any)
        .from("giveaways")
        .update({ winner_user_id: winnerUserId })
        .eq("id", giveawayId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["giveaways"] }),
  });
}

export function useDeleteGiveaway() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("giveaways").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["giveaways"] }),
  });
}
