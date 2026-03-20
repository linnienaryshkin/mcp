# [MS Teams Notification MCP (Model Context Protocol) Server](https://github.com/linnienaryshkin/mcp)

Let's experiment with creating our own MCP server to learn how this technology works in depth.

Here is a settled GitHub Copilot Space for this repository: <https://github.com/copilot/spaces/linnienaryshkin/1>

## Table of contents

- [MS Teams Notification MCP (Model Context Protocol) Server](#ms-teams-notification-mcp-model-context-protocol-server)
  - [Table of contents](#table-of-contents)
  - [Goal](#goal)
  - [Theory | The basics](#theory--the-basics)
    - [Key Terminology](#key-terminology)
    - [Tools, Resources, Prompts](#tools-resources-prompts)
    - [Communication | JSON-RPC](#communication--json-rpc)
    - [Transport Layer (HTTP, SSE, Streamable HTTP)](#transport-layer-http-sse-streamable-http)
      - [Standard HTTP](#standard-http)
      - [Server-Sent Events (SSE)](#server-sent-events-sse)
      - [Streamable HTTP](#streamable-http)
  - [Setup](#setup)
    - [Installation](#installation)
    - [Environment Variables](#environment-variables)
    - [Building and Running](#building-and-running)
  - [References](#references)

## Goal

I want to build an MCP server that can be connected from MCP clients such as Cursor or VS Code GitHub Copilot, then send a message to my MS Teams chat through Agent mode.

## Theory | The basics

MCP is a protocol for communication between AI agents and tools. It defines a standard way for agents to interact with tools, and for tools to provide information back to agents. MCP is designed to be flexible and extensible, allowing for a wide range of use cases.

### Key Terminology

- **MCP Client**: An application that implements the MCP protocol to communicate with an MCP server. Examples include Cursor, VS Code GitHub Copilot, Cloud Desktop, and more.
  - Contains or orchestrates access to the model
  - Sends prompts to the LLM
  - Sends tool requests to the MCP server
- **LLM (Large Language Model)**: The model that processes prompts and generates responses.
- **MCP Server**: The server that implements the MCP protocol to handle requests from MCP clients and interact with tools.
  - Hosts and executes tools
  - Hosts resources
  - Hosts reusable prompts
  - Validates input

### Tools, Resources, Prompts

- **Tools**: Functions or APIs that the MCP server can execute on behalf of the MCP client. Tools can perform various tasks, such as fetching data, performing calculations, or interacting with external services.
  - Name
  - Description
  - Input schema
  - Output schema
- **Resources**: Data or information that the MCP server can provide to the MCP client.
- **Prompts**: Predefined prompts that the MCP server can provide to the MCP client.

### Communication | JSON-RPC

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "send_message_to_teams",
    "arguments": {
      "message": "Hello, MS Teams!"
    }
  },
  "id": 1
}
```

### Transport Layer (HTTP, SSE, Streamable HTTP)

#### Standard HTTP

- Request-response model
- Best for quick and simple interactions
- Limited by latency and connection overhead

#### Server-Sent Events (SSE)

- Unidirectional communication from server to client
- Best for real-time updates and notifications

#### Streamable HTTP

- Allows continuous data streaming between client and server
- Best for long-running tasks and large data transfers
- Currently considered to be the future of MCP communication

## Setup

### Installation

Install dependencies from the root of the repository:

```bash
npm install
```

### Environment Variables

This project uses environment variables to configure the MCP server. Follow these steps to set up your environment:

**Copy the environment template:**

```bash
cp .env.example .env
```

**Edit `.env` with your configuration:**

```bash
# Required
TEAMS_WEBHOOK_URL=https://your-organization.webhook.office.com/webhookb2/...

# Optional (defaults shown)
PORT=8787
HOST=127.0.0.1
```

1. **Get your Teams Webhook URL:**
   - Open Microsoft Teams
   - Go to your target channel → **Settings** → **Connectors**
   - Search for "Incoming Webhook" and select it
   - Click **Configure** and give it a name
   - Copy the webhook URL and paste it in `.env` as `TEAMS_WEBHOOK_URL`

2. **Ensure `.env` is not committed** (it's already in `.gitignore`, but double-check for sensitive data)

### Building and Running

```bash
# Build TypeScript
npm run build

# Run stdio server
node dist/stdio-server/index.js

# Run streamable HTTP server
node dist/streamable-http-server/index.js

# Test Teams integration directly
npm run test:teams -- --message "Hello from integration test"
```

Optional test flags:

```bash
# Use an explicit webhook URL
npm run test:teams -- --webhookUrl "https://your-organization.webhook.office.com/webhookb2/..."

# Dry run (validates inputs without sending)
npm run test:teams -- --dryRun
```

**Note:** The server will fail to start if required environment variables are missing. Check the error message for which variable needs to be set.

## References

- <https://modelcontextprotocol.io/docs/develop/build-server>
- [Build an MCP Server in Node.js: Model Context Protocol Tutorial](https://oneuptime.com/blog/post/2025-12-17-build-mcp-server-nodejs/view)
- [@modelcontextprotocol/sdk](https://www.npmjs.com/package/%40modelcontextprotocol/sdk?activeTab=readme)
- [Create MCP Server in Node.js: Step-by-Step Guide | by Smit Pipaliya | ServerAvatar | Medium](https://medium.com/serveravatar/create-mcp-server-in-node-js-step-by-step-guide-d60ddc659002)
- [Building Your First MCP Server: A Beginner’s Guide - DEV Community](https://dev.to/kevin-uehara/building-your-first-mcp-server-a-beginners-guide-59ml)
- [YouTube](https://www.youtube.com/watch?v=299LRZQchpI)
