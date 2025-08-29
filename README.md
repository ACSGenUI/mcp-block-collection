# AEM Block Collection MCP Server

A minimal MCP (Model Context Protocol) server that provides access to AEM block metadata from `blocks.json`.

## What it does

This server exposes a single tool: `list_blocks` - which reads AEM block information from a `blocks.json` file and returns structured data about all available blocks.

## Installation

```bash
npm install
```

## Usage

```bash
node index.js
```

## Configuration

The server automatically looks for `blocks.json` in the current directory or parent directories.

## MCP Tool

### `list_blocks`

Lists all available AEM blocks with metadata from `blocks.json`.

**Input**: None required
**Output**: JSON with block information including names, descriptions, file paths, and file counts.

## Dependencies

- `@modelcontextprotocol/sdk` - MCP server implementation
- `fs-extra` - Enhanced file system operations
- `zod` - Schema validation

## MCP Configuration

To use this server with an MCP client (like Claude Desktop or Cline), add this configuration:

```json
{
  "mcpServers": {
    "aem-block-collection": {
      "command": "node",
      "args": ["https://github.com/ACSUI-Gen-Playground/mcp-block-collection#main"],
      "env": {}
    }
  }
}
```

**Note**: Replace `https://github.com/ACSUI-Gen-Playground/mcp-block-collection` with the actual node module name of the server.
