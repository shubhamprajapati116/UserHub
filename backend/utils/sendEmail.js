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
  await transporter.sendMail({
    from: ` <${process.env.EMAIL_USER}> "UserHub"`,
    to,
    subject,
    html,
    
  });
};
module.exports = sendEmail;
