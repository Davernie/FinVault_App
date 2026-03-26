import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.SESSION_SECRET || "hackathon_secret";

const tokenBlacklist = new Map<string, number>();

setInterval(() => {
  const now = Date.now();
  tokenBlacklist.forEach((exp, token) => {
    if (exp < now) tokenBlacklist.delete(token);
  });
}, 30 * 60 * 1000);

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: "No token provided" });

    if (tokenBlacklist.has(token)) {
      return res.status(401).json({ message: "Token revoked" });
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ message: "Token expired" });
        }
        return res.status(403).json({ message: "Invalid token" });
      }
      req.user = user;
      next();
    });
  };

  // Auth routes
  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      const existingUser = await storage.getUserByEmail(input.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const user = await storage.createUser(input);
      const token = jwt.sign({ id: user.id, email: user.email, jti: crypto.randomUUID() }, JWT_SECRET, { expiresIn: '24h' });
      res.status(201).json({ token, user });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.auth.login.path, async (req, res) => {
    try {
      const input = api.auth.login.input.parse(req.body);
      const user = await storage.getUserByEmail(input.email);

      // Basic plain text password check for demo purposes
      if (!user || user.password !== input.password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ id: user.id, email: user.email, jti: crypto.randomUUID() }, JWT_SECRET, { expiresIn: '24h' });
      res.status(200).json({ token, user });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.auth.logout.path, authenticateToken, async (req: any, res) => {
    const token = req.headers['authorization']!.split(' ')[1];
    const decoded = jwt.decode(token) as { exp: number };
    tokenBlacklist.set(token, decoded.exp * 1000);
    res.status(200).json({ message: "Logged out successfully" });
  });

  // Protected routes
  app.get(api.accounts.list.path, authenticateToken, async (req: any, res) => {
    const accounts = await storage.getAccounts(req.user.id);
    res.json(accounts);
  });

  app.get(api.accounts.get.path, authenticateToken, async (req: any, res) => {
    const account = await storage.getAccount(Number(req.params.id));
    if (!account) return res.status(404).json({ message: "Account not found" });
    if (account.userId !== req.user.id) return res.status(403).json({ message: "Forbidden" });
    res.json(account);
  });

  // BUGGY: N+1 queries implementation (Challenge #2)
  app.get(api.transactions.list.path, authenticateToken, async (req: any, res) => {
    const accountId = Number(req.params.accountId);
    const account = await storage.getAccount(accountId);
    if (!account || account.userId !== req.user.id) return res.status(403).json({ message: "Forbidden" });

    const transactions = await storage.getTransactions(accountId);
    const categories = await storage.getCategories();

    const enriched = transactions.map(txn => ({
      ...txn,
      category: categories.find(c => c.id === txn.categoryId)?.name || "Unknown"
    }));

    res.json(enriched);
  });

  app.get(api.categories.list.path, authenticateToken, async (req: any, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  app.get(api.budgets.list.path, authenticateToken, async (req: any, res) => {
    const budgets = await storage.getBudgets(req.user.id);
    const categories = await storage.getCategories();

    const enriched = budgets.map(b => ({
      ...b,
      category: categories.find(c => c.id === b.categoryId)?.name
    }));
    res.json(enriched);
  });

  app.post(api.budgets.create.path, authenticateToken, async (req: any, res) => {
    try {
      const input = api.budgets.create.input.parse(req.body);
      const budget = await storage.createBudget({
        userId: req.user.id,
        categoryId: input.categoryId,
        limitAmount: input.limitAmount,
        period: input.period,
      });
      res.status(201).json(budget);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // BUGGY: Race condition implementation (Challenge #1)
  app.post(api.transfers.create.path, authenticateToken, async (req: any, res) => {
    try {
      const input = api.transfers.create.input.parse(req.body);

      const fromAcct = await storage.getAccount(input.fromAccountId);
      const toAcct = await storage.getAccount(input.toAccountId);

      if (!fromAcct || fromAcct.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      if (!toAcct) {
        return res.status(404).json({ message: "Target account not found" });
      }

      await storage.transferFunds(input.fromAccountId, input.toAccountId, input.amount);

      res.status(200).json({ message: "Transfer successful" });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      if (err instanceof Error && err.message === "Insufficient funds") {
        return res.status(400).json({ message: "Insufficient funds" });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
