import { useChat } from "@ai-sdk/react";
import {
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  DefaultChatTransport,
  isDynamicToolUIPart,
  lastAssistantMessageIsCompleteWithApprovalResponses,
  type UIMessage,
} from "ai";
import { ChevronUpIcon, ClockIcon, Trash2Icon, DownloadIcon } from "lucide-react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  messagesToMarkdown,
} from "@/components/ai-elements/conversation.tsx";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message.tsx";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning.tsx";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input.tsx";
import { renderToolPart } from "@/components/tools/toolRegistry.tsx";
import { useAuthStore } from "@/store/auth.ts";
import { cn } from "@/lib/utils.ts";

// ─── MessageParts renderer ────────────────────────────────────────────────────

function MessageParts({
  message,
  onDelete,
  addToolApprovalResponse,
  isLastMessage = false,
  isStreaming = false,
}: {
  message: UIMessage;
  onDelete: (id: string) => void;
  addToolApprovalResponse: (opts: { id: string; approved: boolean }) => void;
  isLastMessage?: boolean;
  isStreaming?: boolean;
}) {
  // Consolidate all reasoning parts into one block
  const reasoningText = message.parts
    .filter((part) => part.type === "reasoning")
    .map((part) => part.text)
    .join("\n\n");

  const lastPart = message.parts.at(-1);
  const isReasoningStreaming =
    isLastMessage && isStreaming && lastPart?.type === "reasoning";

  return (
    <Message from={message.role}>
      <MessageContent messageId={message.id} onDelete={onDelete}>
        {reasoningText.trim() && (
          <Reasoning className="w-full" isStreaming={isReasoningStreaming}>
            <ReasoningTrigger />
            <ReasoningContent>{reasoningText}</ReasoningContent>
          </Reasoning>
        )}
        {message.parts.map((part, i) => {
          if (part.type === "text") {
            return <MessageResponse key={i}>{part.text}</MessageResponse>;
          }
          return null;
        })}
      </MessageContent>

      {/* Tool parts rendered outside the text bubble so they get full width */}
      {message.parts.map((part, i) => {
        if (part.type === "text" || part.type === "reasoning") return null;
        return (
          <div key={i} className="w-full">
            {renderToolPart(
              part,
              () => {
                if (isDynamicToolUIPart(part) && part.approval?.id) {
                  addToolApprovalResponse({ id: part.approval.id, approved: true });
                }
              },
              () => {
                if (isDynamicToolUIPart(part) && part.approval?.id) {
                  addToolApprovalResponse({ id: part.approval.id, approved: false });
                }
              },
            )}
          </div>
        );
      })}
    </Message>
  );
}

// ─── Inner chat ───────────────────────────────────────────────────────────────

function Chat({
  username,
  initialMessages,
}: {
  username: string;
  initialMessages: UIMessage[];
}) {
  const { messages, sendMessage, status, setMessages, addToolApprovalResponse } =
    useChat({
      messages: initialMessages,
      transport: new DefaultChatTransport({
        api: "/api/chat",
        body: { username },
      }),
      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    });

  const [input, setInput] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const focusedRef = useRef<HTMLDivElement>(null);

  function handleSubmit(message: PromptInputMessage) {
    if (!message.text.trim()) return;
    sendMessage({ text: message.text });
    setInput("");
  }

  const deleteMessage = useCallback(
    async (messageId: string) => {
      try {
        const response = await fetch(
          `/api/chat/message?username=${encodeURIComponent(username)}&messageId=${encodeURIComponent(messageId)}`,
          { method: "DELETE" },
        );
        if (response.ok) {
          setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
        }
      } catch (error) {
        console.error("Failed to delete message:", error);
      }
    },
    [username, setMessages],
  );

  const clearConversation = useCallback(async () => {
    if (!confirm("Clear the conversation? This can't be undone.")) return;
    try {
      const response = await fetch(
        `/api/chat/history?username=${encodeURIComponent(username)}`,
        { method: "DELETE" },
      );
      if (response.ok) setMessages([]);
    } catch (error) {
      console.error("Failed to clear conversation:", error);
    }
  }, [username, setMessages]);

  const downloadConversation = useCallback(() => {
    const markdown = messagesToMarkdown(messages);
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "conversation.md";
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [messages]);

  // Last assistant message for focused view
  const lastAssistant = [...messages]
    .reverse()
    .find((m) => m.role === "assistant");

  const isStreaming = status === "streaming" || status === "submitted";

  return (
    <div className="relative flex h-full flex-col bg-background">

      {/* ── History panel (full conversation) ───────── */}
      <div
        className={cn(
          "absolute inset-0 z-20 flex flex-col bg-background transition-all duration-300",
          historyOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
      >
        <div className="flex items-center justify-between border-b border-border/60 bg-background px-6 py-3">
          <span className="text-sm font-medium tracking-wide text-muted-foreground">
            Conversation history
          </span>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={downloadConversation}
                  title="Download"
                  className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <DownloadIcon className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={clearConversation}
                  title="Clear conversation"
                  className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2Icon className="size-3.5" />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setHistoryOpen(false)}
              className="ml-1 flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Close history"
            >
              <ChevronUpIcon className="size-4 rotate-180" />
            </button>
          </div>
        </div>

        <Conversation className="flex-1 min-h-0">
          <ConversationContent>
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 py-4">
              {messages.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  No messages yet.
                </p>
              ) : (
                messages.map((message, i) => (
                  <MessageParts
                    key={message.id}
                    message={message}
                    onDelete={deleteMessage}
                    addToolApprovalResponse={addToolApprovalResponse}
                    isLastMessage={i === messages.length - 1}
                    isStreaming={isStreaming}
                  />
                ))
              )}
            </div>
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </div>

      {/* ── Focused view ─────────────────────────────── */}
      <div className="flex flex-1 min-h-0 flex-col">

        {/* Response area — scrollable, fills space above prompt */}
        <div className="flex flex-1 min-h-0 justify-center overflow-y-auto px-6 pb-8 pt-6">
          <div ref={focusedRef} className="w-full max-w-2xl">
            {lastAssistant ? (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <MessageParts
                  message={lastAssistant}
                  onDelete={deleteMessage}
                  addToolApprovalResponse={addToolApprovalResponse}
                  isLastMessage
                  isStreaming={isStreaming}
                />
              </div>
            ) : (
              <div className="animate-in fade-in duration-500">
                <p className="text-2xl font-light tracking-tight text-foreground/80">
                  What can I help you with?
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Try asking about the weather, or just say hello.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Prompt area — ~35vh from bottom on large screens ── */}
        <div className="w-full px-6" style={{ paddingBottom: "calc(max(2rem, min(35vh, 40vh)) - 150px)" }}>
          <div className="relative mx-auto max-w-2xl">
            <PromptInput onSubmit={handleSubmit}>
              <PromptInputTextarea
                value={input}
                placeholder="Ask anything…"
                className="min-h-0 py-3 leading-normal text-sm resize-none"
                onChange={(e: { currentTarget: { value: SetStateAction<string> } }) =>
                  setInput(e.currentTarget.value)
                }
              />
              <PromptInputSubmit
                status={isStreaming ? "streaming" : "ready"}
                disabled={!input.trim()}
              />
            </PromptInput>

            {/* History + utility row */}
            <div className="mt-2.5 flex items-center justify-between px-1">
              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  messages.length > 0 && "opacity-100",
                  messages.length === 0 && "opacity-0 pointer-events-none",
                )}
              >
                <ClockIcon className="size-3" />
                {messages.length} message{messages.length !== 1 ? "s" : ""}
              </button>

              <span className="text-[11px] text-muted-foreground/50 select-none">
                Ctrl+/ for menu
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Loader ───────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const user = useAuthStore((s) => s.user);
  const username = user?.username ?? "anonymous";

  const [initialMessages, setInitialMessages] = useState<UIMessage[] | null>(null);

  useEffect(() => {
    fetch(`/api/chat/history?username=${encodeURIComponent(username)}`)
      .then((r) => r.json())
      .then((data) => setInitialMessages(data.messages ?? []))
      .catch(() => setInitialMessages([]));
  }, [username]);

  if (initialMessages === null) return null;

  return <Chat username={username} initialMessages={initialMessages} />;
}
