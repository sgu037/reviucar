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

// Logo ReviuCar em base64 (simplified version)
const REVIUCAR_LOGO_BASE64 = `data:image/svg+xml;base64,${btoa(`
<svg width="160" height="60" viewBox="0 0 160 60" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#DC2626;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#991B1B;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="160" height="60" fill="url(#gradient)" rx="8"/>
  <circle cx="25" cy="30" r="12" fill="white"/>
  <text x="22" y="36" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#DC2626">R</text>
  <text x="45" y="25" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white">REVIUCAR</text>
  <text x="45" y="40" font-family="Arial, sans-serif" font-size="10" fill="white">Avaliação Inteligente</text>
</svg>
`)}`;

// Function to calculate numerology sum
const calculateNumerologySum = (num: number): number => {
  const digits = num.toString().replace(/\D/g, '').slice(0, 5);
  return digits.split('').reduce((sum, digit) => sum + parseInt(digit), 0);
};

// Function to adjust value to end in 8 numerologically
const adjustToNumerology8 = (baseValue: number): number => {
  let adjusted = Math.round(baseValue / 100) * 100; // Round to nearest hundred
  
  while (calculateNumerologySum(adjusted) !== 8) {
    adjusted += 100;
  }
  
  return adjusted;
};

// Function to calculate express evaluation value
const calculateExpressValue = (fipeValue: string, quilometragem: number = 80000): string => {
  // Extract numeric value from FIPE string
  const numericValue = parseFloat(fipeValue.replace(/[^\d,]/g, '').replace(',', '.'));
  
  if (isNaN(numericValue)) return 'R$ 0,00';
  
  // Calculate 78% of FIPE
  const lojistValue = numericValue * 0.78;
  
  // Subtract R$ 1,000
  const quickSaleValue = lojistValue - 1000;
  
  // Adjust to numerology 8 and ensure it ends in ",00"
  const finalValue = adjustToNumerology8(quickSaleValue);
  
  return `R$ ${finalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Function to generate express evaluation markdown
const generateExpressEvaluation = (data: ReportData): string => {
  const quilometragem = 85000; // Default value, could be made dynamic
  const expressValue = calculateExpressValue(data.veiculo.valor_fipe, quilometragem);
  
  return `AVALIAÇÃO EXPRESSA

Veículo: ${data.veiculo.modelo}
Ano: ${data.veiculo.ano}
Quilometragem: ${quilometragem.toLocaleString('pt-BR')} km
Tabela Fipe: ${data.veiculo.valor_fipe}
Por: ${expressValue}`;
};

const createHTMLTemplate = (data: ReportData): string => {
  const currentDate = new Date().toLocaleDateString('pt-BR');
  const expressEvaluation = generateExpressEvaluation(data);
  
  // Determine risk level and color
  let riskLevel = 'MÉDIO';
  let riskClass = 'risco-medio';
  
  if (data.sintese.conclusao_final.includes('estético') || data.sintese.estrutura_ok) {
    riskLevel = 'BAIXO';
    riskClass = 'risco-baixo';
  } else if (data.sintese.conclusao_final.includes('grave') || 
             data.sintese.conclusao_final.includes('estrutural')) {
    riskLevel = 'ALTO';
    riskClass = 'risco-alto';
  }

  return `
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <style>
      @page {
        margin: 20mm;
        size: A4;
      }
      body {
        font-family: 'Arial', sans-serif;
        margin: 0;
        padding: 0;
        color: #333;
        line-height: 1.6;
        font-size: 14px;
      }
      .header {
        text-align: center;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 2px solid #c10000;
      }
      .logo {
        width: 180px;
        margin-bottom: 15px;
        display: block;
        margin-left: auto;
        margin-right: auto;
      }
      .document-title {
        font-size: 24px;
        font-weight: bold;
        color: #c10000;
        margin: 10px 0;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .document-info {
        color: #666;
        font-size: 13px;
        margin-top: 10px;
      }
      .section {
        margin: 25px 0;
        page-break-inside: avoid;
      }
      .title {
        font-size: 18px;
        font-weight: bold;
        color: #c10000;
        border-bottom: 2px solid #c10000;
        padding-bottom: 8px;
        margin-bottom: 15px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .label {
        font-weight: bold;
        color: #333;
      }
      .box {
        border: 1px solid #ddd;
        padding: 20px;
        border-radius: 8px;
        background: #fafafa;
        margin-bottom: 15px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      .box p {
        margin: 10px 0;
        line-height: 1.5;
      }
      .vehicle-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
        margin-top: 10px;
      }
      .vehicle-item {
        padding: 8px 0;
        border-bottom: 1px solid #eee;
      }
      .express-eval {
        background: #f0f8f0;
        border: 2px solid #28a745;
        padding: 20px;
        border-radius: 8px;
        font-family: 'Courier New', monospace;
        font-size: 13px;
        line-height: 1.8;
        margin-top: 10px;
      }
      .express-eval .title-eval {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 15px;
        text-align: center;
        color: #155724;
      }
      .express-eval .price {
        font-size: 18px;
        font-weight: bold;
        color: #28a745;
      }
      .risco-baixo {
        background: #d4edda;
        border: 2px solid #28a745;
        color: #155724;
        font-weight: bold;
        padding: 20px;
        border-radius: 8px;
        text-align: center;
        font-size: 18px;
        margin: 15px 0;
      }
      .risco-medio {
        background: #fff3cd;
        border: 2px solid #ffc107;
        color: #856404;
        font-weight: bold;
        padding: 20px;
        border-radius: 8px;
        text-align: center;
        font-size: 18px;
        margin: 15px 0;
      }
      .risco-alto {
        background: #f8d7da;
        border: 2px solid #dc3545;
        color: #721c24;
        font-weight: bold;
        padding: 20px;
        border-radius: 8px;
        text-align: center;
        font-size: 18px;
        margin: 15px 0;
      }
      .technical-item {
        display: flex;
        margin: 12px 0;
        padding: 8px 0;
        border-bottom: 1px solid #eee;
      }
      .technical-label {
        font-weight: bold;
        width: 180px;
        color: #555;
        flex-shrink: 0;
      }
      .technical-value {
        color: #333;
        flex: 1;
      }
      .footer {
        margin-top: 40px;
        text-align: center;
        font-size: 12px;
        color: #777;
        border-top: 1px solid #ddd;
        padding-top: 20px;
        page-break-inside: avoid;
      }
      .footer-logo {
        font-weight: bold;
        color: #c10000;
        margin-bottom: 5px;
      }
      ul {
        margin: 10px 0;
        padding-left: 20px;
      }
      li {
        margin: 8px 0;
        line-height: 1.4;
      }
      h2 {
        color: #c10000;
        margin: 15px 0 10px 0;
      }
      /* Page break utilities */
      .page-break-before {
        page-break-before: always;
      }
      .no-break {
        page-break-inside: avoid;
      }
    </style>
  </head>
  <body>

    <div class="header no-break">
      <img class="logo" src="${REVIUCAR_LOGO_BASE64}" alt="ReviuCar" />
      <h1 class="document-title">Laudo Técnico de Avaliação Veicular</h1>
      <div class="document-info">
        <strong>Data:</strong> ${currentDate} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>Analista:</strong> IA ReviuCar<br>
        <strong>Protocolo:</strong> RVC-${Date.now().toString().slice(-6)}
      </div>
    </div>

    <div class="section no-break">
      <div class="title">🚗 Veículo Avaliado</div>
      <div class="box">
        <div class="vehicle-grid">
          <div class="vehicle-item">
            <span class="label">Modelo:</span> ${data.veiculo.modelo}
          </div>
          <div class="vehicle-item">
            <span class="label">Marca:</span> ${data.veiculo.marca}
          </div>
          <div class="vehicle-item">
            <span class="label">Ano Modelo:</span> ${data.veiculo.ano}
          </div>
          <div class="vehicle-item">
            <span class="label">Combustível:</span> ${data.veiculo.combustivel}
          </div>
          <div class="vehicle-item">
            <span class="label">Valor FIPE:</span> ${data.veiculo.valor_fipe}
          </div>
          <div class="vehicle-item">
            <span class="label">Código FIPE:</span> ${data.veiculo.codigo_fipe}
          </div>
        </div>
        ${data.veiculo.placa ? `<div class="vehicle-item"><span class="label">Placa:</span> ${data.veiculo.placa}</div>` : ''}
      </div>
    </div>

    <div class="section">
      <div class="title">🔍 Resultados Técnicos</div>
      <div class="box">
        <div class="technical-item">
          <div class="technical-label">Repintura detectada em:</div>
          <div class="technical-value">${data.sintese.repintura_em}</div>
        </div>
        <div class="technical-item">
          <div class="technical-label">Massa plástica visível em:</div>
          <div class="technical-value">${data.sintese.massa_em}</div>
        </div>
        <div class="technical-item">
          <div class="technical-label">Alinhamento comprometido:</div>
          <div class="technical-value">${data.sintese.alinhamento_comprometido}</div>
        </div>
        <div class="technical-item">
          <div class="technical-label">Vidros/faróis trocados:</div>
          <div class="technical-value">${data.sintese.vidros_trocados}</div>
        </div>
        <div class="technical-item">
          <div class="technical-label">Estrutura inferior:</div>
          <div class="technical-value">${data.sintese.estrutura_inferior}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="title">🧾 Conclusão Técnica</div>
      <div class="box">
        <p><strong>Resumo da Análise:</strong></p>
        <p>${data.sintese.resumo}</p>
      </div>
    </div>

    <div class="section">
      <div class="title">⚠️ Classificação de Risco</div>
      <div class="${riskClass}">
        CLASSIFICAÇÃO DE RISCO: ${riskLevel}
      </div>
    </div>

    <div class="section">
      <div class="title">💰 Avaliação Expressa</div>
      <div class="box">
        <pre style="font-family: Arial, sans-serif; margin: 0; white-space: pre-line;">${expressEvaluation}</pre>
      </div>
    </div>

    <div class="section">
      <div class="title">📎 Observações Finais</div>
      <div class="box">
        <ul>
          <li>Este laudo técnico foi gerado com base em imagens e/ou descrição do veículo.</li>
          <li>Laudo automatizado pela IA ReviuCar conforme protocolo técnico padrão.</li>
        </ul>
      </div>
    </div>

    <div class="footer">
      ReviuCar – Avaliação Inteligente de Veículos <br />
      🌐 www.reviucar.com.br &nbsp;&nbsp; | &nbsp;&nbsp; ✉️ contato@reviucar.com
    </div>
  </body>
</html>`;
};

export const generatePDF = async (reportData: ReportData) => {
  try {
    // Create a temporary div to render HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = createHTMLTemplate(reportData);
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '794px'; // A4 width in pixels at 96 DPI
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.padding = '40px';
    tempDiv.style.boxSizing = 'border-box';
    
    document.body.appendChild(tempDiv);

    // Wait for fonts and images to load
    await new Promise(resolve => setTimeout(resolve, 500));

    // Convert HTML to canvas with better settings for multi-page content
    const canvas = await html2canvas(tempDiv, {
      width: 794,
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: 'white',
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: 794,
      windowHeight: tempDiv.scrollHeight
    });

    // Remove temporary div
    document.body.removeChild(tempDiv);

    // Create PDF with proper multi-page handling
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png', 1.0);
    
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // If content fits in one page
    if (imgHeight <= pageHeight) {
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    } else {
      // Multi-page handling
      let heightLeft = imgHeight;
      let position = 0;

      // First page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Additional pages
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
    }

    // Save PDF with professional filename
    const currentDate = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    const vehicleInfo = `${reportData.veiculo.marca}_${reportData.veiculo.modelo}_${reportData.veiculo.ano}`.replace(/\s+/g, '_');
    const fileName = `Laudo_ReviuCar_${vehicleInfo}_${currentDate}.pdf`;
    
    pdf.save(fileName);

  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    alert('Erro ao gerar PDF. Verifique sua conexão e tente novamente.');
  }
};