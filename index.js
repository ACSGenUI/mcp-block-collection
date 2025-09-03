#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Embedded blocks metadata to avoid STDIO transport issues
const BLOCKS_METADATA = [
  {
    "name": "Accordion",
    "description": "Implements an accordion UI pattern, allowing users to expand and collapse sections of content, styled with borders, padding, and transitions for visual feedback.",
    "js_file": "blocks/accordion/accordion.js",
    "css_file": "blocks/accordion/accordion.css"
  },
  {
    "name": "Cards",
    "description": "Displays content in a card-like format with images and text, using a grid layout for responsiveness and basic styling for borders and spacing.",
    "js_file": "blocks/cards/cards.js",
    "css_file": "blocks/cards/cards.css"
  },
  {
    "name": "Carousel",
    "description": "Creates a carousel or slider to showcase content, featuring navigation buttons, slide indicators, and CSS for basic layout and appearance.",
    "js_file": "blocks/carousel/carousel.js",
    "css_file": "blocks/carousel/carousel.css"
  },
  {
    "name": "Columns",
    "description": "Arranges content into columns, adapting to different screen sizes with CSS flexbox for layout control.",
    "js_file": "blocks/columns/columns.js",
    "css_file": "blocks/columns/columns.css"
  },
  {
    "name": "Embed",
    "description": "Embeds external content (videos, social posts) into a page, using placeholders and lazy loading for performance.",
    "js_file": "blocks/embed/embed.js",
    "css_file": "blocks/embed/embed.css"
  },
  {
    "name": "Footer",
    "description": "Loads and displays footer content, fetching it as a fragment and applying basic styling for background color and font size.",
    "js_file": "blocks/footer/footer.js",
    "css_file": "blocks/footer/footer.css"
  },
  {
    "name": "Form",
    "description": "Generates forms from JSON definitions, handling submissions and confirmations, with CSS for structuring fields and basic input styling.",
    "js_file": "blocks/form/form.js",
    "css_file": "blocks/form/form.css",
    "helper_file": "blocks/form/form-fields.js"
  },
  {
    "name": "Fragment",
    "description": "Includes content from another page fragment into the current page.",
    "js_file": "blocks/fragment/fragment.js",
    "css_file": "blocks/fragment/fragment.css"
  },
  {
    "name": "Header",
    "description": "Loads and displays header content, fetching it as a fragment and applying CSS for layout and navigation.",
    "js_file": "blocks/header/header.js",
    "css_file": "blocks/header/header.css"
  },
  {
    "name": "Hero",
    "description": "Presents a hero section with a large image and heading, using CSS for positioning and basic styling.",
    "js_file": "blocks/hero/hero.js",
    "css_file": "blocks/hero/hero.css"
  },
  {
    "name": "Modal",
    "description": "Creates modal dialogs that can be opened via links, styled with CSS for appearance and positioning.",
    "js_file": "blocks/modal/modal.js",
    "css_file": "blocks/modal/modal.css"
  },
  {
    "name": "Quote",
    "description": "Displays a quote with an optional attribution, styled with CSS for quotation marks and alignment.",
    "js_file": "blocks/quote/quote.js",
    "css_file": "blocks/quote/quote.css"
  },
  {
    "name": "Search",
    "description": "Implements a search feature with a search box and results display, using CSS for layout and highlighting search terms.",
    "js_file": "blocks/search/search.js",
    "css_file": "blocks/search/search.css"
  },
  {
    "name": "Table",
    "description": "Renders data in a tabular format, providing options for header display, striping, and borders via CSS classes.",
    "js_file": "blocks/table/table.js",
    "css_file": "blocks/table/table.css"
  },
  {
    "name": "Tabs",
    "description": "Creates a tabbed interface for organizing content into panels, using CSS for layout and basic styling of tabs and panels.",
    "js_file": "blocks/tabs/tabs.js",
    "css_file": "blocks/tabs/tabs.css"
  },
  {
    "name": "Video",
    "description": "Embeds videos from various sources (YouTube, Vimeo, local files), using placeholders and lazy loading for performance, with CSS for basic layout and styling.",
    "js_file": "blocks/video/video.js",
    "css_file": "blocks/video/video.css"
  }
];

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
            message: 'Using embedded blocks metadata for analysis',
            source: 'embedded-data'
          }, null, 2) 
        }]
      };
    } catch (error) {
      return {
        content: [{ 
          type: "text", 
          text: JSON.stringify({
            error: 'Failed to list blocks',
            details: error.message
          }, null, 2) 
        }]
      };
    }
  }
);

// Log startup information
console.error(`AEM Block Collection MCP Server started`);
console.error(`Loaded metadata for ${BLOCKS_METADATA.length} blocks from embedded data`);

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);
