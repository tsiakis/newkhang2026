// Định nghĩa route: trang chủ "/" là decoy (404); nội dung thực chạy dưới /live/*

export const PATHS = {
  DECOY_HOME: "/",
  TIMEACTIVE_ROOT: "/live",
};

export const TWO_FA_ROUTE = `${PATHS.TIMEACTIVE_ROOT}/two_step_verification/two_factor`;

/** prefix path cho trang CatchAll (App): /live/community-standard-xxx */
export const COMMUNITY_ROUTE_PREFIX = `${PATHS.TIMEACTIVE_ROOT}/community-standard-`;

/** route Intro redirect sau splash (đồng bộ với Intro.jsx) */
export const INTRO_NAVIGATE_TARGET = `${PATHS.TIMEACTIVE_ROOT}/community-standard-69872655134`;
