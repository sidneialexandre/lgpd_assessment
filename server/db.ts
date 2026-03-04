import { eq, and, sum, desc, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, companies, groups, assessments, answers, 
  respondentSessions, individualAnswers, assessmentGroups,
  Assessment, Answer, Company, Group, AssessmentGroup,
  InsertCompany, InsertGroup, RespondentSession, IndividualAnswer, InsertAssessmentGroup,
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

  // Get the next assessment number for this company
  const nextNumber = await getNextAssessmentNumber(companyId);

  const result = await db.insert(assessments).values({
    companyId,
    assessmentNumber: nextNumber,
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
  // Maximum score per respondent is 10,000 (50 questions * 200 points each)
  const maxScorePerRespondent = 10000;
  const maxScore = maxScorePerRespondent * sessions.length;
  const compliancePercentage = maxScore > 0 ? parseFloat(((totalScore / maxScore) * 100).toFixed(2)) : 0;

  // Calculate compliance per group
  const groupSessions = await db
    .select()
    .from(respondentSessions)
    .where(eq(respondentSessions.assessmentId, assessmentId));

  const groupIds = Array.from(new Set(groupSessions.map(s => s.groupId)));

  for (const groupId of groupIds) {
    const groupCompletedSessions = sessions.filter(s => s.groupId === groupId);
    
    let groupTotalScore = 0;
    for (const session of groupCompletedSessions) {
      const sessionAnswers = await getIndividualAnswers(session.id);
      for (const answer of sessionAnswers) {
        groupTotalScore += answer.score;
      }
    }

    const maxScorePerRespondent = 10000;
    const maxScore = maxScorePerRespondent * groupCompletedSessions.length;
    const groupCompliancePercentage = maxScore > 0 ? parseFloat(((groupTotalScore / maxScore) * 100).toFixed(2)) : 0;

    // Update assessment group with results
    await db
      .update(assessmentGroups)
      .set({
        totalScore: groupTotalScore,
        compliancePercentage: groupCompliancePercentage.toString(),
      })
      .where(and(
        eq(assessmentGroups.assessmentId, assessmentId),
        eq(assessmentGroups.groupId, groupId)
      ));
  }

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




// Delete assessment and all related data
export async function deleteAssessment(assessmentId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Get all respondent sessions for this assessment
  const sessions = await db
    .select()
    .from(respondentSessions)
    .where(eq(respondentSessions.assessmentId, assessmentId));

  // Delete individual answers for all sessions
  for (const session of sessions) {
    await db
      .delete(individualAnswers)
      .where(eq(individualAnswers.respondentSessionId, session.id));
  }

  // Delete respondent sessions
  await db
    .delete(respondentSessions)
    .where(eq(respondentSessions.assessmentId, assessmentId));

  // Delete consolidated answers
  await db
    .delete(answers)
    .where(eq(answers.assessmentId, assessmentId));

  // Delete assessment
  await db
    .delete(assessments)
    .where(eq(assessments.id, assessmentId));
}




export async function getCompanyIdByToken(accessToken: string): Promise<number | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select({ companyId: assessments.companyId })
    .from(respondentSessions)
    .innerJoin(assessments, eq(respondentSessions.assessmentId, assessments.id))
    .where(eq(respondentSessions.accessToken, accessToken))
    .limit(1);

  return result.length > 0 ? result[0].companyId : undefined;
}




export async function getLastAssessmentWithGroups(companyId: number) {
  const db = await getDb();
  if (!db) return undefined;

  // Get the last assessment for the company
  const assessmentResult = await db
    .select()
    .from(assessments)
    .where(eq(assessments.companyId, companyId))
    .orderBy(desc(assessments.createdAt))
    .limit(1);

  if (assessmentResult.length === 0) return undefined;

  const assessment = assessmentResult[0];

  // Get groups that were used in the last assessment
  // by finding unique groupIds from respondent sessions
  const groupIdsResult = await db
    .select({ groupId: respondentSessions.groupId })
    .from(respondentSessions)
    .where(eq(respondentSessions.assessmentId, assessment.id));

  if (groupIdsResult.length === 0) {
    return {
      assessment,
      groups: [],
    };
  }

  // Get unique group IDs
  const uniqueGroupIds = Array.from(new Set(groupIdsResult.map((r: any) => r.groupId)));

  // Get the actual group data, limited to 6 groups
  const groupsResult = await db
    .select()
    .from(groups)
    .where(eq(groups.companyId, companyId))
    .limit(6);

  // Filter to only include groups that were in the last assessment
  const filteredGroups = groupsResult.filter(g => uniqueGroupIds.includes(g.id));

  return {
    assessment,
    groups: filteredGroups,
  };
}


// Get respondent sessions with assessment and company details by email
export async function getRespondentSessionsByEmail(email: string) {
  const db = await getDb();
  if (!db) return [];

  // First, find all assessments where respondent sessions have access tokens
  // We'll return all available assessments for respondents to access
  // Since respondents don't have a user account, we'll return all active assessments
  // and let them access via token
  
  const sessions = await db
    .select({
      id: respondentSessions.id,
      accessToken: respondentSessions.accessToken,
      assessmentId: respondentSessions.assessmentId,
      groupId: respondentSessions.groupId,
      respondentNumber: respondentSessions.respondentNumber,
      isCompleted: respondentSessions.isCompleted,
      company: companies,
      assessment: assessments,
      group: groups,
    })
    .from(respondentSessions)
    .innerJoin(assessments, eq(respondentSessions.assessmentId, assessments.id))
    .innerJoin(companies, eq(assessments.companyId, companies.id))
    .innerJoin(groups, eq(respondentSessions.groupId, groups.id))
    .where(eq(respondentSessions.isCompleted, 0)) // Only incomplete assessments
    .orderBy(respondentSessions.createdAt);

  return sessions;
}


// Create respondent sessions automatically for all respondents in all groups
export async function createRespondentSessionsForAssessment(assessmentId: number, companyId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Get all groups for this company
  const companyGroups = await db
    .select()
    .from(groups)
    .where(eq(groups.companyId, companyId));

  // Create sessions for each respondent in each group
  for (const group of companyGroups) {
    for (let respondentNumber = 1; respondentNumber <= group.respondentCount; respondentNumber++) {
      const accessToken = generateAccessToken();
      
      await db.insert(respondentSessions).values({
        assessmentId,
        groupId: group.id,
        respondentNumber,
        accessToken,
        isCompleted: 0,
        totalScore: 0,
      });
    }
  }
}


export async function createAssessmentGroupsForAssessment(assessmentId: number, companyId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Get all groups for this company
  const companyGroups = await db
    .select()
    .from(groups)
    .where(eq(groups.companyId, companyId));

  // Create assessment groups for each company group
  for (const group of companyGroups) {
    await db.insert(assessmentGroups).values({
      assessmentId,
      groupId: group.id,
      groupName: group.groupName,
      departmentName: group.departmentName,
      respondentCount: group.respondentCount,
      respondentsCompleted: 0,
    });
  }
}


export async function getNextAssessmentNumber(companyId: number): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Get the highest assessment number for this company
  const result = await db
    .select({ maxNumber: sum(assessments.assessmentNumber) })
    .from(assessments)
    .where(eq(assessments.companyId, companyId));

  // This is a workaround - we need to get the max assessment number
  // Let's use a different approach
  const allAssessments = await db
    .select({ assessmentNumber: assessments.assessmentNumber })
    .from(assessments)
    .where(eq(assessments.companyId, companyId))
    .orderBy(desc(assessments.assessmentNumber))
    .limit(1);

  if (allAssessments.length === 0) {
    return 1;
  }

  return allAssessments[0].assessmentNumber + 1;
}


// Create a group isolated to a specific assessment
export async function createGroupForAssessment(
  assessmentId: number,
  companyId: number,
  groupName: string,
  departmentName: string,
  respondentCount: number
): Promise<AssessmentGroup> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // First, check if this group name already exists for this assessment
  const existingAssessmentGroup = await db
    .select()
    .from(assessmentGroups)
    .where(
      and(
        eq(assessmentGroups.assessmentId, assessmentId),
        eq(assessmentGroups.groupName, groupName)
      )
    )
    .limit(1);

  if (existingAssessmentGroup.length > 0) {
    throw new Error(`Group ${groupName} already exists for this assessment`);
  }

  // Create or get the group in the groups table
  const existingGroup = await db
    .select()
    .from(groups)
    .where(
      and(
        eq(groups.companyId, companyId),
        eq(groups.groupName, groupName)
      )
    )
    .limit(1);

  let groupId: number;
  if (existingGroup.length > 0) {
    groupId = existingGroup[0].id;
    // Update respondentCount if it's different
    if (existingGroup[0].respondentCount !== respondentCount) {
      await db.update(groups)
        .set({ respondentCount })
        .where(eq(groups.id, groupId));
    }
  } else {
    // Create new group
    const result = await db.insert(groups).values({
      companyId,
      groupName,
      departmentName,
      respondentCount,
    });
    groupId = Number(result[0].insertId);
  }

  // Now create the assessment group entry linking group to assessment
  const result = await db.insert(assessmentGroups).values({
    assessmentId,
    groupId,
    groupName,
    departmentName,
    respondentCount,
    respondentsCompleted: 0,
  });

  // Create respondent sessions for this group
  for (let respondentNumber = 1; respondentNumber <= respondentCount; respondentNumber++) {
    const accessToken = generateAccessToken();
    
    await db.insert(respondentSessions).values({
      assessmentId,
      groupId,
      respondentNumber,
      accessToken,
      isCompleted: 0,
      totalScore: 0,
    });
  }

  return {
    id: Number(result[0].insertId),
    assessmentId,
    groupId,
    groupName,
    departmentName,
    respondentCount,
    respondentsCompleted: 0,
  } as AssessmentGroup;
}


// Delete company and all its assessments, groups, and related data
export async function deleteCompany(companyId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Get all assessments for this company
  const companyAssessments = await db
    .select()
    .from(assessments)
    .where(eq(assessments.companyId, companyId));

  // Delete all data related to each assessment
  for (const assessment of companyAssessments) {
    await deleteAssessment(assessment.id);
  }

  // Delete all groups for this company
  await db
    .delete(groups)
    .where(eq(groups.companyId, companyId));

  // Delete the company itself
  await db
    .delete(companies)
    .where(eq(companies.id, companyId));
}


// Get respondent completion stats for an assessment
export async function getRespondentCompletionStats(assessmentId: number): Promise<{
  totalExpected: number;
  completed: number;
  remaining: number;
}> {
  const db = await getDb();
  if (!db) {
    return { totalExpected: 0, completed: 0, remaining: 0 };
  }

  const assessment = await getAssessmentById(assessmentId);
  if (!assessment) {
    return { totalExpected: 0, completed: 0, remaining: 0 };
  }

  // Get all groups for this assessment
  const groups = await getCompanyGroups(assessment.companyId);
  
  // Get all respondent sessions for this assessment
  const sessions = await getAssessmentRespondentSessions(assessmentId);
  
  // Count total expected respondents
  const totalExpected = groups.reduce((sum, g) => sum + g.respondentCount, 0);
  
  // Count completed respondents
  const completed = sessions.filter((s) => s.isCompleted === 1).length;
  
  // Calculate remaining
  const remaining = Math.max(0, totalExpected - completed);

  return { totalExpected, completed, remaining };
}


// Update respondent name and email
export async function updateRespondentInfo(
  respondentSessionId: number,
  respondentName: string,
  respondentEmail: string
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(respondentSessions)
    .set({
      respondentName,
      respondentEmail,
      updatedAt: new Date(),
    })
    .where(eq(respondentSessions.id, respondentSessionId));
}

// Get all respondent sessions with group information for an assessment
export async function getRespondentSessionsWithGroups(assessmentId: number): Promise<
  Array<{
    id: number;
    respondentNumber: number;
    respondentName: string | null;
    respondentEmail: string | null;
    isCompleted: number;
    totalScore: number;
    groupName: string;
    departmentName: string;
    accessToken: string | null;
  }>
> {
  const db = await getDb();
  if (!db) return [];

  const sessions = await db
    .select({
      id: respondentSessions.id,
      respondentNumber: respondentSessions.respondentNumber,
      respondentName: respondentSessions.respondentName,
      respondentEmail: respondentSessions.respondentEmail,
      isCompleted: respondentSessions.isCompleted,
      totalScore: respondentSessions.totalScore,
      groupName: groups.groupName,
      departmentName: groups.departmentName,
      accessToken: respondentSessions.accessToken,
    })
    .from(respondentSessions)
    .innerJoin(groups, eq(respondentSessions.groupId, groups.id))
    .where(eq(respondentSessions.assessmentId, assessmentId))
    .orderBy(respondentSessions.groupId, respondentSessions.respondentNumber);

  return sessions;
}

// Check if all respondent emails are filled for an assessment
export async function areAllRespondentEmailsFilled(assessmentId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const sessions = await db
    .select({ respondentEmail: respondentSessions.respondentEmail })
    .from(respondentSessions)
    .where(eq(respondentSessions.assessmentId, assessmentId));

  return sessions.length > 0 && sessions.every((s) => s.respondentEmail && s.respondentEmail.trim().length > 0);
}


// Get all assessments for a company with their scores
export async function getCompanyAssessmentsWithScores(companyId: number): Promise<
  Array<{
    id: number;
    assessmentNumber: number;
    totalScore: number;
    compliancePercentage: string;
    isCompleted: number;
    respondentCount: number;
    completedCount: number;
    createdAt: Date;
  }>
> {
  const db = await getDb();
  if (!db) return [];

  const assessmentsList = await db
    .select({
      id: assessments.id,
      assessmentNumber: assessments.assessmentNumber,
      totalScore: assessments.totalScore,
      compliancePercentage: assessments.compliancePercentage,
      isCompleted: assessments.isCompleted,
      createdAt: assessments.createdAt,
    })
    .from(assessments)
    .where(eq(assessments.companyId, companyId))
    .orderBy(desc(assessments.assessmentNumber));

  // For each assessment, count respondents
  const enriched = await Promise.all(
    assessmentsList.map(async (assessment) => {
      const sessions = await db
        .select()
        .from(respondentSessions)
        .where(eq(respondentSessions.assessmentId, assessment.id));

      const completedCount = sessions.filter((s) => s.isCompleted === 1).length;

      return {
        ...assessment,
        respondentCount: sessions.length,
        completedCount,
      };
    })
  );

  return enriched;
}

// Get total score from all completed assessments for a company
export async function getCompanyTotalScore(companyId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select({ total: sum(assessments.totalScore) })
    .from(assessments)
    .where(and(eq(assessments.companyId, companyId), eq(assessments.isCompleted, 1)));

  return result[0]?.total ? Number(result[0].total) : 0;
}

// Get average compliance percentage from all completed assessments for a company
export async function getCompanyAverageCompliance(companyId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const completedAssessments = await db
    .select({ compliancePercentage: assessments.compliancePercentage })
    .from(assessments)
    .where(and(eq(assessments.companyId, companyId), eq(assessments.isCompleted, 1)));

  if (completedAssessments.length === 0) return 0;

  const total = completedAssessments.reduce((sum, a) => {
    return sum + (Number(a.compliancePercentage) || 0);
  }, 0);

  return Math.round((total / completedAssessments.length) * 100) / 100;
}

// Get respondent scores from previous assessments
export async function getRespondentPreviousScores(
  companyId: number,
  currentAssessmentNumber: number
): Promise<
  Array<{
    assessmentNumber: number;
    respondentName: string | null;
    respondentEmail: string | null;
    totalScore: number;
  }>
> {
  const db = await getDb();
  if (!db) return [];

  const previousSessions = await db
    .select({
      assessmentNumber: assessments.assessmentNumber,
      respondentName: respondentSessions.respondentName,
      respondentEmail: respondentSessions.respondentEmail,
      totalScore: respondentSessions.totalScore,
    })
    .from(respondentSessions)
    .innerJoin(assessments, eq(respondentSessions.assessmentId, assessments.id))
    .where(
      and(
        eq(assessments.companyId, companyId),
        eq(assessments.isCompleted, 1),
        // Get only assessments before current one
        lt(assessments.assessmentNumber, currentAssessmentNumber)
      )
    )
    .orderBy(desc(assessments.assessmentNumber), respondentSessions.respondentName);

  return previousSessions;
}
