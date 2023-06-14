const cron = require("node-cron");
const { SendEmail } = require("./user.controller");

const scheduler = {
  start: function() {
    // Schedule SendEmail to run every Monday at 9:00 AM
    cron.schedule("0 9 * * 1", SendEmail);
  }
};

module.exports = scheduler;
