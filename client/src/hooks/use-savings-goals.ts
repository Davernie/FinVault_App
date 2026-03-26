import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { authFetch } from "@/lib/fetcher";
import { useToast } from "@/hooks/use-toast";

export function useSavingsGoals() {
  return useQuery({
    queryKey: [api.savingsGoals.list.path],
    queryFn: async () => {
      return await authFetch(api.savingsGoals.list.path);
    },
  });
}

export function useCreateSavingsGoal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: typeof api.savingsGoals.create.input._type) => {
      return await authFetch(api.savingsGoals.create.path, {
        method: api.savingsGoals.create.method,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.savingsGoals.list.path] });
      toast({ title: "Goal Created", description: "Your savings goal has been set." });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Creation Failed", description: error.message });
    },
  });
}

export function useUpdateSavingsGoal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & typeof api.savingsGoals.update.input._type) => {
      return await authFetch(buildUrl(api.savingsGoals.update.path, { id }), {
        method: api.savingsGoals.update.method,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.savingsGoals.list.path] });
      toast({ title: "Goal Updated", description: "Your savings goal has been updated." });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Update Failed", description: error.message });
    },
  });
}

export function useDeleteSavingsGoal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      return await authFetch(buildUrl(api.savingsGoals.delete.path, { id }), {
        method: api.savingsGoals.delete.method,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.savingsGoals.list.path] });
      toast({ title: "Goal Deleted", description: "Your savings goal has been removed." });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Delete Failed", description: error.message });
    },
  });
}
