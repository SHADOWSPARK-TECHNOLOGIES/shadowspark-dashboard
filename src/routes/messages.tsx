import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageCircle, Phone, Search, Send } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatThread } from "@/components/ui/chat-thread";
import { initials, relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  normalizeBackendConversation,
  useConversationMessagesQuery,
  useConversationsQuery,
} from "@/lib/backend-api";
import { useSendMessageMutation } from "@/hooks/use-messages";
import type { Message, MessageChannel } from "@/types";

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [
      { title: "Messages Inbox — ShadowSpark" },
      {
        name: "description",
        content:
          "One unified inbox for WhatsApp, SMS, Telegram and email conversations with loan applicants.",
      },
      { property: "og:title", content: "Messages Inbox — ShadowSpark" },
      {
        property: "og:description",
        content: "Unified omnichannel inbox for lending conversations.",
      },
    ],
  }),
  component: MessagesPage,
});

const channels = [
  { key: "WHATSAPP", label: "WhatsApp", icon: MessageCircle },
  { key: "SMS", label: "SMS", icon: Phone },
  { key: "EMAIL", label: "Email", icon: Mail },
  { key: "TELEGRAM", label: "Telegram", icon: Send },
] as const;

function MessagesPage() {
  const conversationsQuery = useConversationsQuery();
  const sendMutation = useSendMessageMutation();
  const conversations = useMemo(
    () => (conversationsQuery.data ?? []).map(normalizeBackendConversation),
    [conversationsQuery.data],
  );
  const [channel, setChannel] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeId && conversations[0]) {
      setActiveId(conversations[0].id);
    }
  }, [activeId, conversations]);

  const activeConversation =
    conversations.find((conversation) => conversation.id === activeId) ?? conversations[0] ?? null;
  const activeMessagesQuery = useConversationMessagesQuery(
    activeConversation?.id.split(":")[0] ?? null,
    activeConversation?.channel ?? null,
  );
  const activeMessages: Message[] = useMemo(
    () =>
      activeMessagesQuery.data?.map((message, index) => ({
        id: message.id,
        channel: activeConversation?.channel ?? "WHATSAPP",
        direction:
          (message as { direction?: "INBOUND" | "OUTBOUND" }).direction ??
          (index % 2 === 0 ? "INBOUND" : "OUTBOUND"),
        from: (message as { from?: string }).from ?? activeConversation?.contactPhone ?? "",
        to: (message as { to?: string }).to ?? activeConversation?.contactPhone ?? "",
        body:
          (message as { body?: string; content?: string }).body ??
          (message as { body?: string; content?: string }).content ??
          "",
        status: (message as { status?: Message["status"] }).status ?? "DELIVERED",
        createdAt: message.createdAt,
      })) ?? [],
    [activeMessagesQuery.data, activeConversation],
  );

  const list = conversations.filter((conversation) => {
    if (channel !== "ALL" && conversation.channel !== channel) return false;
    if (search && !conversation.contactName.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });
  const active = activeConversation ?? list[0] ?? null;

  return (
    <AppShell title="Messages" breadcrumb="ShadowSpark / Messages">
      <div className="grid h-[calc(100vh-9rem)] grid-cols-1 gap-4 lg:grid-cols-[190px_300px_1fr]">
        <div className="space-y-1 rounded-xl border border-border bg-card p-2">
          <button
            onClick={() => setChannel("ALL")}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
              channel === "ALL" ? "bg-primary/12 text-primary" : "hover:bg-elevated",
            )}
          >
            All channels
          </button>
          {channels.map((item) => {
            const unread = conversations
              .filter((conversation) => conversation.channel === item.key)
              .reduce((sum, conversation) => sum + conversation.unread, 0);
            return (
              <button
                key={item.key}
                onClick={() => setChannel(item.key)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  channel === item.key ? "bg-primary/12 text-primary" : "hover:bg-elevated",
                )}
              >
                <item.icon className="size-4" />
                <span className="truncate">{item.label}</span>
                {unread > 0 ? (
                  <span className="num ml-auto rounded-md bg-elevated px-1.5 text-[10px]">
                    {unread}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="flex min-h-0 flex-col rounded-xl border border-border bg-card">
          <div className="relative border-b border-border p-2.5">
            <Search className="absolute top-1/2 left-5 size-4 -translate-y-1/2 text-subtle" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search conversations"
              className="h-9 pl-9"
            />
          </div>
          <ul className="scroll-slim min-h-0 flex-1 divide-y divide-border/60 overflow-y-auto">
            {conversationsQuery.isPending ? (
              Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-9 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-2.5 w-40" />
                    </div>
                  </div>
                </li>
              ))
            ) : conversationsQuery.isError ? (
              <li className="px-3 py-6 text-center">
                <p className="text-xs text-muted-foreground">
                  {conversationsQuery.error instanceof Error
                    ? conversationsQuery.error.message
                    : "Failed to load conversations"}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => conversationsQuery.refetch()}
                >
                  Retry
                </Button>
              </li>
            ) : list.length === 0 ? (
              <li className="px-3 py-6 text-center text-xs text-muted-foreground">
                No conversations found
              </li>
            ) : (
              list.map((conversation) => (
                <li key={conversation.id}>
                  <button
                    onClick={() => setActiveId(conversation.id)}
                    className={cn(
                      "flex w-full items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-elevated/60",
                      activeId === conversation.id && "bg-elevated/70",
                    )}
                  >
                    <span className="num grid size-9 shrink-0 place-items-center rounded-full bg-elevated text-[11px] font-semibold text-primary">
                      {initials(conversation.contactName)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">
                          {conversation.contactName}
                        </span>
                        {conversation.unread > 0 ? (
                          <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                        ) : null}
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {conversation.messages[conversation.messages.length - 1]?.body}
                      </span>
                      <span className="num block text-[10px] text-subtle">
                        {conversation.channel} · {relativeTime(conversation.lastMessageAt)}
                      </span>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="flex min-h-0 flex-col rounded-xl border border-border bg-card">
          {active ? (
            <>
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-semibold">{active.contactName}</p>
                <p className="num text-[11px] text-muted-foreground">
                  {active.contactPhone} · {active.channel}
                </p>
              </div>
              {activeMessagesQuery.isPending ? (
                <div className="flex-1 space-y-3 p-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className={cn("h-10", i % 2 === 0 ? "w-2/3" : "ml-auto w-1/2")}
                    />
                  ))}
                </div>
              ) : activeMessagesQuery.isError ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    {activeMessagesQuery.error instanceof Error
                      ? activeMessagesQuery.error.message
                      : "Failed to load messages"}
                  </p>
                  <Button size="sm" variant="outline" onClick={() => activeMessagesQuery.refetch()}>
                    Retry
                  </Button>
                </div>
              ) : activeMessages.length === 0 ? (
                <EmptyState
                  title="No messages yet"
                  description="No message history exists for this conversation."
                />
              ) : (
                <ChatThread
                  messages={activeMessages}
                  defaultChannel={active.channel}
                  sending={sendMutation.isPending}
                  onSend={({ channel: ch, body }) =>
                    sendMutation.mutate({
                      loanApplicationId: active.id.split(":")[0] ?? active.id,
                      channel: ch,
                      to: active.contactPhone,
                      body,
                    })
                  }
                />
              )}
            </>
          ) : (
            <EmptyState
              title="Select a conversation"
              description="Choose a conversation from the list to read and reply."
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}
