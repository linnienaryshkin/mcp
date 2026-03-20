import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { createServer, IncomingMessage, ServerResponse } from 'node:http';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import * as z from 'zod/v4';
import { config } from '../lib/config.js';
import { sendTeamsMessage } from '../lib/teams-integration.js';

type SessionRuntime = {
  server: McpServer;
  transport: StreamableHTTPServerTransport;
};

const sessions = new Map<string, SessionRuntime>();

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

function createMcpServer(): McpServer {
  const server = new McpServer(
    {
      name: 'teams-mcp-streamable-http-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        logging: {},
      },
    },
  );

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

  registerSendMessageToTeamsTool(server);

  return server;
}

function writeJsonRpcError(
  res: ServerResponse,
  code: number,
  message: string,
  statusCode = 400,
): void {
  if (res.headersSent) {
    return;
  }

  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(
    JSON.stringify({
      jsonrpc: '2.0',
      error: { code, message },
      id: null,
    }),
  );
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) {
    return undefined;
  }

  return JSON.parse(raw);
}

async function getOrCreateRuntime(
  req: IncomingMessage,
  body: unknown,
): Promise<SessionRuntime | undefined> {
  const sessionIdHeader = req.headers['mcp-session-id'];
  const sessionId = Array.isArray(sessionIdHeader) ? sessionIdHeader[0] : sessionIdHeader;

  if (sessionId && sessions.has(sessionId)) {
    return sessions.get(sessionId);
  }

  if (!sessionId && isInitializeRequest(body)) {
    let runtime: SessionRuntime | undefined;

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (newSessionId) => {
        if (runtime) {
          sessions.set(newSessionId, runtime);
        }
      },
    });

    const server = createMcpServer();
    runtime = { server, transport };

    transport.onclose = () => {
      const activeSessionId = transport.sessionId;
      if (activeSessionId) {
        sessions.delete(activeSessionId);
      }
      void server.close();
    };

    await server.connect(transport);
    return runtime;
  }

  return undefined;
}

async function handleMcpRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (!req.url || !req.url.startsWith('/mcp')) {
    res.statusCode = 404;
    res.end('Not Found');
    return;
  }

  const method = req.method ?? 'GET';

  try {
    if (method === 'POST') {
      const body = await readJsonBody(req);
      const runtime = await getOrCreateRuntime(req, body);

      if (!runtime) {
        writeJsonRpcError(
          res,
          -32000,
          'Bad Request: missing valid session or initialize request',
          400,
        );
        return;
      }

      await runtime.transport.handleRequest(req, res, body);
      return;
    }

    if (method === 'GET' || method === 'DELETE') {
      const sessionIdHeader = req.headers['mcp-session-id'];
      const sessionId = Array.isArray(sessionIdHeader) ? sessionIdHeader[0] : sessionIdHeader;

      if (!sessionId || !sessions.has(sessionId)) {
        writeJsonRpcError(res, -32000, 'Invalid or missing session ID', 400);
        return;
      }

      const runtime = sessions.get(sessionId);
      if (!runtime) {
        writeJsonRpcError(res, -32000, 'Invalid or missing session ID', 400);
        return;
      }

      await runtime.transport.handleRequest(req, res);
      return;
    }

    writeJsonRpcError(res, -32000, 'Method not allowed', 405);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Streamable HTTP MCP request failed:', message);
    writeJsonRpcError(res, -32603, 'Internal server error', 500);
  }
}

const httpServer = createServer((req, res) => {
  void handleMcpRequest(req, res);
});

httpServer.listen(config.server.port, config.server.host, () => {
  console.log(
    `Streamable HTTP MCP server listening on http://${config.server.host}:${config.server.port}/mcp`,
  );
});

async function shutdown(): Promise<void> {
  const runtimes = Array.from(sessions.values());
  sessions.clear();

  for (const runtime of runtimes) {
    await runtime.transport.close();
    await runtime.server.close();
  }

  httpServer.close(() => {
    process.exit(0);
  });
}

process.on('SIGINT', () => {
  void shutdown();
});

process.on('SIGTERM', () => {
  void shutdown();
});
