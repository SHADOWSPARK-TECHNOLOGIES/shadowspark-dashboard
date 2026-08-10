import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clearStoredToken, login, setStoredToken, useAuthMeQuery } from "@/lib/backend-api";

export { useAuthMeQuery };

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
