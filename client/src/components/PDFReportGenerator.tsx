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
    
    // Create HTML content with COMPLETE CSS reset
    const htmlContent = generateHTMLContent(data);
    
    // Create an iframe with isolated CSS
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.style.position = 'absolute';
    iframe.style.width = '210mm';
    iframe.style.height = '297mm';
    
    document.body.appendChild(iframe);
    
    // Write content to iframe
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      throw new Error('Não foi possível acessar o documento do iframe');
    }
    
    // Write HTML with complete CSS reset
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              border: 0;
              background: transparent;
              color: inherit;
              font-size: inherit;
              font-weight: inherit;
              line-height: inherit;
              text-decoration: none;
            }
            
            html, body {
              width: 100%;
              height: 100%;
              background-color: #ffffff;
              color: #333333;
              font-family: Arial, sans-serif;
              font-size: 12px;
              line-height: 1.6;
            }
            
            body {
              padding: 20px;
            }
            
            h1 {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 10px;
              color: #1e40af;
            }
            
            h2 {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 12px;
              color: #1f2937;
            }
            
            h4 {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 5px;
              color: #1e40af;
            }
            
            p {
              margin-bottom: 8px;
              color: #333333;
            }
            
            ul {
              margin-left: 20px;
              margin-bottom: 8px;
            }
            
            li {
              margin-bottom: 4px;
              color: #666666;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
            }
            
            td {
              padding: 6px;
              color: #333333;
            }
            
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 3px solid #1e40af;
            }
            
            .company-info {
              background-color: #f3f4f6;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            
            .compliance-box {
              background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
              color: white;
              padding: 25px;
              border-radius: 8px;
              margin-bottom: 20px;
              text-align: center;
            }
            
            .compliance-box p {
              color: white;
            }
            
            .compliance-value {
              font-size: 40px;
              font-weight: bold;
              margin: 0;
            }
            
            .group-result {
              margin-bottom: 20px;
              border: 1px solid #ddd;
              padding: 15px;
              border-radius: 4px;
              page-break-inside: avoid;
            }
            
            .progress-bar {
              width: 100%;
              height: 8px;
              background-color: #e5e7eb;
              border-radius: 4px;
              overflow: hidden;
              margin-top: 8px;
            }
            
            .progress-fill {
              height: 100%;
              background-color: #3b82f6;
              border-radius: 4px;
            }
            
            .info-section {
              background-color: #f9fafb;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
              font-size: 11px;
            }
            
            .footer {
              border-top: 1px solid #e5e7eb;
              padding-top: 12px;
              text-align: center;
              font-size: 10px;
              color: #999999;
              margin-top: 20px;
            }
            
            .label {
              font-weight: bold;
              color: #374151;
            }
            
            .text-muted {
              color: #666666;
            }
            
            .text-small {
              font-size: 11px;
            }
            
            .text-xs {
              font-size: 10px;
            }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `);
    iframeDoc.close();
    
    // Wait for iframe to render
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('[PDF] Convertendo iframe para canvas...');
    
    // Convert iframe to canvas
    const canvas = await html2canvas(iframeDoc.body, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowHeight: iframeDoc.body.scrollHeight,
      windowWidth: 800,
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
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
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
