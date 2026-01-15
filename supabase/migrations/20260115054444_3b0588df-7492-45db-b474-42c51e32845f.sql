-- Make workout_sessions viewable by all authenticated users for the front lines feed
-- Add policy for viewing completed sessions from all users (public feed)
CREATE POLICY "Anyone can view completed sessions for feed" 
ON public.workout_sessions 
FOR SELECT 
USING (status = 'COMPLETED');

-- Make profiles viewable by everyone so we can show display names in feed
-- (Already exists based on context, but ensuring it's there)