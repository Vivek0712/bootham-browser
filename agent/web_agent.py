"""
Strands-based Web Automation Agent
Provides web navigation and interaction capabilities using Bedrock Claude
"""

from strands import Agent, tool
from typing import Dict, Any, Optional
import json


@tool
async def navigate(url: str) -> Dict[str, Any]:
    """Navigate to a specified URL.
    
    Args:
        url: The URL to navigate to
    """
    return {
        "status": "success",
        "content": [{
            "json": {
                "action": "navigate",
                "url": url,
                "message": f"Navigating to {url}"
            }
        }]
    }


@tool
async def screenshot() -> Dict[str, Any]:
    """Take a screenshot of the current page."""
    return {
        "status": "success",
        "content": [{
            "json": {
                "action": "screenshot",
                "message": "Taking screenshot of current page"
            }
        }]
    }


@tool
async def click(x: int, y: int) -> Dict[str, Any]:
    """Click at specific coordinates on the page.
    
    Args:
        x: X coordinate for the click
        y: Y coordinate for the click
    """
    return {
        "status": "success",
        "content": [{
            "json": {
                "action": "click",
                "x": x,
                "y": y,
                "message": f"Clicking at coordinates ({x}, {y})"
            }
        }]
    }


@tool
async def scroll(direction: str, amount: int = 500) -> Dict[str, Any]:
    """Scroll the page up or down.
    
    Args:
        direction: Direction to scroll ('up' or 'down')
        amount: Amount to scroll in pixels (default: 500)
    """
    return {
        "status": "success",
        "content": [{
            "json": {
                "action": "scroll",
                "direction": direction,
                "amount": amount,
                "message": f"Scrolling {direction} by {amount} pixels"
            }
        }]
    }


@tool
async def type_text(text: str, submit: bool = False) -> Dict[str, Any]:
    """Type text into the last clicked element.
    
    Args:
        text: Text to type into the element
        submit: Whether to press Enter after typing (to submit forms)
    """
    return {
        "status": "success",
        "content": [{
            "json": {
                "action": "type",
                "text": text,
                "submit": submit,
                "message": f"Typing text{' and submitting' if submit else ''}"
            }
        }]
    }


@tool
async def write_file(filename: str, content: str) -> Dict[str, Any]:
    """Write content to a file.
    
    Args:
        filename: Name of the file to write to
        content: Content to write to the file
    """
    return {
        "status": "success",
        "content": [{
            "json": {
                "action": "write_file",
                "filename": filename,
                "size": len(content),
                "message": f"Writing content to {filename}"
            }
        }]
    }


@tool
async def get_selected_text() -> Dict[str, Any]:
    """Get the text that is currently selected on the page by the user."""
    return {
        "status": "success",
        "content": [{
            "json": {
                "action": "get_selected_text",
                "message": "Getting selected text from page"
            }
        }]
    }


@tool
async def get_page_content(selector: str = "body") -> Dict[str, Any]:
    """Get the visible text content from the current page.
    
    Args:
        selector: Optional CSS selector to get content from specific element
    """
    return {
        "status": "success",
        "content": [{
            "json": {
                "action": "get_page_content",
                "selector": selector,
                "message": f"Getting page content from {selector}"
            }
        }]
    }


@tool
async def ask_user(question: str) -> Dict[str, Any]:
    """Ask the user a question and get their response.
    
    Args:
        question: The question to ask the user
    """
    return {
        "status": "success",
        "content": [{
            "json": {
                "action": "ask_user",
                "question": question,
                "message": f"Asking user: {question}"
            }
        }]
    }


# Create the web automation agent
web_agent = Agent(
    name="WebAutomationAgent",
    model="bedrock.us.anthropic.claude-3-7-sonnet-20250219-v1:0",
    system_prompt="""You are a web navigation assistant with vision capabilities. 
When you don't know something DO NOT stop or make assumptions, ASK the user for feedback so we can continue. 
When you see a screenshot, analyze it carefully to identify elements and their positions. 
First click on elements like form fields, then use the type tool to enter text. 
You can submit forms by setting submit=true when typing.
You can scroll up or down to see more content on the page. 
Think step by step and take screenshot between each to ensure you are doing what you think you are doing.""",
    tools=[
        navigate,
        screenshot,
        click,
        scroll,
        type_text,
        write_file,
        get_selected_text,
        get_page_content,
        ask_user
    ]
)


def invoke_agent(prompt: str) -> str:
    """Invoke the web agent with a prompt.
    
    Args:
        prompt: The user's prompt/request
        
    Returns:
        The agent's response as a string
    """
    result = web_agent(prompt)
    return result.message


async def invoke_agent_async(prompt: str):
    """Invoke the web agent asynchronously with streaming.
    
    Args:
        prompt: The user's prompt/request
        
    Yields:
        Streaming events from the agent
    """
    async for event in web_agent.stream_async(prompt):
        yield event
