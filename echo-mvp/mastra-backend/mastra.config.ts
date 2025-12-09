import "dotenv/config";
import { createMastraConfig } from "@mastra/core";
import { mastra } from "./src/mastra";

export default createMastraConfig({
  name: "echo-email-assistant",
  mastra,
  port: 5001, // Different from rugby coach (5000)
});
