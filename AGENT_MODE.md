# Agent Mode - AI-Powered Web Automation

## Overview

Agent Mode integrates AWS Bedrock's Claude AI model into the Electron browser, enabling autonomous web navigation and task execution through natural language prompts.

## Features

- **Natural Language Control**: Describe what you want to accomplish, and the AI agent will navigate and interact with websites
- **Visual Understanding**: The agent can take screenshots and analyze page content
- **Interactive Questions**: The agent can ask you questions when it needs clarification
- **Separate Agent Tab**: All agent actions happen in a dedicated tab, keeping your browsing separate
- **Real-time Logging**: See what the agent is doing in the agent panel

## Prerequisites

1. **Node.js**: Version 16 or higher
2. **AWS Account**: You need an AWS account with Bedrock access
3. **AWS Credentials**: Configure your AWS credentials (via `~/.aws/credentials` or environment variables)
4. **Bedrock Model Access**: Request access to Claude 3.7 Sonnet in your AWS region (us-west-2)

### Installing Dependencies

```bash
npm install
```

This will install all required dependencies including:
- `@aws-sdk/client-bedrock-runtime` - AWS Bedrock SDK
- `playwright` - Browser automation (not used directly but required for compatibility)
- Other Electron and React dependencies

### Setting up AWS Credentials

Create or edit `~/.aws/credentials`:

```ini
[default]
aws_access_key_id = YOUR_ACCESS_KEY
aws_secret_access_key = YOUR_SECRET_KEY
```

Or set environment variables:

```bash
export AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY
export AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY
export AWS_REGION=us-west-1
```

## Usage

### 1. Start the Browser

```bash
npm start
```

### 2. Open Agent Mode

Click the **🤖 Agent Mode** button in the toolbar. This will open the agent panel on the right side of the window.

### 3. Enter a Prompt

Type your task in the text area. Examples:

- "Search for AAA Amazon Basics batteries on Amazon and write a summary to a file"
- "Go to Wikipedia and find information about Electron framework"
- "Navigate to GitHub and search for Electron repositories"

### 4. Execute

Click **Execute** or press `Ctrl+Enter`. The agent will:

1. Create a new tab for its actions
2. Navigate to websites
3. Take screenshots to understand the page
4. Click on elements
5. Fill in forms
6. Ask you questions if needed

### 5. Monitor Progress

Watch the agent panel for real-time logs showing:

- System messages (green) - Agent status and actions
- Assistant messages (purple) - AI reasoning and decisions
- User messages (blue) - Your prompts and responses
- Errors (red) - Any issues encountered

### 6. Answer Questions

If the agent needs clarification, a question box will appear in the agent panel. Type your answer and click **Submit Answer**.

### 7. Stop if Needed

Click the **Stop** button to halt agent execution at any time.

## How It Works

### Architecture

```
┌─────────────────┐
│  Renderer       │
│  (Browser UI)   │
│  - Agent Panel  │
│  - Prompt Input │
└────────┬────────┘
         │ IPC
┌────────▼────────┐
│  Main Process   │
│  - Agent Service│
│  - IPC Handlers │
└────────┬────────┘
         │
┌────────▼────────┐
│  AWS Bedrock    │
│  Claude 3.7     │
│  Sonnet         │
└────────┬────────┘
         │
┌────────▼────────┐
│  Webview        │
│  (Agent Tab)    │
│  - Navigation   │
│  - Interaction  │
└─────────────────┘
```

### Agent Tools

The AI agent has access to these tools:

1. **navigate**: Go to a URL
2. **screenshot**: Capture the current page
3. **click**: Click at specific coordinates
4. **scroll**: Scroll up or down
5. **type**: Type text into form fields
6. **write_file**: Save content to a file
7. **ask_user**: Ask you a question

### Agent Loop

1. Send prompt to Bedrock
2. Receive tool requests from AI
3. Execute tools (navigate, click, etc.)
4. Send results back to AI
5. Repeat until task is complete

## Output Files

### Screenshots

Screenshots are saved to: `screenshots/<session-id>/screenshot_<uuid>.png`

### Generated Files

Files created by the agent are saved to: `artefacts/<session-id>/<filename>`

## Troubleshooting

### "Agent service not initialized"

- Check your AWS credentials are configured correctly
- Verify you have access to Bedrock in us-west-2 region
- Check the DevTools console (View > Toggle Developer Tools) for initialization errors
- Look for `[Agent]` prefixed messages in the console
- Ensure you have internet connectivity

### "Agent tab not found"

- The agent automatically creates a new tab
- If this fails, try manually creating a tab first

### Agent gets stuck

- Click the **Stop** button
- Check the agent log for errors
- Try a more specific prompt
- Check the DevTools console for error messages
- Verify the agent tab webview is loading correctly

### Debugging

To debug issues:

1. Open DevTools: The app automatically opens DevTools on startup
2. Check the Console tab for `[Agent]` and `[Preload]` messages
3. Look for error messages in red
4. Check the Network tab to see if Bedrock API calls are being made
5. Verify AWS credentials are working:
   ```bash
   aws bedrock list-foundation-models --region us-west-2
   ```

### Screenshots not working

- Ensure the `screenshots` directory is writable
- Check disk space

### AWS Errors

- Verify your AWS credentials are valid
- Check you have Bedrock permissions
- Ensure Claude 3.7 Sonnet is available in your region

## Example Prompts

### Simple Navigation

```
Go to example.com and take a screenshot
```

### Search Task

```
Search Google for "Electron framework" and summarize the first result
```

### Form Interaction

```
Go to duckduckgo.com, search for "AWS Bedrock", and tell me the first result
```

### Data Extraction

```
Navigate to news.ycombinator.com and list the top 5 story titles
```

### File Creation

```
Visit wikipedia.org, search for "Artificial Intelligence", and write a summary to ai-summary.md
```

## Limitations

- The agent can only interact with web pages, not desktop applications
- Complex JavaScript interactions may not work perfectly
- The agent uses coordinates for clicking, which may vary by screen size
- Some websites may block automated access

## Security Considerations

- The agent runs in a separate webview with limited permissions
- AWS credentials are handled securely by the AWS SDK
- The agent cannot access your local file system beyond the output directories
- All IPC communication is whitelisted in the preload script

## Cost

Using AWS Bedrock incurs costs based on:
- Number of input tokens (your prompts + context)
- Number of output tokens (AI responses)
- Number of API calls

Monitor your usage in the AWS Console. A typical agent session might cost $0.10-$1.00 depending on complexity.

## Future Enhancements

- [ ] Support for multiple AI models
- [ ] Better element detection (using DOM selectors instead of coordinates)
- [ ] Session history and replay
- [ ] Custom tool definitions
- [ ] Multi-step workflows
- [ ] Integration with local LLMs (Ollama, etc.)

## Contributing

Contributions are welcome! Areas for improvement:

- Better error handling
- More robust element interaction
- Support for authentication flows
- Improved screenshot analysis
- Better logging and debugging tools
