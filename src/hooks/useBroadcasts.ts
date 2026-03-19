import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

const ALLOWED_USERNAMES = ["net", "cooling"];

export function useCanBroadcast() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["can-broadcast", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("profiles")
        .select("username")
        .eq("user_id", user.id)
        .single();
      return ALLOWED_USERNAMES.includes((data?.username || "").toLowerCase());
    },
    enabled: !!user,
  });
}

export function useActiveBroadcast() {
  return useQuery({
    queryKey: ["active-broadcast"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("broadcasts")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000,
  });
}

export function useBroadcasterProfile(userId?: string) {
  return useQuery({
    queryKey: ["broadcaster-profile", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();
      return data;
    },
    enabled: !!userId,
  });
}

export function useStartBroadcast() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (title: string) => {
      if (!user) throw new Error("Not authenticated");
      // End any existing active broadcasts first
      await supabase.from("broadcasts").update({ active: false }).eq("user_id", user.id).eq("active", true);
      const { data, error } = await supabase
        .from("broadcasts")
        .insert({ user_id: user.id, title, active: true })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-broadcast"] });
    },
  });
}

export function useStopBroadcast() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (broadcastId: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("broadcasts")
        .update({ active: false })
        .eq("id", broadcastId)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-broadcast"] });
    },
  });
}

export function useSendBroadcastMessage() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ broadcastId, content }: { broadcastId: string; content: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("broadcast_messages")
        .insert({ broadcast_id: broadcastId, user_id: user.id, content });
      if (error) throw error;
    },
  });
}

export function useBroadcastMessages(broadcastId?: string) {
  const [messages, setMessages] = useState<any[]>([]);

  // Initial fetch
  useEffect(() => {
    if (!broadcastId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("broadcast_messages")
        .select("*")
        .eq("broadcast_id", broadcastId)
        .order("created_at", { ascending: true })
        .limit(200);
      setMessages(data || []);
    };

    fetchMessages();

    // Realtime subscription
    const channel = supabase
      .channel(`broadcast-${broadcastId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "broadcast_messages",
          filter: `broadcast_id=eq.${broadcastId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [broadcastId]);

  return messages;
}
