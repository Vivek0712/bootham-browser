"""
AgentCore Runtime Application
Wraps the Strands web agent for deployment to Amazon Bedrock AgentCore
"""

from bedrock_agentcore.runtime import BedrockAgentCoreApp
from web_agent import web_agent
import json
import base64

app = BedrockAgentCoreApp()


@app.entrypoint
async def invoke(payload):
    """Process user input and return agent response with streaming.
    
    Args:
        payload: Input payload containing the user's prompt and optional media
        
    Yields:
        Streaming events from the agent
    """
    user_message = payload.get(
        "prompt", 
        "No prompt found in input, please provide a prompt key in the payload"
    )
    
    # Check for media (images) in payload
    media = payload.get("media")
    
    if media:
        # Handle multi-modal input with image
        media_type = media.get("type", "image")
        media_format = media.get("format", "png")
        media_data = media.get("data")  # Base64 encoded
        
        # Build multi-modal message for Strands agent
        # Strands supports images in messages
        message_content = [
            {"text": user_message}
        ]
        
        if media_data:
            # Add image to message
            message_content.append({
                "image": {
                    "format": media_format,
                    "source": {
                        "bytes": base64.b64decode(media_data)
                    }
                }
            })
        
        # Send multi-modal message to agent
        async for event in web_agent.stream_async(message_content):
            yield {
                "event": event.get("type", "unknown"),
                "data": event
            }
    else:
        # Regular text-only message
        async for event in web_agent.stream_async(user_message):
            yield {
                "event": event.get("type", "unknown"),
                "data": event
            }


if __name__ == "__main__":
    app.run()
