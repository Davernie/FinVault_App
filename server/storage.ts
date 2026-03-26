import { db } from "./db";
import { eq, inArray, sql } from "drizzle-orm";
import {
  users, accounts, categories, transactions, budgets,
  type User, type Account, type Category, type Transaction, type Budget
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<User, "id" | "createdAt">): Promise<User>;

  getAccounts(userId: number): Promise<Account[]>;
  getAccount(id: number): Promise<Account | undefined>;
  createAccount(account: Omit<Account, "id">): Promise<Account>;
  updateAccountBalance(id: number, amount: number): Promise<void>;

  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;

  getTransactions(accountId: number): Promise<Transaction[]>;
  getTransactionsForUser(userId: number): Promise<Transaction[]>;
  createTransaction(tx: Omit<Transaction, "id" | "date">): Promise<Transaction>;

  getBudgets(userId: number): Promise<Budget[]>;
  createBudget(budget: Omit<Budget, "id">): Promise<Budget>;

  transferFunds(fromAccountId: number, toAccountId: number, amount: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: Omit<User, "id" | "createdAt">): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getAccounts(userId: number): Promise<Account[]> {
    return await db.select().from(accounts).where(eq(accounts.userId, userId));
  }

  async getAccount(id: number): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    return account;
  }

  async createAccount(account: Omit<Account, "id">): Promise<Account> {
    const [newAccount] = await db.insert(accounts).values(account).returning();
    return newAccount;
  }

  async updateAccountBalance(id: number, amount: number): Promise<void> {
    await db.update(accounts)
      .set({ balance: sql`${accounts.balance} + ${amount}` })
      .where(eq(accounts.id, id));
  }

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async getTransactions(accountId: number): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.accountId, accountId));
  }

  async getTransactionsForUser(userId: number): Promise<Transaction[]> {
    const userAccounts = await db.select({ id: accounts.id }).from(accounts).where(eq(accounts.userId, userId));
    const accountIds = userAccounts.map(a => a.id);
    if (accountIds.length === 0) return [];
    return await db.select().from(transactions).where(inArray(transactions.accountId, accountIds));
  }

  async createTransaction(tx: Omit<Transaction, "id" | "date">): Promise<Transaction> {
    const [newTx] = await db.insert(transactions).values(tx).returning();
    return newTx;
  }

  async getBudgets(userId: number): Promise<Budget[]> {
    return await db.select().from(budgets).where(eq(budgets.userId, userId));
  }

  async createBudget(budget: Omit<Budget, "id">): Promise<Budget> {
    const [newBudget] = await db.insert(budgets).values(budget).returning();
    return newBudget;
  }

  async transferFunds(fromAccountId: number, toAccountId: number, amount: number): Promise<void> {
    await db.transaction(async (tx) => {
      // Lock both rows to block concurrent transfers until this transaction completes
      const { rows: [fromAcct] } = await tx.execute(
        sql`SELECT balance FROM accounts WHERE id = ${fromAccountId} FOR UPDATE`
      ) as { rows: { balance: number }[] };
      await tx.execute(
        sql`SELECT balance FROM accounts WHERE id = ${toAccountId} FOR UPDATE`
      );

      if (!fromAcct || fromAcct.balance < amount) {
        throw new Error("Insufficient funds");
      }

      // Simulate latency to make race condition testing visible
      await new Promise(resolve => setTimeout(resolve, 8));

      await tx.update(accounts)
        .set({ balance: sql`${accounts.balance} - ${amount}` })
        .where(eq(accounts.id, fromAccountId));
      await tx.update(accounts)
        .set({ balance: sql`${accounts.balance} + ${amount}` })
        .where(eq(accounts.id, toAccountId));

      await tx.insert(transactions).values([
        { accountId: fromAccountId, categoryId: 1, amount, type: "debit", description: `Transfer to account #${toAccountId}` },
        { accountId: toAccountId, categoryId: 1, amount, type: "credit", description: `Transfer from account #${fromAccountId}` },
      ]);
    });
  }
}

export const storage = new DatabaseStorage();
