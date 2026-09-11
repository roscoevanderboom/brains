/// <reference lib="deno.unstable" />
import { RouterContext } from "@oak/oak";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  tool,
  toUIMessageStream,
  UIMessage,
} from "ai";
import { z } from "zod";

const provider = createOpenRouter({
  apiKey: Deno.env.get("OPENROUTER_API_KEY"),
});

const model = provider("openrouter/free");

// ---------------------------------------------------------------------------
// Deno KV helpers
// ---------------------------------------------------------------------------

const kv = await Deno.openKv();

/** Load the stored message history for a given user. */
async function loadHistory(username: string): Promise<UIMessage[]> {
  const entry = await kv.get<UIMessage[]>(["chat_history", username]);
  return entry.value ?? [];
}

/** Persist the full updated message list for a user. */
async function saveHistory(
  username: string,
  messages: UIMessage[],
): Promise<void> {
  await kv.set(["chat_history", username], messages);
}

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

const weatherTool = tool({
  description: "Display the current weather for a location",
  inputSchema: z.object({
    location: z.string().describe("The city or location to get weather for"),
  }),
  execute: async ({ location }) => {
    // Simulated weather fetch — replace with a real API call as needed
    await new Promise((r) => setTimeout(r, 500));
    return {
      location,
      weather: "Sunny",
      temperature: 72,
      unit: "F",
    };
  },
});

// Tool that requires user approval before execution
const sendEmailTool = tool({
  description: "Send an email to a recipient. Requires user approval before sending.",
  inputSchema: z.object({
    to: z.string().describe("The email address of the recipient"),
    subject: z.string().describe("The subject of the email"),
    body: z.string().describe("The body content of the email"),
  }),
  execute: async ({ to, subject, body }) => {
    // Simulated email send — replace with real email API as needed
    await new Promise((r) => setTimeout(r, 500));
    return {
      success: true,
      message: `Email sent to ${to}`,
      subject,
      bodyLength: body.length,
    };
  },
});

/**
 * scratchPad — lets the AI render arbitrary JSX in the chat UI.
 * The model writes self-contained JSX (no imports, no function wrappers)
 * using only standard HTML/SVG elements and Tailwind classes.
 */
const scratchPadTool = tool({
  description:
    "Render a rich visual UI directly in the chat. Use this to display data, charts, tables, cards, diagrams, or any interactive content that benefits from a visual layout. Write self-contained JSX using standard HTML elements and Tailwind CSS classes — no imports or function declarations.",
  inputSchema: z.object({
    jsx: z
      .string()
      .describe(
        "Self-contained JSX string to render. Rules: (1) Use ONLY standard HTML/SVG elements and Tailwind CSS utility classes for all styling. (2) NEVER use inline style attributes — use Tailwind classes exclusively. (3) Do not include import statements, export keywords, or function wrappers — just the JSX expression itself. (4) For layouts use flex/grid Tailwind classes. (5) For sizing use Tailwind size classes like w-64, h-64, etc.",
      ),
  }),
  execute: async ({ jsx }) => {
    // Pass the JSX straight through to the frontend renderer
    return { jsx };
  },
});

export const tools = {
  displayWeather: weatherTool,
  sendEmail: sendEmailTool,
  scratchPad: scratchPadTool,
};

// ---------------------------------------------------------------------------
// POST /api/chat handler
// ---------------------------------------------------------------------------

export async function handleChat(
  // deno-lint-ignore no-explicit-any
  ctx: RouterContext<any>,
): Promise<void> {
  let body: { messages: UIMessage[]; username?: string };

  try {
    body = await ctx.request.body.json();
  } catch {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid JSON body" };
    return;
  }

  const { messages, username = "anonymous" } = body;

  if (!Array.isArray(messages)) {
    ctx.response.status = 400;
    ctx.response.body = { error: "messages must be an array" };
    return;
  }

  // The client sends the full message history (initialMessages + new messages).
  // Use it directly for the model — no need to merge with stored history.
  const allMessages: UIMessage[] = messages;

  const result = streamText({
    model,
    instructions: "You are a helpful assistant. Use tools when appropriate. When the user asks to visualize data, create a chart, build a table, show a UI component, or when a visual layout would make your response clearer, use the scratchPad tool to render JSX directly in the chat. When using scratchPad: always use Tailwind CSS classes for styling, never use inline style attributes, use only standard HTML/SVG elements.",
    messages: await convertToModelMessages(allMessages),
    stopWhen: isStepCount(10),
    tools,
    toolApproval: {
      sendEmail: "user-approval",
    },
    onFinish: async ({ response }) => {
      // Build updated UIMessage list: all prior messages + new assistant turn.
      // response.messages contains the assistant messages from this turn.
      const assistantMessages = response.messages.map((m) => ({
        id: crypto.randomUUID(),
        role: m.role as UIMessage["role"],
        // convertToModelMessages uses CoreMessage format; cast back to UIMessage
        // by wrapping content parts.
        parts: Array.isArray(m.content)
          ? m.content.map((c) =>
            c.type === "text" ? { type: "text" as const, text: c.text } : c
          )
          : [{ type: "text" as const, text: String(m.content) }],
      })) as UIMessage[];

      await saveHistory(username, [...allMessages, ...assistantMessages]);
    },
  });

  const streamResponse = createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });

  // Copy the streamed response into the Oak context.
  ctx.response.status = streamResponse.status;
  streamResponse.headers.forEach((value, key) => {
    ctx.response.headers.set(key, value);
  });
  ctx.response.body = streamResponse.body;
}
