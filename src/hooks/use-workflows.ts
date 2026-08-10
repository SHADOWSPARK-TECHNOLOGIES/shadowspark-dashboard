import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ApiError,
  executeWorkflow,
  getWorkflowById,
  idempotencyKeyFor,
  listWorkflows,
} from "@/lib/backend-api";

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}

export function useWorkflowsQuery() {
  return useQuery({
    queryKey: ["workflows"],
    queryFn: listWorkflows,
    staleTime: 60_000,
  });
}

export function useWorkflowDetailQuery(id: string | null) {
  return useQuery({
    queryKey: ["workflows", id],
    queryFn: () => getWorkflowById(id ?? ""),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}

export function useExecuteWorkflowMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { id: string; input?: Record<string, unknown> }) =>
      executeWorkflow(variables.id, variables.input, {
        idempotencyKey: idempotencyKeyFor(variables),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success(`Workflow ${variables.id} executed`);
    },
    onError: (error) => {
      toast.error(errorMessage(error));
    },
  });
}
