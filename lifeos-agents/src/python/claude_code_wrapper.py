#!/usr/bin/env python3
"""
Claude Code SDK Wrapper for lifeOS
Enables Claude Code access through the agent UI using Max plan
"""

import asyncio
import sys
import json
from pathlib import Path

# Add the autonomous coding harness to path
sys.path.insert(0, str(Path.home() / "claude-quickstarts" / "autonomous-coding"))

try:
    from claude_code_sdk import ClaudeSDKClient
    from client import create_client
except ImportError as e:
    print(json.dumps({"error": f"Failed to import claude_code_sdk: {e}"}))
    sys.exit(1)

# Working directory for Claude Code
LIFEOS_ROOT = Path("/home/louisdup/Agents/lifeOS")

async def send_message(message: str, working_dir: str = None):
    """Send a message to Claude Code and stream the response."""

    if working_dir is None:
        working_dir = str(LIFEOS_ROOT)

    try:
        # Create client with working directory context
        client = create_client(Path(working_dir), "claude-sonnet-4-5")

        response_text = ""
        tool_uses = []

        async with client:
            # Send the user message
            await client.query(message)

            # Collect response
            async for msg in client.receive_response():
                msg_type = type(msg).__name__

                if msg_type == "AssistantMessage" and hasattr(msg, "content"):
                    for block in msg.content:
                        block_type = type(block).__name__

                        if block_type == "TextBlock" and hasattr(block, "text"):
                            response_text += block.text
                            # Stream output
                            print(json.dumps({
                                "type": "text",
                                "content": block.text
                            }), flush=True)

                        elif block_type == "ToolUseBlock":
                            tool_name = getattr(block, "name", "unknown")
                            tool_uses.append(tool_name)
                            print(json.dumps({
                                "type": "tool",
                                "name": tool_name
                            }), flush=True)

                elif msg_type == "UserMessage" and hasattr(msg, "content"):
                    for block in msg.content:
                        if type(block).__name__ == "ToolResultBlock":
                            is_error = getattr(block, "is_error", False)
                            if is_error:
                                content = str(getattr(block, "content", ""))[:500]
                                print(json.dumps({
                                    "type": "tool_error",
                                    "content": content
                                }), flush=True)

        # Send completion signal
        print(json.dumps({
            "type": "complete",
            "response": response_text,
            "tools_used": tool_uses
        }), flush=True)

    except Exception as e:
        print(json.dumps({
            "type": "error",
            "error": str(e)
        }), flush=True)
        sys.exit(1)

def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No message provided"}))
        sys.exit(1)

    message = sys.argv[1]
    working_dir = sys.argv[2] if len(sys.argv) > 2 else None

    asyncio.run(send_message(message, working_dir))

if __name__ == "__main__":
    main()
