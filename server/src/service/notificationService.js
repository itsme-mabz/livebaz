const webpush = require("web-push");
const logger = require("../utils/logger");
webpush.setVapidDetails(
  "mailto:admin@example.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// send web-push
async function sendWebPush(subscription, payload) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (e) {
    logger.error("webpush err", e.statusCode || e.message);
  }
}

// high-level notify
async function notifyFollowers(event, followers) {
  // event: {type, fixtureId, text}
  for (const f of followers) {
    // f = {userId, subscription}
    if (f.subscription)
      await sendWebPush(f.subscription, {
        title: "Match Update",
        body: event.text,
        data: event,
      });
  }
}
module.exports = { notifyFollowers };
