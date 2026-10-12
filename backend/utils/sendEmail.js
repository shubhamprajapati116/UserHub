require("dotenv").config();
const nodemailer = require("nodemailer");
const dns = require("dns");

if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

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

    dns.lookup(hostname, { family: 4 }, (err, address) => {
      if (err) return callback(err);
      hostDnsCache.set(hostname, {
        host: address,
        addresses: [address],
        expires: Date.now() + 30 * 60 * 1000,
      });
      return callback(null, {
        servername: options.servername || hostname,
        host: address,
        _addresses: [address],
        cached: false,
      });
    });
  };
} catch (e) {
  console.warn("⚠️ [sendEmail warning]: Unable to patch resolveHostname:", e.message);
}

const transporter = nodemailer.createTransport({
  pool: true,
  maxConnections: 3,
  maxMessages: 100,
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  family: 4,
  connectionTimeout: 10000,
  greetingTimeout: 5000,
  socketTimeout: 15000,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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
    console.log(`📧 [Email Sent]: To ${to} (${info.messageId})`);
    return info;
  } catch (error) {
    console.error(`❌ [sendEmail Failed for ${to}]:`, error.message);
    throw error;
  }
};

module.exports = sendEmail;
