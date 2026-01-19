/**
 * Google Analytics utility for tracking custom events and user properties.
 * GA4 Measurement ID: G-JJW0JW6E05
 * 
 * Best Practices Implemented:
 * - User ID for cross-session tracking (authenticated users)
 * - User properties for segmentation
 * - Custom events for key engagement points
 * - SPA-aware page view tracking
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

type GtagCommand = 'config' | 'event' | 'set';

/**
 * Safely call gtag with proper typing
 */
function gtag(command: GtagCommand, ...args: unknown[]) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag(command, ...args);
  }
}

/**
 * Track a page view in SPA context
 * Called on route changes since GA4 only auto-tracks initial page load
 */
export function trackPageView(path: string, title?: string) {
  gtag('config', 'G-JJW0JW6E05', {
    page_path: path,
    page_title: title || document.title,
  });
}

/**
 * Set user ID for cross-session tracking
 * This allows GA to stitch together sessions from the same user
 */
export function setUserId(userId: string | null) {
  gtag('set', { user_id: userId });
}

/**
 * Set user properties for segmentation and analysis
 * These appear as dimensions in GA4 reports
 */
export function setUserProperties(properties: {
  user_type?: 'anonymous' | 'authenticated' | 'guest';
  is_handler?: boolean;
  has_active_campaign?: boolean;
}) {
  gtag('set', 'user_properties', properties);
}

// ============================================
// CUSTOM EVENT TRACKING
// ============================================
// GA4 recommended event naming: snake_case
// Max 40 characters for event names
// Max 25 custom parameters per event
// ============================================

/**
 * Authentication Events
 */
export function trackSignUp(method: 'email' | 'google' | 'anonymous') {
  gtag('event', 'sign_up', { method });
}

export function trackLogin(method: 'email' | 'google') {
  gtag('event', 'login', { method });
}

export function trackAnonymousConversion() {
  gtag('event', 'anonymous_conversion', {
    event_category: 'engagement',
  });
}

/**
 * Core Engagement Events
 */
export function trackMissionStart(params: {
  mission_id: string;
  mission_name: string;
  difficulty: number;
  is_assignment?: boolean;
}) {
  gtag('event', 'mission_start', {
    mission_id: params.mission_id,
    mission_name: params.mission_name,
    difficulty: params.difficulty,
    is_assignment: params.is_assignment || false,
  });
}

export function trackMissionComplete(params: {
  mission_id: string;
  mission_name: string;
  duration_seconds: number;
  total_sets: number;
  total_reps: number;
  total_weight: number;
  score: number;
  xp_earned: number;
}) {
  gtag('event', 'mission_complete', {
    mission_id: params.mission_id,
    mission_name: params.mission_name,
    duration_seconds: params.duration_seconds,
    total_sets: params.total_sets,
    total_reps: params.total_reps,
    total_weight: params.total_weight,
    score: params.score,
    xp_earned: params.xp_earned,
    value: params.score, // GA4 uses 'value' for monetization-like metrics
  });
}

export function trackWorkoutAbandoned(params: {
  mission_id: string;
  duration_seconds: number;
  sets_completed: number;
}) {
  gtag('event', 'workout_abandoned', {
    mission_id: params.mission_id,
    duration_seconds: params.duration_seconds,
    sets_completed: params.sets_completed,
  });
}

/**
 * Boss & Campaign Events
 */
export function trackBossDamage(params: {
  boss_id: string;
  damage_dealt: number;
  weakness_hits: number;
}) {
  gtag('event', 'boss_damage', {
    boss_id: params.boss_id,
    damage_dealt: params.damage_dealt,
    weakness_hits: params.weakness_hits,
  });
}

export function trackCampaignStart(params: {
  campaign_id: string;
  campaign_name: string;
  total_missions: number;
}) {
  gtag('event', 'campaign_start', {
    campaign_id: params.campaign_id,
    campaign_name: params.campaign_name,
    total_missions: params.total_missions,
  });
}

export function trackCampaignComplete(params: {
  campaign_id: string;
  campaign_name: string;
  duration_seconds: number;
  is_personal_record: boolean;
}) {
  gtag('event', 'campaign_complete', {
    campaign_id: params.campaign_id,
    campaign_name: params.campaign_name,
    duration_seconds: params.duration_seconds,
    is_personal_record: params.is_personal_record,
  });
}

/**
 * Social & Multiplayer Events
 */
export function trackRivalAdded() {
  gtag('event', 'rival_added', {
    event_category: 'social',
  });
}

export function trackSquadJoined() {
  gtag('event', 'squad_joined', {
    event_category: 'social',
  });
}

export function trackMissionAssigned(params: {
  squad_id: string;
  member_count: number;
}) {
  gtag('event', 'mission_assigned', {
    squad_id: params.squad_id,
    member_count: params.member_count,
    event_category: 'handler',
  });
}

/**
 * Achievement & Progression Events
 */
export function trackAchievementUnlocked(params: {
  achievement_id: string;
  achievement_name: string;
  rarity: string;
}) {
  gtag('event', 'unlock_achievement', {
    achievement_id: params.achievement_id,
    achievement_name: params.achievement_name,
    rarity: params.rarity,
  });
}

export function trackPersonalRecord(params: {
  exercise_id: string;
  exercise_name: string;
  record_type: string;
  value: number;
}) {
  gtag('event', 'personal_record', {
    exercise_id: params.exercise_id,
    exercise_name: params.exercise_name,
    record_type: params.record_type,
    value: params.value,
  });
}

/**
 * Feature Usage Events
 */
export function trackFeatureUsed(feature: string, details?: Record<string, unknown>) {
  gtag('event', 'feature_used', {
    feature_name: feature,
    ...details,
  });
}

export function trackHIITSession(params: {
  config_name: string;
  rounds_completed: number;
  total_duration_seconds: number;
}) {
  gtag('event', 'hiit_complete', {
    config_name: params.config_name,
    rounds_completed: params.rounds_completed,
    total_duration_seconds: params.total_duration_seconds,
  });
}
