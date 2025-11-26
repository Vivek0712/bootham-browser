// Agent service for Bedrock integration
const { BedrockRuntimeClient, ConverseCommand } = require('@aws-sdk/client-bedrock-runtime');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Generate UUID v4 using crypto
function uuidv4() {
  return crypto.randomUUID();
}

const modelId = "us.anthropic.claude-3-7-sonnet-20250219-v1:0";

const systemPrompt = `You are a web navigation assistant with vision capabilities. When you don't know something DO NOT stop or make assumptions, ASK the user for feedback so we can continue. When you see a screenshot, analyze it carefully to identify elements and their positions. First click on elements like form fields, then use the type tool to enter text. You can submit forms by setting submit=true when typing. You can scroll up or down to see more content on the page. Think step by step and take screenshot between each to ensure you are doing what you think you are doing.`;

// Define web interaction tools
const webTools = [
  {
    "toolSpec": {
      "name": "navigate",
      "description": "Navigate to a specified URL",
      "inputSchema": {
        "json": {
          "type": "object",
          "properties": {
            "url": { "type": "string" }
          },
          "required": ["url"]
        }
      }
    }
  },
  {
    "toolSpec": {
      "name": "screenshot",
      "description": "Take a screenshot of the current page",
      "inputSchema": {
        "json": {
          "type": "object",
          "properties": {},
          "required": []
        }
      }
    }
  },
  {
    "toolSpec": {
      "name": "click",
      "description": "Click at specific coordinates on the page",
      "inputSchema": {
        "json": {
          "type": "object",
          "properties": {
            "x": {
              "type": "number",
              "description": "X coordinate for the click"
            },
            "y": {
              "type": "number",
              "description": "Y coordinate for the click"
            }
          },
          "required": ["x", "y"]
        }
      }
    }
  },
  {
    "toolSpec": {
      "name": "scroll",
      "description": "Scroll the page up or down",
      "inputSchema": {
        "json": {
          "type": "object",
          "properties": {
            "direction": {
              "type": "string",
              "description": "Direction to scroll: 'up' or 'down'"
            },
            "amount": {
              "type": "number",
              "description": "Amount to scroll in pixels (default: 500)"
            }
          },
          "required": ["direction"]
        }
      }
    }
  },
  {
    "toolSpec": {
      "name": "type",
      "description": "Type text into the last clicked element, with option to submit",
      "inputSchema": {
        "json": {
          "type": "object",
          "properties": {
            "text": {
              "type": "string",
              "description": "Text to type into the last clicked element"
            },
            "submit": {
              "type": "boolean",
              "description": "Whether to press Enter after typing (to submit forms)"
            }
          },
          "required": ["text"]
        }
      }
    }
  },
  {
    "toolSpec": {
      "name": "write_file",
      "description": "Write content to a file",
      "inputSchema": {
        "json": {
          "type": "object",
          "properties": {
            "filename": {
              "type": "string",
              "description": "Name of the file to write to"
            },
            "content": {
              "type": "string",
              "description": "Content to write to the file"
            }
          },
          "required": ["filename", "content"]
        }
      }
    }
  },
  {
    "toolSpec": {
      "name": "ask_user",
      "description": "Ask the user a question and get their response. Always use this tool when you need user feedback",
      "inputSchema": {
        "json": {
          "type": "object",
          "properties": {
            "question": {
              "type": "string",
              "description": "The question to ask the user"
            }
          },
          "required": ["question"]
        }
      }
    }
  },
  {
    "toolSpec": {
      "name": "get_selected_text",
      "description": "Get the text that is currently selected on the page by the user",
      "inputSchema": {
        "json": {
          "type": "object",
          "properties": {},
          "required": []
        }
      }
    }
  },
  {
    "toolSpec": {
      "name": "get_page_content",
      "description": "Get the visible text content from the current page",
      "inputSchema": {
        "json": {
          "type": "object",
          "properties": {
            "selector": {
              "type": "string",
              "description": "Optional CSS selector to get content from specific element (e.g., 'article', 'main', '.content')"
            }
          },
          "required": []
        }
      }
    }
  }
];

class AgentService {
  constructor() {
    this.bedrockClient = null;
    this.page = null;
    this.browser = null;
    this.sessionId = null;
    this.messages = [];
    this.isRunning = false;
    this.eventCallback = null;
  }

  initialize(region = 'us-west-2') {
    this.bedrockClient = new BedrockRuntimeClient({ region });
    this.sessionId = uuidv4();
    
    // Create screenshots directory
    const screenshotsDir = path.join(process.cwd(), 'screenshots', this.sessionId);
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    
    // Create artifacts directory
    const artifactsDir = path.join(process.cwd(), 'artefacts', this.sessionId);
    if (!fs.existsSync(artifactsDir)) {
      fs.mkdirSync(artifactsDir, { recursive: true });
    }
  }

  setEventCallback(callback) {
    this.eventCallback = callback;
  }

  emitEvent(type, data) {
    if (this.eventCallback) {
      this.eventCallback({ type, data });
    }
  }

  async initializeBrowser(browserContext) {
    // Use the provided browser context from Electron
    this.page = browserContext;
  }

  async executePrompt(prompt) {
    if (this.isRunning) {
      throw new Error('Agent is already running');
    }

    this.isRunning = true;
    this.messages = [{
      role: "user",
      content: [{ text: prompt }]
    }];

    try {
      this.emitEvent('agent-start', { prompt });
      await this.runAgentLoop();
      this.emitEvent('agent-complete', {});
    } catch (error) {
      this.emitEvent('agent-error', { error: error.message });
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  async runAgentLoop() {
    let requestCount = 1;

    this.emitEvent('log', { message: `Sending request ${requestCount} to Bedrock...`, type: 'system' });

    let response = await this.bedrockClient.send(new ConverseCommand({
      modelId,
      system: [{ text: systemPrompt }],
      messages: this.messages,
      toolConfig: { tools: webTools }
    }));

    let outputMessage = response.output.message;
    let stopReason = response.stopReason;

    this.emitEvent('log', { message: JSON.stringify(outputMessage, null, 2), type: 'assistant' });
    this.messages.push(outputMessage);

    while (stopReason === "tool_use") {
      const toolContent = [];

      for (const content of outputMessage.content) {
        if (content.toolUse) {
          const tool = content.toolUse;
          const toolId = tool.toolUseId;
          const toolInput = tool.input || {};

          let result = await this.executeTool(tool.name, toolInput);
          
          if (tool.name === "screenshot") {
            const filename = result.filename;
            const imageBytes = fs.readFileSync(filename);
            toolContent.push({
              toolResult: {
                toolUseId: toolId,
                content: [
                  { json: { filename } },
                  { image: { format: "png", source: { bytes: imageBytes } } }
                ]
              }
            });
          } else if (tool.name === "ask_user") {
            // Wait for user response via event
            const response = await this.waitForUserResponse(toolInput.question);
            result = { response };
            toolContent.push({
              toolResult: {
                toolUseId: toolId,
                content: [{ json: result }]
              }
            });
          } else {
            toolContent.push({
              toolResult: {
                toolUseId: toolId,
                content: [{ json: result }]
              }
            });
          }
        }
      }

      // Add browser context
      const pageInfo = await this.getPageInfo();
      toolContent.push({
        text: `Current page: Title: '${pageInfo.title}', URL: '${pageInfo.url}'`
      });

      const toolResultMessage = {
        role: "user",
        content: toolContent
      };

      this.messages.push(toolResultMessage);
      requestCount++;

      this.emitEvent('log', { message: `Sending request ${requestCount} to Bedrock...`, type: 'system' });

      response = await this.bedrockClient.send(new ConverseCommand({
        modelId,
        system: [{ text: systemPrompt }],
        messages: this.messages,
        toolConfig: { tools: webTools }
      }));

      outputMessage = response.output.message;
      this.messages.push(outputMessage);
      this.emitEvent('log', { message: JSON.stringify(outputMessage, null, 2), type: 'assistant' });
      stopReason = response.stopReason;
    }
  }

  async executeTool(toolName, toolInput) {
    this.emitEvent('log', { message: `Executing tool: ${toolName}`, type: 'system' });

    try {
      switch (toolName) {
        case 'navigate':
          return await this.navigate(toolInput.url);
        case 'screenshot':
          return await this.takeScreenshot();
        case 'click':
          return await this.click(toolInput.x, toolInput.y);
        case 'scroll':
          return await this.scroll(toolInput.direction, toolInput.amount || 500);
        case 'type':
          return await this.typeText(toolInput.text, toolInput.submit);
        case 'write_file':
          return await this.writeFile(toolInput.filename, toolInput.content);
        case 'ask_user':
          // Handled separately in the loop
          return {};
        case 'get_selected_text':
          return await this.getSelectedText();
        case 'get_page_content':
          return await this.getPageContent(toolInput.selector);
        default:
          return { error: `Unknown tool: ${toolName}` };
      }
    } catch (error) {
      console.error(`[Agent] Error executing tool ${toolName}:`, error);
      this.emitEvent('log', { message: `Tool error: ${error.message}`, type: 'error' });
      return { error: error.message };
    }
  }

  async navigate(url) {
    this.emitEvent('tool-execute', { tool: 'navigate', params: { url } });
    
    try {
      // Stop any current navigation first
      this.page.stop();
      
      // Load the new URL
      await this.page.loadURL(url);
      
      // Wait for the page to finish loading
      await new Promise((resolve) => {
        const timeout = setTimeout(resolve, 10000); // 10 second timeout
        
        const checkLoading = () => {
          if (!this.page.isLoading()) {
            clearTimeout(timeout);
            resolve();
          } else {
            setTimeout(checkLoading, 100);
          }
        };
        
        checkLoading();
      });
      
      // Additional wait for page to stabilize
      await this.sleep(1000);
      
      const title = await this.page.getTitle();
      return { title };
    } catch (error) {
      console.error('[Agent] Navigation error:', error);
      // Return partial success even if there's an error
      return { title: 'Navigation Error', error: error.message };
    }
  }

  async takeScreenshot() {
    const filename = path.join(process.cwd(), 'screenshots', this.sessionId, `screenshot_${uuidv4()}.png`);
    this.emitEvent('tool-execute', { tool: 'screenshot', params: { filename } });
    
    const image = await this.page.capturePage();
    fs.writeFileSync(filename, image.toPNG());
    
    return { filename };
  }

  async click(x, y) {
    this.emitEvent('tool-execute', { tool: 'click', params: { x, y } });
    
    // Use executeJavaScript to click at coordinates
    await this.page.executeJavaScript(`
      (function() {
        const element = document.elementFromPoint(${x}, ${y});
        if (element) {
          element.focus();
          element.click();
        }
      })();
    `);
    
    await this.sleep(1000);
    return { clicked_at: { x, y } };
  }

  async scroll(direction, amount) {
    this.emitEvent('tool-execute', { tool: 'scroll', params: { direction, amount } });
    const deltaY = direction.toLowerCase() === 'down' ? amount : -amount;
    await this.page.executeJavaScript(`window.scrollBy(0, ${deltaY})`);
    await this.sleep(1000);
    return { scrolled: true, direction, amount };
  }

  async typeText(text, submit = false) {
    this.emitEvent('tool-execute', { tool: 'type', params: { text, submit } });
    
    // Use executeJavaScript to type text into focused element
    const escapedText = text.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
    
    await this.page.executeJavaScript(`
      (function() {
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
          activeElement.value = '${escapedText}';
          activeElement.dispatchEvent(new Event('input', { bubbles: true }));
          ${submit ? 'activeElement.form && activeElement.form.submit();' : ''}
        }
      })();
    `);
    
    await this.sleep(1000);
    return { typed: true, text, submitted: submit };
  }

  async writeFile(filename, content) {
    this.emitEvent('tool-execute', { tool: 'write_file', params: { filename } });
    const filepath = path.join(process.cwd(), 'artefacts', this.sessionId, filename);
    fs.writeFileSync(filepath, content, 'utf8');
    return { written: true, filename, size: content.length };
  }

  async getSelectedText() {
    this.emitEvent('tool-execute', { tool: 'get_selected_text', params: {} });
    
    try {
      const selectedText = await this.page.executeJavaScript(`
        window.getSelection().toString();
      `);
      
      return { 
        selected_text: selectedText || '',
        has_selection: selectedText && selectedText.length > 0
      };
    } catch (error) {
      console.error('[Agent] Error getting selected text:', error);
      return { selected_text: '', has_selection: false, error: error.message };
    }
  }

  async getPageContent(selector = 'body') {
    this.emitEvent('tool-execute', { tool: 'get_page_content', params: { selector } });
    
    try {
      const content = await this.page.executeJavaScript(`
        (function() {
          const element = document.querySelector('${selector}');
          if (!element) return '';
          
          // Get visible text content, removing script and style tags
          const clone = element.cloneNode(true);
          const scripts = clone.querySelectorAll('script, style, noscript');
          scripts.forEach(s => s.remove());
          
          return clone.innerText || clone.textContent || '';
        })();
      `);
      
      return { 
        content: content || '',
        selector: selector,
        length: content ? content.length : 0
      };
    } catch (error) {
      console.error('[Agent] Error getting page content:', error);
      return { content: '', selector, length: 0, error: error.message };
    }
  }

  async getPageInfo() {
    try {
      const title = await this.page.getTitle();
      const url = await this.page.getURL();
      return { title, url };
    } catch (error) {
      return { title: "Unknown", url: "Unknown" };
    }
  }

  waitForUserResponse(question) {
    return new Promise((resolve) => {
      // Store the resolve function locally, don't send it via IPC
      this.userResponseResolve = resolve;
      this.emitEvent('ask-user', { question });
    });
  }
  
  resolveUserResponse(response) {
    if (this.userResponseResolve) {
      this.userResponseResolve(response);
      this.userResponseResolve = null;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop() {
    this.isRunning = false;
  }
}

module.exports = AgentService;
