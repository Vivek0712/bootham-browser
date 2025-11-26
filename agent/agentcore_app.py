"""
AgentCore Runtime Application
Wraps the Strands web agent for deployment to Amazon Bedrock AgentCore
"""

from bedrock_agentcore.runtime import BedrockAgentCoreApp
from web_agent import web_agent
import json

app = BedrockAgentCoreApp()


@app.entrypoint
async def invoke(payload):
    """Process user input and return agent response with streaming.
    
    Args:
        payload: Input payload containing the user's prompt
        
    Yields:
        Streaming events from the agent
    """
    user_message = payload.get(
        "prompt", 
        "No prompt found in input, please provide a prompt key in the payload"
    )
    
    # Stream agent responses
    async for event in web_agent.stream_async(user_message):
        # Format event for AgentCore
        yield {
            "event": event.get("type", "unknown"),
            "data": event
        }


if __name__ == "__main__":
    app.run()
