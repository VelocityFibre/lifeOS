import { Agent } from "@mastra/core";
import { spawn } from "child_process";
import * as path from "path";

const CLAUDE_CODE_AGENT_PROMPT = `# Role
You are Claude Code - an AI coding assistant with full access to the lifeOS codebase.

# Your Capabilities
You have REAL access to the entire project through Claude Code SDK. You can:
- Read and edit any file in the project
- Execute bash commands
- Search for code patterns
- Create new files and directories
- Run tests and build commands
- Debug issues
- Deploy changes

# Context
You're running in the lifeOS project at /home/louisdup/Agents/lifeOS
This is a personal OS application with:
- React Native Expo frontend (echo-mvp/expo-app)
- Node.js backend with Mastra agents (lifeos-agents)
- PostgreSQL database on Neon
- Multiple AI agents (Gmail, Calendar, etc.)

# Response Style
- Be concise and helpful
- Show code changes you make
- Explain your reasoning briefly
- Ask for clarification when needed
- Use markdown for formatting

# Important
- You're using the user's Claude Code Max plan (unlimited)
- You have full file system access
- You can run any command
- Work autonomously within the project

Your goal: Help the user build and improve their lifeOS application.`;

// Export a function that creates the agent
export async function createClaudeCodeAgent() {
  console.log("✅ Claude Code agent loaded (using Max plan via SDK)");

  // Create the agent without tools for now
  // We'll intercept messages and call Claude Code SDK directly
  return new Agent({
    name: "claude-code-agent",
    instructions: CLAUDE_CODE_AGENT_PROMPT,
    model: "openai/gpt-4o-mini",
  });
};

// Helper function to call Claude Code SDK
export async function callClaudeCode(message: string, working_dir?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, "../python/claude_code_wrapper.py");
    const args = [pythonScript, message];
    if (working_dir) {
      args.push(working_dir);
    }

    const python = spawn("python3", args);
    let responseText = "";
    let errorOutput = "";

    python.stdout.on("data", (data: Buffer) => {
      const lines = data.toString().split("\n").filter(line => line.trim());

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);

          if (parsed.type === "text") {
            responseText += parsed.content;
          } else if (parsed.type === "complete") {
            resolve(parsed.response);
          } else if (parsed.type === "error") {
            reject(new Error(parsed.error));
          }
        } catch (e) {
          // Ignore JSON parse errors (might be partial output)
        }
      }
    });

    python.stderr.on("data", (data: Buffer) => {
      errorOutput += data.toString();
    });

    python.on("close", (code: number) => {
      if (code !== 0) {
        reject(new Error(`Claude Code SDK exited with code ${code}: ${errorOutput}`));
      } else if (!responseText && code === 0) {
        // If we got here, response was already resolved in the complete handler
        return;
      }
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      python.kill();
      reject(new Error("Claude Code SDK request timed out"));
    }, 5 * 60 * 1000);
  });
}
