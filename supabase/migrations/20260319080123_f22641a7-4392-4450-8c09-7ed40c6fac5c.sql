-- Delete the auto-created duplicate badge
DELETE FROM public.badges WHERE name = 'Педро - 88';

-- Update trigger to use the correct badge name "Педро-88"
CREATE OR REPLACE FUNCTION public.check_pedro88_badge()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _post record;
  _like_count int;
  _badge_id uuid;
  _event_active boolean;
BEGIN
  SELECT active INTO _event_active FROM public.events WHERE title = 'Вирусное вращение' LIMIT 1;
  IF _event_active IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  SELECT id, content, user_id INTO _post FROM public.posts WHERE id = NEW.post_id;
  IF _post IS NULL THEN RETURN NEW; END IF;

  IF _post.content NOT LIKE '%#Педро88%' THEN
    RETURN NEW;
  END IF;

  SELECT count(*) INTO _like_count FROM public.likes WHERE post_id = NEW.post_id;
  IF _like_count < 88 THEN RETURN NEW; END IF;

  SELECT id INTO _badge_id FROM public.badges WHERE name = 'Педро-88' LIMIT 1;
  IF _badge_id IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.user_badges (user_id, badge_id)
  VALUES (_post.user_id, _badge_id)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;