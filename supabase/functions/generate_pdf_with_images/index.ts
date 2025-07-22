import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { PDFDocument, rgb, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  console.log('PDF generation function called with method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 200 
    });
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      throw new Error('Method not allowed. Use POST.');
    }

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      throw new Error('Invalid JSON in request body');
    }

    const { reportData, vehicleData, images } = requestBody;
    
    console.log('Received PDF generation request:', { 
      hasReportData: !!reportData, 
      hasVehicleData: !!vehicleData,
      imageCount: images?.length || 0
    });

    // Validate required fields
    if (!reportData) {
      throw new Error('No report data provided');
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Add first page
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();
    
    let yPosition = height - 50;
    const margin = 50;
    const lineHeight = 20;

    // Helper function to safely get string values
    const safeString = (value: any): string => {
      if (value === null || value === undefined) return '';
      return String(value);
    };

    // Helper function to draw text safely
    const drawTextSafe = (text: any, x: number, y: number, options: any = {}) => {
      const safeText = safeString(text);
      if (safeText.trim()) {
        page.drawText(safeText, { x, y, font, size: 12, color: rgb(0, 0, 0), ...options });
      }
    };

    // Title
    drawTextSafe('LAUDO TÉCNICO DE AVALIAÇÃO VEICULAR', margin, yPosition, {
      font: boldFont,
      size: 18,
      color: rgb(0.8, 0, 0)
    });
    yPosition -= 40;

    // Date and protocol
    const currentDate = new Date().toLocaleDateString('pt-BR');
    drawTextSafe(`Data: ${currentDate}`, margin, yPosition);
    drawTextSafe(`Protocolo: RVC-${Date.now().toString().slice(-6)}`, width - 200, yPosition);
    yPosition -= 30;

    // Vehicle information
    drawTextSafe('VEÍCULO AVALIADO', margin, yPosition, { font: boldFont, size: 14 });
    yPosition -= 25;

    if (vehicleData?.placa) {
      drawTextSafe(`Placa: ${safeString(vehicleData.placa)}`, margin, yPosition);
      yPosition -= lineHeight;
    }

    if (vehicleData?.modelo) {
      drawTextSafe(`Modelo: ${safeString(vehicleData.modelo)}`, margin, yPosition);
      yPosition -= lineHeight;
    }

    if (vehicleData?.created_at) {
      const analysisDate = new Date(vehicleData.created_at).toLocaleDateString('pt-BR');
      drawTextSafe(`Data da Análise: ${analysisDate}`, margin, yPosition);
      yPosition -= 30;
    }

    // Technical results
    if (reportData.sintese) {
      drawTextSafe('RESULTADOS TÉCNICOS', margin, yPosition, { font: boldFont, size: 14 });
      yPosition -= 25;

      const sintese = reportData.sintese;
      
      if (sintese.repintura_em) {
        drawTextSafe(`Repintura detectada em: ${safeString(sintese.repintura_em)}`, margin, yPosition);
        yPosition -= lineHeight;
      }

      if (sintese.massa_em) {
        drawTextSafe(`Massa plástica visível em: ${safeString(sintese.massa_em)}`, margin, yPosition);
        yPosition -= lineHeight;
      }

      if (sintese.alinhamento_comprometido) {
        drawTextSafe(`Alinhamento comprometido: ${safeString(sintese.alinhamento_comprometido)}`, margin, yPosition);
        yPosition -= lineHeight;
      }

      if (sintese.vidros_trocados) {
        drawTextSafe(`Vidros/faróis trocados: ${safeString(sintese.vidros_trocados)}`, margin, yPosition);
        yPosition -= lineHeight;
      }

      if (sintese.estrutura_inferior) {
        drawTextSafe(`Estrutura inferior: ${safeString(sintese.estrutura_inferior)}`, margin, yPosition);
        yPosition -= 30;
      }
    }

    // Technical conclusion
    if (reportData.sintese?.resumo) {
      drawTextSafe('CONCLUSÃO TÉCNICA', margin, yPosition, { font: boldFont, size: 14 });
      yPosition -= 25;

      const resumo = safeString(reportData.sintese.resumo);
      const words = resumo.split(' ');
      let currentLine = '';
      const maxWidth = width - 2 * margin;
      const avgCharWidth = 7; // Approximate character width
      const maxCharsPerLine = Math.floor(maxWidth / avgCharWidth);

      for (const word of words) {
        if ((currentLine + word).length > maxCharsPerLine) {
          if (currentLine.trim()) {
            drawTextSafe(currentLine.trim(), margin, yPosition);
            yPosition -= lineHeight;
          }
          currentLine = word + ' ';
        } else {
          currentLine += word + ' ';
        }
      }
      
      if (currentLine.trim()) {
        drawTextSafe(currentLine.trim(), margin, yPosition);
        yPosition -= 30;
      }
    }

    // Risk classification
    if (reportData.sintese?.classificacao_risco) {
      drawTextSafe('CLASSIFICAÇÃO DE RISCO', margin, yPosition, { font: boldFont, size: 14 });
      yPosition -= 25;
      
      const risco = safeString(reportData.sintese.classificacao_risco).toUpperCase();
      let riskColor = rgb(0, 0, 0);
      
      if (risco.includes('BAIXO')) riskColor = rgb(0, 0.6, 0);
      else if (risco.includes('MÉDIO') || risco.includes('MEDIO')) riskColor = rgb(0.8, 0.6, 0);
      else if (risco.includes('ALTO')) riskColor = rgb(0.8, 0, 0);
      
      drawTextSafe(`CLASSIFICAÇÃO DE RISCO: ${risco}`, margin, yPosition, {
        font: boldFont,
        size: 16,
        color: riskColor
      });
      yPosition -= 30;
    }

    // Components analysis
    if (reportData.componentes && Array.isArray(reportData.componentes) && reportData.componentes.length > 0) {
      drawTextSafe('COMPONENTES ANALISADOS', margin, yPosition, { font: boldFont, size: 14 });
      yPosition -= 25;

      for (const componente of reportData.componentes) {
        if (yPosition < 100) {
          // Add new page if needed
          const newPage = pdfDoc.addPage([595, 842]);
          yPosition = height - 50;
        }

        const nome = safeString(componente.nome);
        const estado = safeString(componente.estado);
        const observacoes = safeString(componente.observacoes || componente.conclusao);

        if (nome) {
          drawTextSafe(`• ${nome}: ${estado}`, margin, yPosition, { font: boldFont });
          yPosition -= lineHeight;
          
          if (observacoes) {
            drawTextSafe(`  ${observacoes}`, margin + 20, yPosition);
            yPosition -= lineHeight;
          }
        }
        yPosition -= 5;
      }
      yPosition -= 20;
    }

    // Footer
    if (yPosition < 100) {
      const newPage = pdfDoc.addPage([595, 842]);
      yPosition = height - 50;
    }

    yPosition = 80; // Position footer at bottom
    drawTextSafe('ReviuCar – Avaliação Inteligente de Veículos', margin, yPosition, {
      size: 10,
      color: rgb(0.5, 0.5, 0.5)
    });
    drawTextSafe('www.reviucar.com.br | contato@reviucar.com', margin, yPosition - 15, {
      size: 10,
      color: rgb(0.5, 0.5, 0.5)
    });

    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save();

    // Upload PDF to Supabase Storage
    const fileName = `laudo_${Date.now()}.pdf`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('laudos')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('PDF upload error:', uploadError);
      throw new Error(`Failed to upload PDF: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('laudos')
      .getPublicUrl(fileName);

    console.log('PDF generated and uploaded successfully:', fileName);

    return new Response(
      JSON.stringify({ 
        success: true,
        pdfUrl: urlData.publicUrl,
        fileName: fileName
      }), 
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in PDF generation function:', error);
    
    const errorMessage = error.message || 'Unknown error occurred';
    const errorResponse = {
      error: errorMessage,
      success: false,
      timestamp: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});