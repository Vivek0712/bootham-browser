# Deploying to Amazon Bedrock AgentCore

This guide explains how to deploy the Web Automation Agent to Amazon Bedrock AgentCore Runtime.

## Prerequisites

- AWS account with AgentCore permissions
- Python 3.10+
- Docker, Finch, or Podman (for custom deployment)
- AWS CLI configured

## Quick Start with Starter Toolkit

### 1. Install Dependencies

```bash
cd agent
pip install -r requirements.txt
pip install bedrock-agentcore-starter-toolkit
```

### 2. Configure Agent

```bash
agentcore configure --entrypoint agentcore_app.py
```

### 3. Test Locally (Optional)

```bash
# Requires Docker/Finch/Podman
agentcore launch --local

# Test the local deployment
curl -X POST http://localhost:8080/invocations \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Navigate to example.com"}'
```

### 4. Deploy to AWS

```bash
agentcore launch
```

### 5. Invoke Your Agent

```bash
agentcore invoke '{"prompt": "Go to Wikipedia and search for AI"}'
```

## Custom Deployment with Docker

### 1. Create Dockerfile

```dockerfile
# agent/Dockerfile
FROM --platform=linux/arm64 ghcr.io/astral-sh/uv:python3.11-bookworm-slim

WORKDIR /app

# Copy requirements
COPY requirements.txt ./

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy agent code
COPY web_agent.py agentcore_app.py __init__.py ./

# Expose port
EXPOSE 8080

# Run with OpenTelemetry instrumentation
CMD ["opentelemetry-instrument", "python", "agentcore_app.py"]
```

### 2. Build and Push to ECR

```bash
# Setup buildx
docker buildx create --use

# Build ARM64 image
docker buildx build --platform linux/arm64 -t web-agent:arm64 --load agent/

# Create ECR repository
aws ecr create-repository --repository-name web-agent --region us-west-2

# Login to ECR
aws ecr get-login-password --region us-west-2 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-west-2.amazonaws.com

# Tag and push
docker tag web-agent:arm64 <account-id>.dkr.ecr.us-west-2.amazonaws.com/web-agent:latest
docker push <account-id>.dkr.ecr.us-west-2.amazonaws.com/web-agent:latest
```

### 3. Deploy Agent Runtime

```python
# deploy_agent.py
import boto3

client = boto3.client('bedrock-agentcore-control', region_name='us-west-2')

response = client.create_agent_runtime(
    agentRuntimeName='web-automation-agent',
    agentRuntimeArtifact={
        'containerConfiguration': {
            'containerUri': '<account-id>.dkr.ecr.us-west-2.amazonaws.com/web-agent:latest'
        }
    },
    networkConfiguration={"networkMode": "PUBLIC"},
    roleArn='arn:aws:iam::<account-id>:role/AgentRuntimeRole'
)

print(f"Agent Runtime ARN: {response['agentRuntimeArn']}")
print(f"Status: {response['status']}")
```

```bash
python deploy_agent.py
```

### 4. Invoke Agent

```python
# invoke_agent.py
import boto3
import json

client = boto3.client('bedrock-agentcore', region_name='us-west-2')

payload = json.dumps({
    "prompt": "Navigate to amazon.com and search for batteries"
})

response = client.invoke_agent_runtime(
    agentRuntimeArn='arn:aws:bedrock-agentcore:us-west-2:<account-id>:runtime/web-automation-agent-xxx',
    runtimeSessionId='unique-session-id-at-least-33-characters-long',
    payload=payload,
    qualifier="DEFAULT"
)

response_body = response['response'].read()
print(json.loads(response_body))
```

## Integration with Electron App

### Update agent-service.js

The `agent-service.js` file needs to be updated to invoke the AgentCore-deployed agent instead of using direct Bedrock API calls.

```javascript
// In browser/agent-service.js

async executePrompt(prompt) {
  if (this.isRunning) {
    throw new Error('Agent is already running');
  }

  this.isRunning = true;

  try {
    this.emitEvent('agent-start', { prompt });
    
    // Invoke AgentCore agent
    const response = await this.invokeAgentCore(prompt);
    
    // Process streaming response
    await this.processAgentCoreResponse(response);
    
    this.emitEvent('agent-complete', {});
  } catch (error) {
    this.emitEvent('agent-error', { error: error.message });
    throw error;
  } finally {
    this.isRunning = false;
  }
}

async invokeAgentCore(prompt) {
  const { BedrockAgentCoreClient, InvokeAgentRuntimeCommand } = require('@aws-sdk/client-bedrock-agentcore');
  
  const client = new BedrockAgentCoreClient({ region: 'us-west-2' });
  
  const command = new InvokeAgentRuntimeCommand({
    agentRuntimeArn: process.env.AGENT_RUNTIME_ARN,
    runtimeSessionId: this.sessionId,
    payload: JSON.stringify({ prompt })
  });
  
  return await client.send(command);
}
```

## Environment Variables

Set these in your Electron app:

```bash
# .env
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AGENT_RUNTIME_ARN=arn:aws:bedrock-agentcore:us-west-2:account-id:runtime/web-automation-agent-xxx
```

## Observability

### Enable CloudWatch Transaction Search

1. Open CloudWatch console
2. Navigate to Application Signals > Transaction search
3. Enable Transaction Search
4. Select "Ingest spans as structured logs"

### Add OpenTelemetry

Already included in the Dockerfile CMD:

```dockerfile
CMD ["opentelemetry-instrument", "python", "agentcore_app.py"]
```

### View Metrics

1. Open CloudWatch console
2. Navigate to GenAI Observability
3. Find your agent service
4. View traces, metrics, and logs

## Cost Optimization

- Use appropriate instance sizes
- Enable auto-scaling
- Monitor token usage
- Set up CloudWatch alarms

## Troubleshooting

### Agent Not Responding

```bash
# Check agent status
aws bedrock-agentcore-control describe-agent-runtime \
  --agent-runtime-arn <your-arn> \
  --region us-west-2
```

### View Logs

```bash
# Get CloudWatch log group
aws logs describe-log-groups \
  --log-group-name-prefix /aws/bedrock-agentcore \
  --region us-west-2

# Tail logs
aws logs tail /aws/bedrock-agentcore/web-automation-agent --follow
```

### Test Locally

```bash
# Run agent locally with Docker
docker run --platform linux/arm64 -p 8080:8080 \
  -e AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" \
  -e AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" \
  -e AWS_REGION="us-west-2" \
  web-agent:arm64

# Test endpoint
curl -X POST http://localhost:8080/invocations \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test"}'
```

## Security Best Practices

1. **IAM Roles**: Use least privilege principle
2. **Network**: Use VPC endpoints when possible
3. **Secrets**: Store credentials in AWS Secrets Manager
4. **Monitoring**: Enable CloudWatch alarms
5. **Updates**: Keep dependencies updated

## Additional Resources

- [AgentCore Documentation](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/)
- [Strands Agents Documentation](https://strandsagents.com/latest/)
- [AgentCore Starter Toolkit](https://pypi.org/project/bedrock-agentcore-starter-toolkit/)
