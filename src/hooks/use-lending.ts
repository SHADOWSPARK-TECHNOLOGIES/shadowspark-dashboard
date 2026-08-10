import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { LoanStatus } from "@/types";
import {
  assignLoan,
  createLoan,
  getLoanById,
  idempotencyKeyFor,
  normalizeApiError,
  normalizeBackendLoan,
  updateLoanStatus,
  type CreateLoanInput,
} from "@/lib/backend-api";

function errorMessage(error: unknown): string {
  return normalizeApiError(error).error.message;
}

export function useCreateLoanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateLoanInput) =>
      createLoan(input, { idempotencyKey: idempotencyKeyFor(input) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      toast.success("Loan application created");
    },
    onError: (error) => {
      toast.error(errorMessage(error));
    },
  });
}

export function useUpdateLoanStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { id: string; status: LoanStatus }) =>
      updateLoanStatus(variables.id, variables.status, {
        idempotencyKey: idempotencyKeyFor(variables),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["loan", variables.id] });
      toast.success(`Loan ${variables.id} moved to ${variables.status.replace(/_/g, " ")}`);
    },
    onError: (error) => {
      toast.error(errorMessage(error));
    },
  });
}

export function useAssignLoanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { id: string; officerUserId: string }) =>
      assignLoan(variables.id, variables.officerUserId, {
        idempotencyKey: idempotencyKeyFor(variables),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["loan", variables.id] });
      toast.success(`Loan ${variables.id} reassigned`);
    },
    onError: (error) => {
      toast.error(errorMessage(error));
    },
  });
}

export function useLoanDetailQuery(loanId: string | null) {
  return useQuery({
    queryKey: ["loan", loanId],
    queryFn: async () => {
      const loan = await getLoanById(loanId ?? "");
      return normalizeBackendLoan(loan);
    },
    enabled: Boolean(loanId),
    staleTime: 30_000,
  });
}
