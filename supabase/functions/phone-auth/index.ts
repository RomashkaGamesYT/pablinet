import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { action, phone, code, displayName, username } = await req.json();

    if (action === 'request_code') {
      if (!phone || phone.length < 10) {
        return jsonResponse({ error: 'Введите корректный номер телефона' }, 400);
      }

      // Normalize phone
      const normalizedPhone = phone.replace(/\D/g, '');

      // Generate 6-digit code and unique token
      const authCode = String(Math.floor(100000 + Math.random() * 900000));
      const token = crypto.randomUUID().replace(/-/g, '').substring(0, 16);

      // Invalidate old codes for this phone
      await supabase
        .from('phone_auth_codes')
        .update({ used: true })
        .eq('phone', normalizedPhone)
        .eq('used', false);

      // Store new code
      const { error: insertErr } = await supabase
        .from('phone_auth_codes')
        .insert({ phone: normalizedPhone, code: authCode, token });

      if (insertErr) {
        console.error('Insert error:', insertErr);
        return jsonResponse({ error: 'Ошибка создания кода' }, 500);
      }

      return jsonResponse({ token, message: 'Код создан. Откройте Telegram-бота для получения.' });
    }

    if (action === 'verify_code') {
      if (!phone || !code) {
        return jsonResponse({ error: 'Введите номер и код' }, 400);
      }

      const normalizedPhone = phone.replace(/\D/g, '');

      // Find valid code
      const { data: authCode, error: findErr } = await supabase
        .from('phone_auth_codes')
        .select('*')
        .eq('phone', normalizedPhone)
        .eq('code', code)
        .eq('used', false)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (findErr || !authCode) {
        return jsonResponse({ error: 'Неверный или просроченный код' }, 400);
      }

      // Mark code as used
      await supabase
        .from('phone_auth_codes')
        .update({ used: true })
        .eq('id', authCode.id);

      // Find or create user with phone-based email
      const phoneEmail = `${normalizedPhone}@phone.net.local`;

      // Check if user exists
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const existingUser = users?.find((u: any) => u.email === phoneEmail);

      let userId: string;

      if (existingUser) {
        userId = existingUser.id;
      } else {
        // Create new user - need displayName and username for registration
        if (!displayName || !username) {
          return jsonResponse({ error: 'Для регистрации укажите имя и юзернейм', needsRegistration: true }, 400);
        }

        const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
          email: phoneEmail,
          email_confirm: true,
          user_metadata: {
            display_name: displayName,
            username: username,
            phone: normalizedPhone,
          },
        });

        if (createErr) {
          console.error('Create user error:', createErr);
          return jsonResponse({ error: 'Ошибка создания аккаунта' }, 500);
        }

        userId = newUser.user.id;
      }

      // Generate magic link for sign-in
      const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: phoneEmail,
      });

      if (linkErr || !linkData) {
        console.error('Generate link error:', linkErr);
        return jsonResponse({ error: 'Ошибка авторизации' }, 500);
      }

      const hashedToken = linkData.properties?.hashed_token;
      if (!hashedToken) {
        return jsonResponse({ error: 'Ошибка генерации токена' }, 500);
      }

      return jsonResponse({ 
        hashed_token: hashedToken, 
        email: phoneEmail,
        isNewUser: !existingUser 
      });
    }

    return jsonResponse({ error: 'Неизвестное действие' }, 400);
  } catch (err) {
    console.error('Phone auth error:', err);
    return jsonResponse({ error: 'Внутренняя ошибка сервера' }, 500);
  }
});

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
