import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /**
   * Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user.
   * This mirrors the Manus account and should be used for authentication lookups.
   */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Assessment table to store individual assessments
export const assessments = mysqlTable("assessments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  totalScore: int("totalScore").default(0).notNull(),
  compliancePercentage: int("compliancePercentage").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = typeof assessments.$inferInsert;

// Answers table to store user responses
export const answers = mysqlTable("answers", {
  id: int("id").autoincrement().primaryKey(),
  assessmentId: int("assessmentId").notNull().references(() => assessments.id),
  questionId: int("questionId").notNull(),
  selectedAnswer: varchar("selectedAnswer", { length: 1 }).notNull(), // A, B, C, D
  score: int("score").notNull(), // 100, 65, 35, 0
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Answer = typeof answers.$inferSelect;
export type InsertAnswer = typeof answers.$inferInsert;