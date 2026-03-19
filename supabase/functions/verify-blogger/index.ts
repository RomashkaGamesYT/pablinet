import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/telegram';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), { status: 500, headers: corsHeaders });

  const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY');
  if (!TELEGRAM_API_KEY) return new Response(JSON.stringify({ error: 'TELEGRAM_API_KEY not configured' }), { status: 500, headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Verify the caller is an admin
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'No authorization header' }), { status: 401, headers: corsHeaders });
  }

  const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  }

  // Check admin role
  const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders });
  }

  const { requestId, action, rejectionReason } = await req.json();
  if (!requestId || !['approve', 'reject'].includes(action)) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400, headers: corsHeaders });
  }

  // Get the verification request
  const { data: request, error: reqError } = await supabase
    .from('verification_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (reqError || !request) {
    return new Response(JSON.stringify({ error: 'Request not found' }), { status: 404, headers: corsHeaders });
  }

  if (request.status !== 'pending') {
    return new Response(JSON.stringify({ error: 'Request already processed' }), { status: 400, headers: corsHeaders });
  }

  if (action === 'approve') {
    // Find the Flame badge
    const { data: flameBadge } = await supabase
      .from('badges')
      .select('id')
      .eq('name', 'Flame')
      .single();

    if (!flameBadge) {
      return new Response(JSON.stringify({ error: 'Flame badge not found. Create it first.' }), { status: 400, headers: corsHeaders });
    }

    // Find the user by username
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('username', request.site_username)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: corsHeaders });
    }

    // Assign Flame badge
    await supabase.from('user_badges').upsert(
      { user_id: profile.user_id, badge_id: flameBadge.id },
      { onConflict: 'user_id,badge_id' }
    );

    // Update request status
    await supabase
      .from('verification_requests')
      .update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: user.id })
      .eq('id', requestId);

    // Notify via Telegram
    await sendTelegramMessage(
      request.telegram_chat_id,
      '🔥 Поздравляем! Твоя заявка одобрена — бейдж Flame выдан в соцсети нэт!',
      LOVABLE_API_KEY, TELEGRAM_API_KEY
    );
  } else {
    // Reject
    await supabase
      .from('verification_requests')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString(), reviewed_by: user.id })
      .eq('id', requestId);

    await sendTelegramMessage(
      request.telegram_chat_id,
      '❌ К сожалению, твоя заявка на бейдж Flame отклонена.',
      LOVABLE_API_KEY, TELEGRAM_API_KEY
    );
  }

  return new Response(JSON.stringify({ ok: true, action }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});

async function sendTelegramMessage(chatId: number, text: string, lovableKey: string, telegramKey: string) {
  await fetch(`${GATEWAY_URL}/sendMessage`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableKey}`,
      'X-Connection-Api-Key': telegramKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
}
