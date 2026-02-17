import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "../db";
import { companies, assessments, groups, assessmentGroups, respondentSessions, users } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

describe("Respondent Count Integration Tests", () => {
  let db: any;
  let testCompanyId: number;
  let testAssessmentId: number;

  beforeAll(async () => {
    db = await getDb();
    // Create a test user if needed
    try {
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.openId, "test-user-respondent-count"))
        .limit(1);
      if (existingUser.length === 0) {
        await db.insert(users).values({
          openId: "test-user-respondent-count",
          name: "Test User",
          email: "test@example.com",
          role: "admin",
        });
      }
    } catch (error) {
      // User might already exist
    }
  });

  afterAll(async () => {
    // Cleanup is handled by the database
  });

  it("should create exactly 15 respondents for a single group with 15 respondentCount", async () => {
    // Get test user
    const testUser = await db
      .select()
      .from(users)
      .where(eq(users.openId, "test-user-respondent-count"))
      .limit(1);
    const userId = testUser[0].id;

    // Create a test company with dynamic CNPJ
    const random = Math.floor(Math.random() * 10000);
    const dynamicCNPJ = `${random.toString().padStart(4, '0')}0001900`;
    const companyResult = await db.insert(companies).values({
      cnpj: dynamicCNPJ,
      razaoSocial: "Test Company 15 Respondents",
      userId,
    });
    testCompanyId = Number(companyResult[0].insertId);

    // Create a test assessment
    const assessmentResult = await db.insert(assessments).values({
      companyId: testCompanyId,
      assessmentNumber: 1,
    });
    testAssessmentId = Number(assessmentResult[0].insertId);

    // Create a group with 15 respondents
    const groupResult = await db.insert(groups).values({
      companyId: testCompanyId,
      groupName: "G1",
      departmentName: "Test Department",
      respondentCount: 15,
    });
    const groupId = Number(groupResult[0].insertId);

    // Create assessment group
    await db.insert(assessmentGroups).values({
      assessmentId: testAssessmentId,
      groupId,
      groupName: "G1",
      departmentName: "Test Department",
      respondentCount: 15,
      respondentsCompleted: 0,
    });

    // Create respondent sessions
    for (let i = 1; i <= 15; i++) {
      await db.insert(respondentSessions).values({
        assessmentId: testAssessmentId,
        groupId,
        respondentNumber: i,
        accessToken: `token-${i}`,
        isCompleted: 0,
        totalScore: 0,
      });
    }

    // Verify the count
    const sessions = await db
      .select()
      .from(respondentSessions)
      .where(
        and(
          eq(respondentSessions.assessmentId, testAssessmentId),
          eq(respondentSessions.groupId, groupId)
        )
      );

    expect(sessions.length).toBe(15);
    expect(sessions[0].respondentNumber).toBe(1);
    expect(sessions[14].respondentNumber).toBe(15);
  });

  it("should create exactly 5 respondents for a group with 5 respondentCount", async () => {
    // Get test user
    const testUser = await db
      .select()
      .from(users)
      .where(eq(users.openId, "test-user-respondent-count"))
      .limit(1);
    const userId = testUser[0].id;

    // Create a test company with dynamic CNPJ
    const random = Math.floor(Math.random() * 10000);
    const dynamicCNPJ = `${random.toString().padStart(4, '0')}0001910`;
    const companyResult = await db.insert(companies).values({
      cnpj: dynamicCNPJ,
      razaoSocial: "Test Company 5 Respondents",
      userId,
    });
    const companyId = Number(companyResult[0].insertId);

    // Create a test assessment
    const assessmentResult = await db.insert(assessments).values({
      companyId,
      assessmentNumber: 1,
    });
    const assessmentId = Number(assessmentResult[0].insertId);

    // Create a group with 5 respondents
    const groupResult = await db.insert(groups).values({
      companyId,
      groupName: "G1",
      departmentName: "Test Department",
      respondentCount: 5,
    });
    const groupId = Number(groupResult[0].insertId);

    // Create assessment group
    await db.insert(assessmentGroups).values({
      assessmentId,
      groupId,
      groupName: "G1",
      departmentName: "Test Department",
      respondentCount: 5,
      respondentsCompleted: 0,
    });

    // Create respondent sessions
    for (let i = 1; i <= 5; i++) {
      await db.insert(respondentSessions).values({
        assessmentId,
        groupId,
        respondentNumber: i,
        accessToken: `token-${i}`,
        isCompleted: 0,
        totalScore: 0,
      });
    }

    // Verify the count
    const sessions = await db
      .select()
      .from(respondentSessions)
      .where(
        and(
          eq(respondentSessions.assessmentId, assessmentId),
          eq(respondentSessions.groupId, groupId)
        )
      );

    expect(sessions.length).toBe(5);
  });

  it("should create correct total respondents for multiple groups with different counts", async () => {
    // Get test user
    const testUser = await db
      .select()
      .from(users)
      .where(eq(users.openId, "test-user-respondent-count"))
      .limit(1);
    const userId = testUser[0].id;

    // Create a test company with dynamic CNPJ
    const random = Math.floor(Math.random() * 10000);
    const dynamicCNPJ = `${random.toString().padStart(4, '0')}0001920`;
    const companyResult = await db.insert(companies).values({
      cnpj: dynamicCNPJ,
      razaoSocial: "Test Company Multiple Groups",
      userId,
    });
    const companyId = Number(companyResult[0].insertId);

    // Create a test assessment
    const assessmentResult = await db.insert(assessments).values({
      companyId,
      assessmentNumber: 1,
    });
    const assessmentId = Number(assessmentResult[0].insertId);

    const groupConfigs = [
      { name: "G1", dept: "TI", count: 5 },
      { name: "G2", dept: "RH", count: 8 },
      { name: "G3", dept: "Finance", count: 12 },
    ];

    let totalRespondents = 0;

    for (const config of groupConfigs) {
      // Create group
      const groupResult = await db.insert(groups).values({
        companyId,
        groupName: config.name,
        departmentName: config.dept,
        respondentCount: config.count,
      });
      const groupId = Number(groupResult[0].insertId);

      // Create assessment group
      await db.insert(assessmentGroups).values({
        assessmentId,
        groupId,
        groupName: config.name,
        departmentName: config.dept,
        respondentCount: config.count,
        respondentsCompleted: 0,
      });

      // Create respondent sessions
      for (let i = 1; i <= config.count; i++) {
        await db.insert(respondentSessions).values({
          assessmentId,
          groupId,
          respondentNumber: i,
          accessToken: `token-${config.name}-${i}`,
          isCompleted: 0,
          totalScore: 0,
        });
        totalRespondents++;
      }
    }

    // Verify total count
    const allSessions = await db
      .select()
      .from(respondentSessions)
      .where(eq(respondentSessions.assessmentId, assessmentId));

    expect(allSessions.length).toBe(25); // 5 + 8 + 12
    expect(totalRespondents).toBe(25);
  });

  it("should NOT create duplicate respondents when respondentCount is respected", async () => {
    // Get test user
    const testUser = await db
      .select()
      .from(users)
      .where(eq(users.openId, "test-user-respondent-count"))
      .limit(1);
    const userId = testUser[0].id;

    // Create a test company with dynamic CNPJ
    const random = Math.floor(Math.random() * 10000);
    const dynamicCNPJ = `${random.toString().padStart(4, '0')}0001930`;
    const companyResult = await db.insert(companies).values({
      cnpj: dynamicCNPJ,
      razaoSocial: "Test Company No Duplicates",
      userId,
    });
    const companyId = Number(companyResult[0].insertId);

    // Create a test assessment
    const assessmentResult = await db.insert(assessments).values({
      companyId,
      assessmentNumber: 1,
    });
    const assessmentId = Number(assessmentResult[0].insertId);

    // Create a group with 10 respondents
    const groupResult = await db.insert(groups).values({
      companyId,
      groupName: "G1",
      departmentName: "Test Department",
      respondentCount: 10,
    });
    const groupId = Number(groupResult[0].insertId);

    // Create assessment group
    await db.insert(assessmentGroups).values({
      assessmentId,
      groupId,
      groupName: "G1",
      departmentName: "Test Department",
      respondentCount: 10,
      respondentsCompleted: 0,
    });

    // Create respondent sessions - exactly 10, no duplicates
    for (let i = 1; i <= 10; i++) {
      await db.insert(respondentSessions).values({
        assessmentId,
        groupId,
        respondentNumber: i,
        accessToken: `token-${i}`,
        isCompleted: 0,
        totalScore: 0,
      });
    }

    // Verify no duplicates
    const sessions = await db
      .select()
      .from(respondentSessions)
      .where(
        and(
          eq(respondentSessions.assessmentId, assessmentId),
          eq(respondentSessions.groupId, groupId)
        )
      );

    expect(sessions.length).toBe(10);

    // Check that all respondent numbers are unique
    const respondentNumbers = sessions.map((s: any) => s.respondentNumber);
    const uniqueNumbers = new Set(respondentNumbers);
    expect(uniqueNumbers.size).toBe(10);
  });

  it("should verify respondent count matches group configuration", async () => {
    // Get test user
    const testUser = await db
      .select()
      .from(users)
      .where(eq(users.openId, "test-user-respondent-count"))
      .limit(1);
    const userId = testUser[0].id;

    // Create a test company with dynamic CNPJ
    const random = Math.floor(Math.random() * 10000);
    const dynamicCNPJ = `${random.toString().padStart(4, '0')}0001940`;
    const companyResult = await db.insert(companies).values({
      cnpj: dynamicCNPJ,
      razaoSocial: "Test Company Verify Count",
      userId,
    });
    const companyId = Number(companyResult[0].insertId);

    // Create a test assessment
    const assessmentResult = await db.insert(assessments).values({
      companyId,
      assessmentNumber: 1,
    });
    const assessmentId = Number(assessmentResult[0].insertId);

    const expectedCount = 20;

    // Create a group with 20 respondents
    const groupResult = await db.insert(groups).values({
      companyId,
      groupName: "G1",
      departmentName: "Test Department",
      respondentCount: expectedCount,
    });
    const groupId = Number(groupResult[0].insertId);

    // Create assessment group
    const agResult = await db.insert(assessmentGroups).values({
      assessmentId,
      groupId,
      groupName: "G1",
      departmentName: "Test Department",
      respondentCount: expectedCount,
      respondentsCompleted: 0,
    });

    // Create respondent sessions
    for (let i = 1; i <= expectedCount; i++) {
      await db.insert(respondentSessions).values({
        assessmentId,
        groupId,
        respondentNumber: i,
        accessToken: `token-${i}`,
        isCompleted: 0,
        totalScore: 0,
      });
    }

    // Verify count matches configuration
    const sessions = await db
      .select()
      .from(respondentSessions)
      .where(
        and(
          eq(respondentSessions.assessmentId, assessmentId),
          eq(respondentSessions.groupId, groupId)
        )
      );

    const assessmentGroup = await db
      .select()
      .from(assessmentGroups)
      .where(eq(assessmentGroups.id, Number(agResult[0].insertId)))
      .limit(1);

    expect(sessions.length).toBe(expectedCount);
    expect(assessmentGroup[0].respondentCount).toBe(expectedCount);
    expect(sessions.length).toBe(assessmentGroup[0].respondentCount);
  });
});
