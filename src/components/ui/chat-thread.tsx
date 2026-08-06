import { useState } from "react";
import { Paperclip, Send } from "lucide-react";
import type { Message, MessageChannel } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function ChatThread({
  messages,
  defaultChannel = "WHATSAPP",
  className,
}: {
  messages: Message[];
  defaultChannel?: MessageChannel;
  className?: string;
}) {
  const [draft, setDraft] = useState("");
  const [channel, setChannel] = useState<MessageChannel>(defaultChannel);
  const [local, setLocal] = useState<Message[]>([]);

  const all = [...messages, ...local];

  function send() {
    if (!draft.trim()) return;
    setLocal((prev) => [
      ...prev,
      {
        id: `local-${prev.length}`,
        channel,
        direction: "OUTBOUND",
        from: "ShadowSpark",
        to: "applicant",
        body: draft.trim(),
        status: "SENT",
        createdAt: new Date().toISOString(),
      },
    ]);
    setDraft("");
    toast.success(`Message queued on ${channel.toLowerCase()}`);
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="scroll-slim flex-1 space-y-4 overflow-y-auto p-4">
        {all.map((message) => {
          const outbound = message.direction === "OUTBOUND";
          return (
            <div
              key={message.id}
              className={cn("flex flex-col gap-1", outbound ? "items-end" : "items-start")}
            >
              <div
                className={cn(
                  "max-w-[82%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed",
                  outbound
                    ? "rounded-br-sm border border-primary/25 bg-primary/12 text-foreground"
                    : "rounded-bl-sm bg-elevated text-foreground",
                )}
              >
                {message.body}
              </div>
              <span className="num text-[10px] text-subtle">
                {message.channel} · {relativeTime(message.createdAt)} · {message.status}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 border-t border-border p-3">
        <Select value={channel} onValueChange={(value) => setChannel(value as MessageChannel)}>
          <SelectTrigger className="w-[124px] shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
            <SelectItem value="SMS">SMS</SelectItem>
            <SelectItem value="EMAIL">Email</SelectItem>
            <SelectItem value="TELEGRAM">Telegram</SelectItem>
          </SelectContent>
        </Select>
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") send();
          }}
          placeholder="Write a reply…"
        />
        <Button variant="ghost" size="icon" className="shrink-0" aria-label="Attach file">
          <Paperclip className="size-4" />
        </Button>
        <Button size="icon" className="shrink-0" onClick={send} aria-label="Send message">
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
