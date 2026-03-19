import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useConversations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get user's conversation IDs (RLS allows seeing own rows)
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

      // Get partner user_ids using security definer function
      const partnerResults = await Promise.all(
        convIds.map(async (convId) => {
          const { data } = await supabase.rpc("get_conversation_partner" as any, {
            _conversation_id: convId,
            _my_user_id: user.id,
          });
          return { convId, partnerId: data as string | null };
        })
      );

      const partnerMap = new Map(partnerResults.map((r) => [r.convId, r.partnerId]));
      const otherUserIds = [...new Set(partnerResults.map((r) => r.partnerId).filter(Boolean))] as string[];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, avatar_emoji, verified")
        .in("user_id", otherUserIds);

      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));

      // Get last message + unread count for each conversation
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

          const partnerId = partnerMap.get(conv.id);

          return {
            ...conv,
            otherUser: partnerId ? profileMap.get(partnerId) : null,
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

      // Check if conversation already exists using security definer function
      const { data: existingConvId } = await supabase
        .rpc("find_conversation_between" as any, { _user1: user.id, _user2: targetUserId });

      if (existingConvId) {
        return existingConvId as string;
      }

      // Create new conversation - generate ID client-side to avoid RLS select issue
      const convId = crypto.randomUUID();
      const { error: convError } = await supabase
        .from("conversations")
        .insert({ id: convId });
      if (convError) throw convError;

      // Add both participants
      const { error: pError } = await supabase
        .from("conversation_participants")
        .insert([
          { conversation_id: convId, user_id: user.id },
          { conversation_id: convId, user_id: targetUserId },
        ]);
      if (pError) throw pError;

      return convId;
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
