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
    
    // Create a completely isolated container with NO Tailwind classes
    const container = document.createElement("div");
    container.id = "pdf-report-container-" + Date.now();
    
    // Set inline styles ONLY - no classes
    container.style.cssText = `
      position: absolute;
      left: -9999px;
      width: 210mm;
      padding: 20px;
      background-color: #ffffff;
      font-family: Arial, sans-serif;
      color: #333333;
      line-height: 1.6;
      font-size: 12px;
    `;
    
    // Generate HTML with ONLY inline styles
    container.innerHTML = generateHTMLContent(data);
    document.body.appendChild(container);

    console.log('[PDF] Convertendo HTML para canvas...');
    
    // Convert HTML to canvas with strict options
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowHeight: container.scrollHeight,
      windowWidth: 800,
      // Disable CSS parsing that might cause oklch errors
      removeContainer: false,
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
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
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
    <div style="margin-bottom: 20px; page-break-inside: avoid; border: 1px solid #ddd; padding: 15px; border-radius: 4px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <div>
          <h4 style="margin: 0 0 5px 0; font-size: 14px; font-weight: bold; color: #1e40af;">
            ${group.groupName} - ${group.departmentName}
          </h4>
          <p style="margin: 0; font-size: 11px; color: #666666;">
            Respondentes: ${group.completedCount}/${group.respondentCount}
          </p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-size: 20px; font-weight: bold; color: #1e40af;">
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
    <div style="font-family: Arial, sans-serif; color: #333333; line-height: 1.6; font-size: 12px;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #1e40af;">
        <h1 style="margin: 0 0 10px 0; font-size: 28px; color: #1e40af;">
          Avaliação de Conformidade LGPD
        </h1>
        <p style="margin: 0; font-size: 12px; color: #666666;">
          Lei Geral de Proteção de Dados - Lei nº 13.709/2018
        </p>
      </div>

      <!-- Company Info -->
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="margin: 0 0 12px 0; font-size: 16px; color: #1f2937;">Informações da Empresa</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <tr>
            <td style="padding: 6px; font-weight: bold; width: 30%; color: #374151;">Empresa:</td>
            <td style="padding: 6px; color: #666666;">${data.companyName}</td>
          </tr>
          <tr style="background-color: #ffffff;">
            <td style="padding: 6px; font-weight: bold; color: #374151;">Avaliação:</td>
            <td style="padding: 6px; color: #666666;">Avaliação ${data.assessmentNumber}</td>
          </tr>
          <tr>
            <td style="padding: 6px; font-weight: bold; color: #374151;">Data do Relatório:</td>
            <td style="padding: 6px; color: #666666;">${formattedDate}</td>
          </tr>
          <tr style="background-color: #ffffff;">
            <td style="padding: 6px; font-weight: bold; color: #374151;">Total de Respondentes:</td>
            <td style="padding: 6px; color: #666666;">${data.completedRespondents} de ${data.totalRespondents}</td>
          </tr>
        </table>
      </div>

      <!-- Overall Compliance -->
      <div style="background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); color: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
        <p style="margin: 0 0 8px 0; font-size: 12px; opacity: 0.9;">Conformidade Total</p>
        <p style="margin: 0; font-size: 40px; font-weight: bold;">${data.compliancePercentage}%</p>
        <p style="margin: 8px 0 0 0; font-size: 11px; opacity: 0.9;">Pontuação Total: ${data.totalScore.toLocaleString()} / 10.000 pontos</p>
      </div>

      <!-- Group Results -->
      <div style="margin-bottom: 20px;">
        <h2 style="margin: 0 0 15px 0; font-size: 16px; color: #1f2937;">Conformidade por Grupo</h2>
        ${groupsHTML}
      </div>

      <!-- Pillar Information -->
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 11px;">
        <h2 style="margin: 0 0 10px 0; font-size: 14px; color: #1f2937;">Sobre a Avaliação</h2>
        <p style="margin: 0 0 8px 0; color: #666666;">
          Esta avaliação é composta por 50 questões divididas em 3 pilares estratégicos:
        </p>
        <ul style="margin: 8px 0; padding-left: 20px; color: #666666;">
          <li><strong style="color: #1e40af;">Segurança da Informação:</strong> 15 questões sobre proteção de dados</li>
          <li><strong style="color: #16a34a;">Conformidade Documental:</strong> 15 questões sobre documentação</li>
          <li><strong style="color: #7c3aed;">Cultura de Privacidade:</strong> 20 questões sobre conscientização</li>
        </ul>
      </div>

      <!-- Footer -->
      <div style="border-top: 1px solid #e5e7eb; padding-top: 12px; text-align: center; font-size: 10px; color: #999999;">
        <p style="margin: 0;">Relatório gerado automaticamente pelo sistema de Avaliação de Conformidade LGPD</p>
        <p style="margin: 4px 0 0 0;">© 2026 - Todos os direitos reservados</p>
      </div>
    </div>
  `;
}
