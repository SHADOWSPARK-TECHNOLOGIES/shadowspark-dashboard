import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  clearStoredToken,
  login,
  normalizeApiError,
  setStoredToken,
  useAuthMeQuery,
} from "@/lib/backend-api";

export { useAuthMeQuery };

function errorMessage(error: unknown): string {
  return normalizeApiError(error).error.message;
}

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const result = await login(email, password);
      setStoredToken(result.token);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      toast.success("Signed in");
    },
    onError: (error) => {
      toast.error(errorMessage(error));
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      clearStoredToken();
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["auth", "me"] });
      queryClient.clear();
    },
  });
}
