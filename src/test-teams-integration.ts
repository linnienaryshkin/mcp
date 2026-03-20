import 'dotenv/config';
import { parseArgs } from 'node:util';
import { sendTeamsMessage } from './lib/teams-integration.js';

type CliOptions = {
  webhookUrl?: string;
  message: string;
  dryRun: boolean;
  help: boolean;
};

function parseCliOptions(): CliOptions {
  const { values } = parseArgs({
    options: {
      webhookUrl: {
        type: 'string',
      },
      message: {
        type: 'string',
        default: `Teams integration test at ${new Date().toISOString()}`,
      },
      dryRun: {
        type: 'boolean',
        default: false,
      },
      help: {
        type: 'boolean',
        default: false,
      },
    },
  });

  return {
    webhookUrl: values.webhookUrl,
    message: values.message,
    dryRun: values.dryRun,
    help: values.help,
  };
}

function printHelp(): void {
  console.log('Usage: npm run test:teams -- [--webhookUrl URL] [--message TEXT] [--dryRun]');
  console.log('');
  console.log('Options:');
  console.log(
    '  --webhookUrl   Teams Incoming Webhook URL. Falls back to TEAMS_WEBHOOK_URL env var.',
  );
  console.log('  --message      Message to send.');
  console.log('  --dryRun       Validate config and print payload without sending a request.');
  console.log('  --help         Show this help text.');
}

function resolveWebhookUrl(cliWebhookUrl?: string): string {
  const resolved = cliWebhookUrl ?? process.env.TEAMS_WEBHOOK_URL;

  if (!resolved) {
    throw new Error('Missing webhook URL. Provide --webhookUrl or set TEAMS_WEBHOOK_URL.');
  }

  try {
    new URL(resolved);
  } catch {
    throw new Error('Webhook URL is not a valid URL.');
  }

  return resolved;
}

async function main(): Promise<void> {
  const options = parseCliOptions();

  if (options.help) {
    printHelp();
    return;
  }

  const webhookUrl = resolveWebhookUrl(options.webhookUrl);

  if (options.dryRun) {
    console.log('Dry run successful.');
    console.log(`Webhook URL: ${webhookUrl}`);
    console.log(`Message: ${options.message}`);
    return;
  }

  await sendTeamsMessage(options.message, webhookUrl);
  console.log('Teams integration test succeeded. Message delivered.');
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Teams integration test failed: ${message}`);
  process.exit(1);
});
