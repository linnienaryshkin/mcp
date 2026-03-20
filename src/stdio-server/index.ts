import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as z from 'zod/v4';
import { config } from '../lib/config.js';
import { sendTeamsMessage } from '../lib/teams-integration.js';

const server = new McpServer({
  name: 'teams-mcp-server',
  version: '1.0.0',
});

server.registerTool(
  'ping',
  {
    description: 'Health-check tool that returns server status and UTC time.',
    inputSchema: {
      message: z.string().optional().describe('Optional string to echo back in the response.'),
    },
  },
  async ({ message }) => {
    const text = message?.trim() ? `pong: ${message}` : 'pong';

    return {
      content: [
        {
          type: 'text',
          text: `${text} | utc=${new Date().toISOString()}`,
        },
      ],
    };
  },
);

function registerSendMessageToTeamsTool(server: McpServer): void {
  server.registerTool(
    'send_message_to_teams',
    {
      description: 'Send a plain text message to an MS Teams Incoming Webhook URL.',
      inputSchema: {
        message: z.string().min(1).describe('The text message to send to the Teams channel.'),
      },
    },
    async ({ message }) => {
      const resolvedWebhook = config.teams.webhookUrl;

      if (!resolvedWebhook) {
        throw new Error(
          'Missing webhook URL. Pass webhookUrl argument or set TEAMS_WEBHOOK_URL in .env file.',
        );
      }

      await sendTeamsMessage(message, resolvedWebhook);

      return {
        content: [
          {
            type: 'text',
            text: 'Message sent to Microsoft Teams successfully.',
          },
        ],
      };
    },
  );
}

registerSendMessageToTeamsTool(server);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP server running on stdio');
}

main().catch((error: unknown) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});
