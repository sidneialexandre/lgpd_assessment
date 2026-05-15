import { describe, it, expect, beforeAll } from 'vitest';
import { getDb, getAssessmentById, getCompanyGroups, getAssessmentRespondentSessions } from '../db';
import { eq } from 'drizzle-orm';
import { companies, assessments, assessmentGroups } from '../../drizzle/schema';

describe('PDF Flow Debug - Complete Data Flow', () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error('Database connection failed');
    }
  });

  it('should trace complete PDF data flow for assessment 660001', async () => {
    console.log('\n========== INICIANDO TRACE DO FLUXO PDF ==========\n');

    // Step 1: Get assessment
    console.log('[TRACE] Step 1: Fetching assessment 660001');
    const assessment = await getAssessmentById(660001);
    console.log('[TRACE] Assessment:', {
      id: assessment?.id,
      companyId: assessment?.companyId,
      companyIdType: typeof assessment?.companyId,
      assessmentNumber: assessment?.assessmentNumber,
      totalScore: assessment?.totalScore,
      compliancePercentage: assessment?.compliancePercentage,
    });

    expect(assessment).toBeDefined();
    expect(assessment?.companyId).toBe(120002);

    // Step 2: Get company info
    console.log('\n[TRACE] Step 2: Fetching company 120002');
    const companyId = typeof assessment!.companyId === 'string' 
      ? parseInt(assessment!.companyId, 10) 
      : assessment!.companyId;

    const company = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    console.log('[TRACE] Company query result:', {
      found: company.length > 0,
      id: company[0]?.id,
      cnpj: company[0]?.cnpj,
      razaoSocial: company[0]?.razaoSocial,
    });

    expect(company).toHaveLength(1);
    expect(company[0].razaoSocial).toBe('Silvana e Elaine Casa Noturna Ltda');

    // Step 3: Get sessions
    console.log('\n[TRACE] Step 3: Fetching respondent sessions for assessment 660001');
    const sessions = await getAssessmentRespondentSessions(660001);
    console.log('[TRACE] Sessions:', {
      totalSessions: sessions.length,
      completedSessions: sessions.filter(s => s.isCompleted === 1).length,
      groupIds: Array.from(new Set(sessions.map(s => s.groupId))),
    });

    // Step 4: Get groups
    console.log('\n[TRACE] Step 4: Fetching groups for company 120002');
    const allGroups = await getCompanyGroups(120002);
    console.log('[TRACE] All groups:', {
      totalGroups: allGroups.length,
      groups: allGroups.map(g => ({ id: g.id, groupName: g.groupName, respondentCount: g.respondentCount })),
    });

    // Step 5: Get assessment groups data
    console.log('\n[TRACE] Step 5: Fetching assessment groups data');
    const assessmentGroupsData = await db
      .select()
      .from(assessmentGroups)
      .where(eq(assessmentGroups.assessmentId, 660001));

    console.log('[TRACE] Assessment groups:', {
      totalAssessmentGroups: assessmentGroupsData.length,
      groups: assessmentGroupsData.map(ag => ({
        groupId: ag.groupId,
        compliancePercentage: ag.compliancePercentage,
        totalScore: ag.totalScore,
      })),
    });

    // Step 6: Simulate the final companyName construction
    console.log('\n[TRACE] Step 6: Constructing final companyName');
    const companyInfo = company[0];
    const finalCompanyName = companyInfo?.razaoSocial 
      ? String(companyInfo.razaoSocial)
      : `Empresa ${assessment!.companyId}`;

    console.log('[TRACE] Final company name:', {
      value: finalCompanyName,
      type: typeof finalCompanyName,
      length: finalCompanyName.length,
      isEmpty: finalCompanyName === '',
      isUndefined: finalCompanyName === undefined,
    });

    // Step 7: Simulate report data construction
    console.log('\n[TRACE] Step 7: Constructing report data for PDF');
    const reportData = {
      companyName: finalCompanyName,
      assessmentNumber: assessment!.assessmentNumber,
      totalScore: assessment!.totalScore,
      compliancePercentage: parseFloat(assessment!.compliancePercentage),
      totalRespondents: 17,
      completedRespondents: sessions.filter(s => s.isCompleted === 1).length,
      groups: allGroups.map(group => {
        const groupSessions = sessions.filter(s => s.groupId === group.id);
        const completedCount = groupSessions.filter(s => s.isCompleted === 1).length;
        const groupData = assessmentGroupsData.find(ag => ag.groupId === group.id);
        const compliancePercentage = groupData?.compliancePercentage 
          ? (typeof groupData.compliancePercentage === 'string' 
            ? parseFloat(groupData.compliancePercentage) 
            : groupData.compliancePercentage)
          : 0;

        return {
          groupName: group.groupName,
          departmentName: group.departmentName,
          respondentCount: group.respondentCount,
          completedCount,
          totalScore: groupData?.totalScore || 0,
          compliancePercentage,
        };
      }),
      pillars: [
        { name: 'Segurança da Informação', compliancePercentage: 10 },
        { name: 'Conformidade Documental', compliancePercentage: 15 },
        { name: 'Cultura de Privacidade', compliancePercentage: 20 },
      ],
      generatedAt: new Date(),
    };

    console.log('[TRACE] Report data:', {
      companyName: reportData.companyName,
      companyNameType: typeof reportData.companyName,
      assessmentNumber: reportData.assessmentNumber,
      totalScore: reportData.totalScore,
      groupsCount: reportData.groups.length,
      pillarsCount: reportData.pillars.length,
    });

    console.log('[TRACE] Full report data:', JSON.stringify(reportData, null, 2));

    // Verify the result
    expect(reportData.companyName).toBe('Silvana e Elaine Casa Noturna Ltda');
    expect(reportData.companyName).not.toContain('Empresa 120002');
    expect(reportData.companyName).not.toContain('Empresa ');

    console.log('\n========== TRACE CONCLUÍDO COM SUCESSO ==========\n');
  });
});
