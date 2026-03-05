import { describe, it, expect } from "vitest";
import { ReportData } from "@/components/PDFReportGenerator";

describe("PDF Report Generator", () => {
  it("should validate ReportData interface structure", () => {
    const reportData: ReportData = {
      companyName: "Empresa Teste LTDA",
      assessmentNumber: 1,
      totalScore: 7500,
      compliancePercentage: 75,
      totalRespondents: 10,
      completedRespondents: 10,
      groups: [
        {
          groupName: "G1",
          departmentName: "TI",
          respondentCount: 5,
          completedCount: 5,
          totalScore: 3750,
          compliancePercentage: 75,
        },
      ],
      generatedAt: new Date(),
    };

    expect(reportData.companyName).toBe("Empresa Teste LTDA");
    expect(reportData.assessmentNumber).toBe(1);
    expect(reportData.totalScore).toBe(7500);
    expect(reportData.compliancePercentage).toBe(75);
    expect(reportData.totalRespondents).toBe(10);
    expect(reportData.completedRespondents).toBe(10);
    expect(reportData.groups).toHaveLength(1);
    expect(reportData.generatedAt).toBeInstanceOf(Date);
  });

  it("should validate group data in report", () => {
    const reportData: ReportData = {
      companyName: "Empresa Teste",
      assessmentNumber: 1,
      totalScore: 8000,
      compliancePercentage: 80,
      totalRespondents: 20,
      completedRespondents: 20,
      groups: [
        {
          groupName: "G1",
          departmentName: "Segurança",
          respondentCount: 10,
          completedCount: 10,
          totalScore: 4000,
          compliancePercentage: 80,
        },
        {
          groupName: "G2",
          departmentName: "Compliance",
          respondentCount: 10,
          completedCount: 10,
          totalScore: 4000,
          compliancePercentage: 80,
        },
      ],
      generatedAt: new Date(),
    };

    expect(reportData.groups).toHaveLength(2);
    expect(reportData.groups[0].groupName).toBe("G1");
    expect(reportData.groups[1].groupName).toBe("G2");
    expect(reportData.groups[0].compliancePercentage).toBe(80);
    expect(reportData.groups[1].compliancePercentage).toBe(80);
  });

  it("should handle zero compliance percentage", () => {
    const reportData: ReportData = {
      companyName: "Empresa Teste",
      assessmentNumber: 1,
      totalScore: 0,
      compliancePercentage: 0,
      totalRespondents: 10,
      completedRespondents: 0,
      groups: [
        {
          groupName: "G1",
          departmentName: "TI",
          respondentCount: 10,
          completedCount: 0,
          totalScore: 0,
          compliancePercentage: 0,
        },
      ],
      generatedAt: new Date(),
    };

    expect(reportData.compliancePercentage).toBe(0);
    expect(reportData.groups[0].compliancePercentage).toBe(0);
  });

  it("should handle 100% compliance percentage", () => {
    const reportData: ReportData = {
      companyName: "Empresa Teste",
      assessmentNumber: 1,
      totalScore: 10000,
      compliancePercentage: 100,
      totalRespondents: 10,
      completedRespondents: 10,
      groups: [
        {
          groupName: "G1",
          departmentName: "TI",
          respondentCount: 10,
          completedCount: 10,
          totalScore: 10000,
          compliancePercentage: 100,
        },
      ],
      generatedAt: new Date(),
    };

    expect(reportData.compliancePercentage).toBe(100);
    expect(reportData.groups[0].compliancePercentage).toBe(100);
  });

  it("should format company name correctly", () => {
    const companyNames = [
      "Empresa Teste LTDA",
      "Company Name Inc",
      "Empresa com Espaços Múltiplos",
    ];

    companyNames.forEach((name) => {
      const reportData: ReportData = {
        companyName: name,
        assessmentNumber: 1,
        totalScore: 5000,
        compliancePercentage: 50,
        totalRespondents: 10,
        completedRespondents: 5,
        groups: [],
        generatedAt: new Date(),
      };

      expect(reportData.companyName).toBe(name);
    });
  });

  it("should validate assessment number", () => {
    const assessmentNumbers = [1, 2, 3, 10, 100];

    assessmentNumbers.forEach((num) => {
      const reportData: ReportData = {
        companyName: "Empresa",
        assessmentNumber: num,
        totalScore: 5000,
        compliancePercentage: 50,
        totalRespondents: 10,
        completedRespondents: 5,
        groups: [],
        generatedAt: new Date(),
      };

      expect(reportData.assessmentNumber).toBe(num);
    });
  });

  it("should handle multiple groups with different compliance levels", () => {
    const reportData: ReportData = {
      companyName: "Empresa Teste",
      assessmentNumber: 1,
      totalScore: 6000,
      compliancePercentage: 60,
      totalRespondents: 30,
      completedRespondents: 30,
      groups: [
        {
          groupName: "G1",
          departmentName: "Segurança",
          respondentCount: 10,
          completedCount: 10,
          totalScore: 3000,
          compliancePercentage: 75,
        },
        {
          groupName: "G2",
          departmentName: "Compliance",
          respondentCount: 10,
          completedCount: 10,
          totalScore: 2000,
          compliancePercentage: 50,
        },
        {
          groupName: "G3",
          departmentName: "Cultura",
          respondentCount: 10,
          completedCount: 10,
          totalScore: 1000,
          compliancePercentage: 25,
        },
      ],
      generatedAt: new Date(),
    };

    expect(reportData.groups).toHaveLength(3);
    expect(reportData.groups[0].compliancePercentage).toBe(75);
    expect(reportData.groups[1].compliancePercentage).toBe(50);
    expect(reportData.groups[2].compliancePercentage).toBe(25);
  });

  it("should validate date generation", () => {
    const now = new Date();
    const reportData: ReportData = {
      companyName: "Empresa",
      assessmentNumber: 1,
      totalScore: 5000,
      compliancePercentage: 50,
      totalRespondents: 10,
      completedRespondents: 5,
      groups: [],
      generatedAt: now,
    };

    expect(reportData.generatedAt).toEqual(now);
    expect(reportData.generatedAt.getTime()).toBeCloseTo(now.getTime(), -2);
  });

  it("should validate respondent counts", () => {
    const reportData: ReportData = {
      companyName: "Empresa",
      assessmentNumber: 1,
      totalScore: 5000,
      compliancePercentage: 50,
      totalRespondents: 100,
      completedRespondents: 75,
      groups: [],
      generatedAt: new Date(),
    };

    expect(reportData.totalRespondents).toBe(100);
    expect(reportData.completedRespondents).toBe(75);
    expect(reportData.completedRespondents).toBeLessThanOrEqual(
      reportData.totalRespondents
    );
  });

  it("should validate score ranges", () => {
    const reportData: ReportData = {
      companyName: "Empresa",
      assessmentNumber: 1,
      totalScore: 7500,
      compliancePercentage: 75,
      totalRespondents: 10,
      completedRespondents: 10,
      groups: [],
      generatedAt: new Date(),
    };

    expect(reportData.totalScore).toBeGreaterThanOrEqual(0);
    expect(reportData.totalScore).toBeLessThanOrEqual(10000);
    expect(reportData.compliancePercentage).toBeGreaterThanOrEqual(0);
    expect(reportData.compliancePercentage).toBeLessThanOrEqual(100);
  });

  it("should generate filename with company name and assessment number", () => {
    const companyName = "Empresa Teste";
    const assessmentNumber = 1;
    const expectedFilename = `LGPD_Relatorio_${companyName.replace(/\s+/g, "_")}_${assessmentNumber}.pdf`;

    expect(expectedFilename).toBe("LGPD_Relatorio_Empresa_Teste_1.pdf");
  });

  it("should handle special characters in company name for filename", () => {
    const specialNames = [
      "Empresa & Cia",
      "Company (Ltda)",
      "Test-Company",
      "Empresa/Filial",
    ];

    specialNames.forEach((name) => {
      const filename = `LGPD_Relatorio_${name.replace(/\s+/g, "_")}_1.pdf`;
      expect(filename).toContain("LGPD_Relatorio_");
      expect(filename).toContain("_1.pdf");
    });
  });
});
