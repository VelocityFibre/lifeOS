import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { google } from "googleapis";

// Initialize Gmail API (user will provide OAuth tokens)
function getGmailClient(accessToken: string) {
  // DEV MODE: Allow "mock" token for testing
  if (accessToken === "mock" || accessToken === "test" || process.env.NODE_ENV === "development") {
    // Return null to trigger mock responses
    return null as any;
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.gmail({ version: "v1", auth: oauth2Client });
}

// Tool: List Unread Emails
export const listUnreadEmailsTool = createTool({
  id: "list-unread-emails",
  description: "List unread emails from Gmail inbox",
  inputSchema: z.object({
    accessToken: z.string().describe("Gmail OAuth access token"),
    maxResults: z.number().optional().default(10).describe("Number of emails to fetch"),
  }),
  execute: async ({ context }) => {
    const { accessToken, maxResults } = context;
    try {
      const gmail = getGmailClient(accessToken);

      // DEV MODE: Return mock data if no real Gmail client
      if (!gmail) {
        return {
          success: true,
          count: 3,
          emails: [
            {
              id: "mock1",
              subject: "Test Email 1: Welcome to Echo",
              from: "welcome@echo.app",
              date: new Date().toISOString(),
              snippet: "This is a mock email for testing...",
              body: "This is a mock email body for testing the email agent without real Gmail API calls.",
              hasAttachments: false,
            },
            {
              id: "mock2",
              subject: "Test Email 2: Your Invoice",
              from: "billing@example.com",
              date: new Date(Date.now() - 86400000).toISOString(),
              snippet: "Your invoice for December...",
              body: "Invoice #12345\nAmount: $99.00\nDue: Dec 15, 2024",
              hasAttachments: true,
            },
            {
              id: "mock3",
              subject: "Test Email 3: Meeting Tomorrow",
              from: "team@company.com",
              date: new Date(Date.now() - 172800000).toISOString(),
              snippet: "Don't forget our meeting...",
              body: "Hi,\n\nJust a reminder about our meeting tomorrow at 2pm.\n\nBest,\nTeam",
              hasAttachments: false,
            },
          ].slice(0, maxResults),
        };
      }

      // Get list of unread message IDs
      const listResponse = await gmail.users.messages.list({
        userId: "me",
        q: "is:unread",
        maxResults,
      });

      if (!listResponse.data.messages || listResponse.data.messages.length === 0) {
        return {
          success: true,
          count: 0,
          emails: [],
          message: "No unread emails found! 🎉",
        };
      }

      // Fetch full details for each message
      const emails = await Promise.all(
        listResponse.data.messages.map(async (message: any) => {
          const details = await gmail.users.messages.get({
            userId: "me",
            id: message.id!,
            format: "full",
          });

          const headers = details.data.payload?.headers || [];
          const getHeader = (name: string) =>
            headers.find((h: any) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

          // Extract body - handles both text/plain and text/html
          let body = "";
          if (details.data.payload?.body?.data) {
            // Simple email with body directly in payload
            body = Buffer.from(details.data.payload.body.data, "base64").toString("utf-8");
          } else if (details.data.payload?.parts) {
            // Multipart email - prefer text/plain, fallback to text/html
            const textPart = details.data.payload.parts.find((part: any) => part.mimeType === "text/plain");
            const htmlPart = details.data.payload.parts.find((part: any) => part.mimeType === "text/html");

            if (textPart?.body?.data) {
              body = Buffer.from(textPart.body.data, "base64").toString("utf-8");
            } else if (htmlPart?.body?.data) {
              // Extract text from HTML (basic HTML stripping)
              const htmlContent = Buffer.from(htmlPart.body.data, "base64").toString("utf-8");
              body = htmlContent
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove style tags
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove script tags
                .replace(/<[^>]+>/g, ' ') // Remove HTML tags
                .replace(/&nbsp;/g, ' ') // Replace &nbsp;
                .replace(/&amp;/g, '&') // Replace &amp;
                .replace(/&lt;/g, '<') // Replace &lt;
                .replace(/&gt;/g, '>') // Replace &gt;
                .replace(/\s+/g, ' ') // Collapse whitespace
                .trim();
            }
          }

          return {
            id: message.id!,
            subject: getHeader("Subject"),
            from: getHeader("From"),
            date: getHeader("Date"),
            snippet: details.data.snippet || "",
            body: body.substring(0, 500), // Preview only
            hasAttachments: (details.data.payload?.parts?.length || 0) > 1,
          };
        })
      );

      return {
        success: true,
        count: emails.length,
        emails,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: "Failed to fetch emails. Please check your Gmail connection.",
      };
    }
  },
});

// Tool: Search Emails
export const searchEmailsTool = createTool({
  id: "search-emails",
  description: "Search emails in Gmail using a query",
  inputSchema: z.object({
    accessToken: z.string().describe("Gmail OAuth access token"),
    query: z.string().describe("Search query (e.g., 'from:john@example.com', 'subject:invoice')"),
    maxResults: z.number().optional().default(10),
  }),
  execute: async ({ context }) => {
    const { accessToken, query, maxResults } = context;
    try {
      const gmail = getGmailClient(accessToken);

      // DEV MODE: Return mock search results
      if (!gmail) {
        return {
          success: true,
          count: 1,
          emails: [
            {
              id: "mock-search-1",
              subject: `Mock result for: ${query}`,
              from: "search@example.com",
              date: new Date().toISOString(),
              snippet: `This is a mock email matching your search: "${query}"`,
            },
          ],
          query,
        };
      }

      const listResponse = await gmail.users.messages.list({
        userId: "me",
        q: query,
        maxResults,
      });

      if (!listResponse.data.messages || listResponse.data.messages.length === 0) {
        return {
          success: true,
          count: 0,
          emails: [],
          message: `No emails found matching: "${query}"`,
        };
      }

      const emails = await Promise.all(
        listResponse.data.messages.map(async (message: any) => {
          const details = await gmail.users.messages.get({
            userId: "me",
            id: message.id!,
            format: "metadata",
            metadataHeaders: ["From", "Subject", "Date"],
          });

          const headers = details.data.payload?.headers || [];
          const getHeader = (name: string) =>
            headers.find((h: any) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

          return {
            id: message.id!,
            subject: getHeader("Subject"),
            from: getHeader("From"),
            date: getHeader("Date"),
            snippet: details.data.snippet || "",
          };
        })
      );

      return {
        success: true,
        count: emails.length,
        emails,
        query,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `Search failed: ${error.message}`,
      };
    }
  },
});

// Tool: Get Email Details
export const getEmailDetailsTool = createTool({
  id: "get-email-details",
  description: "Get full details of a specific email by ID",
  inputSchema: z.object({
    accessToken: z.string(),
    emailId: z.string().describe("Gmail message ID"),
  }),
  execute: async ({ context }) => {
    const { accessToken, emailId } = context;
    try {
      const gmail = getGmailClient(accessToken);

      // DEV MODE: Return mock email details
      if (!gmail) {
        return {
          success: true,
          email: {
            id: emailId,
            subject: "Mock Email Details",
            from: "mock@example.com",
            to: "you@example.com",
            date: new Date().toISOString(),
            body: `This is a mock email body for ID: ${emailId}\n\nIn production, this would show the full email content from Gmail API.\n\nFor now, this mock response allows testing without OAuth setup.`,
            snippet: "Mock email for testing...",
          },
        };
      }

      const details = await gmail.users.messages.get({
        userId: "me",
        id: emailId,
        format: "full",
      });

      const headers = details.data.payload?.headers || [];
      const getHeader = (name: string) =>
        headers.find((h: any) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

      // Extract body - handles both text/plain and text/html
      let body = "";
      if (details.data.payload?.body?.data) {
        // Simple email with body directly in payload
        body = Buffer.from(details.data.payload.body.data, "base64").toString("utf-8");
      } else if (details.data.payload?.parts) {
        // Multipart email - prefer text/plain, fallback to text/html
        const textPart = details.data.payload.parts.find((part: any) => part.mimeType === "text/plain");
        const htmlPart = details.data.payload.parts.find((part: any) => part.mimeType === "text/html");

        if (textPart?.body?.data) {
          body = Buffer.from(textPart.body.data, "base64").toString("utf-8");
        } else if (htmlPart?.body?.data) {
          // Extract text from HTML (basic HTML stripping)
          const htmlContent = Buffer.from(htmlPart.body.data, "base64").toString("utf-8");
          body = htmlContent
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove style tags
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove script tags
            .replace(/<[^>]+>/g, ' ') // Remove HTML tags
            .replace(/&nbsp;/g, ' ') // Replace &nbsp;
            .replace(/&amp;/g, '&') // Replace &amp;
            .replace(/&lt;/g, '<') // Replace &lt;
            .replace(/&gt;/g, '>') // Replace &gt;
            .replace(/\s+/g, ' ') // Collapse whitespace
            .trim();
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
          snippet: details.data.snippet || "",
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
});

// Tool: Draft Email (for user review before sending)
export const draftEmailTool = createTool({
  id: "draft-email",
  description: "Create an email draft for user review (does not send). User must confirm before sending.",
  inputSchema: z.object({
    to: z.string().describe("Recipient email address"),
    subject: z.string().describe("Email subject"),
    body: z.string().describe("Email body (plain text)"),
    cc: z.string().optional().describe("CC email addresses"),
    bcc: z.string().optional().describe("BCC email addresses"),
  }),
  execute: async ({ context }) => {
    const { to, subject, body, cc, bcc } = context;

    // Return draft for user review (never actually sends)
    return {
      success: true,
      isDraft: true,
      message: `📧 **Email Draft Ready**\n\n**To:** ${to}${cc ? `\n**CC:** ${cc}` : ''}${bcc ? `\n**BCC:** ${bcc}` : ''}\n**Subject:** ${subject}\n**Message:**\n\`\`\`\n${body}\n\`\`\`\n\nReply **"yes"** to send, **"edit [changes]"** to revise, or **"cancel"** to discard.`,
      draft: { to, subject, body, cc, bcc },
    };
  },
});

// Tool: Send Email
export const sendEmailTool = createTool({
  id: "send-email",
  description: "Send an email via Gmail (ONLY use after user has confirmed a draft with 'yes'/'send'/'confirm')",
  inputSchema: z.object({
    accessToken: z.string().describe("Gmail OAuth access token"),
    to: z.string().describe("Recipient email address"),
    subject: z.string().describe("Email subject"),
    body: z.string().describe("Email body (plain text)"),
    cc: z.string().optional().describe("CC email addresses (comma-separated)"),
    bcc: z.string().optional().describe("BCC email addresses (comma-separated)"),
  }),
  execute: async ({ context }) => {
    const { accessToken, to, subject, body, cc, bcc } = context;
    try {
      const gmail = getGmailClient(accessToken);

      // DEV MODE: Return mock success response
      if (!gmail) {
        return {
          success: true,
          message: `✅ Email sent successfully (MOCK MODE)!`,
          details: {
            to,
            subject,
            preview: body.substring(0, 100) + (body.length > 100 ? "..." : ""),
            sentAt: new Date().toISOString(),
            mode: "mock",
          },
        };
      }

      // Construct the email in RFC 2822 format
      const emailLines = [
        `To: ${to}`,
        cc ? `Cc: ${cc}` : null,
        bcc ? `Bcc: ${bcc}` : null,
        `Subject: ${subject}`,
        `Content-Type: text/plain; charset=utf-8`,
        ``,
        body,
      ].filter(Boolean); // Remove null values

      const email = emailLines.join('\r\n');

      // Encode the email in base64url format
      const encodedEmail = Buffer.from(email)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // Send the email
      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedEmail,
        },
      });

      return {
        success: true,
        message: `✅ Email sent successfully!`,
        details: {
          to,
          subject,
          messageId: response.data.id,
          threadId: response.data.threadId,
          sentAt: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `Failed to send email: ${error.message}`,
      };
    }
  },
});
