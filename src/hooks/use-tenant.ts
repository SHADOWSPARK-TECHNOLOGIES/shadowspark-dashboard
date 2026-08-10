import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "sonner";
import {
  ApiError,
  getTenantIdFromToken,
  idempotencyKeyFor,
  normalizeApiError,
  updateSettings,
  useTenantProfileQuery,
  type SettingsUpdateInput,
} from "@/lib/backend-api";

export { useTenantProfileQuery };

export function useTenantId(): string | null {
  return useMemo(() => getTenantIdFromToken(), []);
}

function errorMessage(error: unknown): string {
  const normalized = normalizeApiError(error);
  return normalized.error.message;
}

export function useUpdateSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SettingsUpdateInput) =>
      updateSettings(input, { idempotencyKey: idempotencyKeyFor(input) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant", "profile"] });
      toast.success("Settings saved");
    },
    onError: (error) => {
      toast.error(errorMessage(error));
    },
  });
}
