# Strands Agents Architecture

This document describes the refactored architecture using Strands Agents framework with Amazon Bedrock AgentCore deployment support.

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    Electron Browser UI                        │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │  Landing Page  │  │  Tabs/Toolbar│  │  Agent Sidebar  │  │
│  │  (React)       │  │  (React)     │  │  (React)        │  │
│  └────────────────┘  └──────────────┘  └─────────────────┘  │
└───────────────────────────┬──────────────────────────────────┘
                            │ IPC
┌───────────────────────────▼──────────────────────────────────┐
│                    Main Process (Node.js)                     │
│  ┌──────────────────────────────────────────────────────┐    │
│  │              agent-service.js                        │    │
│  │  - Manages agent lifecycle                           │    │
│  │  - Executes tools in webview                         │    │
│  │  - Handles streaming responses                       │    │
│  └──────────────────┬───────────────────────────────────┘    │
└─────────────────────┼────────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼ (Local Mode)              ▼ (AgentCore Mode)
┌───────────────────┐       ┌──────────────────────────┐
│  Local Python     │       │  AgentCore Runtime       │
│  Agent Server     │       │  (AWS Managed)           │
│  (Port 8080)      │       │                          │
│  ┌──────────────┐ │       │  ┌──────────────────┐   │
│  │agentcore_app │ │       │  │  Docker Container│   │
│  │    .py       │ │       │  │  (ARM64)         │   │
│  └──────┬───────┘ │       │  │                  │   │
│         │         │       │  │  agentcore_app   │   │
│         ▼         │       │  │      .py         │   │
│  ┌──────────────┐ │       │  └────────┬─────────┘   │
│  │  web_agent   │ │       │           │             │
│  │    .py       │ │       │           ▼             │
│  │              │ │       │    ┌──────────────┐     │
│  │  (Strands    │ │       │    │  web_agent   │     │
│  │   Agent)     │ │       │    │    .py       │     │
│  └──────┬───────┘ │       │    │              │     │
└─────────┼─────────┘       │    │  (Strands    │     │
          │                 │    │   Agent)     │     │
          │                 │    └──────┬───────┘     │
          │                 └───────────┼─────────────┘
          │                             │
          └─────────────┬───────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │  Amazon Bedrock       │
            │  Claude 3.7 Sonnet    │
            └───────────────────────┘
```

## Components

### 1. Electron Browser (Frontend)

**Location**: `src/`

- React-based UI with tabs, toolbar, and agent sidebar
- Communicates with main process via IPC
- Displays agent logs and handles user interactions

### 2. Agent Service (Main Process)

**Location**: `browser/agent-service.js`

**Responsibilities**:
- Manages agent lifecycle (start/stop)
- Routes requests to local or AgentCore agent
- Executes tools in browser webview
- Handles streaming responses
- Manages user questions

**Modes**:
- **Local Mode**: Spawns Python agent server locally
- **AgentCore Mode**: Invokes deployed AgentCore agent

### 3. Strands Agent (Python)

**Location**: `agent/`

**Files**:
- `web_agent.py` - Strands agent with tool definitions
- `agentcore_app.py` - AgentCore runtime wrapper
- `requirements.txt` - Python dependencies
- `__init__.py` - Package initialization

**Tools**:
- `navigate(url)` - Navigate to URL
- `screenshot()` - Capture page
- `click(x, y)` - Click coordinates
- `scroll(direction, amount)` - Scroll page
- `type_text(text, submit)` - Type into element
- `write_file(filename, content)` - Save file
- `get_selected_text()` - Get selection
- `get_page_content(selector)` - Extract content
- `ask_user(question)` - Request user input

## Deployment Modes

### Local Development Mode

**Setup**:
```bash
# Install Python dependencies
cd agent
pip install -r requirements.txt

# Set environment variable
export AGENT_MODE=local

# Start Electron app
npm start
```

**How it works**:
1. Electron starts and spawns local Python agent server
2. Agent server listens on port 8080
3. Agent service sends HTTP requests to localhost
4. Tools execute in browser webview
5. Results stream back to UI

**Advantages**:
- Fast iteration
- No AWS deployment needed
- Easy debugging
- No AWS costs

### AgentCore Production Mode

**Setup**:
```bash
# Deploy agent to AgentCore
cd agent
agentcore configure --entrypoint agentcore_app.py
agentcore launch

# Set environment variables
export AGENT_MODE=agentcore
export AGENT_RUNTIME_ARN=arn:aws:bedrock-agentcore:...

# Start Electron app
npm start
```

**How it works**:
1. Electron connects to deployed AgentCore agent
2. Requests sent via AWS SDK
3. AgentCore manages scaling and sessions
4. Tools execute in browser webview
5. Results stream back to UI

**Advantages**:
- Serverless scaling
- Session isolation
- Production-ready
- Managed infrastructure
- Built-in observability

## Tool Execution Flow

```
1. User enters prompt in sidebar
   ↓
2. Agent service receives prompt
   ↓
3. Sends to Strands agent (local or AgentCore)
   ↓
4. Agent analyzes and decides tools to use
   ↓
5. Agent returns tool use requests
   ↓
6. Agent service executes tools in webview
   ↓
7. Tool results sent back to agent
   ↓
8. Agent processes results and responds
   ↓
9. Response displayed in sidebar
```

## Configuration

### Environment Variables

```bash
# Agent deployment mode
AGENT_MODE=local|agentcore

# AgentCore configuration (agentcore mode only)
AGENT_RUNTIME_ARN=arn:aws:bedrock-agentcore:region:account:runtime/name
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# Local agent configuration (local mode only)
AGENT_PORT=8080
```

### Agent Configuration

Edit `agent/web_agent.py` to customize:
- Model selection
- System prompt
- Tool definitions
- Tool behavior

## Development Workflow

### 1. Local Development

```bash
# Terminal 1: Start Electron app
npm start

# Terminal 2: Test agent directly
cd agent
python -c "from web_agent import invoke_agent; print(invoke_agent('test'))"
```

### 2. Testing Tools

```bash
# Test individual tools
cd agent
python -c "
from web_agent import navigate
import asyncio
result = asyncio.run(navigate('https://example.com'))
print(result)
"
```

### 3. Deploy to AgentCore

```bash
cd agent
agentcore configure --entrypoint agentcore_app.py
agentcore launch --local  # Test locally first
agentcore launch          # Deploy to AWS
```

### 4. Switch to AgentCore Mode

```bash
export AGENT_MODE=agentcore
export AGENT_RUNTIME_ARN=<your-arn>
npm start
```

## Benefits of Strands Architecture

### 1. Separation of Concerns
- Agent logic in Python (Strands)
- Browser automation in JavaScript (Electron)
- Clear interface between components

### 2. Flexibility
- Easy to switch between local and production
- Can deploy agent independently
- Multiple Electron apps can use same agent

### 3. Scalability
- AgentCore handles scaling automatically
- Session isolation per user
- No infrastructure management

### 4. Maintainability
- Agent code is framework-agnostic
- Tools are well-defined and testable
- Clear deployment path

### 5. Observability
- Built-in CloudWatch integration
- Distributed tracing
- Metrics and logs

## Migration from Direct Bedrock

### Before (Direct Bedrock)
- Bedrock API calls in agent-service.js
- Tool definitions in JavaScript
- Manual conversation management
- No deployment infrastructure

### After (Strands + AgentCore)
- Strands agent handles conversation
- Tool definitions in Python
- Framework manages state
- Production deployment ready

## Troubleshooting

### Local Mode Issues

**Agent server not starting**:
```bash
# Check Python installation
python --version  # Should be 3.10+

# Check dependencies
cd agent
pip install -r requirements.txt

# Test agent directly
python agentcore_app.py
```

**Port already in use**:
```bash
# Change port
export AGENT_PORT=8081
```

### AgentCore Mode Issues

**Connection errors**:
```bash
# Verify ARN
echo $AGENT_RUNTIME_ARN

# Check AWS credentials
aws sts get-caller-identity

# Test agent directly
cd agent
agentcore invoke '{"prompt": "test"}'
```

**Tool execution failures**:
- Check CloudWatch logs
- Verify webview is ready
- Check tool implementation

## Next Steps

1. **Local Development**: Start with local mode for development
2. **Test Tools**: Verify each tool works correctly
3. **Deploy to AgentCore**: Use starter toolkit for deployment
4. **Enable Observability**: Set up CloudWatch monitoring
5. **Production**: Switch to AgentCore mode

## Additional Resources

- [Strands Agents Documentation](https://strandsagents.com/latest/)
- [AgentCore Documentation](https://docs.aws.amazon.com/bedrock-agentcore/)
- [Agent Deployment Guide](./AGENTCORE_DEPLOYMENT.md)
- [Agent README](./agent/README.md)
