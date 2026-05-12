import { describe, it, expect, beforeAll } from 'vitest';
import { getDb, createCompany, createAssessment, createGroupForAssessment, getAssessmentById } from '../db';
import { eq } from 'drizzle-orm';
import { companies, assessments } from '../../drizzle/schema';

describe('Company Name in PDF Generation', () => {
  let db: any;
  let testUserId = 1;
  let testCompanyId: number;
  let testAssessmentId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error('Database connection failed');
    }
  });

  it('should return correct company name from database', async () => {
    // Get the test company (ID 120002)
    const company = await db
      .select()
      .from(companies)
      .where(eq(companies.id, 120002))
      .limit(1);

    expect(company).toHaveLength(1);
    expect(company[0].razaoSocial).toBe('Silvana e Elaine Casa Noturna Ltda');
    console.log('[TEST] Company found:', company[0]);
  });

  it('should return correct company name in assessment', async () => {
    // Get the test assessment (ID 660001)
    const assessment = await getAssessmentById(660001);
    
    expect(assessment).toBeDefined();
    expect(assessment?.companyId).toBe(120002);
    console.log('[TEST] Assessment found:', assessment);
  });

  it('should verify company name is not null or empty', async () => {
    const company = await db
      .select()
      .from(companies)
      .where(eq(companies.id, 120002))
      .limit(1);

    expect(company[0].razaoSocial).toBeTruthy();
    expect(company[0].razaoSocial).not.toBe('');
    expect(company[0].razaoSocial).not.toBeNull();
    expect(company[0].razaoSocial).toContain('Silvana');
  });

  it('should verify assessment has correct companyId type', async () => {
    const assessment = await getAssessmentById(660001);
    
    expect(assessment).toBeDefined();
    // companyId should be convertible to number
    const companyId = typeof assessment?.companyId === 'string' 
      ? parseInt(assessment.companyId, 10) 
      : assessment?.companyId;
    
    expect(companyId).toBe(120002);
    console.log('[TEST] Assessment companyId:', { original: assessment?.companyId, converted: companyId });
  });
});
