-- =====================================================
-- IRON PROTOCOL - Seed Data
-- Run this after migrations to populate initial data
-- =====================================================

-- =====================================================
-- 1. HIIT CONFIGS (Public Tabata Presets)
-- =====================================================
INSERT INTO public.hiit_configs (name, code_name, work_duration_sec, rest_duration_sec, rounds, is_public, created_by) VALUES
('Classic Tabata', 'classic_tabata', 20, 10, 8, true, NULL),
('Extended Tabata', 'extended_tabata', 20, 10, 12, true, NULL),
('Power Intervals', 'power_intervals', 30, 15, 8, true, NULL),
('Endurance Build', 'endurance_build', 40, 20, 10, true, NULL),
('Sprint Series', 'sprint_series', 15, 10, 16, true, NULL)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 2. BOSS TEMPLATES (Weekly Raid Bosses)
-- =====================================================
INSERT INTO public.boss_templates (name, code_name, lore, weaknesses, weakness_multiplier, is_active, sort_order) VALUES
(
  'Iron Sentinel',
  'iron_sentinel',
  'An ancient automaton forged in the depths of the Protocol. Its iron frame absorbs punishment, but targeted strikes to its joints can bring it down.',
  ARRAY['CHEST', 'SHOULDERS', 'TRICEPS'],
  1.25,
  true,
  1
),
(
  'Void Leviathan',
  'void_leviathan',
  'A creature from beyond the veil, sustained by dark energy. Its incorporeal form is vulnerable to grounded, powerful movements.',
  ARRAY['BACK', 'BICEPS', 'CORE'],
  1.25,
  true,
  2
),
(
  'Titanforged Colossus',
  'titanforged_colossus',
  'The pinnacle of Protocol engineering. This massive construct requires overwhelming force to topple.',
  ARRAY['LEGS', 'GLUTES', 'CALVES'],
  1.25,
  true,
  3
),
(
  'Storm Harbinger',
  'storm_harbinger',
  'A being of pure electrical fury. Its erratic movements make it difficult to hit, but consistent pressure wears it down.',
  ARRAY['CORE', 'SHOULDERS', 'BACK'],
  1.30,
  true,
  4
),
(
  'Crimson Reaper',
  'crimson_reaper',
  'Swift and deadly, the Reaper strikes without warning. Only those with superior conditioning can match its relentless assault.',
  ARRAY['CARDIO', 'LEGS', 'CORE'],
  1.20,
  true,
  5
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 3. ACHIEVEMENTS
-- =====================================================
INSERT INTO public.achievements (code_name, name, description, category, trigger_type, trigger_value, xp_reward, rarity, is_hidden, hint) VALUES
-- Session-based achievements
('first_blood', 'First Blood', 'Complete your first mission', 'SESSIONS', 'COMPLETED_MISSIONS', 1, 100, 'common', false, 'Complete any mission'),
('getting_started', 'Getting Started', 'Complete 5 missions', 'SESSIONS', 'COMPLETED_MISSIONS', 5, 250, 'common', false, 'Keep completing missions'),
('dedicated', 'Dedicated', 'Complete 25 missions', 'SESSIONS', 'COMPLETED_MISSIONS', 25, 500, 'uncommon', false, 'Consistency is key'),
('veteran', 'Veteran', 'Complete 100 missions', 'SESSIONS', 'COMPLETED_MISSIONS', 100, 1000, 'rare', false, 'Long-term commitment'),
('legend', 'Legend', 'Complete 500 missions', 'SESSIONS', 'COMPLETED_MISSIONS', 500, 5000, 'legendary', true, 'Become legendary'),

-- Weight achievements
('weight_mover', 'Weight Mover', 'Lift 10,000 lbs total', 'WEIGHT', 'TOTAL_WEIGHT', 10000, 200, 'common', false, 'Every rep counts'),
('iron_lifter', 'Iron Lifter', 'Lift 100,000 lbs total', 'WEIGHT', 'TOTAL_WEIGHT', 100000, 500, 'uncommon', false, 'Keep pushing'),
('steel_titan', 'Steel Titan', 'Lift 1,000,000 lbs total', 'WEIGHT', 'TOTAL_WEIGHT', 1000000, 2000, 'rare', false, 'A true titan'),
('legendary_lifter', 'Legendary Lifter', 'Lift 10,000,000 lbs total', 'WEIGHT', 'TOTAL_WEIGHT', 10000000, 10000, 'legendary', true, 'Legendary volume'),

-- Combo achievements
('combo_starter', 'Combo Starter', 'Achieve a 10 combo', 'COMBO', 'MAX_COMBO', 10, 100, 'common', false, 'Chain your sets'),
('combo_master', 'Combo Master', 'Achieve a 25 combo', 'COMBO', 'MAX_COMBO', 25, 300, 'uncommon', false, 'Maintain momentum'),
('combo_king', 'Combo King', 'Achieve a 50 combo', 'COMBO', 'MAX_COMBO', 50, 750, 'rare', false, 'Unstoppable chains'),
('combo_legend', 'Combo Legend', 'Achieve a 100 combo', 'COMBO', 'MAX_COMBO', 100, 2000, 'legendary', true, 'Perfect execution'),

-- Boss achievements
('boss_slayer', 'Boss Slayer', 'Deal damage to a weekly boss', 'BOSS', 'BOSS_DAMAGE', 1, 150, 'common', false, 'Join the raid'),
('boss_hunter', 'Boss Hunter', 'Deal 50,000 total boss damage', 'BOSS', 'BOSS_DAMAGE', 50000, 500, 'uncommon', false, 'Consistent contribution'),
('boss_destroyer', 'Boss Destroyer', 'Deal 500,000 total boss damage', 'BOSS', 'BOSS_DAMAGE', 500000, 2000, 'rare', true, 'Elite raider')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 4. MILESTONES
-- =====================================================
INSERT INTO public.milestones (code_name, name, description, category, target_value, tier, is_active) VALUES
-- Weight milestones
('weight_10k', '10K Club', 'Lift 10,000 lbs total', 'WEIGHT', 10000, 1, true),
('weight_50k', '50K Club', 'Lift 50,000 lbs total', 'WEIGHT', 50000, 2, true),
('weight_100k', '100K Club', 'Lift 100,000 lbs total', 'WEIGHT', 100000, 3, true),
('weight_500k', '500K Club', 'Lift 500,000 lbs total', 'WEIGHT', 500000, 4, true),
('weight_1m', 'Million Pound Club', 'Lift 1,000,000 lbs total', 'WEIGHT', 1000000, 5, true),

-- Sets milestones
('sets_100', 'Century Sets', 'Complete 100 sets', 'SETS', 100, 1, true),
('sets_500', 'Set Master', 'Complete 500 sets', 'SETS', 500, 2, true),
('sets_1000', 'Set Legend', 'Complete 1,000 sets', 'SETS', 1000, 3, true),
('sets_5000', 'Set Immortal', 'Complete 5,000 sets', 'SETS', 5000, 4, true),

-- Reps milestones
('reps_1000', 'Rep Rookie', 'Complete 1,000 reps', 'REPS', 1000, 1, true),
('reps_5000', 'Rep Regular', 'Complete 5,000 reps', 'REPS', 5000, 2, true),
('reps_10000', 'Rep Veteran', 'Complete 10,000 reps', 'REPS', 10000, 3, true),
('reps_50000', 'Rep Legend', 'Complete 50,000 reps', 'REPS', 50000, 4, true),

-- XP milestones
('xp_1000', 'Rising Star', 'Earn 1,000 XP', 'XP', 1000, 1, true),
('xp_5000', 'Proven Warrior', 'Earn 5,000 XP', 'XP', 5000, 2, true),
('xp_10000', 'Elite Operative', 'Earn 10,000 XP', 'XP', 10000, 3, true),
('xp_50000', 'Master Operative', 'Earn 50,000 XP', 'XP', 50000, 4, true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 5. COSMETICS
-- =====================================================
INSERT INTO public.cosmetics (code_name, name, description, type, value, rarity, is_active) VALUES
-- Titles (unlocked by milestones/achievements)
('title_rookie', 'Rookie', 'Just getting started', 'TITLE', 'Rookie', 'common', true),
('title_operative', 'Operative', 'A proven member of the Protocol', 'TITLE', 'Operative', 'common', true),
('title_veteran', 'Veteran', 'Battle-hardened and experienced', 'TITLE', 'Veteran', 'uncommon', true),
('title_elite', 'Elite', 'Among the best of the best', 'TITLE', 'Elite', 'rare', true),
('title_legend', 'Legend', 'A living legend of the Protocol', 'TITLE', 'Legend', 'legendary', true),
('title_handler', 'Handler', 'Leads squads to victory', 'TITLE', 'Handler', 'rare', true),
('title_iron_titan', 'Iron Titan', 'Lifted a million pounds', 'TITLE', 'Iron Titan', 'legendary', true),

-- Icons (emoji-based)
('icon_fire', 'Flame', 'Burning with intensity', 'ICON', '🔥', 'common', true),
('icon_lightning', 'Lightning', 'Strike fast', 'ICON', '⚡', 'common', true),
('icon_skull', 'Skull', 'Hardcore dedication', 'ICON', '💀', 'uncommon', true),
('icon_crown', 'Crown', 'Royalty among lifters', 'ICON', '👑', 'rare', true),
('icon_dragon', 'Dragon', 'Fierce and powerful', 'ICON', '🐉', 'legendary', true),
('icon_star', 'Star', 'Rising above', 'ICON', '⭐', 'common', true),
('icon_muscle', 'Muscle', 'Pure strength', 'ICON', '💪', 'common', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- NOTES
-- =====================================================
-- This seed data provides:
-- - 5 HIIT timer presets
-- - 5 weekly boss templates
-- - 17 achievements across categories
-- - 17 milestones for progress tracking
-- - 14 cosmetic items (titles + icons)
--
-- Exercises and Missions should be seeded separately
-- or created by users/admins through the app.
