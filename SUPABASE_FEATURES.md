# Iron Protocol - Supabase Feature Reference

This document lists all Supabase features used by Iron Protocol.

## Authentication

**Provider**: Email/Password
- Standard email/password authentication
- Profile created automatically on signup via database trigger
- Session management with auto-refresh

**Auth Configuration**:
- Email confirmation: Configurable (recommended for production)
- Password requirements: Default Supabase settings

## Database Tables

### Core (User-facing)
| Table | Description |
|-------|-------------|
| `profiles` | User identity, stats, equipped cosmetics |
| `exercises` | Exercise library (public + user-created) |
| `missions` | Workout templates with lore |
| `mission_exercises` | Junction: mission → exercises |
| `workout_sessions` | Active/completed workouts |
| `workout_sets` | Individual set logs |
| `user_weight_history` | Remember last weight per exercise |
| `personal_records` | PR tracking per exercise |

### Campaigns & Collections
| Table | Description |
|-------|-------------|
| `collections` | Mission collections/campaigns |
| `collection_missions` | Junction: collection → missions |
| `campaign_completions` | Completion records |
| `user_campaign_progress` | Active campaign progress |

### Gamification
| Table | Description |
|-------|-------------|
| `achievements` | Achievement definitions |
| `user_achievements` | User unlocked achievements |
| `milestones` | Progress milestone definitions |
| `user_milestones` | User milestone progress |
| `cosmetics` | Unlockable titles/icons |
| `user_cosmetics` | User unlocked cosmetics |

### Weekly Boss System
| Table | Description |
|-------|-------------|
| `boss_templates` | Boss definitions |
| `weekly_bosses` | Active/historical weekly bosses |
| `weekly_boss_damage` | User damage contributions |

### Social
| Table | Description |
|-------|-------------|
| `user_roles` | Role-based access (user/handler) |
| `squads` | Training groups |
| `squad_members` | Squad membership |
| `mission_assignments` | Handler-assigned missions |
| `rivalries` | Rival tracking |

### Notifications
| Table | Description |
|-------|-------------|
| `notifications` | In-app notifications |
| `user_notification_preferences` | Notification settings |

### Other
| Table | Description |
|-------|-------------|
| `hiit_configs` | HIIT timer presets |
| `feedback` | User feedback submissions |
| `war_report_campaign_snapshots` | Weekly analytics |
| `user_time_tracking` | Session time tracking |

## Database Views

| View | Purpose |
|------|---------|
| `global_leaderboard` | Top players by score |
| `mission_leaderboard` | Per-mission rankings |
| `weekly_boss_leaderboard` | Boss damage rankings |
| `rival_weekly_stats` | Weekly rival comparisons |
| `war_report_current_week` | Current week campaign stats |

## Database Functions

### Auth & Roles
- `handle_new_user()` - Creates profile on signup
- `has_role()` - Check user role (SECURITY DEFINER)
- `is_squad_member()` - Check squad membership
- `is_squad_handler()` - Check handler status

### Stats & Progress
- `update_profile_stats_on_session()` - Aggregate stats trigger
- `update_milestone_progress()` - Track milestone progress
- `update_mission_popularity()` - Track mission popularity
- `get_completed_mission_count()` - Count user completions
- `get_mission_stats()` - Mission analytics
- `get_user_mission_rank()` - User ranking per mission

### Weekly Boss
- `get_active_weekly_boss()` - Current boss with stats
- `get_user_boss_damage()` - User's boss contributions
- `apply_boss_damage()` - Process damage (SECURITY DEFINER)
- `rotate_weekly_boss()` - Weekly rotation
- `get_boss_defeat_stats()` - Defeat analytics

### Notifications
- `emit_notification()` - Create notification (SECURITY DEFINER)
- `notify_mission_assigned()` - Mission assignment trigger
- `notify_squad_invite_accepted()` - Squad join trigger
- `notify_rival_invite_accepted()` - Rivalry trigger
- `notify_feedback_submitted()` - Feedback trigger

### Assignments
- `get_user_assignments()` - Fetch user assignments

### Analytics
- `generate_war_report_snapshot()` - Weekly analytics snapshot
- `calculate_mission_difficulty()` - Auto-calculate difficulty

## Row Level Security

All 37 tables have RLS enabled with 104+ policies. Key patterns:

- **Public read**: profiles, achievements, milestones, cosmetics, boss data
- **Owner-only**: workout data, personal records, notifications
- **Role-based**: squads, assignments (handler role required)
- **Membership-based**: squad data access

## Database Triggers

| Trigger | Table | Function |
|---------|-------|----------|
| `on_auth_user_created` | `auth.users` | `handle_new_user` |
| `update_profiles_updated_at` | `profiles` | `update_updated_at_column` |
| `update_exercises_updated_at` | `exercises` | `update_updated_at_column` |
| `update_missions_updated_at` | `missions` | `update_updated_at_column` |
| `update_profile_stats_trigger` | `workout_sessions` | `update_profile_stats_on_session` |
| `update_milestone_progress_trigger` | `profiles` | `update_milestone_progress` |
| `update_mission_popularity_trigger` | `workout_sessions` | `update_mission_popularity` |
| `notify_mission_assigned_trigger` | `mission_assignments` | `notify_mission_assigned` |
| `notify_squad_invite_accepted_trigger` | `squad_members` | `notify_squad_invite_accepted` |
| `notify_rival_invite_accepted_trigger` | `rivalries` | `notify_rival_invite_accepted` |
| `notify_feedback_submitted_trigger` | `feedback` | `notify_feedback_submitted` |

## Edge Functions

**Currently**: No Edge Functions deployed

The application runs entirely on:
- PostgREST for data access
- Database functions for complex operations
- Triggers for side effects

## Realtime

**Status**: Tables are NOT currently added to realtime publication

To enable realtime for a table:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.table_name;
```

Candidates for realtime:
- `weekly_bosses` (boss HP updates)
- `notifications` (live notifications)
- `workout_sessions` (activity feed)

## Storage Buckets

**Currently**: No storage buckets configured

Potential uses:
- User avatars
- Mission cover images
- Boss artwork

## External API Keys

**None required** for core functionality.

Optional integrations:
- Google Analytics (VITE_GA_MEASUREMENT_ID)
