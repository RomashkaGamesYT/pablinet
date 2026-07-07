// Sends an email to 100@pablinet.ru that a client is waiting for a specialist.
// Uses Resend if RESEND_API_KEY is set, otherwise logs (still returns 200).
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { username, display_name, conversationId } = await req.json();
    const RESEND = Deno.env.get("RESEND_API_KEY");
    const subject = `Клиент @${username} ждёт помощи`;
    const body = `Пользователь @${username}${display_name ? ` (${display_name})` : ""} нуждается в специалисте поддержки pablinet.\n\nДиалог: ${conversationId}\n\nОткройте админку → Чаты, чтобы ответить.`;

    if (!RESEND) {
      console.warn("[support-alert] RESEND_API_KEY not set, skipping email. Payload:", { username, conversationId });
      return new Response(JSON.stringify({ sent: false, reason: "no_resend_key" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "pablinet support <support@pablinet.ru>",
        to: ["100@pablinet.ru"],
        subject,
        text: body,
      }),
    });
    if (!resp.ok) {
      const t = await resp.text();
      console.error("resend error", resp.status, t);
      return new Response(JSON.stringify({ sent: false, error: t }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ sent: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
