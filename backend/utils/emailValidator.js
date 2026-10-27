const dns = require("dns").promises;

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "mailinator.net", "mailinator.org", "yopmail.com", "yopmail.net",
  "10minutemail.com", "10minutemail.net", "10minmail.com", "tempmail.com", "temp-mail.org",
  "temp-mail.io", "tempmail.net", "tempmailo.com", "tempr.email", "guerrillamail.com",
  "guerrillamail.net", "guerrillamail.org", "guerrillamail.biz", "guerrillamailblock.com",
  "sharklasers.com", "grr.la", "pokemail.net", "spam4.me", "trashmail.com", "trashmail.net",
  "trashmail.de", "throwawaymail.com", "getnada.com", "nada.email", "dispostable.com",
  "maildrop.cc", "mailnesia.com", "mintemail.com", "mohmal.com", "emailondeck.com",
  "fakeinbox.com", "fakemail.net", "mailcatch.com", "moakt.com", "mytemp.email",
  "burnermail.io", "discard.email", "spambox.us", "spamgourmet.com", "inboxkitten.com",
  "mail.tm", "emailfake.com", "crazymailing.com", "tmail.ws", "tmpmail.org", "tmpmail.net",
  "byom.de", "einrot.com", "33mail.com", "anonaddy.me", "mailpoof.com", "dropmail.me",
  "harakirimail.com", "mailforspam.com", "spamdecoy.net", "trbvm.com", "luxusmail.org",
  "minuteinbox.com", "emltmp.com", "linshiyouxiang.net", "tempinbox.com", "fakemailgenerator.com",
  "example.com", "example.org", "example.net", "test.com",
]);

const COMMON_PROVIDERS = [
  "gmail.com", "yahoo.com", "yahoo.in", "yahoo.co.in", "outlook.com", "hotmail.com",
  "live.com", "icloud.com", "me.com", "aol.com", "protonmail.com", "proton.me",
  "rediffmail.com", "zoho.com", "zohomail.in", "gmx.com", "yandex.com", "msn.com",
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DNS_TIMEOUT_MS = 4000;
const CACHE_TTL_MS = 30 * 60 * 1000;
const domainCache = new Map();
const NETWORK_ERROR_CODES = new Set([
  "ETIMEOUT", "ETIMEDOUT", "ECONNREFUSED", "ECONNRESET", "EAI_AGAIN", "ECANCELLED",
]);

function levenshtein(a, b) {
  if (a === b) return 0;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return dp[a.length][b.length];
}

function suggestDomain(domain) {
  if (COMMON_PROVIDERS.includes(domain)) return null;
  let best = null;
  let bestDist = Infinity;
  for (const provider of COMMON_PROVIDERS) {
    const dist = levenshtein(domain, provider);
    if (dist < bestDist) {
      bestDist = dist;
      best = provider;
    }
  }
  return bestDist > 0 && bestDist <= 2 ? best : null;
}

function withTimeout(promise, ms) {
  let timer;
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise((_, reject) => {
      timer = setTimeout(
        () => reject(Object.assign(new Error("DNS timeout"), { code: "ETIMEOUT" })),
        ms,
      );
    }),
  ]);
}

const dnsResolver = new (require("dns").promises.Resolver)();
try {
  dnsResolver.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
}

async function domainAcceptsMail(domain) {
  const cached = domainCache.get(domain);
  if (cached && cached.expires > Date.now()) return cached.ok;

  let ok;
  try {
    const mx = await withTimeout(dnsResolver.resolveMx(domain), DNS_TIMEOUT_MS);
    ok = Array.isArray(mx) && mx.some((r) => r.exchange && r.exchange !== ".");
  } catch (err) {
    if (err.code === "ENOTFOUND" || err.code === "ENODATA") {
      try {
        const a = await withTimeout(dnsResolver.resolve4(domain), DNS_TIMEOUT_MS);
        ok = Array.isArray(a) && a.length > 0;
      } catch (aErr) {
        if (aErr.code === "ENOTFOUND" || aErr.code === "ENODATA") {
          ok = false;
        } else if (NETWORK_ERROR_CODES.has(aErr.code)) {
          return null;
        } else {
          ok = false;
        }
      }
    } else if (NETWORK_ERROR_CODES.has(err.code)) {
      return null;
    } else {
      ok = false;
    }
  }

  domainCache.set(domain, { ok, expires: Date.now() + CACHE_TTL_MS });
  return ok;
}

async function validateEmailDeliverability(rawEmail) {
  const normalized = String(rawEmail || "").trim().toLowerCase();

  if (!normalized || !EMAIL_REGEX.test(normalized)) {
    return {
      valid: false,
      code: "INVALID_FORMAT",
      reason: "Please enter a valid email address.",
      suggestion: null,
      normalized,
    };
  }

  const [localPart, domain] = normalized.split("@");
  const typo = suggestDomain(domain);
  const suggestion = typo ? `${localPart}@${typo}` : null;

  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      valid: false,
      code: "DISPOSABLE",
      reason: "Temporary / disposable email addresses are not allowed. Please use a permanent email.",
      suggestion: null,
      normalized,
    };
  }

  const accepts = await domainAcceptsMail(domain);

  if (accepts === false) {
    return {
      valid: false,
      code: "NO_MX",
      reason: suggestion
        ? `The domain "${domain}" cannot receive emails. Did you mean ${suggestion}?`
        : `The domain "${domain}" does not exist or cannot receive emails.`,
      suggestion,
      normalized,
    };
  }

  return {
    valid: true,
    code: accepts === null ? "DNS_UNAVAILABLE" : "OK",
    reason:
      accepts === null
        ? "Could not reach DNS to confirm the domain. The verification link will confirm the address."
        : "Email domain can receive mail.",
    suggestion,
    normalized,
  };
}

module.exports = {
  validateEmailDeliverability,
  DISPOSABLE_DOMAINS,
};
