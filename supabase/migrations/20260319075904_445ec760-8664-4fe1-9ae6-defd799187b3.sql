-- Create the Pedro-88 badge
INSERT INTO public.badges (name, description, icon_url)
VALUES ('Педро - 88', 'Награда за 88 лайков на посте с #Педро88 в ивенте «Вирусное вращение»', 'https://em-content.zobj.net/source/apple/391/man-dancing_1f57a.png');

-- Create trigger function to auto-award badge
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
  -- Check if the Вирусное вращение event is active
  SELECT active INTO _event_active FROM public.events WHERE title = 'Вирусное вращение' LIMIT 1;
  IF _event_active IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  -- Get the post
  SELECT id, content, user_id INTO _post FROM public.posts WHERE id = NEW.post_id;
  IF _post IS NULL THEN RETURN NEW; END IF;

  -- Check if post contains #Педро88
  IF _post.content NOT LIKE '%#Педро88%' THEN
    RETURN NEW;
  END IF;

  -- Count likes
  SELECT count(*) INTO _like_count FROM public.likes WHERE post_id = NEW.post_id;
  IF _like_count < 88 THEN RETURN NEW; END IF;

  -- Get badge id
  SELECT id INTO _badge_id FROM public.badges WHERE name = 'Педро - 88' LIMIT 1;
  IF _badge_id IS NULL THEN RETURN NEW; END IF;

  -- Award badge if not already awarded
  INSERT INTO public.user_badges (user_id, badge_id)
  VALUES (_post.user_id, _badge_id)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Create trigger on likes table
CREATE TRIGGER on_like_check_pedro88
  AFTER INSERT ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION public.check_pedro88_badge();