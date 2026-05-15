import { describe, it, expect, beforeAll } from 'vitest';
import { getDb, getAssessmentById, getCompanyGroups, getAssessmentRespondentSessions } from '../db';
import { eq } from 'drizzle-orm';
import { companies, assessments, assessmentGroups } from '../../drizzle/schema';

describe('PDF Generation Simulation - Verify Company Name Flow', () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error('Database connection failed');
    }
  });

  it('should verify company name is not lost in the data flow', async () => {
    console.log('\n========== SIMULANDO GERAÇÃO DE PDF ==========\n');

    // Simulate the exact flow that happens in the backend procedure
    const assessment = await getAssessmentById(660001);
    expect(assessment).toBeDefined();

    const companyId = typeof assessment!.companyId === 'string' 
      ? parseInt(assessment!.companyId, 10) 
      : assessment!.companyId;

    const company = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    expect(company).toHaveLength(1);

    const companyInfo = company[0];
    const finalCompanyName = companyInfo?.razaoSocial 
      ? String(companyInfo.razaoSocial)
      : `Empresa ${assessment!.companyId}`;

    console.log('[SIMULATION] finalCompanyName:', finalCompanyName);
    expect(finalCompanyName).toBe('Silvana e Elaine Casa Noturna Ltda');

    // Simulate the reportData construction
    const sessions = await getAssessmentRespondentSessions(660001);
    const completedSessions = sessions.filter(s => s.isCompleted === 1);
    const allGroups = await getCompanyGroups(assessment!.companyId);
    const assessmentGroupsData = await db
      .select()
      .from(assessmentGroups)
      .where(eq(assessmentGroups.assessmentId, 660001));

    const reportData = {
      companyName: finalCompanyName,
      assessmentNumber: assessment!.assessmentNumber,
      totalScore: assessment!.totalScore,
      compliancePercentage: parseFloat(assessment!.compliancePercentage),
      totalRespondents: 17,
      completedRespondents: completedSessions.length,
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

    console.log('[SIMULATION] reportData.companyName:', reportData.companyName);
    console.log('[SIMULATION] reportData.companyName type:', typeof reportData.companyName);
    console.log('[SIMULATION] reportData.companyName length:', reportData.companyName.length);
    console.log('[SIMULATION] reportData.companyName trim():', reportData.companyName.trim());
    console.log('[SIMULATION] reportData.companyName isEmpty:', reportData.companyName === '');
    console.log('[SIMULATION] reportData.companyName isUndefined:', reportData.companyName === undefined);

    // Simulate the PDF generation
    const displayCompanyName = reportData.companyName && reportData.companyName.trim() 
      ? reportData.companyName 
      : 'Empresa desconhecida';
    
    console.log('[SIMULATION] displayCompanyName:', displayCompanyName);
    expect(displayCompanyName).toBe('Silvana e Elaine Casa Noturna Ltda');

    // Simulate the filename generation
    const safeCompanyName = (reportData.companyName && reportData.companyName.trim()) 
      ? reportData.companyName.replace(/\s+/g, "_") 
      : "Empresa_Desconhecida";
    
    const filename = `LGPD_Relatorio_${safeCompanyName}_${reportData.assessmentNumber}.pdf`;
    
    console.log('[SIMULATION] safeCompanyName:', safeCompanyName);
    console.log('[SIMULATION] filename:', filename);
    
    expect(filename).toContain('Silvana_e_Elaine_Casa_Noturna_Ltda');
    expect(filename).not.toContain('Empresa_120002');
    expect(filename).not.toContain('Empresa_Desconhecida');

    console.log('\n========== SIMULAÇÃO CONCLUÍDA COM SUCESSO ==========\n');
  });

  it('should verify that company name is preserved through JSON serialization', async () => {
    console.log('\n========== TESTANDO SERIALIZAÇÃO JSON ==========\n');

    const assessment = await getAssessmentById(660001);
    const companyId = typeof assessment!.companyId === 'string' 
      ? parseInt(assessment!.companyId, 10) 
      : assessment!.companyId;

    const company = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    const companyInfo = company[0];
    const finalCompanyName = companyInfo?.razaoSocial 
      ? String(companyInfo.razaoSocial)
      : `Empresa ${assessment!.companyId}`;

    // Simulate JSON serialization and deserialization
    const reportData = {
      companyName: finalCompanyName,
      assessmentNumber: assessment!.assessmentNumber,
    };

    const jsonString = JSON.stringify(reportData);
    console.log('[SERIALIZATION] JSON string:', jsonString);

    const deserialized = JSON.parse(jsonString);
    console.log('[SERIALIZATION] Deserialized companyName:', deserialized.companyName);

    expect(deserialized.companyName).toBe('Silvana e Elaine Casa Noturna Ltda');
    expect(deserialized.companyName).not.toBe('Empresa 120002');

    console.log('\n========== TESTE DE SERIALIZAÇÃO CONCLUÍDO ==========\n');
  });

  it('should verify that company name is not affected by special characters', async () => {
    console.log('\n========== TESTANDO CARACTERES ESPECIAIS ==========\n');

    const assessment = await getAssessmentById(660001);
    const companyId = typeof assessment!.companyId === 'string' 
      ? parseInt(assessment!.companyId, 10) 
      : assessment!.companyId;

    const company = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    const razaoSocial = company[0].razaoSocial;
    console.log('[SPECIAL_CHARS] razaoSocial:', razaoSocial);
    console.log('[SPECIAL_CHARS] razaoSocial charCodes:', Array.from(razaoSocial).map(c => c.charCodeAt(0)));

    // Check for special characters
    const hasSpecialChars = /[àáâãäåèéêëìíîïòóôõöùúûüçñ]/i.test(razaoSocial);
    console.log('[SPECIAL_CHARS] hasSpecialChars:', hasSpecialChars);

    // Test replace operation
    const safeCompanyName = razaoSocial.replace(/\s+/g, "_");
    console.log('[SPECIAL_CHARS] safeCompanyName:', safeCompanyName);

    expect(safeCompanyName).toBe('Silvana_e_Elaine_Casa_Noturna_Ltda');

    console.log('\n========== TESTE DE CARACTERES ESPECIAIS CONCLUÍDO ==========\n');
  });
});
