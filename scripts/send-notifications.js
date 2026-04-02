/**
 * send-notifications.js
 *
 * Utility script to send push notifications to all registered users.
 * Can be run as a Cloud Function or scheduled job.
 *
 * Usage:
 *   node scripts/send-notifications.js --title "New Look" --body "ReadStreak got a fresh design!" --tokens-file tokens.json
 *
 * Or with Expo tokens from a file:
 *   EXPO_ACCESS_TOKEN=your_token node scripts/send-notifications.js \
 *     --title "New Feature" \
 *     --body "Check out the new social features!" \
 *     --tokens-file registered-tokens.json
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Expo Push Notifications API endpoint
const EXPO_PUSH_API = 'https://exp.host/--/api/v2/push/send';

/**
 * Send a notification to a batch of Expo push tokens
 */
async function sendExpoNotification(tokens, { title, body, data = {} }) {
  if (!tokens || tokens.length === 0) {
    console.log('No tokens provided.');
    return { success: 0, failed: 0, errors: [] };
  }

  const messages = tokens
    .filter(token => typeof token === 'string' && token.startsWith('ExponentPushToken'))
    .map(token => ({
      to: token,
      sound: 'default',
      title,
      body,
      data,
      badge: 1,
    }));

  if (messages.length === 0) {
    console.log('No valid Expo push tokens found.');
    return { success: 0, failed: 0, errors: [] };
  }

  console.log(`Sending notifications to ${messages.length} devices...`);

  try {
    const response = await postToExpoAPI(messages);

    let successCount = 0;
    let failedCount = 0;
    const errors = [];

    if (response.data && Array.isArray(response.data)) {
      response.data.forEach((result, index) => {
        if (result.status === 'ok') {
          successCount++;
        } else if (result.status === 'error') {
          failedCount++;
          errors.push({
            token: messages[index].to,
            error: result.message,
            details: result.details,
          });
        }
      });
    }

    console.log(`\nResults:`);
    console.log(`  ✅ Sent successfully: ${successCount}`);
    console.log(`  ❌ Failed: ${failedCount}`);
    if (errors.length > 0) {
      console.log(`\nFirst 5 errors:`);
      errors.slice(0, 5).forEach(err => {
        console.log(`  - ${err.token}: ${err.error}`);
      });
    }

    return { success: successCount, failed: failedCount, errors };
  } catch (error) {
    console.error('Error sending notifications:', error.message);
    throw error;
  }
}

/**
 * POST to Expo Push API
 */
function postToExpoAPI(messages) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(messages);

    const options = {
      hostname: 'exp.host',
      port: 443,
      path: '/--/api/v2/push/send',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Accept': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(new Error(`Invalid JSON response from Expo API: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Main CLI handler
 */
async function main() {
  const args = process.argv.slice(2);
  let title = 'ReadStreak Update';
  let body = 'Check out what\'s new!';
  let tokensFile = null;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--title' && args[i + 1]) {
      title = args[++i];
    } else if (args[i] === '--body' && args[i + 1]) {
      body = args[++i];
    } else if (args[i] === '--tokens-file' && args[i + 1]) {
      tokensFile = args[++i];
    } else if (args[i] === '--help') {
      console.log(`
Usage: node scripts/send-notifications.js [options]

Options:
  --title <text>        Notification title (default: "ReadStreak Update")
  --body <text>         Notification message body
  --tokens-file <path>  Path to JSON file containing array of Expo push tokens
  --help               Show this help message

Example:
  node scripts/send-notifications.js \\
    --title "New Look" \\
    --body "ReadStreak got a fresh design!" \\
    --tokens-file registered-tokens.json
      `);
      process.exit(0);
    }
  }

  // Load tokens
  let tokens = [];
  if (tokensFile) {
    const tokensPath = path.resolve(tokensFile);
    if (!fs.existsSync(tokensPath)) {
      console.error(`Error: tokens file not found: ${tokensPath}`);
      process.exit(1);
    }
    try {
      const content = fs.readFileSync(tokensPath, 'utf-8');
      tokens = JSON.parse(content);
      if (!Array.isArray(tokens)) {
        console.error('Error: tokens file must contain a JSON array');
        process.exit(1);
      }
    } catch (error) {
      console.error(`Error reading tokens file: ${error.message}`);
      process.exit(1);
    }
  } else {
    console.error('Error: --tokens-file is required');
    console.error('Use --help for usage information');
    process.exit(1);
  }

  // Send notifications
  try {
    const result = await sendExpoNotification(tokens, { title, body });

    if (result.failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

// Export for use as a module (e.g., in Cloud Functions)
module.exports = { sendExpoNotification };

// Run as CLI if executed directly
if (require.main === module) {
  main();
}
