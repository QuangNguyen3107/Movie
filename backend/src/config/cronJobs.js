
const cron = require('node-cron');
const path = require('path');
const { exec } = require('child_process');
const logger = console;

function setupCronJobs() {
  logger.log('Setting up cron jobs...');

  cron.schedule('0 0 * * *', () => {
    logger.log(`Running scheduled expired subscription check at ${new Date().toISOString()}`);

    const scriptPath = path.join(__dirname, '../scripts/checkExpiredSubscriptions.js');

    exec(`node ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
        logger.error(`Error executing subscription check script: ${error.message}`);
        return;
      }

      if (stderr) {
        logger.error(`Script stderr: ${stderr}`);
      }

      logger.log(`Subscription check completed: ${stdout}`);
    });
  }, {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh"
  });

  logger.log('Cron jobs setup completed.');
}

module.exports = { setupCronJobs };