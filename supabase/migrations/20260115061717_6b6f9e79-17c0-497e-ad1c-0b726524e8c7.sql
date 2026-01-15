-- =====================================================
-- HANDLER MODE: DATABASE SCHEMA (Complete)
-- =====================================================

-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('user', 'handler');

-- 2. User Roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. RLS for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add handler role to themselves"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id AND role = 'handler');

CREATE POLICY "Users can remove their own handler role"
  ON public.user_roles FOR DELETE
  USING (auth.uid() = user_id AND role = 'handler');

-- 5. Squads table
CREATE TABLE public.squads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handler_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code_name TEXT NOT NULL,
  description TEXT,
  invite_code TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;

-- 6. Squad Members table
CREATE TABLE public.squad_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  share_stats BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (squad_id, user_id)
);

ALTER TABLE public.squad_members ENABLE ROW LEVEL SECURITY;

-- 7. Mission Assignments table
CREATE TABLE public.mission_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handler_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mission_snapshot JSONB NOT NULL,
  assignee_type TEXT NOT NULL CHECK (assignee_type IN ('USER', 'SQUAD')),
  assignee_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  due_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_session_id UUID REFERENCES public.workout_sessions(id) ON DELETE SET NULL
);

ALTER TABLE public.mission_assignments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- NOW ADD ALL RLS POLICIES (tables exist)
-- =====================================================

-- Squads RLS
CREATE POLICY "Handlers view own squads"
  ON public.squads FOR SELECT
  USING (handler_id = auth.uid());

CREATE POLICY "Members view their squads"
  ON public.squads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.squad_members
      WHERE squad_members.squad_id = squads.id
      AND squad_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone view by invite code"
  ON public.squads FOR SELECT
  USING (true);

CREATE POLICY "Handlers create squads"
  ON public.squads FOR INSERT
  WITH CHECK (
    auth.uid() = handler_id 
    AND public.has_role(auth.uid(), 'handler')
  );

CREATE POLICY "Handlers update squads"
  ON public.squads FOR UPDATE
  USING (auth.uid() = handler_id);

CREATE POLICY "Handlers delete squads"
  ON public.squads FOR DELETE
  USING (auth.uid() = handler_id);

-- Squad Members RLS
CREATE POLICY "Users view own memberships"
  ON public.squad_members FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Handlers view squad members"
  ON public.squad_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.squads
      WHERE squads.id = squad_members.squad_id
      AND squads.handler_id = auth.uid()
    )
  );

CREATE POLICY "Users join squads"
  ON public.squad_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users leave squads"
  ON public.squad_members FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users update membership"
  ON public.squad_members FOR UPDATE
  USING (auth.uid() = user_id);

-- Mission Assignments RLS
CREATE POLICY "Handlers view assignments"
  ON public.mission_assignments FOR SELECT
  USING (handler_id = auth.uid());

CREATE POLICY "Users view their assignments"
  ON public.mission_assignments FOR SELECT
  USING (
    (assignee_type = 'USER' AND assignee_id = auth.uid())
    OR
    (assignee_type = 'SQUAD' AND EXISTS (
      SELECT 1 FROM public.squad_members
      WHERE squad_members.squad_id = mission_assignments.assignee_id
      AND squad_members.user_id = auth.uid()
    ))
  );

CREATE POLICY "Handlers create assignments"
  ON public.mission_assignments FOR INSERT
  WITH CHECK (
    auth.uid() = handler_id
    AND public.has_role(auth.uid(), 'handler')
  );

CREATE POLICY "Handlers update assignments"
  ON public.mission_assignments FOR UPDATE
  USING (handler_id = auth.uid());

CREATE POLICY "Athletes update assignment status"
  ON public.mission_assignments FOR UPDATE
  USING (
    (assignee_type = 'USER' AND assignee_id = auth.uid())
    OR
    (assignee_type = 'SQUAD' AND EXISTS (
      SELECT 1 FROM public.squad_members
      WHERE squad_members.squad_id = mission_assignments.assignee_id
      AND squad_members.user_id = auth.uid()
    ))
  );

CREATE POLICY "Handlers delete assignments"
  ON public.mission_assignments FOR DELETE
  USING (handler_id = auth.uid());

-- Function to get user assignments
CREATE OR REPLACE FUNCTION public.get_user_assignments(_user_id UUID)
RETURNS TABLE (
  id UUID,
  handler_id UUID,
  mission_snapshot JSONB,
  assignee_type TEXT,
  status TEXT,
  assigned_at TIMESTAMP WITH TIME ZONE,
  due_at TIMESTAMP WITH TIME ZONE,
  handler_name TEXT,
  squad_name TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ma.id,
    ma.handler_id,
    ma.mission_snapshot,
    ma.assignee_type,
    ma.status,
    ma.assigned_at,
    ma.due_at,
    p.display_name as handler_name,
    CASE 
      WHEN ma.assignee_type = 'SQUAD' THEN s.name
      ELSE NULL
    END as squad_name
  FROM public.mission_assignments ma
  LEFT JOIN public.profiles p ON p.id = ma.handler_id
  LEFT JOIN public.squads s ON ma.assignee_type = 'SQUAD' AND s.id = ma.assignee_id
  WHERE 
    ma.status != 'COMPLETED'
    AND (
      (ma.assignee_type = 'USER' AND ma.assignee_id = _user_id)
      OR
      (ma.assignee_type = 'SQUAD' AND EXISTS (
        SELECT 1 FROM public.squad_members sm
        WHERE sm.squad_id = ma.assignee_id
        AND sm.user_id = _user_id
      ))
    )
  ORDER BY ma.due_at ASC NULLS LAST, ma.assigned_at DESC
$$;

-- Trigger for squads updated_at
CREATE TRIGGER update_squads_updated_at
  BEFORE UPDATE ON public.squads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();