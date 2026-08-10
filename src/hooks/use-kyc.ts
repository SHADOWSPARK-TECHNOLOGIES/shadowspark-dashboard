import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ApiError,
  idempotencyKeyFor,
  rejectKycDocument,
  requestKycInfo,
  usePendingKycQuery,
  verifyKycDocument,
} from "@/lib/backend-api";

export { usePendingKycQuery };

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}

export function useVerifyKycMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { id: string }) =>
      verifyKycDocument(variables.id, {}, { idempotencyKey: idempotencyKeyFor(variables) }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["kyc", "pending"] });
      toast.success(`Document ${variables.id} verified`);
    },
    onError: (error) => {
      toast.error(errorMessage(error));
    },
  });
}

export function useRejectKycMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { id: string; reason: string }) =>
      rejectKycDocument(variables.id, variables.reason, {
        idempotencyKey: idempotencyKeyFor(variables),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["kyc", "pending"] });
      toast.success(`Document ${variables.id} rejected`);
    },
    onError: (error) => {
      toast.error(errorMessage(error));
    },
  });
}

export function useRequestKycInfoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { id: string; message: string }) =>
      requestKycInfo(variables.id, variables.message, {
        idempotencyKey: idempotencyKeyFor(variables),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kyc", "pending"] });
      toast.success("Information request sent");
    },
    onError: (error) => {
      toast.error(errorMessage(error));
    },
  });
}
