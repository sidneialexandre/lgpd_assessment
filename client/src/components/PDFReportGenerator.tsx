import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
}

export async function generatePDFReport(data: ReportData) {
  try {
    console.log('[PDF] Iniciando geracao de PDF', { companyName: data.companyName, assessmentNumber: data.assessmentNumber });
    
    // Create container element
    const container = document.createElement("div");
    container.innerHTML = generateHTMLContent(data);
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '210mm';
    container.style.padding = '20px';
    container.style.backgroundColor = 'white';
    document.body.appendChild(container);

    console.log('[PDF] Convertendo HTML para canvas...');
    
    // Convert HTML to canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    console.log('[PDF] Canvas criado com sucesso');

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;

    // Add image to PDF (handling multiple pages if needed)
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= 297; // A4 height in mm

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297;
    }

    // Save PDF
    const filename = `LGPD_Relatorio_${data.companyName.replace(/\s+/g, "_")}_${data.assessmentNumber}.pdf`;
    pdf.save(filename);

    console.log('[PDF] PDF gerado e salvo com sucesso:', filename);

    // Clean up
    document.body.removeChild(container);
  } catch (error) {
    console.error('[PDF] Erro ao gerar PDF:', error);
    alert(`Erro ao gerar PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function generateHTMLContent(data: ReportData): string {
  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(data.generatedAt);

  const groupsHTML = data.groups
    .map(
      (group) => `
    <div style="margin-bottom: 20px; page-break-inside: avoid;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <div>
          <h4 style="margin: 0 0 5px 0; font-size: 14px; font-weight: bold; color: #1e3a8a;">
            ${group.groupName} - ${group.departmentName}
          </h4>
          <p style="margin: 0; font-size: 12px; color: #666;">
            Respondentes: ${group.completedCount}/${group.respondentCount}
          </p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-size: 24px; font-weight: bold; color: #1e40af;">
            ${group.compliancePercentage || 0}%
          </p>
        </div>
      </div>
      <div style="width: 100%; height: 8px; background-color: #e5e7eb; border-radius: 4px; overflow: hidden;">
        <div style="height: 100%; background-color: #3b82f6; width: ${group.compliancePercentage || 0}%; border-radius: 4px;"></div>
      </div>
    </div>
  `
    )
    .join("");

  return `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #1e40af;">
        <h1 style="margin: 0 0 10px 0; font-size: 32px; color: #1e40af;">
          Avaliação de Conformidade LGPD
        </h1>
        <p style="margin: 0; font-size: 14px; color: #666;">
          Lei Geral de Proteção de Dados - Lei nº 13.709/2018
        </p>
      </div>

      <!-- Company Info -->
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 30px;">
        <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #1f2937;">Informações da Empresa</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; font-weight: bold; width: 30%; color: #374151;">Empresa:</td>
            <td style="padding: 8px; color: #666;">${data.companyName}</td>
          </tr>
          <tr style="background-color: #fff;">
            <td style="padding: 8px; font-weight: bold; color: #374151;">Avaliação:</td>
            <td style="padding: 8px; color: #666;">Avaliação ${data.assessmentNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; color: #374151;">Data do Relatório:</td>
            <td style="padding: 8px; color: #666;">${formattedDate}</td>
          </tr>
          <tr style="background-color: #fff;">
            <td style="padding: 8px; font-weight: bold; color: #374151;">Total de Respondentes:</td>
            <td style="padding: 8px; color: #666;">${data.completedRespondents} de ${data.totalRespondents}</td>
          </tr>
        </table>
      </div>

      <!-- Overall Compliance -->
      <div style="background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); color: white; padding: 30px; border-radius: 8px; margin-bottom: 30px; text-align: center;">
        <p style="margin: 0 0 10px 0; font-size: 14px; opacity: 0.9;">Conformidade Total</p>
        <p style="margin: 0; font-size: 48px; font-weight: bold;">${data.compliancePercentage}%</p>
        <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.9;">Pontuação Total: ${data.totalScore.toLocaleString()} / 10.000 pontos</p>
      </div>

      <!-- Group Results -->
      <div style="margin-bottom: 30px;">
        <h2 style="margin: 0 0 20px 0; font-size: 18px; color: #1f2937;">Conformidade por Grupo</h2>
        ${groupsHTML}
      </div>

      <!-- Pillar Information -->
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #1f2937;">Sobre a Avaliação</h2>
        <p style="margin: 0 0 10px 0; font-size: 12px; color: #666;">
          Esta avaliação é composta por 50 questões divididas em 3 pilares estratégicos:
        </p>
        <ul style="margin: 10px 0; padding-left: 20px; font-size: 12px; color: #666;">
          <li><strong style="color: #1e40af;">Segurança da Informação:</strong> 15 questões sobre proteção de dados e segurança</li>
          <li><strong style="color: #16a34a;">Conformidade Documental:</strong> 15 questões sobre documentação e políticas</li>
          <li><strong style="color: #7c3aed;">Cultura de Privacidade:</strong> 20 questões sobre conscientização e cultura organizacional</li>
        </ul>
        <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">
          Cada resposta é pontuada de 0 a 100 pontos, totalizando um máximo de 10.000 pontos.
        </p>
      </div>

      <!-- Footer -->
      <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; text-align: center; font-size: 11px; color: #999;">
        <p style="margin: 0;">Relatório gerado automaticamente pelo sistema de Avaliação de Conformidade LGPD</p>
        <p style="margin: 5px 0 0 0;">© 2026 - Todos os direitos reservados</p>
      </div>
    </div>
  `;
}
