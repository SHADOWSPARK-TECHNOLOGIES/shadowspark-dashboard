import { useEffect, useRef, useState } from "react";
import { RotateCcw, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAiChatMutation } from "@/hooks/use-ai-chat";
import type { ChatMessage } from "@/lib/backend-api";

export interface AfroLLMChatProps {
  loanContext?: {
    loanId?: string;
    applicantName?: string;
    loanAmount?: number;
    status?: string;
  };
  className?: string;
}

interface LocalMessage extends ChatMessage {
  id: string;
  failed?: boolean;
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1" aria-label="AfroLLM is typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </span>
  );
}

export function AfroLLMChat({ loanContext, className }: AfroLLMChatProps) {
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [draft, setDraft] = useState("");
  const chatMutation = useAiChatMutation();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, chatMutation.isPending]);

  function send(content: string) {
    const trimmed = content.trim();
    if (!trimmed || chatMutation.isPending) return;

    const userMessage: LocalMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };
    const history: ChatMessage[] = [...messages, userMessage].map(({ role, content: c }) => ({
      role,
      content: c,
    }));

    setMessages((prev) => [...prev, userMessage]);
    setDraft("");

    chatMutation.mutate(
      loanContext ? { messages: history, loan_context: loanContext } : { messages: history },
      {
        onSuccess: (reply) => {
          setMessages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), role: "assistant", content: reply.message },
          ]);
        },
        onError: () => {
          setMessages((prev) =>
            prev.map((m) => (m.id === userMessage.id ? { ...m, failed: true } : m)),
          );
        },
      },
    );
  }

  function retry(failed: LocalMessage) {
    setMessages((prev) => prev.filter((m) => m.id !== failed.id));
    send(failed.content);
  }

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div>
          <p className="text-sm font-semibold">AfroLLM</p>
          <p className="text-[11px] text-muted-foreground">
            Ask about this loan, KYC status or repayment plan
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Clear conversation"
          disabled={messages.length === 0}
          onClick={() => setMessages([])}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div ref={scrollRef} className="scroll-slim min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && !chatMutation.isPending ? (
          <div className="flex h-full items-center justify-center">
            <p className="max-w-56 text-center text-xs text-muted-foreground">
              No messages yet. Ask AfroLLM to summarise this application or draft a follow-up.
            </p>
          </div>
        ) : null}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
                message.role === "user"
                  ? "rounded-br-sm bg-amber-900/30 text-foreground"
                  : "rounded-bl-sm bg-slate-800 text-slate-100",
              )}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              {message.failed ? (
                <button
                  onClick={() => retry(message)}
                  className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-amber-400 hover:underline"
                >
                  <RotateCcw className="size-3" />
                  Failed to send — retry
                </button>
              ) : null}
            </div>
          </div>
        ))}

        {chatMutation.isPending ? (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-slate-800 px-3.5 py-2">
              <TypingDots />
            </div>
          </div>
        ) : null}
      </div>

      <form
        className="flex items-center gap-2 border-t border-border p-3"
        onSubmit={(event) => {
          event.preventDefault();
          send(draft);
        }}
      >
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Message AfroLLM…"
          className="h-9"
          disabled={chatMutation.isPending}
        />
        <Button
          type="submit"
          size="icon"
          aria-label="Send message"
          disabled={!draft.trim() || chatMutation.isPending}
        >
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
