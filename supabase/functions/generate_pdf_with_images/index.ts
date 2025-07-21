import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

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
    if (req.method !== 'POST') {
      throw new Error('Method not allowed. Use POST.');
    }

    const requestBody = await req.json();
    const { reportData, vehicleData, imagePaths } = requestBody;
    
    console.log('Received PDF generation request:', { 
      hasReportData: !!reportData,
      hasVehicleData: !!vehicleData,
      imageCount: imagePaths?.length || 0
    });

    if (!reportData) {
      throw new Error('Report data is required');
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
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Page dimensions
    const pageWidth = 595; // A4 width
    const pageHeight = 842; // A4 height
    const margin = 50;
    const contentWidth = pageWidth - 2 * margin;
    
    // Colors
    const primaryColor = rgb(0.8, 0, 0); // Red
    const darkGray = rgb(0.2, 0.2, 0.2);
    const lightGray = rgb(0.5, 0.5, 0.5);
    const backgroundColor = rgb(0.98, 0.98, 0.98);
    
    // Page 1 - Report Data
    const page1 = pdfDoc.addPage([pageWidth, pageHeight]);
    let currentY = pageHeight - 40;
    const lineHeight = 18;

    // Header with background
    page1.drawRectangle({
      x: 0,
      y: currentY - 60,
      width: pageWidth,
      height: 80,
      color: primaryColor,
    });

    // Logo placeholder (text-based)
    page1.drawText('REVIUCAR', {
      x: margin,
      y: currentY - 25,
      size: 24,
      font: helveticaBoldFont,
      color: rgb(1, 1, 1),
    });

    page1.drawText('Análise Técnica Veicular com IA', {
      x: margin,
      y: currentY - 45,
      size: 12,
      font: helveticaFont,
      color: rgb(1, 1, 1),
    });

    // Document title
    currentY -= 100;
    page1.drawText('LAUDO TÉCNICO DE AVALIAÇÃO VEICULAR', {
      x: margin,
      y: currentY,
      size: 20,
      font: helveticaBoldFont,
      color: primaryColor,
    });

    // Date and protocol
    const currentDate = new Date().toLocaleDateString('pt-BR');
    const protocol = `RVC-${Date.now().toString().slice(-6)}`;
    
    currentY -= 30;
    page1.drawText(`Data: ${currentDate} | Protocolo: ${protocol}`, {
      x: margin,
      y: currentY,
      size: 10,
      font: helveticaFont,
      color: lightGray,
    });

    currentY -= 40;

    // Vehicle info section with background
    page1.drawRectangle({
      x: margin - 10,
      y: currentY - 120,
      width: contentWidth + 20,
      height: 140,
      color: backgroundColor,
    });

    page1.drawText('DADOS DO VEÍCULO', {
      x: margin,
      y: currentY,
      size: 16,
      font: helveticaBoldFont,
      color: primaryColor,
    });
    currentY -= 25;

    // Vehicle information in two columns
    const vehicleInfo = [
      [`Modelo: ${reportData.veiculo?.modelo || 'Não informado'}`, `Marca: ${reportData.veiculo?.marca || 'Não informado'}`],
      [`Ano: ${reportData.veiculo?.ano || 'Não informado'}`, `Placa: ${reportData.veiculo?.placa || 'Não informado'}`],
      [`Combustível: ${reportData.veiculo?.combustivel || 'Não informado'}`, `Código FIPE: ${reportData.veiculo?.codigo_fipe || 'Não informado'}`],
      [`Valor FIPE: ${reportData.veiculo?.valor_fipe || 'Não informado'}`, vehicleData?.quilometragem ? `Quilometragem: ${parseInt(vehicleData.quilometragem.replace(/\D/g, '')).toLocaleString('pt-BR')} km` : 'Não informado']
    ];

    vehicleInfo.forEach(([left, right]) => {
      if (left && typeof left === 'string') {
        page1.drawText(left, {
          x: margin,
          y: currentY,
          size: 11,
          font: helveticaFont,
          color: darkGray,
        });
      }
      if (right && typeof right === 'string') {
        page1.drawText(right, {
          x: margin + contentWidth / 2,
          y: currentY,
          size: 11,
          font: helveticaFont,
          color: darkGray,
        });
      }
      currentY -= lineHeight;
    });
        x: margin,
        y: currentY,
        size: 11,
        font: helveticaFont,
        color: darkGray,
      });
      if (right) {
        page1.drawText(right, {
          x: margin + contentWidth / 2,
          y: currentY,
          size: 11,
          font: helveticaFont,
          color: darkGray,
        });
      }
      currentY -= lineHeight;
    });

    currentY -= 30;

    // Technical results section
    page1.drawRectangle({
      x: margin - 10,
      y: currentY - 120,
      width: contentWidth + 20,
      height: 140,
      color: backgroundColor,
    });

    page1.drawText('RESULTADOS TÉCNICOS', {
      x: margin,
      y: currentY,
      size: 16,
      font: helveticaBoldFont,
      color: primaryColor,
    });
    currentY -= 25;

    const technicalResults = [
      `• Repintura detectada em: ${reportData.sintese?.repintura_em || 'Não informado'}`,
      `• Massa plástica visível em: ${reportData.sintese?.massa_em || 'Não informado'}`,
      `• Alinhamento comprometido: ${reportData.sintese?.alinhamento_comprometido || 'Não informado'}`,
      `• Vidros/faróis trocados: ${reportData.sintese?.vidros_trocados || 'Não informado'}`,
      `• Estrutura inferior: ${reportData.sintese?.estrutura_inferior || 'Não informado'}`,
    ];

    technicalResults.forEach(result => {
      if (result && typeof result === 'string') {
        page1.drawText(result, {
          x: margin,
          y: currentY,
          size: 11,
          font: helveticaFont,
          color: darkGray,
        });
      }
      currentY -= lineHeight;
    });

    currentY -= 30;

    // Risk classification with colored background
    const conclusaoFinal = reportData.sintese?.conclusao_final || 'Não informado';
    const riskLevel = conclusaoFinal === 'Veículo sem indícios de colisão' ? 'BAIXO' : 
                     conclusaoFinal === 'Estrutura comprometida' ? 'ALTO' : 'MÉDIO';
    
    const riskColor = riskLevel === 'BAIXO' ? rgb(0, 0.7, 0) : 
                     riskLevel === 'ALTO' ? rgb(0.8, 0, 0) : rgb(0.8, 0.6, 0);

    page1.drawRectangle({
      x: margin - 10,
      y: currentY - 40,
      width: contentWidth + 20,
      height: 50,
      color: riskColor,
    });

    page1.drawText(`CLASSIFICAÇÃO DE RISCO: ${riskLevel}`, {
      x: margin,
      y: currentY - 15,
      size: 16,
      font: helveticaBoldFont,
      color: rgb(1, 1, 1),
    });

    page1.drawText(conclusaoFinal, {
      x: margin,
      y: currentY - 30,
      size: 12,
      font: helveticaFont,
      color: rgb(1, 1, 1),
    });

    currentY -= 70;

    // Components analysis
    if (reportData.componentes && Array.isArray(reportData.componentes) && reportData.componentes.length > 0 && currentY < 200) {
      const page2 = pdfDoc.addPage([pageWidth, pageHeight]);
      currentY = pageHeight - 50;
      
      page2.drawText('COMPONENTES ANALISADOS', {
        x: margin,
        y: currentY,
        size: 16,
        font: helveticaBoldFont,
        color: primaryColor,
      });
      currentY -= 30;

      reportData.componentes.forEach((comp, index) => {
        if (currentY < 100) {
          const newPage = pdfDoc.addPage([pageWidth, pageHeight]);
          currentY = pageHeight - 50;
        }

        // Component background
        page2.drawRectangle({
          x: margin - 5,
          y: currentY - 35,
          width: contentWidth + 10,
          height: 40,
          color: index % 2 === 0 ? backgroundColor : rgb(1, 1, 1),
        });

        const componentName = comp?.nome || `Componente ${index + 1}`;
        page2.drawText(`${index + 1}. ${componentName}`, {
          x: margin,
          y: currentY - 10,
          size: 12,
          font: helveticaBoldFont,
          color: darkGray,
        });

        const componentState = comp?.estado || 'Não informado';
        page2.drawText(`Estado: ${componentState}`, {
          x: margin + 300,
          y: currentY - 10,
          size: 11,
          font: helveticaFont,
          color: componentState?.toLowerCase() === 'original' ? rgb(0, 0.7, 0) : rgb(0.8, 0.6, 0),
        });

        const componentConclusion = comp?.conclusao || 'Sem observações';
        page2.drawText(componentConclusion, {
          x: margin,
          y: currentY - 25,
          size: 10,
          font: helveticaFont,
          color: lightGray,
        });

        currentY -= 50;
      });
    }

    // Images section
    if (imagePaths && imagePaths.length > 0) {
      console.log('Adding images to PDF:', imagePaths.length);
      
      const imagesPage = pdfDoc.addPage([pageWidth, pageHeight]);
      let imageY = pageHeight - 50;
      let imagesPerPage = 0;
      const maxImagesPerPage = 2;
      const imageMaxWidth = contentWidth;
      const imageMaxHeight = 300;

      // Images page header
      imagesPage.drawText('FOTOS DO VEÍCULO', {
        x: margin,
        y: imageY,
        size: 18,
        font: helveticaBoldFont,
        color: primaryColor,
      });
      imageY -= 50;

      let currentPage = imagesPage;

      for (let i = 0; i < imagePaths.length; i++) {
        try {
          console.log(`Processing image ${i + 1}/${imagePaths.length}: ${imagePaths[i]}`);
          
          // Clean path and create signed URL
          const imagePath = imagePaths[i].startsWith('/') ? imagePaths[i].substring(1) : imagePaths[i];
          console.log(`Creating signed URL for path: ${imagePath}`);
          
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from('fotos')
            .createSignedUrl(imagePath, 3600);

          if (signedUrlError) {
            console.error(`Error creating signed URL for image ${i + 1}:`, signedUrlError);
            continue;
          }

          if (!signedUrlData?.signedUrl) {
            console.error(`No signed URL returned for image ${i + 1}`);
            continue;
          }

          console.log(`Fetching image from: ${signedUrlData.signedUrl}`);

          // Fetch image with proper headers
          const imageResponse = await fetch(signedUrlData.signedUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; PDF-Generator/1.0)',
              'Accept': 'image/*',
            }
          });
          
          if (!imageResponse.ok) {
            console.error(`Failed to fetch image ${i + 1}:`, imageResponse.status, imageResponse.statusText);
            continue;
          }

          const imageBytes = await imageResponse.arrayBuffer();
          
          if (imageBytes.byteLength === 0) {
            console.error(`Image ${i + 1} is empty`);
            continue;
          }
          
          console.log(`Image ${i + 1} fetched successfully, size:`, imageBytes.byteLength, 'bytes');
          
          // Embed image
          let image;
          const contentType = imageResponse.headers.get('content-type') || '';
          
          try {
            if (contentType.includes('png') || imagePath.toLowerCase().includes('.png')) {
              image = await pdfDoc.embedPng(imageBytes);
            } else {
              image = await pdfDoc.embedJpg(imageBytes);
            }
          } catch (embedError) {
            console.error(`Error embedding image ${i + 1}:`, embedError);
            // Try alternative format
            try {
              if (contentType.includes('png') || imagePath.toLowerCase().includes('.png')) {
                image = await pdfDoc.embedJpg(imageBytes);
              } else {
                image = await pdfDoc.embedPng(imageBytes);
              }
            } catch (secondError) {
              console.error(`Failed to embed image ${i + 1} in both formats:`, secondError);
              continue;
            }
          }

          if (!image) {
            console.error(`Failed to embed image ${i + 1}`);
            continue;
          }

          console.log(`Image ${i + 1} embedded successfully, dimensions:`, image.width, 'x', image.height);

          // Calculate scaled dimensions
          const scaleX = imageMaxWidth / image.width;
          const scaleY = imageMaxHeight / image.height;
          const scale = Math.min(scaleX, scaleY, 1);
          
          const finalWidth = image.width * scale;
          const finalHeight = image.height * scale;

          // Check if we need a new page
          if (imagesPerPage >= maxImagesPerPage || imageY - finalHeight - 80 < margin) {
            console.log(`Creating new page for image ${i + 1}`);
            currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
            imageY = pageHeight - 50;
            imagesPerPage = 0;
            
            currentPage.drawText('FOTOS DO VEÍCULO (continuação)', {
              x: margin,
              y: imageY,
              size: 18,
              font: helveticaBoldFont,
              color: primaryColor,
            });
            imageY -= 50;
          }

          // Center image horizontally
          const imageX = margin + (contentWidth - finalWidth) / 2;

          // Draw image border
          currentPage.drawRectangle({
            x: imageX - 5,
            y: imageY - finalHeight - 5,
            width: finalWidth + 10,
            height: finalHeight + 10,
            borderColor: lightGray,
            borderWidth: 1,
          });

          // Draw image
          currentPage.drawImage(image, {
            x: imageX,
            y: imageY - finalHeight,
            width: finalWidth,
            height: finalHeight,
          });

          // Add image caption with background
          currentPage.drawRectangle({
            x: imageX,
            y: imageY - finalHeight - 30,
            width: finalWidth,
            height: 20,
            color: backgroundColor,
          });

          const vehicleModel = reportData.veiculo?.modelo || 'Veículo';
          currentPage.drawText(`Foto ${i + 1} - ${vehicleModel}`, {
            x: imageX + 10,
            y: imageY - finalHeight - 20,
            size: 10,
            font: helveticaBoldFont,
            color: darkGray,
          });

          imageY -= finalHeight + 80;
          imagesPerPage++;

          console.log(`Image ${i + 1} added successfully to PDF`);
        } catch (error) {
          console.error(`Error processing image ${i + 1}:`, error);
        }
      }
    }

    // Add footer to all pages
    const pages = pdfDoc.getPages();
    console.log(`Adding footers to ${pages.length} pages`);
    
    pages.forEach((page, index) => {
      // Footer background
      page.drawRectangle({
        x: 0,
        y: 0,
        width: pageWidth,
        height: 40,
        color: backgroundColor,
      });

      page.drawText('ReviuCar - Análise Técnica Veicular com IA', {
        x: margin,
        y: 20,
        size: 10,
        font: helveticaBoldFont,
        color: primaryColor,
      });
      
      page.drawText(`Página ${index + 1} de ${pages.length} | ${currentDate}`, {
        x: pageWidth - 150,
        y: 20,
        size: 9,
        font: helveticaFont,
        color: lightGray,
      });

      page.drawText('www.reviucar.com.br', {
        x: margin,
        y: 8,
        size: 8,
        font: helveticaFont,
        color: lightGray,
      });
    });

    // Generate PDF bytes
    console.log('Generating PDF bytes...');
    const pdfBytes = await pdfDoc.save();
    console.log('PDF generated successfully, size:', pdfBytes.length, 'bytes');

    // Save PDF to storage
    const fileName = `laudo_${reportData.veiculo.placa}_${Date.now()}.pdf`;
    
    console.log('Saving PDF to storage with filename:', fileName);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('laudos')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading PDF:', uploadError);
      throw new Error(`Failed to save PDF: ${uploadError.message}`);
    }

    console.log('PDF uploaded successfully:', uploadData);

    // Create signed URL for download
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('laudos')
      .createSignedUrl(fileName, 3600);

    if (signedUrlError) {
      console.error('Error creating signed URL:', signedUrlError);
      throw new Error(`Failed to create download URL: ${signedUrlError.message}`);
    }

    console.log('PDF signed URL created successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        pdfUrl: signedUrlData.signedUrl,
        fileName: fileName,
        imageCount: imagePaths?.length || 0
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
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Unknown error occurred',
        success: false,
        stack: error.stack
      }),
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