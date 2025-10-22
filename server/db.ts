import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, assessments, answers, Assessment, Answer } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUser(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createAssessment(userId: number): Promise<Assessment> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(assessments).values({
    userId,
    totalScore: 0,
    compliancePercentage: 0,
  });

  const assessment = await db
    .select()
    .from(assessments)
    .where(eq(assessments.id, Number(result[0].insertId)))
    .limit(1);

  return assessment[0];
}

export async function getAssessmentById(assessmentId: number): Promise<Assessment | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(assessments)
    .where(eq(assessments.id, assessmentId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserAssessments(userId: number): Promise<Assessment[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(assessments)
    .where(eq(assessments.userId, userId))
    .orderBy(assessments.createdAt);
}

export async function saveAnswers(
  assessmentId: number,
  answers_data: Array<{ questionId: number; selectedAnswer: string; score: number }>
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Calculate total score
  const totalScore = answers_data.reduce((sum, answer) => sum + answer.score, 0);
  const compliancePercentage = Math.round((totalScore / 10000) * 100);

  // Save all answers
  for (const answer of answers_data) {
    await db.insert(answers).values({
      assessmentId,
      questionId: answer.questionId,
      selectedAnswer: answer.selectedAnswer,
      score: answer.score,
    });
  }

  // Update assessment with total score and percentage
  await db
    .update(assessments)
    .set({
      totalScore,
      compliancePercentage,
    })
    .where(eq(assessments.id, assessmentId));
}

export async function getAssessmentAnswers(assessmentId: number): Promise<Answer[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(answers)
    .where(eq(answers.assessmentId, assessmentId))
    .orderBy(answers.questionId);
}
