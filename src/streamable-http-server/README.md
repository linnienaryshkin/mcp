# Streamable HTTP Server

Streamable HTTP transport for MCP server communication. Allows continuous data streaming between client and server, best for long-running tasks and large data transfers.

## Implemented tools

- `ping`: Simple health check and optional echo.
- `send_message_to_teams`: Sends a text message to a Microsoft Teams Incoming Webhook.

## Run locally (dev)

```bash
export TEAMS_WEBHOOK_URL="https://your-teams-webhook-url"
export PORT=8787
tsx src/streamable-http-server/index.ts
```

## Build and run

Compiled mode:

```bash
npm run build
PORT=8787 node dist/streamable-http-server/index.js
```

Default endpoint:

```text
http://127.0.0.1:8787/mcp
```

## Teams webhook configuration

You can pass `webhookUrl` directly in tool arguments, or set an environment variable before launching the server:

```bash
export TEAMS_WEBHOOK_URL="https://your-teams-webhook-url"
```

## MCP client configuration (Streamable HTTP)

For clients that support HTTP MCP endpoints:

```json
{
  "mcpServers": {
    "teams-mcp-http": {
      "url": "http://127.0.0.1:8787/mcp"
    }
  }
}
```

### Optional auth header example

```json
{
  "mcpServers": {
    "teams-mcp-http": {
      "url": "http://127.0.0.1:8787/mcp",
      "headers": {
        "Authorization": "Bearer <token>"
      }
    }
  }
}
```
