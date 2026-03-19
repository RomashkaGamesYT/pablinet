import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useConversations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get user's conversation IDs
      const { data: participations, error: pError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);
      if (pError) throw pError;
      if (!participations || participations.length === 0) return [];

      const convIds = participations.map((p) => p.conversation_id);

      // Get conversations
      const { data: conversations, error: cError } = await supabase
        .from("conversations")
        .select("*")
        .in("id", convIds)
        .order("updated_at", { ascending: false });
      if (cError) throw cError;

      // Get all participants for these conversations
      const { data: allParticipants } = await supabase
        .from("conversation_participants")
        .select("conversation_id, user_id")
        .in("conversation_id", convIds);

      // Get other user profiles
      const otherUserIds = [...new Set(
        (allParticipants || [])
          .filter((p) => p.user_id !== user.id)
          .map((p) => p.user_id)
      )];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, avatar_emoji, verified")
        .in("user_id", otherUserIds);

      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));

      // Get last message for each conversation
      const results = await Promise.all(
        (conversations || []).map(async (conv) => {
          const { data: lastMsg } = await supabase
            .from("messages")
            .select("content, created_at, sender_id, read")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          const { count: unreadCount } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .eq("read", false)
            .neq("sender_id", user.id);

          const otherUserId = (allParticipants || [])
            .find((p) => p.conversation_id === conv.id && p.user_id !== user.id)?.user_id;

          return {
            ...conv,
            otherUser: otherUserId ? profileMap.get(otherUserId) : null,
            lastMessage: lastMsg,
            unreadCount: unreadCount || 0,
          };
        })
      );

      return results;
    },
    enabled: !!user,
  });
}

export function useMessages(conversationId?: string) {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!conversationId,
    refetchInterval: 3000,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("messages")
        .insert({ conversation_id: conversationId, sender_id: user.id, content })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["messages", data.conversation_id] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useStartConversation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user) throw new Error("Not authenticated");

      // Check if conversation already exists
      const { data: myConvs } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (myConvs && myConvs.length > 0) {
        const convIds = myConvs.map((c) => c.conversation_id);
        const { data: existing } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", targetUserId)
          .in("conversation_id", convIds);

        if (existing && existing.length > 0) {
          return existing[0].conversation_id;
        }
      }

      // Create new conversation
      const { data: conv, error: convError } = await supabase
        .from("conversations")
        .insert({})
        .select()
        .single();
      if (convError) throw convError;

      // Add both participants
      const { error: pError } = await supabase
        .from("conversation_participants")
        .insert([
          { conversation_id: conv.id, user_id: user.id },
          { conversation_id: conv.id, user_id: targetUserId },
        ]);
      if (pError) throw pError;

      return conv.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      if (!user) return;
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", user.id)
        .eq("read", false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useUnreadCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["unread-messages-count", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      // Get user's conversations
      const { data: participations } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);
      if (!participations || participations.length === 0) return 0;

      const convIds = participations.map((p) => p.conversation_id);
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .in("conversation_id", convIds)
        .eq("read", false)
        .neq("sender_id", user.id);

      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 5000,
  });
}
