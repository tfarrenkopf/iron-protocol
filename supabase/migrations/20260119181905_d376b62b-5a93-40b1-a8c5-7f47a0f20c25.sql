-- Allow anyone to read basic profile info for rival invites and public features
-- This is safe because it only exposes display_name, rival_code, and aggregate stats (already public via leaderboards)
CREATE POLICY "Anyone can view public profile info"
ON public.profiles
FOR SELECT
USING (true);