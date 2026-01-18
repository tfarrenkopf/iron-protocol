-- Fix security issue: profiles_public_select
-- Change from public access to require authentication
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Fix security issue: completed_sessions_public
-- Change from public access to require authentication
DROP POLICY IF EXISTS "Anyone can view completed sessions for feed" ON public.workout_sessions;

CREATE POLICY "Authenticated users can view completed sessions for feed" 
  ON public.workout_sessions FOR SELECT 
  USING (status = 'COMPLETED' AND auth.uid() IS NOT NULL);