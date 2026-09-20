require("dotenv").config();
const nodemailer = require("nodemailer");
const dns = require("dns");

// 1. Force Node.js DNS to prioritize IPv4 to prevent 60-second IPv6 timeout hangs
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

// 2. Set reliable public fallback DNS servers so Node c-ares doesn't query 127.0.0.1
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // If not permitted, continue gracefully
}

// 3. Patch Nodemailer's internal resolveHostname to use OS native IPv4 resolution (dns.lookup getaddrinfo)
// Nodemailer 9.x calls c-ares resolve6 & resolve4 which causes a 60-120 second hang on Windows machines.
// Using dns.lookup with family: 4 resolves in < 30ms and caches the result.
const hostDnsCache = new Map();
try {
  const shared = require("nodemailer/lib/shared");
  shared.resolveHostname = (options, callback) => {
    options = options || {};
    const hostname = options.host || options.servername;
    if (!hostname || require("net").isIP(hostname)) {
      return callback(null, {
        servername: options.servername || false,
        host: hostname,
        _addresses: [hostname],
        cached: false,
      });
    }

    const cached = hostDnsCache.get(hostname);
    if (cached && cached.expires > Date.now()) {
      return callback(null, {
        servername: options.servername || hostname,
        host: cached.host,
        _addresses: cached.addresses,
        cached: true,
      });
    }

    dns.lookup(hostname, { all: true, family: 4 }, (err, addresses) => {
      if (err) {
        return callback(err);
      }
      const addrs = addresses.map((a) => a.address);
      const selectedHost = addrs[0] || hostname;
      hostDnsCache.set(hostname, {
        host: selectedHost,
        addresses: addrs,
        expires: Date.now() + 30 * 60 * 1000, // 30 mins
      });
      return callback(null, {
        servername: options.servername || hostname,
        host: selectedHost,
        _addresses: addrs,
        cached: false,
      });
    });
  };
} catch (e) {
  console.warn("⚠️ [sendEmail warning]: Unable to patch resolveHostname:", e.message);
}

// 4. Create pooled Nodemailer transporter with connection pooling, keepalive and timeouts
const transporter = nodemailer.createTransport({
  pool: true,              // Keep connections alive to reuse for subsequent emails
  maxConnections: 3,       // Up to 3 parallel connections
  maxMessages: 100,        // Max messages per connection before recycling
  rateDelta: 1000,         // Rate limiting window (1 second)
  rateLimit: 5,            // Max 5 messages per second to prevent Gmail throttling
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  family: 4,               // Explicitly force IPv4 socket
  connectionTimeout: 8000, // 8s connection timeout (fail fast rather than hanging)
  greetingTimeout: 5000,   // 5s greeting timeout
  socketTimeout: 12000,    // 12s socket timeout
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Non-blocking connection verification on startup
transporter.verify((err) => {
  if (err) {
    console.warn("⚠️ [SMTP Warning]: SMTP initial check failed:", err.message);
  } else {
    console.log("⚡ [SMTP Ready]: Connected and pooled successfully!");
  }
});

/**
 * Send email helper
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML email body
 */
const sendEmail = async (to, subject, html) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("❌ [sendEmail Error]: EMAIL_USER or EMAIL_PASS not configured in .env");
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: `"UserHub" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`📧 [Fast Email Dispatched]: Sent to ${to} (${info.messageId})`);
    return info;
  } catch (error) {
    console.error(`❌ [sendEmail Failed for ${to}]:`, error.message);
    throw error;
  }
};

module.exports = sendEmail;
