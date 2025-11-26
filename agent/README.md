# Web Automation Agent

A Strands-based AI agent for web automation, deployable to Amazon Bedrock AgentCore Runtime.

## Features

- **Web Navigation**: Navigate to URLs, take screenshots
- **Page Interaction**: Click, scroll, type text
- **Content Extraction**: Get selected text, page content
- **File Operations**: Write files with extracted data
- **User Interaction**: Ask questions when clarification needed

## Local Development

### Prerequisites

- Python 3.10+
- AWS credentials configured
- Access to Amazon Bedrock Claude models

### Setup

```bash
cd agent
pip install -r requirements.txt
```

### Test Locally

```bash
# Run the AgentCore app locally
python agentcore_app.py

# Test with curl
curl -X POST http://localhost:8080/invocations \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Go to example.com and take a screenshot"}'
```

### Test Agent Directly

```python
from web_agent import invoke_agent

result = invoke_agent("Navigate to wikipedia.org")
print(result)
```

## Deployment to AgentCore

### Option 1: Starter Toolkit (Recommended)

```bash
# Install toolkit
pip install bedrock-agentcore-starter-toolkit

# Configure
agentcore configure --entrypoint agentcore_app.py

# Deploy
agentcore launch

# Test
agentcore invoke '{"prompt": "Search for AI on Wikipedia"}'
```

### Option 2: Manual Deployment

See [AgentCore Deployment Guide](../AGENTCORE_DEPLOYMENT.md) for detailed instructions.

## Agent Tools

### Navigation Tools
- `navigate(url)` - Navigate to a URL
- `screenshot()` - Capture current page (automatically sends image to agent for analysis)

### Interaction Tools
- `click(x, y)` - Click at coordinates
- `scroll(direction, amount)` - Scroll page
- `type_text(text, submit)` - Type into focused element

### Content Tools
- `get_selected_text()` - Get user-selected text
- `get_page_content(selector)` - Extract page content

### Utility Tools
- `write_file(filename, content)` - Save data to file
- `ask_user(question)` - Request user input

## Multi-Modal Support

The agent supports vision capabilities through screenshot analysis:

1. When `screenshot()` tool is called, the image is captured
2. Image is base64 encoded and sent to the agent
3. Agent analyzes the screenshot using Claude's vision capabilities
4. Agent can identify elements, buttons, forms, and their positions
5. Agent uses this visual information to make decisions

**Example Flow**:
```
User: "Click the login button"
  ↓
Agent: calls screenshot()
  ↓
Browser: captures page, encodes as base64
  ↓
Agent: receives image, analyzes it
  ↓
Agent: "I see a login button at coordinates (450, 300)"
  ↓
Agent: calls click(450, 300)
```

## Integration with Electron App

The Electron app communicates with this agent through the `agent-service.js` which:

1. Receives tool execution requests from the agent
2. Executes them in the browser webview
3. Returns results back to the agent
4. Handles streaming responses
5. Sends screenshots as base64-encoded images for vision analysis

## Architecture

```
┌─────────────────────┐
│  Electron Browser   │
│  (agent-service.js) │
└──────────┬──────────┘
           │ HTTP/IPC
┌──────────▼──────────┐
│  AgentCore Runtime  │
│  (agentcore_app.py) │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  Strands Agent      │
│  (web_agent.py)     │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  Bedrock Claude     │
│  3.7 Sonnet         │
└─────────────────────┘
```

## Environment Variables

- `AWS_REGION` - AWS region (default: us-west-2)
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_SESSION_TOKEN` - AWS session token (if using temporary credentials)

## Observability

Enable observability for production deployments:

```bash
pip install aws-opentelemetry-distro

# Run with auto-instrumentation
opentelemetry-instrument python agentcore_app.py
```

See [AgentCore Observability](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/observability.html) for details.
