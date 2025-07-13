import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReportData {
  veiculo: {
    marca: string;
    modelo: string;
    ano: number;
    valor_fipe: string;
    codigo_fipe: string;
    combustivel: string;
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

  // Colors - Webmotors style (white background, red and gray details)
  const reviucarRed = '#DC2626';
  const darkGray = '#4B5563';
  const lightGray = '#F9FAFB';
  const mediumGray = '#6B7280';

  // White background (default)
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // ──────────────────────────────────────────────
  // 🔴 Logo ReviuCar centralizada no topo
  // ──────────────────────────────────────────────
  
  // Top red section with logo
  pdf.setFillColor(reviucarRed);
  pdf.rect(0, 0, pageWidth, 35, 'F');
  
  // Logo centered
  const centerX = pageWidth / 2;
  pdf.setFillColor(255, 255, 255);
  pdf.circle(centerX - 15, 18, 8, 'F');
  pdf.setTextColor(reviucarRed);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('R', centerX - 18, 22);
  
  // Company name centered
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(18);
  pdf.text('REVIUCAR', centerX - 5, 22);

  // Separator line
  pdf.setDrawColor(reviucarRed);
  pdf.setLineWidth(1);
  pdf.line(margin, 45, pageWidth - margin, 45);

  yPosition = 60;

  // ──────────────────────────────────────────────
  // 📄 LAUDO TÉCNICO DE AVALIAÇÃO VEICULAR
  // ──────────────────────────────────────────────
  
  pdf.setTextColor(darkGray);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('LAUDO TÉCNICO DE AVALIAÇÃO VEICULAR', centerX, yPosition, { align: 'center' });
  
  yPosition += 12;
  
  // Date and Analyst
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(mediumGray);
  const currentDate = new Date().toLocaleDateString('pt-BR');
  pdf.text(`Data: ${currentDate}`, margin, yPosition);
  pdf.text('Analista: IA ReviuCar', pageWidth - margin - 35, yPosition);

  yPosition += 20;

  // ──────────────────────────────────────────────
  // 🚗 Veículo Avaliado
  // ──────────────────────────────────────────────
  
  pdf.setFillColor(lightGray);
  pdf.rect(margin, yPosition, pageWidth - 2 * margin, 35, 'F');
  pdf.setDrawColor(mediumGray);
  pdf.setLineWidth(0.5);
  pdf.rect(margin, yPosition, pageWidth - 2 * margin, 35);

  yPosition += 8;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(reviucarRed);
  pdf.text('🚗 Veículo Avaliado', margin + 5, yPosition);
  
  yPosition += 8;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(darkGray);
  pdf.text(`Modelo: ${reportData.veiculo.modelo}`, margin + 5, yPosition);
  pdf.text(`Ano: ${reportData.veiculo.ano}`, margin + 100, yPosition);
  pdf.text(`Cor: Não informado`, margin + 5, yPosition + 6);
  pdf.text(`Placa: ${reportData.veiculo.placa || 'Não informado'}`, margin + 100, yPosition + 6);
  
  yPosition += 25;

  // Separator line
  pdf.setDrawColor(mediumGray);
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 15;

  // ──────────────────────────────────────────────
  // 🔍 Resultados Técnicos
  // ──────────────────────────────────────────────
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(reviucarRed);
  pdf.text('🔍 Resultados Técnicos', margin, yPosition);
  yPosition += 10;

  const technicalItems = [
    `▪ Repintura detectada em: ${reportData.sintese.repintura_em}`,
    `▪ Massa plástica visível em: ${reportData.sintese.massa_em}`,
    `▪ Alinhamento comprometido em: ${reportData.sintese.alinhamento_comprometido}`,
    `▪ Vidros/faróis trocados: ${reportData.sintese.vidros_trocados}`,
    `▪ Estrutura inferior: ${reportData.sintese.estrutura_inferior}`
  ];

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(darkGray);

  technicalItems.forEach(item => {
    const lines = pdf.splitTextToSize(item, pageWidth - 2 * margin - 10);
    lines.forEach((line: string) => {
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = margin + 20;
      }
      pdf.text(line, margin + 5, yPosition);
      yPosition += 5;
    });
    yPosition += 2;
  });

  yPosition += 10;

  // Separator line
  pdf.setDrawColor(mediumGray);
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 15;

  // ──────────────────────────────────────────────
  // 🧾 Conclusão Técnica
  // ──────────────────────────────────────────────
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(reviucarRed);
  pdf.text('🧾 Conclusão Técnica', margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(darkGray);
  const conclusionLines = pdf.splitTextToSize(reportData.sintese.resumo, pageWidth - 2 * margin - 10);
  conclusionLines.forEach((line: string) => {
    pdf.text(line, margin + 5, yPosition);
    yPosition += 5;
  });

  yPosition += 15;

  // Separator line
  pdf.setDrawColor(mediumGray);
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 15;

  // ──────────────────────────────────────────────
  // ⚠️ CLASSIFICAÇÃO DE RISCO
  // ──────────────────────────────────────────────
  
  let riskLevel = 'MÉDIO';
  let riskColor = '#FBBF24'; // Yellow
  let riskIcon = '🟡';

  // Determine risk level based on findings
  if (reportData.sintese.conclusao_final.includes('estético') || 
      reportData.sintese.estrutura_ok) {
    riskLevel = 'BAIXO';
    riskColor = '#10B981'; // Green
    riskIcon = '🟢';
  } else if (reportData.sintese.conclusao_final.includes('grave') || 
             reportData.sintese.conclusao_final.includes('estrutural')) {
    riskLevel = 'ALTO';
    riskColor = '#EF4444'; // Red
    riskIcon = '🔴';
  }

  // Risk classification box with color
  pdf.setFillColor(riskColor);
  pdf.rect(margin, yPosition, pageWidth - 2 * margin, 20, 'F');
  pdf.setDrawColor(darkGray);
  pdf.setLineWidth(1);
  pdf.rect(margin, yPosition, pageWidth - 2 * margin, 20);
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text(`⚠️ CLASSIFICAÇÃO DE RISCO: ${riskLevel}`, centerX, yPosition + 12, { align: 'center' });

  yPosition += 35;

  // Separator line
  pdf.setDrawColor(mediumGray);
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 15;

  // ──────────────────────────────────────────────
  // 📎 Observações Finais
  // ──────────────────────────────────────────────
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(reviucarRed);
  pdf.text('📎 Observações Finais', margin, yPosition);
  yPosition += 10;

  const observations = [
    '- Este laudo técnico foi gerado com base em imagens e/ou descrição do veículo.',
    '- Avaliação realizada pela IA ReviuCar seguindo critérios técnicos rigorosos.'
  ];

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(darkGray);

  observations.forEach(obs => {
    pdf.text(obs, margin + 5, yPosition);
    yPosition += 6;
  });

  // ──────────────────────────────────────────────
  // Footer with contact info
  // ──────────────────────────────────────────────
  
  const footerY = pageHeight - 25;
  
  // Footer background
  pdf.setFillColor(lightGray);
  pdf.rect(0, footerY - 5, pageWidth, 30, 'F');
  
  // Top border
  pdf.setDrawColor(reviucarRed);
  pdf.setLineWidth(1);
  pdf.line(0, footerY - 5, pageWidth, footerY - 5);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(reviucarRed);
  pdf.text('📞 ReviuCar - Avaliação Inteligente de Veículos', centerX, footerY + 3, { align: 'center' });
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(mediumGray);
  pdf.text('🌐 www.reviucar.com.br | 📧 contato@reviucar.com', centerX, footerY + 10, { align: 'center' });

  // Save PDF
  const fileName = `Laudo_ReviuCar_${reportData.veiculo.placa || 'Veiculo'}_${currentDate.replace(/\//g, '-')}.pdf`;
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