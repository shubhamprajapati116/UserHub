// backend/docs/paths/index.js

const authDocs = require("./auth.docs");
const profileDocs = require("./profile.docs");
const sessionDocs = require("./session.docs");
const notificationDocs = require("./notification.docs");
const supportDocs = require("./support.docs");
const adminDocs = require("./admin.docs");

module.exports = {
  ...authDocs,
  ...profileDocs,
  ...sessionDocs,
  ...notificationDocs,
  ...supportDocs,
  ...adminDocs,
};