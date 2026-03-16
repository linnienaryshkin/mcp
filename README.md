# MCP (Model Context Protocol) Server

Let's experiment with creating our own MCP server to learn how this technology works in depth.

## Goal

I want to build an MCP server that can be connected from MCP clients such as Cursor or VS Code GitHub Copilot, then send a message to my MS Teams chat through Agent mode.

## Theory | The basics

MCP is a protocol for communication between AI agents and tools. It defines a standard way for agents to interact with tools, and for tools to provide information back to agents. MCP is designed to be flexible and extensible, allowing for a wide range of use cases.

### Key Terminology

* **MCP Client**: An application that implements the MCP protocol to communicate with an MCP server. Examples include Cursor, VS Code GitHub Copilot, Cloud Desktop, and more.
  * Contains or orchestrates access to the model
  * Sends prompts to the LLM
  * Sends tool requests to the MCP server
* **LLM (Large Language Model)**: The model that processes prompts and generates responses.
* **MCP Server**: The server that implements the MCP protocol to handle requests from MCP clients and interact with tools.
  * Hosts and executes tools
  * Hosts resources
  * Hosts reusable prompts
  * Validates input

### Tools, Resources, Prompts

* **Tools**: Functions or APIs that the MCP server can execute on behalf of the MCP client. Tools can perform various tasks, such as fetching data, performing calculations, or interacting with external services.
  * Name
  * Description
  * Input schema
  * Output schema
* **Resources**: Data or information that the MCP server can provide to the MCP client.
* **Prompts**: Predefined prompts that the MCP server can provide to the MCP client.

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

* Request-response model
* Best for quick and simple interactions
* Limited by latency and connection overhead

#### Server-Sent Events (SSE)

* Unidirectional communication from server to client
* Best for real-time updates and notifications

#### Streamable HTTP

* Allows continuous data streaming between client and server
* Best for long-running tasks and large data transfers
* Currently considered to be the future of MCP communication

## References

* <https://modelcontextprotocol.io/docs/develop/build-server>
* [Build an MCP Server in Node.js: Model Context Protocol Tutorial](https://oneuptime.com/blog/post/2025-12-17-build-mcp-server-nodejs/view)
* [Create MCP Server in Node.js: Step-by-Step Guide | by Smit Pipaliya | ServerAvatar | Medium](https://medium.com/serveravatar/create-mcp-server-in-node-js-step-by-step-guide-d60ddc659002)
* [Building Your First MCP Server: A Beginner’s Guide - DEV Community](https://dev.to/kevin-uehara/building-your-first-mcp-server-a-beginners-guide-59ml)
* [YouTube](https://www.youtube.com/watch?v=299LRZQchpI)

## Implementation in this repository

This repository now includes a working TypeScript MCP server in `src/server.ts`.

### Implemented tools

* `ping`: Simple health check and optional echo.
* `send_message_to_teams`: Sends a text message to a Microsoft Teams Incoming Webhook.

### Setup

```bash
npm install
```

### Run locally (dev)

```bash
npm run dev
```

### Build and run

```bash
npm run build
npm start
```

### Teams webhook configuration

You can pass `webhookUrl` directly in tool arguments, or set an environment variable before launching the server:

```bash
export TEAMS_WEBHOOK_URL="https://your-teams-webhook-url"
```

### Example MCP client configuration (stdio)

For clients that support stdio MCP servers, use a command like:

```json
{
  "mcpServers": {
    "teams-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/mcp/dist/server.js"],
      "env": {
        "TEAMS_WEBHOOK_URL": "https://your-teams-webhook-url"
      }
    }
  }
}
```
