# Migration Guide: Direct Bedrock → Strands + AgentCore

This guide helps you migrate from the direct Bedrock integration to the Strands Agents framework with AgentCore deployment support.

## What Changed

### Architecture

**Before**:
```
Electron → agent-service.js → Bedrock API → Claude
```

**After**:
```
Electron → agent-service.js → Strands Agent → Bedrock Claude
                               (Local or AgentCore)
```

### Key Differences

| Aspect | Before | After |
|--------|--------|-------|
| **Agent Logic** | JavaScript in agent-service.js | Python in agent/web_agent.py |
| **Tool Definitions** | JavaScript objects | Python @tool decorators |
| **Conversation** | Manual message management | Strands framework handles it |
| **Deployment** | N/A | AgentCore Runtime support |
| **Scaling** | Single instance | Serverless auto-scaling |
| **Observability** | Manual logging | Built-in CloudWatch |

## Migration Steps

### Step 1: Install Python Dependencies

```bash
cd agent
pip install -r requirements.txt
```

### Step 2: Test Local Agent

```bash
# Start agent server
python agentcore_app.py

# In another terminal, test it
curl -X POST http://localhost:8080/invocations \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test"}'
```

### Step 3: Update Node Dependencies

```bash
npm install
```

This installs:
- `@aws-sdk/client-bedrock-agentcore` - For AgentCore mode
- `node-fetch` - For HTTP requests to local agent

### Step 4: Configure Environment

```bash
# For local development (default)
export AGENT_MODE=local

# For production with AgentCore
export AGENT_MODE=agentcore
export AGENT_RUNTIME_ARN=arn:aws:bedrock-agentcore:...
```

### Step 5: Start Application

```bash
npm start
```

The app will automatically:
- Start local Python agent server (local mode)
- OR connect to AgentCore (agentcore mode)

## Code Changes

### agent-service.js

**Removed**:
- Direct Bedrock API calls
- Manual conversation management
- Tool specification objects
- Message array management

**Added**:
- Local agent server spawning
- AgentCore client integration
- HTTP communication with agent
- Streaming response handling

### New Files

```
agent/
├── web_agent.py          # Strands agent with tools
├── agentcore_app.py      # AgentCore wrapper
├── requirements.txt      # Python dependencies
├── __init__.py          # Package init
└── README.md            # Agent documentation
```

## Feature Parity

All features from the direct Bedrock integration are preserved:

✅ Web navigation (navigate, screenshot)
✅ Page interaction (click, scroll, type)
✅ Content extraction (get_selected_text, get_page_content)
✅ File operations (write_file)
✅ User interaction (ask_user)
✅ Streaming responses
✅ Real-time logging
✅ Error handling

## New Capabilities

### 1. Deployment Options

- **Local**: Development and testing
- **AgentCore**: Production deployment

### 2. Better Tool Management

Tools are now defined with Python decorators:

```python
@tool
async def navigate(url: str) -> Dict[str, Any]:
    """Navigate to a specified URL."""
    return {...}
```

### 3. Framework Benefits

- Automatic conversation management
- Built-in streaming support
- Tool result formatting
- Error handling

### 4. Production Ready

- Serverless scaling
- Session isolation
- CloudWatch observability
- Managed infrastructure

## Testing

### Test Local Mode

```bash
export AGENT_MODE=local
npm start
```

1. Open agent sidebar
2. Enter prompt: "Navigate to example.com"
3. Verify agent executes correctly

### Test AgentCore Mode

```bash
# Deploy agent
cd agent
agentcore launch

# Configure environment
export AGENT_MODE=agentcore
export AGENT_RUNTIME_ARN=<your-arn>

# Start app
npm start
```

1. Open agent sidebar
2. Enter prompt: "Navigate to example.com"
3. Verify agent executes via AgentCore

## Troubleshooting

### "Agent service not initialized"

**Local Mode**:
- Check Python is installed (3.10+)
- Verify dependencies: `pip install -r agent/requirements.txt`
- Check port 8080 is available

**AgentCore Mode**:
- Verify AGENT_RUNTIME_ARN is set
- Check AWS credentials
- Verify agent is deployed: `agentcore invoke '{"prompt": "test"}'`

### "Connection refused"

**Local Mode**:
- Agent server may not have started
- Check console for Python errors
- Try starting manually: `python agent/agentcore_app.py`

**AgentCore Mode**:
- Check AWS region matches
- Verify network connectivity
- Check CloudWatch logs

### Tools not executing

- Verify webview is ready
- Check tool implementation in web_agent.py
- Review agent logs in sidebar
- Check browser console for errors

## Rollback Plan

If you need to rollback to direct Bedrock:

```bash
git checkout main
npm install
npm start
```

The main branch still has the direct Bedrock integration.

## Performance Comparison

### Local Mode
- **Latency**: Similar to direct Bedrock
- **Cost**: No additional costs
- **Scaling**: Single instance

### AgentCore Mode
- **Latency**: Slightly higher (network hop)
- **Cost**: Pay per use
- **Scaling**: Automatic, thousands of sessions

## Best Practices

### Development
1. Use local mode for development
2. Test tools individually
3. Use agent sidebar for debugging
4. Check Python logs for errors

### Production
1. Deploy to AgentCore
2. Enable observability
3. Set up CloudWatch alarms
4. Monitor costs and usage
5. Use session IDs for tracking

## Next Steps

1. ✅ Migrate to Strands architecture
2. ⬜ Test all features in local mode
3. ⬜ Deploy to AgentCore
4. ⬜ Enable observability
5. ⬜ Monitor and optimize

## Support

- **Strands Docs**: https://strandsagents.com/latest/
- **AgentCore Docs**: https://docs.aws.amazon.com/bedrock-agentcore/
- **Architecture**: See [STRANDS_ARCHITECTURE.md](./STRANDS_ARCHITECTURE.md)
- **Deployment**: See [AGENTCORE_DEPLOYMENT.md](./AGENTCORE_DEPLOYMENT.md)
