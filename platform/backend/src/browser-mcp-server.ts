import type { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types.js";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import logger from "@/logging";

/**
 * Constants for Browser MCP server
 */
const BROWSER_MCP_SERVER_NAME = "archestra-browser";
const MCP_SERVER_TOOL_NAME_SEPARATOR = "__";

const TOOL_BROWSE_URL_NAME = "browse_url";
const TOOL_TAKE_SCREENSHOT_NAME = "take_screenshot";
const TOOL_CLICK_ELEMENT_NAME = "click_element";
const TOOL_FILL_INPUT_NAME = "fill_input";
const TOOL_GET_PAGE_CONTENT_NAME = "get_page_content";
const TOOL_NAVIGATE_BACK_NAME = "navigate_back";
const TOOL_NAVIGATE_FORWARD_NAME = "navigate_forward";

// Construct fully-qualified tool names
const TOOL_BROWSE_URL_FULL_NAME = `${BROWSER_MCP_SERVER_NAME}${MCP_SERVER_TOOL_NAME_SEPARATOR}${TOOL_BROWSE_URL_NAME}`;
const TOOL_TAKE_SCREENSHOT_FULL_NAME = `${BROWSER_MCP_SERVER_NAME}${MCP_SERVER_TOOL_NAME_SEPARATOR}${TOOL_TAKE_SCREENSHOT_NAME}`;
const TOOL_CLICK_ELEMENT_FULL_NAME = `${BROWSER_MCP_SERVER_NAME}${MCP_SERVER_TOOL_NAME_SEPARATOR}${TOOL_CLICK_ELEMENT_NAME}`;
const TOOL_FILL_INPUT_FULL_NAME = `${BROWSER_MCP_SERVER_NAME}${MCP_SERVER_TOOL_NAME_SEPARATOR}${TOOL_FILL_INPUT_NAME}`;
const TOOL_GET_PAGE_CONTENT_FULL_NAME = `${BROWSER_MCP_SERVER_NAME}${MCP_SERVER_TOOL_NAME_SEPARATOR}${TOOL_GET_PAGE_CONTENT_NAME}`;
const TOOL_NAVIGATE_BACK_FULL_NAME = `${BROWSER_MCP_SERVER_NAME}${MCP_SERVER_TOOL_NAME_SEPARATOR}${TOOL_NAVIGATE_BACK_NAME}`;
const TOOL_NAVIGATE_FORWARD_FULL_NAME = `${BROWSER_MCP_SERVER_NAME}${MCP_SERVER_TOOL_NAME_SEPARATOR}${TOOL_NAVIGATE_FORWARD_NAME}`;

/**
 * Browser session management
 */
interface BrowserSession {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  sessionId: string;
}

class BrowserMCPManager {
  private sessions: Map<string, BrowserSession> = new Map();

  async createSession(sessionId: string): Promise<BrowserSession> {
    if (this.sessions.has(sessionId)) {
      return this.sessions.get(sessionId)!;
    }

    const browser = await chromium.launch({
      headless: false,
      args: [
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });

    const page = await context.newPage();
    
    const session: BrowserSession = {
      browser,
      context,
      page,
      sessionId
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  async getSession(sessionId: string): Promise<BrowserSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      await session.browser.close();
      this.sessions.delete(sessionId);
    }
  }

  async closeAllSessions(): Promise<void> {
    for (const [sessionId] of this.sessions) {
      await this.closeSession(sessionId);
    }
  }
}

const browserManager = new BrowserMCPManager();

export function getBrowserMcpTools(): Tool[] {
  return [
    {
      name: TOOL_BROWSE_URL_FULL_NAME,
      title: "Browse URL",
      description: "Navigate to a webpage and return page information with screenshot",
      inputSchema: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "URL to navigate to"
          },
          sessionId: {
            type: "string", 
            description: "Browser session ID"
          }
        },
        required: ["url", "sessionId"]
      },
      annotations: {},
      _meta: {}
    },
    {
      name: TOOL_TAKE_SCREENSHOT_FULL_NAME,
      title: "Take Screenshot",
      description: "Take a screenshot of the current page",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: {
            type: "string",
            description: "Browser session ID"
          }
        },
        required: ["sessionId"]
      },
      annotations: {},
      _meta: {}
    },
    {
      name: TOOL_CLICK_ELEMENT_FULL_NAME,
      title: "Click Element",
      description: "Click on an element using CSS selector",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: {
            type: "string",
            description: "Browser session ID"
          },
          selector: {
            type: "string",
            description: "CSS selector for the element to click"
          }
        },
        required: ["sessionId", "selector"]
      },
      annotations: {},
      _meta: {}
    },
    {
      name: TOOL_FILL_INPUT_FULL_NAME,
      title: "Fill Input",
      description: "Fill an input field with text",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: {
            type: "string",
            description: "Browser session ID"
          },
          selector: {
            type: "string", 
            description: "CSS selector for the input field"
          },
          text: {
            type: "string",
            description: "Text to fill in the input field"
          }
        },
        required: ["sessionId", "selector", "text"]
      },
      annotations: {},
      _meta: {}
    },
    {
      name: TOOL_GET_PAGE_CONTENT_FULL_NAME,
      title: "Get Page Content",
      description: "Extract text content and basic page information",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: {
            type: "string",
            description: "Browser session ID"
          }
        },
        required: ["sessionId"]
      },
      annotations: {},
      _meta: {}
    },
    {
      name: TOOL_NAVIGATE_BACK_FULL_NAME,
      title: "Navigate Back",
      description: "Go back to the previous page",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: {
            type: "string",
            description: "Browser session ID"
          }
        },
        required: ["sessionId"]
      },
      annotations: {},
      _meta: {}
    },
    {
      name: TOOL_NAVIGATE_FORWARD_FULL_NAME,
      title: "Navigate Forward", 
      description: "Go forward to the next page",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: {
            type: "string",
            description: "Browser session ID"
          }
        },
        required: ["sessionId"]
      },
      annotations: {},
      _meta: {}
    }
  ];
}

/**
 * Tool implementation functions
 */
export async function callBrowserMcpTool(
  toolName: string,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    switch (toolName) {
      case TOOL_BROWSE_URL_FULL_NAME:
        return await browseTo(args.url, args.sessionId);
      
      case TOOL_TAKE_SCREENSHOT_FULL_NAME:
        return await takeScreenshot(args.sessionId);
      
      case TOOL_CLICK_ELEMENT_FULL_NAME:
        return await clickElement(args.sessionId, args.selector);
      
      case TOOL_FILL_INPUT_FULL_NAME:
        return await fillInput(args.sessionId, args.selector, args.text);
      
      case TOOL_GET_PAGE_CONTENT_FULL_NAME:
        return await getPageContent(args.sessionId);
      
      case TOOL_NAVIGATE_BACK_FULL_NAME:
        return await navigateBack(args.sessionId);
      
      case TOOL_NAVIGATE_FORWARD_FULL_NAME:
        return await navigateForward(args.sessionId);
      
      default:
        throw new Error(`Unknown browser tool: ${toolName}`);
    }
  } catch (error) {
    logger.error("Browser MCP tool error:", error);
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      ],
      isError: true
    };
  }
}

async function browseTo(url: string, sessionId: string): Promise<CallToolResult> {
  const session = await browserManager.createSession(sessionId);
  
  await session.page.goto(url);
  const title = await session.page.title();
  const screenshot = await session.page.screenshot({ encoding: 'base64' });
  
  return {
    content: [
      {
        type: "text",
        text: `Successfully navigated to: ${url}\nPage Title: ${title}`
      },
      {
        type: "image",
        data: screenshot,
        mimeType: "image/png"
      }
    ]
  };
}

async function takeScreenshot(sessionId: string): Promise<CallToolResult> {
  const session = await browserManager.getSession(sessionId);
  if (!session) {
    throw new Error("Browser session not found. Please browse to a URL first.");
  }
  
  const screenshot = await session.page.screenshot({ encoding: 'base64' });
  const url = session.page.url();
  
  return {
    content: [
      {
        type: "text",
        text: `Screenshot taken of: ${url}`
      },
      {
        type: "image", 
        data: screenshot,
        mimeType: "image/png"
      }
    ]
  };
}

async function clickElement(sessionId: string, selector: string): Promise<CallToolResult> {
  const session = await browserManager.getSession(sessionId);
  if (!session) {
    throw new Error("Browser session not found. Please browse to a URL first.");
  }
  
  await session.page.click(selector);
  const screenshot = await session.page.screenshot({ encoding: 'base64' });
  
  return {
    content: [
      {
        type: "text",
        text: `Clicked element: ${selector}`
      },
      {
        type: "image",
        data: screenshot, 
        mimeType: "image/png"
      }
    ]
  };
}

async function fillInput(sessionId: string, selector: string, text: string): Promise<CallToolResult> {
  const session = await browserManager.getSession(sessionId);
  if (!session) {
    throw new Error("Browser session not found. Please browse to a URL first.");
  }
  
  await session.page.fill(selector, text);
  const screenshot = await session.page.screenshot({ encoding: 'base64' });
  
  return {
    content: [
      {
        type: "text",
        text: `Filled input ${selector} with: ${text}`
      },
      {
        type: "image",
        data: screenshot,
        mimeType: "image/png"
      }
    ]
  };
}

async function getPageContent(sessionId: string): Promise<CallToolResult> {
  const session = await browserManager.getSession(sessionId);
  if (!session) {
    throw new Error("Browser session not found. Please browse to a URL first.");
  }
  
  const title = await session.page.title();
  const url = session.page.url();
  const textContent = await session.page.textContent('body');
  
  return {
    content: [
      {
        type: "text",
        text: `Page: ${title}\nURL: ${url}\n\nContent:\n${textContent?.substring(0, 2000)}...`
      }
    ]
  };
}

async function navigateBack(sessionId: string): Promise<CallToolResult> {
  const session = await browserManager.getSession(sessionId);
  if (!session) {
    throw new Error("Browser session not found. Please browse to a URL first.");
  }
  
  await session.page.goBack();
  const url = session.page.url();
  const screenshot = await session.page.screenshot({ encoding: 'base64' });
  
  return {
    content: [
      {
        type: "text",
        text: `Navigated back to: ${url}`
      },
      {
        type: "image",
        data: screenshot,
        mimeType: "image/png"
      }
    ]
  };
}

async function navigateForward(sessionId: string): Promise<CallToolResult> {
  const session = await browserManager.getSession(sessionId);
  if (!session) {
    throw new Error("Browser session not found. Please browse to a URL first.");
  }
  
  await session.page.goForward();
  const url = session.page.url();
  const screenshot = await session.page.screenshot({ encoding: 'base64' });
  
  return {
    content: [
      {
        type: "text",
        text: `Navigated forward to: ${url}`
      },
      {
        type: "image",
        data: screenshot,
        mimeType: "image/png"
      }
    ]
  };
}