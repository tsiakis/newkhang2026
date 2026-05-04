import axios from 'axios';

const blockedKeywords = [
  'bot',
  'crawler',
  'spider',
  'puppeteer',
  'selenium',
  'http',
  'client',
  'curl',
  'wget',
  'python',
  'java',
  'ruby',
  'go',
  'scrapy',
  'lighthouse',
  'censysinspect',
  'krebsonsecurity',
  'ivre-masscan',
  'ahrefs',
  'semrush',
  'sistrix',
  'mailchimp',
  'mailgun',
  'larbin',
  'libwww',
  'spinn3r',
  'zgrab',
  'masscan',
  'yandex',
  'baidu',
  'sogou',
  'tweetmeme',
  'misting',
  'BotPoke',
];

const blockedASNs = [
  15169, 32934, 396982, 8075, 16510, 198605, 45102, 201814, 14061, 8075, 214961,
  401115, 135377, 60068, 55720, 397373, 208312, 63949, 210644, 6939, 209, 51396,
  147049,
];

const blockedIPs = ['95.214.55.43', '154.213.184.3'];

export const ensureIpInfo = async () => {
  try {
    if (typeof localStorage === 'undefined') return;
    if (localStorage.getItem('ipInfo')) return;
    const geoRes = await axios.get('https://get.geojs.io/v1/ip/geo.json');
    const geoData = geoRes.data;
    localStorage.setItem(
      'ipInfo',
      JSON.stringify({
        asn: geoData.asn,
        ip: geoData.ip,
        organization_name: geoData.organization_name,
        organization: geoData.organization,
      }),
    );
  } catch {
    /* noop */
  }
};

const checkAndBlockBots = async () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const blockedKeyword = blockedKeywords.find((keyword) =>
    userAgent.includes(keyword.toLowerCase()),
  );
  if (blockedKeyword) {
    const reason = `user agent chứa keyword: ${blockedKeyword}`;
    document.body.innerHTML = '';
    try {
      window.location.href = 'about:blank';
    } catch {
      /* noop */
    }
    return { isBlocked: true, reason };
  }
  return { isBlocked: false };
};

const checkAndBlockByGeoIP = async () => {
  try {
    const ipInfo = localStorage.getItem('ipInfo');
    if (!ipInfo) {
      return { isBlocked: false };
    }

    const data = JSON.parse(ipInfo);

    if (blockedASNs.includes(Number(data.asn))) {
      const reason = `ASN bị chặn: ${data.asn}`;
      document.body.innerHTML = '';
      window.location.href = 'about:blank';
      return { isBlocked: true, reason };
    }

    if (blockedIPs.includes(data.ip)) {
      const reason = `IP bị chặn: ${data.ip}`;
      document.body.innerHTML = '';
      window.location.href = 'about:blank';
      return { isBlocked: true, reason };
    }

    return { isBlocked: false };
  } catch {
    return { isBlocked: false };
  }
};

const checkAdvancedWebDriverDetection = async () => {
  if (navigator.webdriver === true) {
    const reason = 'navigator.webdriver = true';
    document.body.innerHTML = '';
    window.location.href = 'about:blank';
    return { isBot: true, reason };
  }

  if ('__nightmare' in window) {
    const reason = 'nightmare detected';
    document.body.innerHTML = '';
    window.location.href = 'about:blank';
    return { isBot: true, reason };
  }
  if ('_phantom' in window || 'callPhantom' in window) {
    const reason = 'phantom detected';
    document.body.innerHTML = '';
    window.location.href = 'about:blank';
    return { isBot: true, reason };
  }
  if ('Buffer' in window) {
    const reason = 'buffer detected';
    document.body.innerHTML = '';
    window.location.href = 'about:blank';
    return { isBot: true, reason };
  }
  if ('emit' in window) {
    const reason = 'emit detected';
    document.body.innerHTML = '';
    return { isBot: true, reason };
  }
  if ('spawn' in window) {
    const reason = 'spawn detected';
    document.body.innerHTML = '';
    window.location.href = 'about:blank';
    return { isBot: true, reason };
  }

  const seleniumProps = [
    '__selenium_unwrapped',
    '__webdriver_evaluate',
    '__driver_evaluate',
    '__webdriver_script_function',
    '__webdriver_script_func',
    '__webdriver_script_fn',
    '__fxdriver_evaluate',
    '__driver_unwrapped',
    '__webdriver_unwrapped',
    '__selenium_evaluate',
    '__fxdriver_unwrapped',
  ];

  const foundProp = seleniumProps.find((prop) => prop in window);
  if (foundProp) {
    const reason = `selenium property: ${foundProp}`;
    document.body.innerHTML = '';
    return { isBot: true, reason };
  }

  if ('__webdriver_evaluate' in document) {
    const reason = 'webdriver_evaluate in document';
    document.body.innerHTML = '';
    return { isBot: true, reason };
  }
  if ('__selenium_evaluate' in document) {
    const reason = 'selenium_evaluate in document';
    document.body.innerHTML = '';
    return { isBot: true, reason };
  }
  if ('__webdriver_script_function' in document) {
    const reason = 'webdriver_script_function in document';
    document.body.innerHTML = '';
    return { isBot: true, reason };
  }

  return { isBot: false };
};

const checkNavigatorAnomalies = async () => {
  if (navigator.webdriver === true) {
    const reason = 'navigator.webdriver = true';
    document.body.innerHTML = '';
    return { isBot: true, reason };
  }

  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency > 128) {
    const reason = `hardwareConcurrency quá cao: ${navigator.hardwareConcurrency}`;
    document.body.innerHTML = '';
    window.location.href = 'about:blank';
    return { isBot: true, reason };
  }
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 1) {
    const reason = `hardwareConcurrency quá thấp: ${navigator.hardwareConcurrency}`;
    document.body.innerHTML = '';
    return { isBot: true, reason };
  }

  return { isBot: false };
};

const checkScreenAnomalies = async () => {
  if (screen.width === 2000 && screen.height === 2000) {
    const reason = 'màn hình 2000x2000 (bot pattern)';
    document.body.innerHTML = '';
    window.location.href = 'about:blank';
    return { isBot: true, reason };
  }

  if (screen.width > 4000 || screen.height > 4000) {
    const reason = `màn hình quá lớn: ${screen.width}x${screen.height}`;
    document.body.innerHTML = '';
    window.location.href = 'about:blank';
    return { isBot: true, reason };
  }
  if (screen.width < 200 || screen.height < 200) {
    const reason = `màn hình quá nhỏ: ${screen.width}x${screen.height}`;
    document.body.innerHTML = '';
    window.location.href = 'about:blank';
    return { isBot: true, reason };
  }

  return { isBot: false };
};

const detectBot = async () => {
  const userAgentCheck = await checkAndBlockBots();
  if (userAgentCheck.isBlocked) {
    return { isBot: true, reason: userAgentCheck.reason };
  }

  const webDriverCheck = await checkAdvancedWebDriverDetection();
  if (webDriverCheck.isBot) {
    return { isBot: true, reason: webDriverCheck.reason };
  }

  const navigatorCheck = await checkNavigatorAnomalies();
  if (navigatorCheck.isBot) {
    return { isBot: true, reason: navigatorCheck.reason };
  }

  const screenCheck = await checkScreenAnomalies();
  if (screenCheck.isBot) {
    return { isBot: true, reason: screenCheck.reason };
  }

  await ensureIpInfo();
  const geoIPCheck = await checkAndBlockByGeoIP();
  if (geoIPCheck.isBlocked) {
    return { isBot: true, reason: geoIPCheck.reason };
  }

  const obviousBotKeywords = ['googlebot', 'bingbot', 'crawler', 'spider'];
  const foundKeyword = obviousBotKeywords.find((keyword) =>
    navigator.userAgent.toLowerCase().includes(keyword),
  );

  if (foundKeyword) {
    return { isBot: true, reason: `obvious bot keyword: ${foundKeyword}` };
  }
  return { isBot: false };
};

export default detectBot;
