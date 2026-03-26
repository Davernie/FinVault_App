import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { authFetch } from "@/lib/fetcher";

export function useSpendingByCategory() {
  return useQuery({
    queryKey: [api.analytics.spendingByCategory.path],
    queryFn: async () => {
      return await authFetch(api.analytics.spendingByCategory.path);
    },
  });
}

export function useMonthlyTrends() {
  return useQuery({
    queryKey: [api.analytics.monthlyTrends.path],
    queryFn: async () => {
      return await authFetch(api.analytics.monthlyTrends.path);
    },
  });
}
