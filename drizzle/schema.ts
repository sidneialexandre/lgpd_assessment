import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal } from "drizzle-orm/mysql-core";

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
  role: mysqlEnum("role", ["user", "admin", "respondent"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Companies table to store company information
export const companies = mysqlTable("companies", {
  id: int("id").autoincrement().primaryKey(),
  cnpj: varchar("cnpj", { length: 18 }).notNull().unique(), // XX.XXX.XXX/XXXX-XX
  razaoSocial: varchar("razaoSocial", { length: 255 }).notNull(),
  userId: int("userId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

// Groups table to store respondent groups
export const groups = mysqlTable("groups", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull().references(() => companies.id),
  groupName: varchar("groupName", { length: 100 }).notNull(), // G1, G2, etc
  departmentName: varchar("departmentName", { length: 255 }).notNull(), // Department name
  respondentCount: int("respondentCount").notNull(), // Number of people in this group
  respondentsCompleted: int("respondentsCompleted").default(0).notNull(), // Number of respondents who completed the assessment
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Group = typeof groups.$inferSelect;
export type InsertGroup = typeof groups.$inferInsert;

// Assessment table to store consolidated assessments
export const assessments = mysqlTable("assessments", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull().references(() => companies.id),
  assessmentNumber: int("assessmentNumber").default(1).notNull(), // 1, 2, 3, etc - unique per company
  totalScore: int("totalScore").default(0).notNull(),
  compliancePercentage: decimal("compliancePercentage", { precision: 5, scale: 2 }).default("0").notNull(),
  isCompleted: int("isCompleted").default(0).notNull(), // 0 = not completed, 1 = completed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = typeof assessments.$inferInsert;

// Respondent sessions table to track individual respondents
export const respondentSessions = mysqlTable("respondentSessions", {
  id: int("id").autoincrement().primaryKey(),
  assessmentId: int("assessmentId").notNull().references(() => assessments.id, { onDelete: "cascade" }),
  groupId: int("groupId").notNull().references(() => groups.id, { onDelete: "cascade" }),
  respondentNumber: int("respondentNumber").notNull(), // Which respondent in the group (1, 2, 3, etc)
  accessToken: varchar("accessToken", { length: 255 }), // Unique token for respondent access
  isCompleted: int("isCompleted").default(0).notNull(), // 0 = not completed, 1 = completed
  totalScore: int("totalScore").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RespondentSession = typeof respondentSessions.$inferSelect;
export type InsertRespondentSession = typeof respondentSessions.$inferInsert;

// Individual answers table to store responses per respondent
export const individualAnswers = mysqlTable("individualAnswers", {
  id: int("id").autoincrement().primaryKey(),
  respondentSessionId: int("respondentSessionId").notNull().references(() => respondentSessions.id, { onDelete: "cascade" }),
  questionId: int("questionId").notNull(),
  selectedAnswer: varchar("selectedAnswer", { length: 1 }).notNull(), // A, B, C, D
  score: int("score").notNull(), // 100, 65, 35, 0
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type IndividualAnswer = typeof individualAnswers.$inferSelect;
export type InsertIndividualAnswer = typeof individualAnswers.$inferInsert;

// Consolidated answers table to store aggregated responses
export const answers = mysqlTable("answers", {
  id: int("id").autoincrement().primaryKey(),
  assessmentId: int("assessmentId").notNull().references(() => assessments.id, { onDelete: "cascade" }),
  questionId: int("questionId").notNull(),
  selectedAnswer: varchar("selectedAnswer", { length: 1 }).notNull(), // A, B, C, D
  score: int("score").notNull(), // 100, 65, 35, 0
  responseCount: int("responseCount").default(0).notNull(), // Number of respondents who selected this answer
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Answer = typeof answers.$inferSelect;
export type InsertAnswer = typeof answers.$inferInsert;



// Assessment Groups table to associate groups with specific assessments
export const assessmentGroups = mysqlTable("assessmentGroups", {
  id: int("id").autoincrement().primaryKey(),
  assessmentId: int("assessmentId").notNull().references(() => assessments.id, { onDelete: "cascade" }),
  groupId: int("groupId").notNull().references(() => groups.id, { onDelete: "cascade" }),
  groupName: varchar("groupName", { length: 100 }).notNull(), // G1, G2, etc (copy from group)
  departmentName: varchar("departmentName", { length: 255 }).notNull(), // Department name (copy from group)
  respondentCount: int("respondentCount").notNull(), // Number of respondents in this group for this assessment
  respondentsCompleted: int("respondentsCompleted").default(0).notNull(), // Number who completed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AssessmentGroup = typeof assessmentGroups.$inferSelect;
export type InsertAssessmentGroup = typeof assessmentGroups.$inferInsert;
