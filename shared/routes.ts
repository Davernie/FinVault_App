import { z } from 'zod';
import { users, accounts, categories, budgets } from './schema';

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
