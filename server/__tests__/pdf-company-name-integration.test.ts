import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from '../db';
import { eq } from 'drizzle-orm';
import { companies, assessments, respondentSessions } from '../../drizzle/schema';

describe('PDF Company Name Integration Test', () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error('Database connection failed');
    }
  });

  it('should simulate the complete PDF generation flow', async () => {
    // Step 1: Get the assessment
    const assessmentResult = await db
      .select()
      .from(assessments)
      .where(eq(assessments.id, 660001))
      .limit(1);

    expect(assessmentResult).toHaveLength(1);
    const assessment = assessmentResult[0];
    console.log('[TEST] Assessment:', { id: assessment.id, companyId: assessment.companyId });

    // Step 2: Get the company information
    const companyId = typeof assessment.companyId === 'string' 
      ? parseInt(assessment.companyId, 10) 
      : assessment.companyId;

    const companyResult = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    expect(companyResult).toHaveLength(1);
    const company = companyResult[0];
    console.log('[TEST] Company:', { id: company.id, razaoSocial: company.razaoSocial });

    // Step 3: Simulate the PDF data construction
    const finalCompanyName = company?.razaoSocial 
      ? String(company.razaoSocial)
      : `Empresa ${assessment.companyId}`;

    console.log('[TEST] Final company name for PDF:', finalCompanyName);

    // Verify the result
    expect(finalCompanyName).toBe('Silvana e Elaine Casa Noturna Ltda');
    expect(finalCompanyName).not.toContain('Empresa 120002');
    expect(finalCompanyName).not.toContain('Empresa ');
  });

  it('should verify respondent sessions are associated with correct assessment', async () => {
    // Get all respondent sessions for the assessment
    const sessions = await db
      .select()
      .from(respondentSessions)
      .where(eq(respondentSessions.assessmentId, 660001));

    console.log('[TEST] Respondent sessions count:', sessions.length);
    expect(sessions.length).toBeGreaterThan(0);

    // Verify each session has correct assessment ID
    sessions.forEach(session => {
      expect(session.assessmentId).toBe(660001);
    });
  });

  it('should verify the complete data flow from assessment to company name', async () => {
    // This simulates exactly what the backend procedure does
    const assessment = await db
      .select()
      .from(assessments)
      .where(eq(assessments.id, 660001))
      .limit(1)
      .then(result => result[0]);

    const companyId = typeof assessment.companyId === 'string' 
      ? parseInt(assessment.companyId, 10) 
      : assessment.companyId;

    const company = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1)
      .then(result => result.length > 0 ? result[0] : null);

    const finalCompanyName = company?.razaoSocial 
      ? String(company.razaoSocial)
      : `Empresa ${assessment.companyId}`;

    // This is what should be in the PDF
    const reportData = {
      companyName: finalCompanyName,
      assessmentNumber: assessment.assessmentNumber,
      totalScore: assessment.totalScore,
      compliancePercentage: parseFloat(assessment.compliancePercentage),
    };

    console.log('[TEST] Report data for PDF:', reportData);

    expect(reportData.companyName).toBe('Silvana e Elaine Casa Noturna Ltda');
    expect(reportData.assessmentNumber).toBe(1);
    expect(reportData.totalScore).toBe(27490);
    expect(reportData.compliancePercentage).toBe(16.17);
  });
});
