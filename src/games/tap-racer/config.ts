export const TAP_RACER_CONFIG = {
  LANES: 3,
  ROAD_WIDTH_RATIO: 0.74,
  BASE_SPEED: 420,
  MAX_SPEED: 980,
  SPEED_RAMP: 16,
  BOOST_MULT: 1.45,
  BOOST_DRAIN: 38, // per second while holding boost
  BOOST_RECHARGE: 18, // per second when not boosting
  LANE_LERP_SPEED: 18,
  HITBOX_SCALE: 0.76, // forgiving collision box (76% of visual size)
  SPAWN_INTERVAL_MIN: 0.52,
  SPAWN_INTERVAL_MAX: 1.08,
  LAP_DISTANCE_UNITS: 2400,
  COLORS: {
    bg: '#070A12',
    road: '#0E1422',
    shoulder: '#0A0F1B',
    railGlow: '#22D3EE',
    laneDivider: 'rgba(94, 234, 212, 0.30)',
    gridLine: 'rgba(34, 211, 238, 0.08)',
    playerBody: '#2C666E',
    playerTrim: '#5EEAD4',
    boostGlow: '#F59E0B',
    rivals: ['#FB7185', '#FBBF24', '#38BDF8', '#22C55E'],
    hudBg: 'rgba(9, 13, 22, 0.86)',
    hudBorder: 'rgba(34, 211, 238, 0.38)',
    text: '#F0EDEE',
    muted: '#94A3B8',
  },
} as const;
