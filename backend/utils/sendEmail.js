const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});
const sendEmail = async (to, subject, html) => {
  return transporter.sendMail({
    from: `"UserHub" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};
module.exports = sendEmail;
