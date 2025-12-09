import "dotenv/config";
import { Mastra } from "@mastra/core";
import { emailAgent } from "../agents/email-agent";

export const mastra = new Mastra({
  agents: {
    emailAgent,
  },
});
