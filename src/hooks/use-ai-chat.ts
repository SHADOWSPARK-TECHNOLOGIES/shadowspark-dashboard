import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ApiError,
  chatWithAi,
  idempotencyKeyFor,
  type AiChatInput,
  type ChatMessage,
} from "@/lib/backend-api";

export interface AiChatReply {
  message: string;
}

export function useAiChatMutation() {
  return useMutation({
    mutationFn: async (input: AiChatInput): Promise<AiChatReply> => {
      const result = await chatWithAi(input, { idempotencyKey: idempotencyKeyFor(input) });
      const data = result?.data;
      const message = data?.message ?? data?.reply ?? data?.content ?? "";
      return { message };
    },
    onSuccess: () => {
      toast.success("AfroLLM response received");
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
        return;
      }
      if (error instanceof Error) {
        toast.error(error.message);
        return;
      }
      toast.error("Failed to get AI response");
    },
  });
}

export type { AiChatInput, ChatMessage };
