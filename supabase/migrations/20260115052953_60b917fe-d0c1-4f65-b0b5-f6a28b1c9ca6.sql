-- Add DELETE policy for user_weight_history so users can delete their own weight history
CREATE POLICY "Users delete own weight history" 
ON public.user_weight_history 
FOR DELETE 
USING (auth.uid() = user_id);