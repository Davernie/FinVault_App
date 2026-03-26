import { z } from 'zod';
import { users, accounts, categories, budgets, savingsGoals } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  unauthorized: z.object({ message: z.string() }),
  badRequest: z.object({ message: z.string() }),
};

export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/auth/register' as const,
      input: z.object({ email: z.string().email(), password: z.string() }),
      responses: { 201: z.object({ token: z.string(), user: z.custom<typeof users.$inferSelect>() }), 400: errorSchemas.validation },
    },
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: z.object({ email: z.string().email(), password: z.string() }),
      responses: { 200: z.object({ token: z.string(), user: z.custom<typeof users.$inferSelect>() }), 401: errorSchemas.unauthorized },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout' as const,
      responses: { 200: z.object({ message: z.string() }) },
    },
  },
  accounts: {
    list: {
      method: 'GET' as const,
      path: '/api/accounts' as const,
      responses: { 200: z.array(z.custom<typeof accounts.$inferSelect>()) },
    },
    get: {
      method: 'GET' as const,
      path: '/api/accounts/:id' as const,
      responses: { 200: z.custom<typeof accounts.$inferSelect>(), 404: errorSchemas.notFound },
    }
  },
  transactions: {
    list: {
      method: 'GET' as const,
      path: '/api/accounts/:accountId/transactions' as const,
      responses: { 200: z.array(z.any()) }, // Enriched transactions with category data
    }
  },
  transfers: {
    create: {
      method: 'POST' as const,
      path: '/api/transfers' as const,
      input: z.object({ fromAccountId: z.coerce.number(), toAccountId: z.coerce.number(), amount: z.coerce.number() }),
      responses: { 200: z.object({ message: z.string() }), 400: errorSchemas.badRequest },
    }
  },
  budgets: {
    list: {
      method: 'GET' as const,
      path: '/api/budgets' as const,
      responses: { 200: z.array(z.any()) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/budgets' as const,
      input: z.object({ categoryId: z.coerce.number(), limitAmount: z.coerce.number(), period: z.enum(["monthly", "weekly"]) }),
      responses: { 201: z.custom<typeof budgets.$inferSelect>() },
    }
  },
  categories: {
    list: {
      method: 'GET' as const,
      path: '/api/categories' as const,
      responses: { 200: z.array(z.custom<typeof categories.$inferSelect>()) },
    }
  },
  analytics: {
    spendingByCategory: {
      method: 'GET' as const,
      path: '/api/analytics/spending-by-category' as const,
      responses: {
        200: z.array(z.object({
          categoryId: z.number(),
          categoryName: z.string(),
          colorHex: z.string(),
          total: z.number(),
        })),
      },
    },
    monthlyTrends: {
      method: 'GET' as const,
      path: '/api/analytics/monthly-trends' as const,
      responses: {
        200: z.array(z.object({
          month: z.string(),
          income: z.number(),
          expenses: z.number(),
        })),
      },
  savingsGoals: {
    list: {
      method: 'GET' as const,
      path: '/api/savings-goals' as const,
      responses: { 200: z.array(z.custom<typeof savingsGoals.$inferSelect>()) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/savings-goals' as const,
      input: z.object({
        name: z.string().min(1, "Name is required"),
        targetAmount: z.coerce.number().positive("Target must be positive"),
        deadline: z.string().nullable().optional(),
      }),
      responses: { 201: z.custom<typeof savingsGoals.$inferSelect>() },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/savings-goals/:id' as const,
      input: z.object({
        name: z.string().min(1).optional(),
        targetAmount: z.coerce.number().positive().optional(),
        currentAmount: z.coerce.number().min(0).optional(),
        deadline: z.string().nullable().optional(),
      }),
      responses: { 200: z.custom<typeof savingsGoals.$inferSelect>() },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/savings-goals/:id' as const,
      responses: { 204: z.null() },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
