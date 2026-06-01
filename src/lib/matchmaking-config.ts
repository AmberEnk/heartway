export const MATCHMAKING_CONFIG = {
  launchCity: process.env.NEXT_PUBLIC_LAUNCH_CITY ?? "Los Angeles",
  /** Swipe discover hidden until you explicitly enable it */
  discoverEnabled: process.env.NEXT_PUBLIC_DISCOVER_ENABLED === "true",
  matchmakingMode: process.env.NEXT_PUBLIC_MATCHMAKING_MODE !== "false",
} as const;

export const DEALBREAKER_KEYS = [
  "HAS_CHILDREN",
  "WANTS_CHILDREN_SOON",
  "SMOKING",
  "HEAVY_DRINKING",
  "DIFFERENT_FAITH",
  "NOT_MONOGAMOUS",
  "NO_LONG_DISTANCE",
] as const;

export const AVOID_BEHAVIOR_KEYS = [
  "JEALOUS_CONTROLLING",
  "DISRESPECTS_CULTURE",
  "GHOSTING",
  "RUDENESS",
  "DISHONESTY",
] as const;

export const PARTNER_MUST_HAVE_KEYS = [
  "SPEAKS_MONGOLIAN",
  "SAME_FAITH",
  "NON_SMOKER",
  "FAMILY_ORIENTED",
  "READY_FOR_RELATIONSHIP",
] as const;

export type DealbreakerKey = (typeof DEALBREAKER_KEYS)[number];
export type AvoidBehaviorKey = (typeof AVOID_BEHAVIOR_KEYS)[number];
export type PartnerMustHaveKey = (typeof PARTNER_MUST_HAVE_KEYS)[number];
