CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE base text; uname text; n int := 0;
BEGIN
  base := lower(regexp_replace(coalesce(split_part(NEW.email,'@',1),'user'),'[^a-z0-9]','','gi'));
  IF base = '' THEN base := 'user'; END IF;
  uname := base;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = uname) LOOP
    n := n + 1; uname := base || n::text;
  END LOOP;
  INSERT INTO public.profiles(id, username, display_name)
  VALUES (NEW.id, uname, coalesce(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', uname));
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'group' CHECK (kind IN ('group','direct')),
  name text,
  code text UNIQUE,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.channel_members (
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (channel_id, user_id)
);
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('text','voice')),
  body text,
  audio_path text,
  duration_ms int,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX messages_channel_idx ON public.messages(channel_id, created_at);
GRANT SELECT ON public.channels TO authenticated;
GRANT SELECT, DELETE ON public.channel_members TO authenticated;
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.channels, public.channel_members, public.messages TO service_role;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_member(_channel uuid, _user uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.channel_members WHERE channel_id=_channel AND user_id=_user)
$$;

CREATE POLICY "channels members" ON public.channels FOR SELECT TO authenticated USING (public.is_member(id, auth.uid()));
CREATE POLICY "members see members" ON public.channel_members FOR SELECT TO authenticated USING (public.is_member(channel_id, auth.uid()));
CREATE POLICY "leave channel" ON public.channel_members FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "messages read" ON public.messages FOR SELECT TO authenticated USING (public.is_member(channel_id, auth.uid()));
CREATE POLICY "messages send" ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid() AND public.is_member(channel_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.create_group(_name text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cid uuid; c text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  IF length(trim(_name)) = 0 OR length(_name) > 60 THEN RAISE EXCEPTION 'invalid name'; END IF;
  LOOP
    c := upper(substr(md5(random()::text),1,6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.channels WHERE code=c);
  END LOOP;
  INSERT INTO public.channels(kind,name,code,created_by) VALUES ('group',trim(_name),c,auth.uid()) RETURNING id INTO cid;
  INSERT INTO public.channel_members VALUES (cid, auth.uid());
  RETURN cid;
END $$;

CREATE OR REPLACE FUNCTION public.join_group(_code text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cid uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  SELECT id INTO cid FROM public.channels WHERE code = upper(trim(_code)) AND kind='group';
  IF cid IS NULL THEN RAISE EXCEPTION 'Código no encontrado'; END IF;
  INSERT INTO public.channel_members VALUES (cid, auth.uid()) ON CONFLICT DO NOTHING;
  RETURN cid;
END $$;

CREATE OR REPLACE FUNCTION public.start_direct(_username text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE other uuid; cid uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  SELECT id INTO other FROM public.profiles WHERE username = lower(trim(_username));
  IF other IS NULL THEN RAISE EXCEPTION 'Usuario no encontrado'; END IF;
  IF other = auth.uid() THEN RAISE EXCEPTION 'No puedes hablar contigo'; END IF;
  SELECT c.id INTO cid FROM public.channels c
    JOIN public.channel_members a ON a.channel_id=c.id AND a.user_id=auth.uid()
    JOIN public.channel_members b ON b.channel_id=c.id AND b.user_id=other
    WHERE c.kind='direct' LIMIT 1;
  IF cid IS NOT NULL THEN RETURN cid; END IF;
  INSERT INTO public.channels(kind,created_by) VALUES ('direct',auth.uid()) RETURNING id INTO cid;
  INSERT INTO public.channel_members VALUES (cid, auth.uid()), (cid, other);
  RETURN cid;
END $$;

REVOKE EXECUTE ON FUNCTION public.create_group(text), public.join_group(text), public.start_direct(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.create_group(text), public.join_group(text), public.start_direct(text) TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

CREATE POLICY "voice read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id='voice' AND public.is_member(((storage.foldername(name))[1])::uuid, auth.uid()));
CREATE POLICY "voice upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id='voice' AND public.is_member(((storage.foldername(name))[1])::uuid, auth.uid()));