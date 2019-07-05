require('dotenv').config()

const Slack = require('slack');
const slack = new Slack();

const showPicked = function(restaurants) {
  let picks = '';
  for (const p of restaurants) {
    const lunch = p.lunchBudget ? `💰${p.lunchBudget} yen` : '💰-';
    picks += `
      👉${p.name} (${p.category})
      ${lunch}
      ${p.url}
    `;
  }
  const message = `Picked randomly💁‍♀️\n${picks}`

  slack.chat.postMessage({
    token: process.env.SLACK_BOT_TOKEN,
    channel: process.env.SLACK_CHANNEL,
    text: message,
  }).then(console.log).catch(console.error);
}

module.exports = { showPicked };
