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
      body {
        font-family: 'Arial', sans-serif;
        margin: 40px;
        color: #333;
        line-height: 1.4;
      }
      .header {
        text-align: center;
        margin-bottom: 20px;
      }
      .logo {
        width: 160px;
        margin-bottom: 10px;
      }
      .section {
        margin: 30px 0;
      }
      .title {
        font-size: 22px;
        font-weight: bold;
        color: #c10000;
        border-bottom: 1px solid #ddd;
        padding-bottom: 4px;
        margin-bottom: 10px;
      }
      .label {
        font-weight: bold;
      }
      .box {
        border: 2px solid #ddd;
        padding: 12px;
        border-radius: 8px;
        background: #f9f9f9;
      }
      .box p {
        margin: 8px 0;
      }
      .risco-baixo {
        background: #d4edda;
        border: 2px solid #28a745;
        color: #155724;
        font-weight: bold;
        padding: 15px;
        border-radius: 8px;
        text-align: center;
        font-size: 18px;
      }
      .risco-medio {
        background: #fff3cd;
        border: 2px solid #ffc107;
        color: #856404;
        font-weight: bold;
        padding: 15px;
        border-radius: 8px;
        text-align: center;
        font-size: 18px;
      }
      .risco-alto {
        background: #f8d7da;
        border: 2px solid #dc3545;
        color: #721c24;
        font-weight: bold;
        padding: 15px;
        border-radius: 8px;
        text-align: center;
        font-size: 18px;
      }
      .footer {
        margin-top: 50px;
        text-align: center;
        font-size: 13px;
        color: #777;
        border-top: 1px solid #ddd;
        padding-top: 20px;
      }
      h2 {
        color: #c10000;
        margin: 10px 0;
      }
    </style>
  </head>
  <body>

    <div class="header">
      <img class="logo" src="${REVIUCAR_LOGO_BASE64}" alt="ReviuCar" />
      <h2>LAUDO TÉCNICO DE AVALIAÇÃO VEICULAR</h2>
      <p>Data: ${currentDate} &nbsp;&nbsp; | &nbsp;&nbsp; Analista: IA ReviuCar</p>
    </div>

    <div class="section">
      <div class="title">🚗 Veículo Avaliado</div>
      <div class="box">
        <p><span class="label">Modelo:</span> ${data.veiculo.modelo}</p>
        <p><span class="label">Marca:</span> ${data.veiculo.marca}</p>
        <p><span class="label">Ano Modelo:</span> ${data.veiculo.ano}</p>
        <p><span class="label">Combustível:</span> ${data.veiculo.combustivel}</p>
        <p><span class="label">Valor FIPE:</span> ${data.veiculo.valor_fipe}</p>
        <p><span class="label">Placa:</span> ${data.veiculo.placa || 'Não informado'}</p>
        <p><span class="label">Código FIPE:</span> ${data.veiculo.codigo_fipe}</p>
      </div>
    </div>

    <div class="section">
      <div class="title">🔍 Resultados Técnicos</div>
      <div class="box">
        <p><strong>Repintura:</strong> ${data.sintese.repintura_em}</p>
        <p><strong>Massa plástica:</strong> ${data.sintese.massa_em}</p>
        <p><strong>Alinhamento:</strong> ${data.sintese.alinhamento_comprometido}</p>
        <p><strong>Vidros/faróis trocados:</strong> ${data.sintese.vidros_trocados}</p>
        <p><strong>Estrutura inferior:</strong> ${data.sintese.estrutura_inferior}</p>
      </div>
    </div>

    <div class="section">
      <div class="title">🧾 Conclusão Técnica</div>
      <div class="box">
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
    
    document.body.appendChild(tempDiv);

    // Convert HTML to canvas
    const canvas = await html2canvas(tempDiv, {
      width: 794,
      height: 1123, // A4 height in pixels at 96 DPI
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: 'white'
    });

    // Remove temporary div
    document.body.removeChild(tempDiv);

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');
    
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    // Save PDF
    const currentDate = new Date().toLocaleDateString('pt-BR');
    const fileName = `Laudo_ReviuCar_${reportData.veiculo.placa || 'Veiculo'}_${currentDate.replace(/\//g, '-')}.pdf`;
    pdf.save(fileName);

  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    alert('Erro ao gerar PDF. Tente novamente.');
  }
};