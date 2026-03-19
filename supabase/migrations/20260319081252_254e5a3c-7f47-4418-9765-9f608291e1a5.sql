-- Function to find existing conversation between two users
CREATE OR REPLACE FUNCTION public.find_conversation_between(_user1 uuid, _user2 uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cp1.conversation_id
  FROM conversation_participants cp1
  JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
  WHERE cp1.user_id = _user1 AND cp2.user_id = _user2
  LIMIT 1
$$;