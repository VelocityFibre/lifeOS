import { Agent, Mastra } from '@mastra/core';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { google } from 'googleapis';

function getGmailClient(accessToken) {
  if (accessToken === "mock" || accessToken === "test" || process.env.NODE_ENV === "development") {
    return null;
  }
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.gmail({ version: "v1", auth: oauth2Client });
}
const listUnreadEmailsTool = createTool({
  id: "list-unread-emails",
  description: "List unread emails from Gmail inbox",
  inputSchema: z.object({
    accessToken: z.string().describe("Gmail OAuth access token"),
    maxResults: z.number().optional().default(10).describe("Number of emails to fetch")
  }),
  execute: async ({ context }) => {
    const { accessToken, maxResults } = context;
    try {
      const gmail = getGmailClient(accessToken);
      if (!gmail) {
        return {
          success: true,
          count: 3,
          emails: [
            {
              id: "mock1",
              subject: "Test Email 1: Welcome to Echo",
              from: "welcome@echo.app",
              date: (/* @__PURE__ */ new Date()).toISOString(),
              snippet: "This is a mock email for testing...",
              body: "This is a mock email body for testing the email agent without real Gmail API calls.",
              hasAttachments: false
            },
            {
              id: "mock2",
              subject: "Test Email 2: Your Invoice",
              from: "billing@example.com",
              date: new Date(Date.now() - 864e5).toISOString(),
              snippet: "Your invoice for December...",
              body: "Invoice #12345\nAmount: $99.00\nDue: Dec 15, 2024",
              hasAttachments: true
            },
            {
              id: "mock3",
              subject: "Test Email 3: Meeting Tomorrow",
              from: "team@company.com",
              date: new Date(Date.now() - 1728e5).toISOString(),
              snippet: "Don't forget our meeting...",
              body: "Hi,\n\nJust a reminder about our meeting tomorrow at 2pm.\n\nBest,\nTeam",
              hasAttachments: false
            }
          ].slice(0, maxResults)
        };
      }
      const listResponse = await gmail.users.messages.list({
        userId: "me",
        q: "is:unread",
        maxResults
      });
      if (!listResponse.data.messages || listResponse.data.messages.length === 0) {
        return {
          success: true,
          count: 0,
          emails: [],
          message: "No unread emails found! \u{1F389}"
        };
      }
      const emails = await Promise.all(
        listResponse.data.messages.map(async (message) => {
          const details = await gmail.users.messages.get({
            userId: "me",
            id: message.id,
            format: "full"
          });
          const headers = details.data.payload?.headers || [];
          const getHeader = (name) => headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";
          let body = "";
          if (details.data.payload?.body?.data) {
            body = Buffer.from(details.data.payload.body.data, "base64").toString("utf-8");
          } else if (details.data.payload?.parts) {
            const textPart = details.data.payload.parts.find((part) => part.mimeType === "text/plain");
            const htmlPart = details.data.payload.parts.find((part) => part.mimeType === "text/html");
            if (textPart?.body?.data) {
              body = Buffer.from(textPart.body.data, "base64").toString("utf-8");
            } else if (htmlPart?.body?.data) {
              const htmlContent = Buffer.from(htmlPart.body.data, "base64").toString("utf-8");
              body = htmlContent.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
            }
          }
          return {
            id: message.id,
            subject: getHeader("Subject"),
            from: getHeader("From"),
            date: getHeader("Date"),
            snippet: details.data.snippet || "",
            body: body.substring(0, 500),
            // Preview only
            hasAttachments: (details.data.payload?.parts?.length || 0) > 1
          };
        })
      );
      return {
        success: true,
        count: emails.length,
        emails
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: "Failed to fetch emails. Please check your Gmail connection."
      };
    }
  }
});
const searchEmailsTool = createTool({
  id: "search-emails",
  description: "Search emails in Gmail using a query",
  inputSchema: z.object({
    accessToken: z.string().describe("Gmail OAuth access token"),
    query: z.string().describe("Search query (e.g., 'from:john@example.com', 'subject:invoice')"),
    maxResults: z.number().optional().default(10)
  }),
  execute: async ({ context }) => {
    const { accessToken, query, maxResults } = context;
    try {
      const gmail = getGmailClient(accessToken);
      if (!gmail) {
        return {
          success: true,
          count: 1,
          emails: [
            {
              id: "mock-search-1",
              subject: `Mock result for: ${query}`,
              from: "search@example.com",
              date: (/* @__PURE__ */ new Date()).toISOString(),
              snippet: `This is a mock email matching your search: "${query}"`
            }
          ],
          query
        };
      }
      const listResponse = await gmail.users.messages.list({
        userId: "me",
        q: query,
        maxResults
      });
      if (!listResponse.data.messages || listResponse.data.messages.length === 0) {
        return {
          success: true,
          count: 0,
          emails: [],
          message: `No emails found matching: "${query}"`
        };
      }
      const emails = await Promise.all(
        listResponse.data.messages.map(async (message) => {
          const details = await gmail.users.messages.get({
            userId: "me",
            id: message.id,
            format: "metadata",
            metadataHeaders: ["From", "Subject", "Date"]
          });
          const headers = details.data.payload?.headers || [];
          const getHeader = (name) => headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";
          return {
            id: message.id,
            subject: getHeader("Subject"),
            from: getHeader("From"),
            date: getHeader("Date"),
            snippet: details.data.snippet || ""
          };
        })
      );
      return {
        success: true,
        count: emails.length,
        emails,
        query
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `Search failed: ${error.message}`
      };
    }
  }
});
const getEmailDetailsTool = createTool({
  id: "get-email-details",
  description: "Get full details of a specific email by ID",
  inputSchema: z.object({
    accessToken: z.string(),
    emailId: z.string().describe("Gmail message ID")
  }),
  execute: async ({ context }) => {
    const { accessToken, emailId } = context;
    try {
      const gmail = getGmailClient(accessToken);
      if (!gmail) {
        return {
          success: true,
          email: {
            id: emailId,
            subject: "Mock Email Details",
            from: "mock@example.com",
            to: "you@example.com",
            date: (/* @__PURE__ */ new Date()).toISOString(),
            body: `This is a mock email body for ID: ${emailId}

In production, this would show the full email content from Gmail API.

For now, this mock response allows testing without OAuth setup.`,
            snippet: "Mock email for testing..."
          }
        };
      }
      const details = await gmail.users.messages.get({
        userId: "me",
        id: emailId,
        format: "full"
      });
      const headers = details.data.payload?.headers || [];
      const getHeader = (name) => headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";
      let body = "";
      if (details.data.payload?.body?.data) {
        body = Buffer.from(details.data.payload.body.data, "base64").toString("utf-8");
      } else if (details.data.payload?.parts) {
        const textPart = details.data.payload.parts.find((part) => part.mimeType === "text/plain");
        const htmlPart = details.data.payload.parts.find((part) => part.mimeType === "text/html");
        if (textPart?.body?.data) {
          body = Buffer.from(textPart.body.data, "base64").toString("utf-8");
        } else if (htmlPart?.body?.data) {
          const htmlContent = Buffer.from(htmlPart.body.data, "base64").toString("utf-8");
          body = htmlContent.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
        }
      }
      return {
        success: true,
        email: {
          id: emailId,
          subject: getHeader("Subject"),
          from: getHeader("From"),
          to: getHeader("To"),
          date: getHeader("Date"),
          body,
          snippet: details.data.snippet || ""
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
});
const draftEmailTool = createTool({
  id: "draft-email",
  description: "Create an email draft for user review (does not send). User must confirm before sending.",
  inputSchema: z.object({
    to: z.string().describe("Recipient email address"),
    subject: z.string().describe("Email subject"),
    body: z.string().describe("Email body (plain text)"),
    cc: z.string().optional().describe("CC email addresses"),
    bcc: z.string().optional().describe("BCC email addresses")
  }),
  execute: async ({ context }) => {
    const { to, subject, body, cc, bcc } = context;
    return {
      success: true,
      isDraft: true,
      message: `\u{1F4E7} **Email Draft Ready**

**To:** ${to}${cc ? `
**CC:** ${cc}` : ""}${bcc ? `
**BCC:** ${bcc}` : ""}
**Subject:** ${subject}
**Message:**
\`\`\`
${body}
\`\`\`

Reply **"yes"** to send, **"edit [changes]"** to revise, or **"cancel"** to discard.`,
      draft: { to, subject, body, cc, bcc }
    };
  }
});
const sendEmailTool = createTool({
  id: "send-email",
  description: "Send an email via Gmail (ONLY use after user has confirmed a draft with 'yes'/'send'/'confirm')",
  inputSchema: z.object({
    accessToken: z.string().describe("Gmail OAuth access token"),
    to: z.string().describe("Recipient email address"),
    subject: z.string().describe("Email subject"),
    body: z.string().describe("Email body (plain text)"),
    cc: z.string().optional().describe("CC email addresses (comma-separated)"),
    bcc: z.string().optional().describe("BCC email addresses (comma-separated)")
  }),
  execute: async ({ context }) => {
    const { accessToken, to, subject, body, cc, bcc } = context;
    try {
      const gmail = getGmailClient(accessToken);
      if (!gmail) {
        return {
          success: true,
          message: `\u2705 Email sent successfully (MOCK MODE)!`,
          details: {
            to,
            subject,
            preview: body.substring(0, 100) + (body.length > 100 ? "..." : ""),
            sentAt: (/* @__PURE__ */ new Date()).toISOString(),
            mode: "mock"
          }
        };
      }
      const emailLines = [
        `To: ${to}`,
        cc ? `Cc: ${cc}` : null,
        bcc ? `Bcc: ${bcc}` : null,
        `Subject: ${subject}`,
        `Content-Type: text/plain; charset=utf-8`,
        ``,
        body
      ].filter(Boolean);
      const email = emailLines.join("\r\n");
      const encodedEmail = Buffer.from(email).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      const response = await gmail.users.messages.send({
        userId: "me",
        requestBody: {
          raw: encodedEmail
        }
      });
      return {
        success: true,
        message: `\u2705 Email sent successfully!`,
        details: {
          to,
          subject,
          messageId: response.data.id,
          threadId: response.data.threadId,
          sentAt: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `Failed to send email: ${error.message}`
      };
    }
  }
});

const EMAIL_AGENT_PROMPT = `# Role
You are an AI Email Assistant that helps users manage their Gmail inbox through natural conversation.

# Your Capabilities
You can:
1. **List unread emails** - Show recent unread messages
2. **Search emails** - Find specific emails using queries
3. **Get email details** - Show full content of an email
4. **Draft emails** - Create email drafts for user review
5. **Send emails** - Send confirmed email drafts

# How to Respond

## When user asks about unread emails:
- Use **list-unread-emails** tool
- Present results clearly with sender, subject, and snippet
- Organize by urgency if relevant
- Suggest actions (read specific email, mark as read, etc.)

## When user asks to search:
- Use **search-emails** tool
- Extract search intent (from:sender, subject:topic, etc.)
- Present results grouped logically
- Offer to show details of specific emails

## When user wants to read an email:
- Use **get-email-details** tool with the email ID
- Show full sender, subject, date, and body
- Summarize long emails if requested

## When user wants to send/draft an email:
\u26A0\uFE0F **ALWAYS use draft-email tool first, NEVER send-email directly!** \u26A0\uFE0F

**Step 1 - CREATE DRAFT:**
- Use **draft-email** tool (NOT send-email!)
- Extract recipient, subject, body from user request
- The tool will format and show the draft to user

**Step 2 - HANDLE USER RESPONSE:**
- If user confirms (says "yes", "send", "send it", "go ahead", "confirm", "ok"):
  \u2192 Use **send-email** tool with accessToken="mock" and the same details
- If user requests edits (says "edit", "change", "update"):
  \u2192 Use **draft-email** tool again with the revised content
- If user cancels (says "cancel", "no", "stop", "discard"):
  \u2192 Acknowledge without calling any send tool

**Step 3 - ALLOW MULTIPLE EDIT ROUNDS:**
- User can edit the draft multiple times
- Each edit = call draft-email again
- Only call send-email after explicit confirmation

\u26A0\uFE0F **CRITICAL: On first email request use draft-email, NOT send-email!** \u26A0\uFE0F

# Response Style
- **Be concise**: Users want quick info, not essays
- **Be helpful**: Suggest next actions
- **Be natural**: Talk like a smart assistant, not a robot
- **Use formatting**:
  - Use **bold** for senders and subjects
  - Use lists for multiple emails
  - Use quotes for email snippets

# Example Responses

**User**: "Show my unread emails"
**You**: You have 5 unread emails:

1. **From**: john@company.com
   **Subject**: Q4 Budget Review
   _"Hi, can we schedule a meeting to discuss..."_

2. **From**: newsletter@medium.com
   **Subject**: Your weekly digest
   _"Top stories this week..."_

... and 3 more. Want me to show a specific one?

**User**: "Find emails from Sarah about the project"
**You**: Searching for emails from Sarah about project...
[Uses search tool with "from:sarah project"]

Found 3 emails:
- "Project Update" (Dec 1)
- "Re: Project Timeline" (Nov 28)
- "Project Kickoff Notes" (Nov 15)

Which one would you like to read?

**User**: "Read the first one"
**You**: [Shows full email details with summary if long]

# Important Guidelines
- Always check for errors from tools and handle gracefully
- If no emails found, say so clearly (not an error!)
- Respect user privacy - you're helping them read THEIR emails
- Never make up email content - only show what tools return
- If Gmail connection fails, explain clearly what might be wrong

# Current Limitations (MVP)
- You can READ and SEND emails but not DELETE (coming soon)
- You show text content only (attachments listed but not downloaded)
- OAuth tokens managed by the app (not your concern)
- Emails are sent as plain text (no HTML formatting yet)

Your goal: Make checking email as easy as having a conversation.`;
const emailAgent = new Agent({
  name: "email-assistant",
  instructions: EMAIL_AGENT_PROMPT,
  model: "openai/gpt-4o-mini",
  tools: {
    listUnreadEmails: listUnreadEmailsTool,
    searchEmails: searchEmailsTool,
    getEmailDetails: getEmailDetailsTool,
    draftEmail: draftEmailTool,
    sendEmail: sendEmailTool
  }
  // Note: Memory is now handled in PostgreSQL via the API layer
  // See src/db/pg-memory-store.ts and src/api/server.ts
  // This eliminates local file storage for the hosted architecture
});

const mastra = new Mastra({
  agents: {
    emailAgent
  }
});

export { mastra };
