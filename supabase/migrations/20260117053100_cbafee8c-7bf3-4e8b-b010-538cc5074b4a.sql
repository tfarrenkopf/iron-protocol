-- Phase 1: Mission Collections

-- Collections table
CREATE TABLE public.collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code_name TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'shared')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_system BOOLEAN NOT NULL DEFAULT false,
  popularity_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(created_by, code_name)
);

-- Junction table for collection-mission many-to-many
CREATE TABLE public.collection_missions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(collection_id, mission_id)
);

-- Add rival_code to profiles for future RIVAL MODE share links
ALTER TABLE public.profiles 
ADD COLUMN rival_code TEXT UNIQUE DEFAULT substring(md5(random()::text) from 1 for 8);

-- Enable RLS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_missions ENABLE ROW LEVEL SECURITY;

-- Collections policies
CREATE POLICY "Users can view system collections"
  ON public.collections FOR SELECT
  USING (is_system = true);

CREATE POLICY "Users can view public collections"
  ON public.collections FOR SELECT
  USING (visibility = 'public');

CREATE POLICY "Users can view own collections"
  ON public.collections FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create own collections"
  ON public.collections FOR INSERT
  WITH CHECK (auth.uid() = created_by AND is_system = false);

CREATE POLICY "Users can update own collections"
  ON public.collections FOR UPDATE
  USING (auth.uid() = created_by AND is_system = false);

CREATE POLICY "Users can delete own collections"
  ON public.collections FOR DELETE
  USING (auth.uid() = created_by AND is_system = false);

-- Collection missions policies
CREATE POLICY "Users can view collection missions for accessible collections"
  ON public.collection_missions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.collections c 
      WHERE c.id = collection_id 
      AND (c.is_system = true OR c.visibility = 'public' OR c.created_by = auth.uid())
    )
  );

CREATE POLICY "Users can manage missions in own collections"
  ON public.collection_missions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.collections c 
      WHERE c.id = collection_id AND c.created_by = auth.uid() AND c.is_system = false
    )
  );

CREATE POLICY "Users can remove missions from own collections"
  ON public.collection_missions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.collections c 
      WHERE c.id = collection_id AND c.created_by = auth.uid() AND c.is_system = false
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON public.collections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_collections_created_by ON public.collections(created_by);
CREATE INDEX idx_collections_visibility ON public.collections(visibility);
CREATE INDEX idx_collections_is_system ON public.collections(is_system);
CREATE INDEX idx_collection_missions_collection_id ON public.collection_missions(collection_id);
CREATE INDEX idx_collection_missions_mission_id ON public.collection_missions(mission_id);
CREATE INDEX idx_profiles_rival_code ON public.profiles(rival_code);

-- Seed system collections
INSERT INTO public.collections (code_name, name, description, is_system, visibility) VALUES
  ('push-day', 'PUSH DAY', 'Chest, shoulders, and triceps focused missions', true, 'public'),
  ('pull-day', 'PULL DAY', 'Back and biceps focused missions', true, 'public'),
  ('leg-day', 'LEG DAY', 'Lower body destruction protocols', true, 'public'),
  ('full-body', 'FULL BODY', 'Complete systemic engagement', true, 'public'),
  ('quick-hits', 'QUICK HITS', 'Under 20 minute high-intensity missions', true, 'public'),
  ('endurance', 'ENDURANCE', 'High-volume stamina builders', true, 'public');