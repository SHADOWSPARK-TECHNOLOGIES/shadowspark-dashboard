import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  idempotencyKeyFor,
  normalizeApiError,
  sendMessage,
  useConversationMessagesQuery,
  useConversationsQuery,
  type SendMessageInput,
} from "@/lib/backend-api";

export { useConversationsQuery, useConversationMessagesQuery };

function errorMessage(error: unknown): string {
  return normalizeApiError(error).error.message;
}

export function useSendMessageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SendMessageInput) =>
      sendMessage(input, { idempotencyKey: idempotencyKeyFor(input) }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["messages", "conversations"] });
      queryClient.invalidateQueries({
        queryKey: ["messages", variables.loanApplicationId, variables.channel],
      });
      toast.success("Message sent");
    },
    onError: (error) => {
      toast.error(errorMessage(error));
    },
  });
}
