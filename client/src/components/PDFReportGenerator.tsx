import jsPDF from 'jspdf';

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
    
    // Create PDF directly without html2canvas to avoid gradient issues
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;
    
    // Helper function to add text with word wrapping
    const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number, isBold: boolean = false): number => {
      pdf.setFontSize(fontSize);
      if (isBold) {
        (pdf as any).setFont(undefined, 'bold');
      } else {
        (pdf as any).setFont(undefined, 'normal');
      }
      const lines = pdf.splitTextToSize(text, maxWidth);
      pdf.text(lines, x, y);
      return y + (lines.length * fontSize * 0.35);
    };
    
    // Header
    pdf.setFillColor(30, 64, 175); // #1e40af
    pdf.rect(10, yPosition - 5, pageWidth - 20, 25, 'F');
    pdf.setTextColor(255, 255, 255);
    yPosition = addWrappedText('Avaliação de Conformidade LGPD', 15, yPosition + 5, pageWidth - 30, 18, true);
    pdf.setTextColor(200, 200, 200);
    yPosition = addWrappedText('Lei Geral de Proteção de Dados - Lei nº 13.709/2018', 15, yPosition + 2, pageWidth - 30, 10);
    yPosition += 15;
    
    // Company Info
    pdf.setTextColor(0, 0, 0);
    pdf.setFillColor(243, 244, 246); // #f3f4f6
    pdf.rect(10, yPosition - 2, pageWidth - 20, 40, 'F');
    yPosition = addWrappedText('Informações da Empresa', 15, yPosition + 3, pageWidth - 30, 12, true);
    yPosition = addWrappedText(`Empresa: ${data.companyName}`, 15, yPosition + 2, pageWidth - 30, 10);
    yPosition = addWrappedText(`Avaliação: Avaliação ${data.assessmentNumber}`, 15, yPosition + 2, pageWidth - 30, 10);
    yPosition = addWrappedText(`Total de Respondentes: ${data.completedRespondents} de ${data.totalRespondents}`, 15, yPosition + 2, pageWidth - 30, 10);
    yPosition += 10;
    
    // Compliance Box
    pdf.setFillColor(30, 64, 175); // #1e40af
    pdf.rect(10, yPosition - 2, pageWidth - 20, 30, 'F');
    pdf.setTextColor(255, 255, 255);
    yPosition = addWrappedText('Conformidade Total', 15, yPosition + 3, pageWidth - 30, 11);
    pdf.setFontSize(24);
    (pdf as any).setFont(undefined, 'bold');
    pdf.text(`${data.compliancePercentage}%`, pageWidth / 2, yPosition + 8, { align: 'center' });
    pdf.setFontSize(10);
    (pdf as any).setFont(undefined, 'normal');
    yPosition = addWrappedText(`Pontuação Total: ${data.totalScore.toLocaleString()} / 10.000 pontos`, 15, yPosition + 12, pageWidth - 30, 10);
    yPosition += 10;
    
    // Groups Compliance
    pdf.setTextColor(0, 0, 0);
    yPosition = addWrappedText('Conformidade por Grupo', 15, yPosition, pageWidth - 30, 12, true);
    yPosition += 5;
    
    // Draw groups
    for (const group of data.groups) {
      // Check if we need a new page
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = 20;
      }
      
      // Group header
      pdf.setFillColor(240, 240, 240);
      pdf.rect(10, yPosition - 2, pageWidth - 20, 8, 'F');
      pdf.setFontSize(11);
      (pdf as any).setFont(undefined, 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text(`${group.groupName} - ${group.departmentName}`, 15, yPosition + 3);
      pdf.setFontSize(10);
      (pdf as any).setFont(undefined, 'normal');
      pdf.text(`${group.completedCount}/${group.respondentCount} respondentes`, pageWidth - 30, yPosition + 3, { align: 'right' });
      yPosition += 10;
      
      // Compliance percentage
      pdf.setFontSize(14);
      (pdf as any).setFont(undefined, 'bold');
      pdf.text(`${group.compliancePercentage || 0}%`, 15, yPosition + 3);
      
      // Progress bar
      const barWidth = pageWidth - 50;
      const barX = 15;
      const barY = yPosition + 6;
      const barHeight = 4;
      
      // Background bar
      pdf.setFillColor(229, 231, 235); // #e5e7eb
      pdf.rect(barX, barY, barWidth, barHeight, 'F');
      
      // Filled bar
      const fillWidth = (barWidth * (group.compliancePercentage || 0)) / 100;
      pdf.setFillColor(59, 130, 246); // #3b82f6
      pdf.rect(barX, barY, fillWidth, barHeight, 'F');
      
      yPosition += 15;
    }
    
    // Info Section
    yPosition += 5;
    if (yPosition > pageHeight - 40) {
      pdf.addPage();
      yPosition = 20;
    }
    
    pdf.setFillColor(249, 250, 251); // #f9fafb
    pdf.rect(10, yPosition - 2, pageWidth - 20, 35, 'F');
    pdf.setTextColor(0, 0, 0);
    yPosition = addWrappedText('Sobre a Avaliação', 15, yPosition + 3, pageWidth - 30, 11, true);
    yPosition = addWrappedText('Esta avaliação é composta por 50 questões divididas em 3 pilares estratégicos:', 15, yPosition + 2, pageWidth - 30, 10);
    yPosition = addWrappedText('• Segurança da Informação: 15 questões sobre proteção de dados', 15, yPosition + 2, pageWidth - 30, 10);
    yPosition = addWrappedText('• Conformidade Documental: 15 questões sobre documentação', 15, yPosition + 2, pageWidth - 30, 10);
    yPosition = addWrappedText('• Cultura de Privacidade: 20 questões sobre conscientização', 15, yPosition + 2, pageWidth - 30, 10);
    
    // Footer
    pdf.setTextColor(150, 150, 150);
    pdf.setFontSize(9);
    pdf.text('Relatório gerado automaticamente pelo sistema de Avaliação de Conformidade LGPD', pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    // Save PDF
    const filename = `LGPD_Relatorio_${data.companyName.replace(/\s+/g, "_")}_${data.assessmentNumber}.pdf`;
    pdf.save(filename);
    
    console.log('[PDF] PDF gerado e salvo com sucesso:', filename);
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
    <div class="group-result">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <div>
          <h4>${group.groupName} - ${group.departmentName}</h4>
          <p class="text-small text-muted">Respondentes: ${group.completedCount}/${group.respondentCount}</p>
        </div>
        <div style="text-align: right;">
          <p class="compliance-value" style="color: #1e40af; margin: 0;">${group.compliancePercentage || 0}%</p>
        </div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${group.compliancePercentage || 0}%;"></div>
      </div>
    </div>
  `
    )
    .join("");

  return `
    <div class="header">
      <h1>Avaliação de Conformidade LGPD</h1>
      <p class="text-small text-muted">Lei Geral de Proteção de Dados - Lei nº 13.709/2018</p>
    </div>

    <div class="company-info">
      <h2>Informações da Empresa</h2>
      <table>
        <tr>
          <td class="label" style="width: 30%;">Empresa:</td>
          <td class="text-muted">${data.companyName}</td>
        </tr>
        <tr style="background-color: #ffffff;">
          <td class="label">Avaliação:</td>
          <td class="text-muted">Avaliação ${data.assessmentNumber}</td>
        </tr>
        <tr>
          <td class="label">Data do Relatório:</td>
          <td class="text-muted">${formattedDate}</td>
        </tr>
        <tr style="background-color: #ffffff;">
          <td class="label">Total de Respondentes:</td>
          <td class="text-muted">${data.completedRespondents} de ${data.totalRespondents}</td>
        </tr>
      </table>
    </div>

    <div class="compliance-box">
      <p class="text-small">Conformidade Total</p>
      <p class="compliance-value">${data.compliancePercentage}%</p>
      <p class="text-small">Pontuação Total: ${data.totalScore.toLocaleString()} / 10.000 pontos</p>
    </div>

    <div>
      <h2>Conformidade por Grupo</h2>
      ${groupsHTML}
    </div>

    <div class="info-section">
      <h2>Sobre a Avaliação</h2>
      <p>Esta avaliação é composta por 50 questões divididas em 3 pilares estratégicos:</p>
      <ul>
        <li><span class="label" style="color: #1e40af;">Segurança da Informação:</span> 15 questões sobre proteção de dados</li>
        <li><span class="label" style="color: #16a34a;">Conformidade Documental:</span> 15 questões sobre documentação</li>
        <li><span class="label" style="color: #7c3aed;">Cultura de Privacidade:</span> 20 questões sobre conscientização</li>
      </ul>
    </div>

    <div class="footer">
      <p>Relatório gerado automaticamente pelo sistema de Avaliação de Conformidade LGPD</p>
      <p class="text-xs">© 2026 - Todos os direitos reservados</p>
    </div>
  `;
}
