import { eq, and, sum } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, companies, groups, assessments, answers, 
  respondentSessions, individualAnswers,
  Assessment, Answer, Company, Group, 
  InsertCompany, InsertGroup, RespondentSession, IndividualAnswer,
  InsertRespondentSession, InsertIndividualAnswer
} from "../drizzle/schema";
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

// Company functions
export async function createCompany(userId: number, cnpj: string, razaoSocial: string): Promise<Company> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(companies).values({
    userId,
    cnpj,
    razaoSocial,
  });

  const company = await db
    .select()
    .from(companies)
    .where(eq(companies.id, Number(result[0].insertId)))
    .limit(1);

  return company[0];
}

export async function getCompanyByCNPJ(cnpj: string): Promise<Company | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(companies)
    .where(eq(companies.cnpj, cnpj))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getCompanyById(companyId: number): Promise<Company | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserCompanies(userId: number): Promise<Company[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(companies)
    .where(eq(companies.userId, userId))
    .orderBy(companies.createdAt);
}

// Group functions
export async function createGroup(companyId: number, groupName: string, departmentName: string, respondentCount: number): Promise<Group> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(groups).values({
    companyId,
    groupName,
    departmentName,
    respondentCount,
    respondentsCompleted: 0,
  });

  const group = await db
    .select()
    .from(groups)
    .where(eq(groups.id, Number(result[0].insertId)))
    .limit(1);

  return group[0];
}

export async function getCompanyGroups(companyId: number): Promise<Group[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(groups)
    .where(eq(groups.companyId, companyId))
    .orderBy(groups.createdAt);
}

export async function deleteGroup(groupId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.delete(groups).where(eq(groups.id, groupId));
}

// Assessment functions
export async function createAssessment(companyId: number): Promise<Assessment> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(assessments).values({
    companyId,
    totalScore: 0,
    compliancePercentage: "0",
    isCompleted: 0,
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

export async function getCompanyAssessments(companyId: number): Promise<Assessment[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(assessments)
    .where(eq(assessments.companyId, companyId))
    .orderBy(assessments.createdAt);
}

// Generate unique token for respondent
function generateAccessToken(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;
}

// Respondent session functions
export async function createRespondentSession(assessmentId: number, groupId: number, respondentNumber: number): Promise<RespondentSession> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const accessToken = generateAccessToken();

  const result = await db.insert(respondentSessions).values({
    assessmentId,
    groupId,
    respondentNumber,
    accessToken,
    isCompleted: 0,
    totalScore: 0,
  });

  const session = await db
    .select()
    .from(respondentSessions)
    .where(eq(respondentSessions.id, Number(result[0].insertId)))
    .limit(1);

  return session[0];
}

export async function getRespondentSessionByToken(accessToken: string): Promise<RespondentSession | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(respondentSessions)
    .where(eq(respondentSessions.accessToken, accessToken))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getRespondentSession(sessionId: number): Promise<RespondentSession | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(respondentSessions)
    .where(eq(respondentSessions.id, sessionId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getAssessmentRespondentSessions(assessmentId: number): Promise<RespondentSession[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(respondentSessions)
    .where(eq(respondentSessions.assessmentId, assessmentId))
    .orderBy(respondentSessions.createdAt);
}

// Individual answers functions
export async function saveIndividualAnswers(
  respondentSessionId: number,
  answers_data: Array<{ questionId: number; selectedAnswer: string; score: number }>
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Calculate total score for this respondent
  const totalScore = answers_data.reduce((sum, answer) => sum + answer.score, 0);

  // Save all individual answers
  for (const answer of answers_data) {
    await db.insert(individualAnswers).values({
      respondentSessionId,
      questionId: answer.questionId,
      selectedAnswer: answer.selectedAnswer,
      score: answer.score,
    });
  }

  // Update respondent session with total score and mark as completed
  await db
    .update(respondentSessions)
    .set({
      totalScore,
      isCompleted: 1,
    })
    .where(eq(respondentSessions.id, respondentSessionId));
}

export async function getIndividualAnswers(respondentSessionId: number): Promise<IndividualAnswer[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(individualAnswers)
    .where(eq(individualAnswers.respondentSessionId, respondentSessionId))
    .orderBy(individualAnswers.questionId);
}

// Check if all respondents have completed the assessment
export async function checkAllRespondentsCompleted(assessmentId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // Get all groups for this assessment
  const assessment = await getAssessmentById(assessmentId);
  if (!assessment) return false;

  const companyGroups = await getCompanyGroups(assessment.companyId);
  
  // Get all respondent sessions for this assessment
  const sessions = await getAssessmentRespondentSessions(assessmentId);
  
  // Count completed sessions per group
  const completedByGroup: Record<number, number> = {};
  for (const session of sessions) {
    if (session.isCompleted === 1) {
      completedByGroup[session.groupId] = (completedByGroup[session.groupId] || 0) + 1;
    }
  }

  // Check if all respondents in all groups have completed
  for (const group of companyGroups) {
    const completedCount = completedByGroup[group.id] || 0;
    if (completedCount < group.respondentCount) {
      return false;
    }
  }

  return true;
}

// Calculate consolidated assessment results
export async function calculateConsolidatedResults(assessmentId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Get all completed respondent sessions
  const sessions = await db
    .select()
    .from(respondentSessions)
    .where(and(
      eq(respondentSessions.assessmentId, assessmentId),
      eq(respondentSessions.isCompleted, 1)
    ));

  // Calculate total score from all respondents
  let totalScore = 0;
  const answerCounts: Record<number, Record<string, number>> = {};

  for (const session of sessions) {
    const sessionAnswers = await getIndividualAnswers(session.id);
    
    for (const answer of sessionAnswers) {
      totalScore += answer.score;
      
      if (!answerCounts[answer.questionId]) {
        answerCounts[answer.questionId] = { A: 0, B: 0, C: 0, D: 0 };
      }
      answerCounts[answer.questionId][answer.selectedAnswer] = (answerCounts[answer.questionId][answer.selectedAnswer] || 0) + 1;
    }
  }

  // Delete existing consolidated answers
  await db.delete(answers).where(eq(answers.assessmentId, assessmentId));

  // Save consolidated answers
  for (const questionId in answerCounts) {
    const answerData = answerCounts[questionId];
    const scores: Record<string, number> = { A: 100, B: 65, C: 35, D: 0 };
    
    for (const [selectedAnswer, count] of Object.entries(answerData)) {
      if (count > 0) {
        await db.insert(answers).values({
          assessmentId,
          questionId: parseInt(questionId),
          selectedAnswer,
          score: scores[selectedAnswer],
          responseCount: count,
        });
      }
    }
  }

  // Calculate compliance percentage
  const maxScore = 100000;
  const compliancePercentage = parseFloat(((totalScore / maxScore) * 100).toFixed(2));

  // Update assessment with final results
  await db
    .update(assessments)
    .set({
      totalScore,
      compliancePercentage: compliancePercentage.toString(),
      isCompleted: 1,
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

