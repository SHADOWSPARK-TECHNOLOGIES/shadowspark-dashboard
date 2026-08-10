import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ApiError,
  idempotencyKeyFor,
  updateSettings,
  useTenantProfileQuery,
  type SettingsUpdateInput,
} from "@/lib/backend-api";

export { useTenantProfileQuery };

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong";
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
