-- =====================================================
-- IRON PROTOCOL - Row Level Security Policies
-- =====================================================
-- All tables have RLS enabled. This file documents all policies.
-- =====================================================

-- =====================================================
-- PROFILES
-- =====================================================
CREATE POLICY "Anyone can view public profile info" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- =====================================================
-- EXERCISES
-- =====================================================
CREATE POLICY "View public or own exercises" ON public.exercises
  FOR SELECT USING (is_public = true OR auth.uid() = created_by);

CREATE POLICY "Create own private exercises" ON public.exercises
  FOR INSERT WITH CHECK (auth.uid() = created_by AND is_public = false);

CREATE POLICY "Update own exercises" ON public.exercises
  FOR UPDATE USING (auth.uid() = created_by AND is_public = false);

CREATE POLICY "Delete own exercises" ON public.exercises
  FOR DELETE USING (auth.uid() = created_by AND is_public = false);

-- =====================================================
-- MISSIONS
-- =====================================================
CREATE POLICY "View public or own missions" ON public.missions
  FOR SELECT USING (is_public = true OR auth.uid() = created_by);

CREATE POLICY "Create own private missions" ON public.missions
  FOR INSERT WITH CHECK (auth.uid() = created_by AND is_public = false);

CREATE POLICY "Update own missions" ON public.missions
  FOR UPDATE USING (auth.uid() = created_by AND is_public = false);

CREATE POLICY "Delete own missions" ON public.missions
  FOR DELETE USING (auth.uid() = created_by AND is_public = false);

-- =====================================================
-- MISSION_EXERCISES
-- =====================================================
CREATE POLICY "View mission exercises if can view mission" ON public.mission_exercises
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.missions WHERE id = mission_id AND (is_public = true OR created_by = auth.uid()))
  );

CREATE POLICY "Insert mission exercises if owns mission" ON public.mission_exercises
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.missions WHERE id = mission_id AND created_by = auth.uid())
  );

CREATE POLICY "Update mission exercises if owns mission" ON public.mission_exercises
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.missions WHERE id = mission_id AND created_by = auth.uid())
  );

CREATE POLICY "Delete mission exercises if owns mission" ON public.mission_exercises
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.missions WHERE id = mission_id AND created_by = auth.uid())
  );

-- =====================================================
-- COLLECTIONS
-- =====================================================
CREATE POLICY "View public or own collections" ON public.collections
  FOR SELECT USING (visibility = 'public' OR created_by = auth.uid() OR is_system = true);

CREATE POLICY "Create own collections" ON public.collections
  FOR INSERT WITH CHECK (auth.uid() = created_by AND is_system = false);

CREATE POLICY "Update own collections" ON public.collections
  FOR UPDATE USING (auth.uid() = created_by AND is_system = false);

CREATE POLICY "Delete own collections" ON public.collections
  FOR DELETE USING (auth.uid() = created_by AND is_system = false);

-- =====================================================
-- COLLECTION_MISSIONS
-- =====================================================
CREATE POLICY "Users can view collection missions for accessible collections" ON public.collection_missions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM collections c WHERE c.id = collection_id AND (c.visibility = 'public' OR c.created_by = auth.uid() OR c.is_system = true))
  );

CREATE POLICY "Users can manage missions in own collections" ON public.collection_missions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM collections c WHERE c.id = collection_id AND c.created_by = auth.uid() AND c.is_system = false)
  );

CREATE POLICY "Users can remove missions from own collections" ON public.collection_missions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM collections c WHERE c.id = collection_id AND c.created_by = auth.uid() AND c.is_system = false)
  );

-- =====================================================
-- WORKOUT_SESSIONS
-- =====================================================
CREATE POLICY "Users view own sessions" ON public.workout_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view completed sessions for feed" ON public.workout_sessions
  FOR SELECT USING (status = 'COMPLETED' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users insert own sessions" ON public.workout_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own sessions" ON public.workout_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout sessions" ON public.workout_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- WORKOUT_SETS
-- =====================================================
CREATE POLICY "Users view own workout sets" ON public.workout_sets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.workout_sessions WHERE id = session_id AND user_id = auth.uid())
  );

CREATE POLICY "Users insert own workout sets" ON public.workout_sets
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.workout_sessions WHERE id = session_id AND user_id = auth.uid())
  );

-- =====================================================
-- USER_WEIGHT_HISTORY
-- =====================================================
CREATE POLICY "Users view own weight history" ON public.user_weight_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own weight history" ON public.user_weight_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own weight history" ON public.user_weight_history
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own weight history" ON public.user_weight_history
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- PERSONAL_RECORDS
-- =====================================================
CREATE POLICY "Users view own PRs" ON public.personal_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own PRs" ON public.personal_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own PRs" ON public.personal_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own PRs" ON public.personal_records
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- HIIT_CONFIGS
-- =====================================================
CREATE POLICY "View public or own HIIT configs" ON public.hiit_configs
  FOR SELECT USING (is_public = true OR auth.uid() = created_by);

CREATE POLICY "Create own HIIT configs" ON public.hiit_configs
  FOR INSERT WITH CHECK (auth.uid() = created_by AND is_public = false);

CREATE POLICY "Update own HIIT configs" ON public.hiit_configs
  FOR UPDATE USING (auth.uid() = created_by AND is_public = false);

CREATE POLICY "Delete own HIIT configs" ON public.hiit_configs
  FOR DELETE USING (auth.uid() = created_by AND is_public = false);

-- =====================================================
-- ACHIEVEMENTS
-- =====================================================
CREATE POLICY "Anyone can view active achievements" ON public.achievements
  FOR SELECT USING (is_active = true AND is_hidden = false);

CREATE POLICY "Users can view hidden achievements they've unlocked" ON public.achievements
  FOR SELECT USING (
    is_hidden = true AND EXISTS (
      SELECT 1 FROM user_achievements WHERE achievement_id = achievements.id AND user_id = auth.uid()
    )
  );

-- =====================================================
-- USER_ACHIEVEMENTS
-- =====================================================
CREATE POLICY "Users view own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own achievements" ON public.user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own achievements" ON public.user_achievements
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- MILESTONES
-- =====================================================
CREATE POLICY "Anyone can view active milestones" ON public.milestones
  FOR SELECT USING (is_active = true);

-- =====================================================
-- USER_MILESTONES
-- =====================================================
CREATE POLICY "Users view own milestones" ON public.user_milestones
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own milestones" ON public.user_milestones
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own milestones" ON public.user_milestones
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- COSMETICS
-- =====================================================
CREATE POLICY "Anyone can view active cosmetics" ON public.cosmetics
  FOR SELECT USING (is_active = true);

-- =====================================================
-- USER_COSMETICS
-- =====================================================
CREATE POLICY "Users view own cosmetics" ON public.user_cosmetics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own cosmetics" ON public.user_cosmetics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own cosmetics" ON public.user_cosmetics
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- BOSS_TEMPLATES
-- =====================================================
CREATE POLICY "Anyone can view boss templates" ON public.boss_templates
  FOR SELECT USING (is_active = true);

-- =====================================================
-- WEEKLY_BOSSES
-- =====================================================
CREATE POLICY "Anyone can view weekly bosses" ON public.weekly_bosses
  FOR SELECT USING (true);

-- =====================================================
-- WEEKLY_BOSS_DAMAGE
-- =====================================================
CREATE POLICY "Users view own boss damage" ON public.weekly_boss_damage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own boss damage" ON public.weekly_boss_damage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- USER_ROLES
-- =====================================================
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add handler role to themselves" ON public.user_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id AND role = 'handler');

CREATE POLICY "Users can remove their own handler role" ON public.user_roles
  FOR DELETE USING (auth.uid() = user_id AND role = 'handler');

-- =====================================================
-- SQUADS
-- =====================================================
CREATE POLICY "Anyone can view squads by invite code" ON public.squads
  FOR SELECT USING (true);

CREATE POLICY "Handlers view own squads" ON public.squads
  FOR SELECT USING (handler_id = auth.uid());

CREATE POLICY "Members view their squads" ON public.squads
  FOR SELECT USING (is_squad_member(auth.uid(), id));

CREATE POLICY "Handlers create squads" ON public.squads
  FOR INSERT WITH CHECK (auth.uid() = handler_id AND has_role(auth.uid(), 'handler'));

CREATE POLICY "Handlers update squads" ON public.squads
  FOR UPDATE USING (auth.uid() = handler_id);

CREATE POLICY "Handlers delete squads" ON public.squads
  FOR DELETE USING (auth.uid() = handler_id);

-- =====================================================
-- SQUAD_MEMBERS
-- =====================================================
CREATE POLICY "Users view own memberships" ON public.squad_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Handlers view squad members" ON public.squad_members
  FOR SELECT USING (is_squad_handler(auth.uid(), squad_id));

CREATE POLICY "Users join squads" ON public.squad_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update membership" ON public.squad_members
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users leave squads" ON public.squad_members
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- MISSION_ASSIGNMENTS
-- =====================================================
CREATE POLICY "Handlers view assignments" ON public.mission_assignments
  FOR SELECT USING (handler_id = auth.uid());

CREATE POLICY "Users view their assignments" ON public.mission_assignments
  FOR SELECT USING (
    (assignee_type = 'USER' AND assignee_id = auth.uid()) OR
    (assignee_type = 'SQUAD' AND EXISTS (
      SELECT 1 FROM squad_members WHERE squad_id = assignee_id AND user_id = auth.uid()
    ))
  );

CREATE POLICY "Handlers create assignments" ON public.mission_assignments
  FOR INSERT WITH CHECK (auth.uid() = handler_id AND has_role(auth.uid(), 'handler'));

CREATE POLICY "Handlers update assignments" ON public.mission_assignments
  FOR UPDATE USING (handler_id = auth.uid());

CREATE POLICY "Athletes update assignment status" ON public.mission_assignments
  FOR UPDATE USING (
    (assignee_type = 'USER' AND assignee_id = auth.uid()) OR
    (assignee_type = 'SQUAD' AND EXISTS (
      SELECT 1 FROM squad_members WHERE squad_id = assignee_id AND user_id = auth.uid()
    ))
  );

CREATE POLICY "Handlers delete assignments" ON public.mission_assignments
  FOR DELETE USING (handler_id = auth.uid());

-- =====================================================
-- RIVALRIES
-- =====================================================
CREATE POLICY "Users view own rivalries" ON public.rivalries
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = rival_id);

CREATE POLICY "Users create rivalries" ON public.rivalries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own rivalries" ON public.rivalries
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================
CREATE POLICY "Users view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = recipient_user_id);

CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = recipient_user_id);

CREATE POLICY "Users delete own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = recipient_user_id);

-- =====================================================
-- USER_NOTIFICATION_PREFERENCES
-- =====================================================
CREATE POLICY "Users view own notification preferences" ON public.user_notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own notification preferences" ON public.user_notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own notification preferences" ON public.user_notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- FEEDBACK
-- =====================================================
CREATE POLICY "Users insert own feedback" ON public.feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own feedback" ON public.feedback
  FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- CAMPAIGN_COMPLETIONS
-- =====================================================
CREATE POLICY "Users view own campaign completions" ON public.campaign_completions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view campaign completions for leaderboards" ON public.campaign_completions
  FOR SELECT USING (true);

CREATE POLICY "Users insert own campaign completions" ON public.campaign_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- USER_CAMPAIGN_PROGRESS
-- =====================================================
CREATE POLICY "Users view own campaign progress" ON public.user_campaign_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own campaign progress" ON public.user_campaign_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own campaign progress" ON public.user_campaign_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- WAR_REPORT_CAMPAIGN_SNAPSHOTS
-- =====================================================
CREATE POLICY "Anyone can view war report snapshots" ON public.war_report_campaign_snapshots
  FOR SELECT USING (true);
