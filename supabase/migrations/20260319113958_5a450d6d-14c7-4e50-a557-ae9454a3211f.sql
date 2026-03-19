CREATE TABLE public.phone_auth_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  code text NOT NULL,
  token text NOT NULL UNIQUE,
  used boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.phone_auth_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only service role can access phone_auth_codes"
  ON public.phone_auth_codes FOR ALL
  TO public
  USING (false);

CREATE INDEX idx_phone_auth_codes_token ON public.phone_auth_codes(token);
CREATE INDEX idx_phone_auth_codes_phone ON public.phone_auth_codes(phone);