// Agent service for Strands Agent integration
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

// Generate UUID v4 using crypto
function uuidv4() {
  return crypto.randomUUID();
}

// Agent deployment mode: 'local' or 'agentcore'
const AGENT_MODE = process.env.AGENT_MODE || 'local';
const AGENT_RUNTIME_ARN = process.env.AGENT_RUNTIME_ARN;
const AGENT_PORT = process.env.AGENT_PORT || 8080;

// Tool execution mapping - these execute in the browser webview

class AgentService {
  constructor() {
    this.page = null;
    this.browser = null;
    this.sessionId = null;
    this.isRunning = false;
    this.eventCallback = null;
    this.agentProcess = null;
    this.agentMode = AGENT_MODE;
    this.agentClient = null;
  }

  initialize(region = 'us-west-2') {
    this.sessionId = uuidv4();
    
    // Initialize based on deployment mode
    if (this.agentMode === 'agentcore') {
      this.initializeAgentCore(region);
    } else {
      this.initializeLocalAgent();
    }
    
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

  initializeAgentCore(region) {
    console.log('[Agent] Initializing AgentCore client...');
    
    if (!AGENT_RUNTIME_ARN) {
      throw new Error('AGENT_RUNTIME_ARN environment variable is required for AgentCore mode');
    }
    
    const { BedrockAgentCoreClient } = require('@aws-sdk/client-bedrock-agentcore');
    this.agentClient = new BedrockAgentCoreClient({ region });
    
    console.log('[Agent] AgentCore client initialized');
  }

  initializeLocalAgent() {
    console.log('[Agent] Initializing local Strands agent...');
    
    // Start the local Python agent server
    const agentPath = path.join(__dirname, '../agent/agentcore_app.py');
    
    this.agentProcess = spawn('python', [agentPath], {
      env: { ...process.env, PORT: AGENT_PORT },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    this.agentProcess.stdout.on('data', (data) => {
      console.log(`[Agent] ${data.toString()}`);
    });
    
    this.agentProcess.stderr.on('data', (data) => {
      console.error(`[Agent Error] ${data.toString()}`);
    });
    
    this.agentProcess.on('close', (code) => {
      console.log(`[Agent] Process exited with code ${code}`);
    });
    
    // Wait for agent to be ready
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('[Agent] Local agent server started');
        resolve();
      }, 3000);
    });
  }

  async executePrompt(prompt) {
    if (this.isRunning) {
      throw new Error('Agent is already running');
    }

    this.isRunning = true;

    try {
      this.emitEvent('agent-start', { prompt });
      
      if (this.agentMode === 'agentcore') {
        await this.executeAgentCore(prompt);
      } else {
        await this.executeLocalAgent(prompt);
      }
      
      this.emitEvent('agent-complete', {});
    } catch (error) {
      this.emitEvent('agent-error', { error: error.message });
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  async executeAgentCore(prompt, media = null) {
    console.log('[Agent] Executing via AgentCore...');
    
    const { InvokeAgentRuntimeCommand } = require('@aws-sdk/client-bedrock-agentcore');
    
    // Build payload with optional media
    const payload = { prompt };
    if (media) {
      payload.media = media;
    }
    
    const command = new InvokeAgentRuntimeCommand({
      agentRuntimeArn: AGENT_RUNTIME_ARN,
      runtimeSessionId: this.sessionId,
      payload: JSON.stringify(payload)
    });
    
    const response = await this.agentClient.send(command);
    
    // Process streaming response
    const responseBody = response.response.read();
    const responseData = JSON.parse(responseBody);
    
    // Process agent actions from response
    await this.processAgentResponse(responseData);
  }

  async executeLocalAgent(prompt, media = null) {
    console.log('[Agent] Executing via local agent...');
    
    const fetch = require('node-fetch');
    
    // Build payload with optional media
    const payload = { prompt };
    if (media) {
      payload.media = media;
    }
    
    const response = await fetch(`http://localhost:${AGENT_PORT}/invocations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Agent request failed: ${response.statusText}`);
    }
    
    // Process streaming response
    const reader = response.body;
    let buffer = '';
    
    for await (const chunk of reader) {
      buffer += chunk.toString();
      
      // Try to parse complete JSON events
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep incomplete line in buffer
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            const event = JSON.parse(line);
            await this.processAgentEvent(event);
          } catch (e) {
            console.error('[Agent] Failed to parse event:', e);
          }
        }
      }
    }
  }

  async processAgentEvent(event) {
    console.log('[Agent] Processing event:', event.event);
    
    if (event.event === 'tool_use') {
      const toolData = event.data;
      await this.executeToolFromAgent(toolData);
    } else if (event.event === 'message') {
      this.emitEvent('log', { 
        message: JSON.stringify(event.data, null, 2), 
        type: 'assistant' 
      });
    }
  }

  async processAgentResponse(responseData) {
    console.log('[Agent] Processing response:', responseData);
    
    if (responseData.output && responseData.output.message) {
      this.emitEvent('log', { 
        message: JSON.stringify(responseData.output.message, null, 2), 
        type: 'assistant' 
      });
    }
  }

  async executeToolFromAgent(toolData) {
    const toolName = toolData.name;
    const toolInput = toolData.input || {};
    
    console.log(`[Agent] Executing tool from agent: ${toolName}`);
    
    // Execute the tool in the browser
    const result = await this.executeTool(toolName, toolInput);
    
    // If screenshot, send image back to agent for analysis
    if (toolName === 'screenshot' && result.image_data) {
      this.emitEvent('log', { 
        message: 'Screenshot captured, sending to agent for analysis...', 
        type: 'system' 
      });
      
      // Send screenshot to agent with context
      const media = {
        type: 'image',
        format: result.format,
        data: result.image_data
      };
      
      const pageInfo = await this.getPageInfo();
      const contextPrompt = `I took a screenshot of the current page. Page title: "${pageInfo.title}", URL: "${pageInfo.url}". Please analyze the screenshot and continue with the task.`;
      
      // Send to agent based on mode
      if (this.agentMode === 'agentcore') {
        await this.executeAgentCore(contextPrompt, media);
      } else {
        await this.executeLocalAgent(contextPrompt, media);
      }
    } else {
      // Regular tool result logging
      this.emitEvent('log', { 
        message: `Tool ${toolName} executed: ${JSON.stringify(result)}`, 
        type: 'system' 
      });
    }
    
    return result;
  }

  stop() {
    this.isRunning = false;
    
    // Stop local agent process if running
    if (this.agentProcess) {
      this.agentProcess.kill();
      this.agentProcess = null;
    }
  }

  cleanup() {
    this.stop();
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
    const imageBuffer = image.toPNG();
    fs.writeFileSync(filename, imageBuffer);
    
    // Encode image as base64 for sending to agent
    const imageBase64 = imageBuffer.toString('base64');
    
    return { 
      filename,
      image_data: imageBase64,
      format: 'png'
    };
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


}

module.exports = AgentService;
