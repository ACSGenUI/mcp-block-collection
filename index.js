#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from 'fs-extra';
import path from 'path';

// Load blocks.json for block information
let BLOCKS_METADATA = null;

async function loadBlocksMetadata() {
  try {
    // Try to load from the MCP server's own directory first
    const serverDir = path.dirname(new URL(import.meta.url).pathname);
    let blocksJsonPath = path.join(serverDir, 'blocks.json');
    
    if (!await fs.pathExists(blocksJsonPath)) {
      // Try to find in parent directories (up to 5 levels)
      let currentDir = serverDir;
      let searchDepth = 0;
      const maxSearchDepth = 5;
      
      while (searchDepth < maxSearchDepth && currentDir !== '/') {
        const testPath = path.join(currentDir, 'blocks.json');
        if (await fs.pathExists(testPath)) {
          blocksJsonPath = testPath;
          break;
        }
        currentDir = path.dirname(currentDir);
        searchDepth++;
      }
    }
    
    if (await fs.pathExists(blocksJsonPath)) {
      const content = await fs.readFile(blocksJsonPath, 'utf8');
      BLOCKS_METADATA = JSON.parse(content);
      console.error(`Loaded blocks metadata from: ${blocksJsonPath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Failed to load blocks.json:', error.message);
    return false;
  }
}

// Create MCP server
const server = new McpServer({
  name: 'aem-block-collection',
  version: '1.0.0',
});

// Register the blocks.json as a resource
server.registerPrompt("aem-blocks-metadata",
  {
    title: "AEM Blocks Metadata",
    description: "Access to the complete blocks.json metadata for AEM blocks",
  },
  async () => {
    try {
      if (!BLOCKS_METADATA) {
        return {
          messages: [
            {
              role: "assistant",
              content: {
                type: "text",
                text: "No blocks metadata available. Please ensure blocks.json exists."
              }
            }
          ]
        };
      }

      return {
        messages: [
          {
            role: "assistant",
            content: {
              type: "text",
              text: JSON.stringify(BLOCKS_METADATA, null, 2)
            }
          }
        ]
      };
    } catch (error) {
      return {
        messages: [
          {
            role: "assistant",
            content: {
              type: "text",
              text: `Error loading blocks metadata: ${error.message}`
            }
          }
        ]
      };
    }
  }
);

// Register the list_blocks tool
server.registerTool("list_blocks",
  {
    title: "List AEM Blocks",
    description: "List all available AEM blocks with metadata from blocks.json",
  },
  async () => {
    try {
      if (!BLOCKS_METADATA) {
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify({
              error: 'No blocks metadata available. Please ensure blocks.json exists.',
              suggestion: 'Check if blocks.json is present in the current or parent directories.',
              currentWorkingDir: process.cwd()
            }, null, 2) 
          }]
        };
      }

      const blocks = BLOCKS_METADATA.map(block => ({
        name: block.name,
        description: block.description,
        jsFile: block.js_file,
        cssFile: block.css_file,
        helperFile: block.helper_file || null,
        hasCSS: !!block.css_file,
        hasJS: !!block.js_file,
        hasHelper: !!block.helper_file,
        fileCount: [block.js_file, block.css_file, block.helper_file].filter(Boolean).length
      }));

      return {
        content: [{ 
          type: "text", 
          text: JSON.stringify({
            blocks,
            total: blocks.length,
            mode: 'metadata-only',
            message: 'Using blocks.json metadata for analysis',
            source: 'blocks.json'
          }, null, 2) 
        }]
      };
    } catch (error) {
      return {
        content: [{ 
          type: "text", 
          text: JSON.stringify({
            error: 'Failed to list blocks',
            details: error.message,
            currentWorkingDir: process.cwd()
          }, null, 2) 
        }]
      };
    }
  }
);

// Load blocks metadata on startup
loadBlocksMetadata().then(loaded => {
  if (loaded) {
    console.error(`AEM Block Collection MCP Server started`);
    console.error(`Loaded metadata for ${BLOCKS_METADATA.length} blocks from blocks.json`);
  } else {
    console.error(`AEM Block Collection MCP Server started (no blocks.json found)`);
  }
}).catch(error => {
  console.error('Failed to load blocks metadata:', error.message);
});

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);
