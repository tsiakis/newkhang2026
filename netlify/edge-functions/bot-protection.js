/** Chặn sớm theo User-Agent (case-insensitive). Rủi ro false-positive (vd. "go" trong UA hợp lệ). */
const BLOCKED_UA_FRAGMENTS = [
  "bot",
  "crawler",
  "spider",
  "scraper",
  "scan",
  "curl",
  "wget",
  "python",
  "java",
  "ruby",
  "go",
  "scrapy",
  "lighthouse",
  "puppeteer",
  "selenium",
  "headless",
  "phantom",
];

export default async (request, context) => {
  const ua = (request.headers.get("user-agent") ?? "").toLowerCase();
  void context.ip;

  if (
    BLOCKED_UA_FRAGMENTS.some((fragment) => fragment && ua.includes(fragment))
  ) {
    return new Response("403 Access Denied", {
      status: 403,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return context.next();
};
