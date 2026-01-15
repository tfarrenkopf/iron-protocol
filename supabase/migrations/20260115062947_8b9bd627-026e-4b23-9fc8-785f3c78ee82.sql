-- Create security definer functions to break RLS recursion

-- Function to check if user is a member of a squad
CREATE OR REPLACE FUNCTION public.is_squad_member(_user_id uuid, _squad_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.squad_members
    WHERE user_id = _user_id
      AND squad_id = _squad_id
  )
$$;

-- Function to check if user is the handler of a squad
CREATE OR REPLACE FUNCTION public.is_squad_handler(_user_id uuid, _squad_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.squads
    WHERE id = _squad_id
      AND handler_id = _user_id
  )
$$;

-- Drop existing problematic policies on squads
DROP POLICY IF EXISTS "Members view their squads" ON public.squads;
DROP POLICY IF EXISTS "Handlers view own squads" ON public.squads;
DROP POLICY IF EXISTS "Anyone view by invite code" ON public.squads;

-- Drop existing problematic policies on squad_members
DROP POLICY IF EXISTS "Handlers view squad members" ON public.squad_members;
DROP POLICY IF EXISTS "Users view own memberships" ON public.squad_members;

-- Recreate squads policies using security definer functions
CREATE POLICY "Handlers view own squads" 
ON public.squads 
FOR SELECT 
USING (handler_id = auth.uid());

CREATE POLICY "Members view their squads" 
ON public.squads 
FOR SELECT 
USING (public.is_squad_member(auth.uid(), id));

CREATE POLICY "Anyone can view squads by invite code" 
ON public.squads 
FOR SELECT 
USING (true);

-- Recreate squad_members policies using security definer functions
CREATE POLICY "Users view own memberships" 
ON public.squad_members 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Handlers view squad members" 
ON public.squad_members 
FOR SELECT 
USING (public.is_squad_handler(auth.uid(), squad_id));