-- Function to get conversation partner user_id
CREATE OR REPLACE FUNCTION public.get_conversation_partner(_conversation_id uuid, _my_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id
  FROM conversation_participants
  WHERE conversation_id = _conversation_id AND user_id != _my_user_id
  LIMIT 1
$$;