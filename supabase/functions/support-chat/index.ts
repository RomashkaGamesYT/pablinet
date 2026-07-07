// Support AI chat: consumes messages from support_conversations,
// generates a reply via Lovable AI, and if user asks for a specialist —
// posts an "assistant" message "Вызываю специалиста" and triggers alert.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Ты — ИИ-ассистент службы поддержки платформы pablinet (соцсеть/блог-платформа).
Отвечай на русском, коротко и по делу. Помогай с вопросами про регистрацию, статьи,
верификацию, Pepe+, розыгрыши, эфиры, баны, восстановление пароля.
Если пользователь просит человека, жалуется, недоволен ответом, задаёт сложный
вопрос требующий вмешательства администратора, или обсуждает деньги/жалобы/безопасность —
ответь ровно строкой "ВЫЗЫВАЮ СПЕЦИАЛИСТА" (без кавычек) и коротким пояснением после
переноса строки. В остальных случаях — просто помогай.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { conversationId } = await req.json();
    if (!conversationId) throw new Error("conversationId required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: conv } = await supabase
      .from("support_conversations")
      .select("*")
      .eq("id", conversationId)
      .single();
    if (!conv) throw new Error("Conversation not found");
    if (!conv.ai_active) {
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: history } = await supabase
      .from("support_messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(30);

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...(history || []).map((m: any) => ({
        role: m.role === "admin" ? "assistant" : m.role === "user" ? "user" : "assistant",
        content: m.content,
      })),
    ];

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: "google/gemini-2.5-flash", messages }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI error", aiResp.status, t);
      throw new Error("AI request failed: " + aiResp.status);
    }

    const aiJson = await aiResp.json();
    const reply: string = aiJson?.choices?.[0]?.message?.content?.trim() || "Извините, не удалось сгенерировать ответ.";

    await supabase.from("support_messages").insert({
      conversation_id: conversationId,
      sender_id: null,
      role: "assistant",
      content: reply,
    });

    const needsSpecialist = /вызываю специалиста/i.test(reply);
    if (needsSpecialist) {
      await supabase
        .from("support_conversations")
        .update({ needs_specialist: true, last_message_at: new Date().toISOString() })
        .eq("id", conversationId);

      // Fire-and-forget alert
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, display_name")
          .eq("user_id", conv.user_id)
          .maybeSingle();
        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/support-alert`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            username: profile?.username || "unknown",
            display_name: profile?.display_name || "",
            conversationId,
          }),
        });
      } catch (e) {
        console.error("alert failed", e);
      }
    } else {
      await supabase
        .from("support_conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversationId);
    }

    return new Response(JSON.stringify({ reply, needsSpecialist }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
