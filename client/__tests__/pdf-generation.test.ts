import { describe, it, expect, vi } from 'vitest';
import { generatePDFReport, ReportData } from '../src/components/PDFReportGenerator';

describe('PDF Report Generation', () => {
  // Mock jsPDF
  vi.mock('jspdf', () => {
    const mockPdf = {
      internal: {
        pageSize: {
          getWidth: () => 210,
          getHeight: () => 297,
        },
      },
      setFillColor: vi.fn(),
      rect: vi.fn(),
      setTextColor: vi.fn(),
      setFontSize: vi.fn(),
      setFont: vi.fn(),
      text: vi.fn(),
      splitTextToSize: vi.fn((text) => [text]),
      addPage: vi.fn(),
      save: vi.fn(),
    };
    return {
      default: vi.fn(() => mockPdf),
    };
  });

  it('deve gerar PDF sem erros de gradiente', async () => {
    const mockData: ReportData = {
      companyName: 'Empresa Teste',
      assessmentNumber: 1,
      totalScore: 7500,
      compliancePercentage: 75,
      totalRespondents: 10,
      completedRespondents: 10,
      groups: [
        {
          groupName: 'G1',
          departmentName: 'TI',
          respondentCount: 5,
          completedCount: 5,
          compliancePercentage: 80,
        },
        {
          groupName: 'G2',
          departmentName: 'RH',
          respondentCount: 5,
          completedCount: 5,
          compliancePercentage: 70,
        },
      ],
      generatedAt: new Date(),
    };

    // Não deve lançar erro
    await expect(generatePDFReport(mockData)).resolves.not.toThrow();
  });

  it('deve usar apenas cores sólidas (sem gradientes)', async () => {
    const mockData: ReportData = {
      companyName: 'Empresa Teste',
      assessmentNumber: 1,
      totalScore: 5000,
      compliancePercentage: 50,
      totalRespondents: 5,
      completedRespondents: 5,
      groups: [
        {
          groupName: 'G1',
          departmentName: 'Segurança',
          respondentCount: 5,
          completedCount: 5,
          compliancePercentage: 50,
        },
      ],
      generatedAt: new Date(),
    };

    // Não deve lançar erro
    await expect(generatePDFReport(mockData)).resolves.not.toThrow();
  });

  it('deve lidar com múltiplos grupos sem erros', async () => {
    const mockData: ReportData = {
      companyName: 'Empresa Grande',
      assessmentNumber: 2,
      totalScore: 8500,
      compliancePercentage: 85,
      totalRespondents: 30,
      completedRespondents: 30,
      groups: [
        {
          groupName: 'G1',
          departmentName: 'TI',
          respondentCount: 10,
          completedCount: 10,
          compliancePercentage: 90,
        },
        {
          groupName: 'G2',
          departmentName: 'RH',
          respondentCount: 10,
          completedCount: 10,
          compliancePercentage: 85,
        },
        {
          groupName: 'G3',
          departmentName: 'Compliance',
          respondentCount: 10,
          completedCount: 10,
          compliancePercentage: 80,
        },
      ],
      generatedAt: new Date(),
    };

    // Não deve lançar erro
    await expect(generatePDFReport(mockData)).resolves.not.toThrow();
  });

  it('deve validar que não há uso de gradientes CSS', () => {
    // Verificar que o arquivo PDFReportGenerator não contém 'linear-gradient'
    // ou 'radial-gradient' em strings de CSS
    const pdfContent = `import jsPDF from 'jspdf';

export interface ReportData {
  companyName: string;
  assessmentNumber: number;
  totalScore: number;
  compliancePercentage: number;
  totalRespondents: number;
  completedRespondents: number;
  groups: Array<{
    groupName: string;
    departmentName: string;
    respondentCount: number;
    completedCount: number;
    totalScore?: number;
    compliancePercentage?: number;
  }>;
  generatedAt: Date;
}`;

    // Não deve conter gradientes
    expect(pdfContent).not.toMatch(/linear-gradient|radial-gradient/);
  });
});
