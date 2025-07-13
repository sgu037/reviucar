import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReportData {
  veiculo: {
    modelo: string;
    placa: string;
  };
  componentes: Array<{
    nome: string;
    estado: string;
    conclusao: string;
  }>;
  sintese: {
    resumo: string;
    repintura_em: string;
    massa_em: string;
    alinhamento_comprometido: string;
    vidros_trocados: string;
    estrutura_inferior: string;
    estrutura_ok: boolean;
    conclusao_final: string;
    manutencoes_pendentes?: string[];
  };
}

export const generatePDF = async (reportData: ReportData) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Colors
  const primaryColor = '#DC2626'; // Red color from Reviucar
  const textColor = '#374151';
  const lightGray = '#F3F4F6';

  // Header with logo and title
  pdf.setFillColor(primaryColor);
  pdf.rect(0, 0, pageWidth, 40, 'F');
  
  // Logo area (simplified)
  pdf.setFillColor(255, 255, 255);
  pdf.circle(25, 20, 8, 'F');
  pdf.setTextColor(primaryColor);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('R', 22, 24);
  
  // Company name
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.text('REVIUCAR', 40, 18);
  pdf.setFontSize(12);
  pdf.text('Análise Técnica Veicular Profissional', 40, 26);

  yPosition = 55;

  // Document title
  pdf.setTextColor(textColor);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('LAUDO TÉCNICO AUTOMOTIVO', margin, yPosition);
  yPosition += 15;

  // Date
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const currentDate = new Date().toLocaleDateString('pt-BR');
  pdf.text(`Data de emissão: ${currentDate}`, pageWidth - margin - 40, yPosition - 10);

  // Vehicle information box
  pdf.setFillColor(lightGray);
  pdf.rect(margin, yPosition, pageWidth - 2 * margin, 25, 'F');
  pdf.setDrawColor(primaryColor);
  pdf.setLineWidth(0.5);
  pdf.rect(margin, yPosition, pageWidth - 2 * margin, 25);

  yPosition += 8;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(textColor);
  pdf.text('INFORMAÇÕES DO VEÍCULO', margin + 5, yPosition);
  
  yPosition += 8;
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Modelo: ${reportData.veiculo.modelo}`, margin + 5, yPosition);
  pdf.text(`Placa: ${reportData.veiculo.placa}`, margin + 80, yPosition);
  
  yPosition += 20;

  // Technical report section
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(primaryColor);
  pdf.text('🔧 PARECER TÉCNICO – VERIFICAÇÃO DE BATIDAS, MASSA E RETOQUES', margin, yPosition);
  yPosition += 12;

  // Technical details
  const technicalItems = [
    `• Repintura detectada em: ${reportData.sintese.repintura_em}`,
    `• Massa plástica visível em: ${reportData.sintese.massa_em}`,
    `• Alinhamento comprometido em: ${reportData.sintese.alinhamento_comprometido}`,
    `• Vidros/faróis trocados: ${reportData.sintese.vidros_trocados}`,
    `• Estrutura inferior: ${reportData.sintese.estrutura_inferior}`,
    `• Conclusão: ${reportData.sintese.resumo}`
  ];

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(textColor);

  technicalItems.forEach(item => {
    const lines = pdf.splitTextToSize(item, pageWidth - 2 * margin - 10);
    lines.forEach((line: string) => {
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = margin;
      }
      pdf.text(line, margin + 5, yPosition);
      yPosition += 5;
    });
    yPosition += 2;
  });

  // Risk classification box
  yPosition += 5;
  const riskLevel = reportData.sintese.conclusao_final === 'Reparo estético' ? 'BAIXO' : 'MÉDIO';
  const riskColor = riskLevel === 'BAIXO' ? '#FCD34D' : '#F87171';
  
  pdf.setFillColor(riskColor);
  pdf.rect(margin, yPosition, pageWidth - 2 * margin, 15, 'F');
  pdf.setDrawColor(textColor);
  pdf.rect(margin, yPosition, pageWidth - 2 * margin, 15);
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(textColor);
  pdf.text(`🛑 CLASSIFICAÇÃO DE RISCO: ${riskLevel}`, margin + 5, yPosition + 10);

  yPosition += 25;

  // Components analysis
  if (yPosition > pageHeight - 60) {
    pdf.addPage();
    yPosition = margin;
  }

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(primaryColor);
  pdf.text('ANÁLISE POR COMPONENTE', margin, yPosition);
  yPosition += 10;

  reportData.componentes.forEach((componente, index) => {
    if (yPosition > pageHeight - 40) {
      pdf.addPage();
      yPosition = margin;
    }

    // Component header
    pdf.setFillColor(lightGray);
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(textColor);
    pdf.text(componente.nome, margin + 3, yPosition + 5);
    
    // Status badge
    const statusColor = getStatusColor(componente.estado);
    pdf.setFillColor(statusColor.r, statusColor.g, statusColor.b);
    pdf.rect(pageWidth - margin - 30, yPosition + 1, 25, 6, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.text(componente.estado.toUpperCase(), pageWidth - margin - 28, yPosition + 4.5);

    yPosition += 12;

    // Component conclusion
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(textColor);
    const conclusionLines = pdf.splitTextToSize(componente.conclusao, pageWidth - 2 * margin - 10);
    conclusionLines.forEach((line: string) => {
      pdf.text(line, margin + 5, yPosition);
      yPosition += 4;
    });
    
    yPosition += 5;
  });

  // Footer
  const footerY = pageHeight - 20;
  pdf.setDrawColor(primaryColor);
  pdf.setLineWidth(0.5);
  pdf.line(margin, footerY, pageWidth - margin, footerY);
  
  pdf.setFontSize(8);
  pdf.setTextColor(textColor);
  pdf.text('Este laudo foi gerado pela melhor inteligência artificial do mercado.', margin, footerY + 5);
  pdf.text(`Página 1 de ${pdf.getNumberOfPages()}`, pageWidth - margin - 20, footerY + 5);
  pdf.text('REVIUCAR - Análise Técnica Veicular', pageWidth - margin - 50, footerY + 10);

  // Save PDF
  const fileName = `Laudo_${reportData.veiculo.placa}_${currentDate.replace(/\//g, '-')}.pdf`;
  pdf.save(fileName);
};

const getStatusColor = (estado: string) => {
  switch (estado.toLowerCase()) {
    case 'original':
      return { r: 34, g: 197, b: 94 }; // Green
    case 'retocado':
    case 'troca':
      return { r: 251, g: 191, b: 36 }; // Yellow
    case 'repintura':
    case 'massa':
      return { r: 248, g: 113, b: 113 }; // Red
    default:
      return { r: 107, g: 114, b: 128 }; // Gray
  }
};