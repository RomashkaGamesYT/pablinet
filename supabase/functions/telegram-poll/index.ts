import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/telegram';
const MAX_RUNTIME_MS = 55_000;
const MIN_REMAINING_MS = 5_000;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), { status: 500, headers: corsHeaders });

  const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY');
  if (!TELEGRAM_API_KEY) return new Response(JSON.stringify({ error: 'TELEGRAM_API_KEY not configured' }), { status: 500, headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let totalProcessed = 0;

  // Read initial offset
  const { data: state, error: stateErr } = await supabase
    .from('telegram_bot_state')
    .select('update_offset')
    .eq('id', 1)
    .single();

  if (stateErr) {
    return new Response(JSON.stringify({ error: stateErr.message }), { status: 500, headers: corsHeaders });
  }

  let currentOffset = state.update_offset;

  while (true) {
    const elapsed = Date.now() - startTime;
    const remainingMs = MAX_RUNTIME_MS - elapsed;
    if (remainingMs < MIN_REMAINING_MS) break;

    const timeout = Math.min(50, Math.floor(remainingMs / 1000) - 5);
    if (timeout < 1) break;

    const response = await fetch(`${GATEWAY_URL}/getUpdates`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': TELEGRAM_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        offset: currentOffset,
        timeout,
        allowed_updates: ['message'],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return new Response(JSON.stringify({ error: data }), { status: 502, headers: corsHeaders });
    }

    const updates = data.result ?? [];
    if (updates.length === 0) continue;

    for (const update of updates) {
      const message = update.message;
      if (!message?.text) continue;

      const chatId = message.chat.id;
      const text = message.text.trim();
      const telegramUsername = message.from?.username || null;

      // Handle /start with verification token
      if (text.startsWith('/start verify_')) {
        const token = text.replace('/start verify_', '').trim();
        await handleVerifyToken(supabase, chatId, token, LOVABLE_API_KEY, TELEGRAM_API_KEY);
        totalProcessed++;
        continue;
      }

      if (text === '/start') {
        await sendTelegramMessage(chatId, 
          '👋 Привет! Я бот соцсети нэт.\n\n' +
          '🔥 Чтобы подать заявку на бейдж Flame, отправь свой username.\n' +
          '📱 Если ты входишь по номеру телефона — перейди по ссылке из приложения.\n\n' +
          'Например: @myusername',
          LOVABLE_API_KEY, TELEGRAM_API_KEY
        );
      } else if (text.startsWith('@') || text.startsWith('/verify ')) {
        const username = text.replace('/verify ', '').replace('@', '').trim();
        
        if (!username) {
          await sendTelegramMessage(chatId, '❌ Укажи username. Например: @myusername', LOVABLE_API_KEY, TELEGRAM_API_KEY);
          continue;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id, username, display_name')
          .eq('username', username)
          .single();

        if (!profile) {
          await sendTelegramMessage(chatId, `❌ Пользователь @${username} не найден в соцсети нэт.`, LOVABLE_API_KEY, TELEGRAM_API_KEY);
          continue;
        }

        const { data: existing } = await supabase
          .from('verification_requests')
          .select('id, status')
          .eq('site_username', username)
          .eq('status', 'pending')
          .maybeSingle();

        if (existing) {
          await sendTelegramMessage(chatId, '⏳ Заявка на верификацию уже подана и ожидает рассмотрения.', LOVABLE_API_KEY, TELEGRAM_API_KEY);
          continue;
        }

        const { data: flameBadge } = await supabase
          .from('badges')
          .select('id')
          .eq('name', 'Flame')
          .single();

        if (flameBadge) {
          const { data: hasBadge } = await supabase
            .from('user_badges')
            .select('id')
            .eq('user_id', profile.user_id)
            .eq('badge_id', flameBadge.id)
            .maybeSingle();

          if (hasBadge) {
            await sendTelegramMessage(chatId, '✅ У пользователя @' + username + ' уже есть бейдж Flame!', LOVABLE_API_KEY, TELEGRAM_API_KEY);
            continue;
          }
        }

        await supabase.from('verification_requests').insert({
          telegram_chat_id: chatId,
          telegram_username: telegramUsername,
          site_username: username,
          status: 'pending',
        });

        await sendTelegramMessage(chatId, 
          `✅ Заявка на верификацию для @${username} отправлена!\n\n` +
          'Админ рассмотрит её в ближайшее время. Ты получишь уведомление.',
          LOVABLE_API_KEY, TELEGRAM_API_KEY
        );

        totalProcessed++;
      } else {
        await sendTelegramMessage(chatId, 
          'Отправь свой username из соцсети нэт для подачи заявки на бейдж 🔥 Flame.\n\nНапример: @myusername',
          LOVABLE_API_KEY, TELEGRAM_API_KEY
        );
      }
    }

    // Advance offset
    const newOffset = Math.max(...updates.map((u: any) => u.update_id)) + 1;
    await supabase
      .from('telegram_bot_state')
      .update({ update_offset: newOffset, updated_at: new Date().toISOString() })
      .eq('id', 1);

    currentOffset = newOffset;
  }

  return new Response(JSON.stringify({ ok: true, processed: totalProcessed }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});

async function handleVerifyToken(
  supabase: any, 
  chatId: number, 
  token: string, 
  lovableKey: string, 
  telegramKey: string
) {
  // Look up the token in phone_auth_codes
  const { data: authCode, error } = await supabase
    .from('phone_auth_codes')
    .select('*')
    .eq('token', token)
    .eq('used', false)
    .gte('expires_at', new Date().toISOString())
    .maybeSingle();

  if (error || !authCode) {
    await sendTelegramMessage(chatId, '❌ Ссылка недействительна или истекла. Запросите новый код.', lovableKey, telegramKey);
    return;
  }

  // Send the code to the user
  const phone = authCode.phone;
  const maskedPhone = phone.slice(0, 3) + '****' + phone.slice(-4);
  
  await sendTelegramMessage(chatId, 
    `📱 Код верификации для номера ${maskedPhone}:\n\n` +
    `<b>${authCode.code}</b>\n\n` +
    '⏱ Код действителен 10 минут. Введите его на сайте.',
    lovableKey, telegramKey
  );
}

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
