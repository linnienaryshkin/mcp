# Stdio Server

Standard I/O transport for MCP server communication.

## Implemented tools

- `ping`: Simple health check and optional echo.
- `send_message_to_teams`: Sends a text message to a Microsoft Teams Incoming Webhook.

## Run locally (dev)

```bash
tsx src/stdio-server/index.ts
```

## Build and run

```bash
npm run build
node dist/stdio-server/index.js
```

## MCP client configuration (stdio)

For clients that support stdio MCP servers, use a command like:

```json
{
  "mcpServers": {
    "teams-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/mcp/dist/stdio-server/index.js"],
      "env": {
        "TEAMS_WEBHOOK_URL": "https://your-teams-webhook-url"
      }
    }
  }
}
```

### Alternative: launch through npm script

If you prefer to launch through a project script:

```json
{
  "mcpServers": {
    "teams-mcp": {
      "command": "npm",
      "args": ["run", "dev"],
      "cwd": "/absolute/path/to/mcp",
      "env": {
        "TEAMS_WEBHOOK_URL": "https://your-teams-webhook-url"
      }
    }
  }
}
```
