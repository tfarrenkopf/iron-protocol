-- Add active_campaign_id to profiles for pinning campaigns
ALTER TABLE public.profiles
ADD COLUMN active_campaign_id UUID REFERENCES public.collections(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_profiles_active_campaign ON public.profiles(active_campaign_id) WHERE active_campaign_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.active_campaign_id IS 'The currently pinned/active campaign the user is working on';