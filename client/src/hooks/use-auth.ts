import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

// Use direct fetch for auth since we don't have token yet
export function useLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: typeof api.auth.login.input._type) => {
      const res = await fetch(api.auth.login.path, {
        method: api.auth.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to login");
      }
      return res.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      toast({ title: "Welcome back!", description: "Successfully logged in." });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Login failed", description: error.message });
    }
  });
}

export function useRegister() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: typeof api.auth.register.input._type) => {
      const res = await fetch(api.auth.register.path, {
        method: api.auth.register.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to register");
      }
      return res.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      toast({ title: "Account created!", description: "Welcome to FinVault." });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Registration failed", description: error.message });
    }
  });
}

export function useLogout() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return () => {
    const token = localStorage.getItem("token");

    // Notify server to blacklist the token (fire-and-forget)
    if (token) {
      fetch(api.auth.logout.path, {
        method: api.auth.logout.method,
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => { });
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    queryClient.clear();
    toast({ title: "Logged out", description: "You have been securely logged out." });
    setLocation("/login");
  };
}

export function useUser() {
  // Simple synchronous user getter from localStorage for UI state
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");

  return {
    user: userStr ? JSON.parse(userStr) : null,
    isAuthenticated: !!token,
  };
}
