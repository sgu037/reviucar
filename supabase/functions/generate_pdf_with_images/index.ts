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
    
    // Page 1 - Report Data
    const page1 = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page1.getSize();
    
    let currentY = height - 50;
    const margin = 50;
    const lineHeight = 20;

    // Header
    page1.drawText('LAUDO TÉCNICO DE AVALIAÇÃO VEICULAR', {
      x: margin,
      y: currentY,
      size: 18,
      font: helveticaBoldFont,
      color: rgb(0.8, 0, 0), // Red color
    });
    currentY -= 40;

    // Vehicle info
    page1.drawText('DADOS DO VEÍCULO', {
      x: margin,
      y: currentY,
      size: 14,
      font: helveticaBoldFont,
    });
    currentY -= lineHeight;

    const vehicleInfo = [
      `Modelo: ${reportData.veiculo.modelo}`,
      `Marca: ${reportData.veiculo.marca}`,
      `Ano: ${reportData.veiculo.ano}`,
      `Placa: ${reportData.veiculo.placa}`,
      `Combustível: ${reportData.veiculo.combustivel}`,
      `Valor FIPE: ${reportData.veiculo.valor_fipe}`,
      `Código FIPE: ${reportData.veiculo.codigo_fipe}`,
    ];

    if (vehicleData?.quilometragem) {
      vehicleInfo.push(`Quilometragem: ${parseInt(vehicleData.quilometragem.replace(/\D/g, '')).toLocaleString('pt-BR')} km`);
    }

    vehicleInfo.forEach(info => {
      page1.drawText(info, {
        x: margin,
        y: currentY,
        size: 12,
        font: helveticaFont,
      });
      currentY -= lineHeight;
    });

    currentY -= 20;

    // Technical results
    page1.drawText('RESULTADOS TÉCNICOS', {
      x: margin,
      y: currentY,
      size: 14,
      font: helveticaBoldFont,
    });
    currentY -= lineHeight;

    const technicalResults = [
      `Repintura detectada em: ${reportData.sintese.repintura_em}`,
      `Massa plástica visível em: ${reportData.sintese.massa_em}`,
      `Alinhamento comprometido: ${reportData.sintese.alinhamento_comprometido}`,
      `Vidros/faróis trocados: ${reportData.sintese.vidros_trocados}`,
      `Estrutura inferior: ${reportData.sintese.estrutura_inferior}`,
    ];

    technicalResults.forEach(result => {
      page1.drawText(result, {
        x: margin,
        y: currentY,
        size: 12,
        font: helveticaFont,
      });
      currentY -= lineHeight;
    });

    currentY -= 20;

    // Components analysis
    page1.drawText('COMPONENTES ANALISADOS', {
      x: margin,
      y: currentY,
      size: 14,
      font: helveticaBoldFont,
    });
    currentY -= lineHeight;

    reportData.componentes.forEach(comp => {
      const componentText = `• ${comp.nome}: ${comp.estado} - ${comp.conclusao}`;
      page1.drawText(componentText, {
        x: margin,
        y: currentY,
        size: 10,
        font: helveticaFont,
      });
      currentY -= 15;
    });

    currentY -= 20;

    // Final conclusion
    page1.drawText('CONCLUSÃO FINAL', {
      x: margin,
      y: currentY,
      size: 14,
      font: helveticaBoldFont,
    });
    currentY -= lineHeight;

    page1.drawText(reportData.sintese.resumo, {
      x: margin,
      y: currentY,
      size: 12,
      font: helveticaFont,
    });
    currentY -= lineHeight;

    page1.drawText(`Classificação: ${reportData.sintese.conclusao_final}`, {
      x: margin,
      y: currentY,
      size: 12,
      font: helveticaBoldFont,
      color: rgb(0.8, 0, 0),
    });

    // Page 2+ - Images
    if (imagePaths && imagePaths.length > 0) {
      console.log('Adding images to PDF:', imagePaths.length);
      
      let currentPage = pdfDoc.addPage([595, 842]);
      let imageY = height - 50;
      let imagesPerPage = 0;
      const maxImagesPerPage = 3;
      const imageHeight = 200;
      const imageSpacing = 50;

      // Add images page header
      currentPage.drawText('FOTOS DO VEÍCULO', {
        x: margin,
        y: imageY,
        size: 16,
        font: helveticaBoldFont,
      });
      imageY -= 40;

      for (let i = 0; i < imagePaths.length; i++) {
        try {
          console.log(`Processing image ${i + 1}/${imagePaths.length}: ${imagePaths[i]}`);
          
          // Create signed URL for the image with proper path handling
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

          console.log(`Signed URL created: ${signedUrlData.signedUrl}`);

          // Fetch image with proper headers
          const imageResponse = await fetch(signedUrlData.signedUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; PDF-Generator/1.0)',
            }
          });
          
          if (!imageResponse.ok) {
            console.error(`Failed to fetch image ${i + 1}:`, imageResponse.status, imageResponse.statusText);
            continue;
          }

          console.log(`Image ${i + 1} fetched successfully, content-type:`, imageResponse.headers.get('content-type'));

          const imageBytes = await imageResponse.arrayBuffer();
          
          if (imageBytes.byteLength === 0) {
            console.error(`Image ${i + 1} is empty`);
            continue;
          }
          
          console.log(`Image ${i + 1} size:`, imageBytes.byteLength, 'bytes');
          
          // Determine image type and embed
          let image;
          const contentType = imageResponse.headers.get('content-type') || '';
          console.log(`Processing image ${i + 1} with content-type: ${contentType}`);
          
          if (contentType.includes('jpeg') || contentType.includes('jpg')) {
            image = await pdfDoc.embedJpg(imageBytes);
          } else if (contentType.includes('png')) {
            image = await pdfDoc.embedPng(imageBytes);
          } else {
            // Try to determine by file extension or default to JPEG
            const pathLower = imagePath.toLowerCase();
            if (pathLower.includes('.png')) {
              image = await pdfDoc.embedPng(imageBytes);
            } else {
              // Default to JPEG
              image = await pdfDoc.embedJpg(imageBytes);
            }
          }

          if (!image) {
            console.error(`Failed to embed image ${i + 1}`);
            continue;
          }

          console.log(`Image ${i + 1} embedded successfully, dimensions:`, image.width, 'x', image.height);

          // Calculate image dimensions to fit page
          const maxImageWidth = width - 2 * margin;
          const maxImageHeight = 250; // Maximum height per image
          
          // Calculate scale to fit both width and height constraints
          const scaleX = maxImageWidth / image.width;
          const scaleY = maxImageHeight / image.height;
          const scale = Math.min(scaleX, scaleY, 1); // Don't upscale
          
          const finalWidth = image.width * scale;
          const finalHeight = image.height * scale;

          console.log(`Image ${i + 1} final dimensions:`, finalWidth, 'x', finalHeight);

          // Check if we need a new page
          if (imagesPerPage >= maxImagesPerPage || imageY - finalHeight - 60 < margin) {
            console.log(`Creating new page for image ${i + 1}`);
            currentPage = pdfDoc.addPage([595, 842]);
            imageY = height - 50;
            imagesPerPage = 0;
            
            currentPage.drawText('FOTOS DO VEÍCULO (continuação)', {
              x: margin,
              y: imageY,
              size: 16,
              font: helveticaBoldFont,
            });
            imageY -= 40;
          }

          // Center image horizontally
          const imageX = margin + (maxImageWidth - finalWidth) / 2;

          // Draw image
          currentPage.drawImage(image, {
            x: imageX,
            y: imageY - finalHeight,
            width: finalWidth,
            height: finalHeight,
          });

          // Add image caption
          currentPage.drawText(`Foto ${i + 1}`, {
            x: imageX,
            y: imageY - finalHeight - 20,
            size: 10,
            font: helveticaFont,
            color: rgb(0.5, 0.5, 0.5),
          });

          imageY -= finalHeight + 60; // Space between images
          imagesPerPage++;

          console.log(`Image ${i + 1} added successfully to PDF`);
        } catch (error) {
          console.error(`Error processing image ${i + 1}:`, error);
          // Continue with next image instead of failing completely
        }
      }
    } else {
      console.log('No images provided for PDF generation');
    }

    // Add footer to all pages
    const pages = pdfDoc.getPages();
    console.log(`Adding footers to ${pages.length} pages`);
    
    pages.forEach((page, index) => {
      page.drawText(`ReviuCar - Análise Técnica Veicular - Página ${index + 1}/${pages.length}`, {
        x: margin,
        y: 30,
        size: 8,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
      });
      
      page.drawText(`Data: ${new Date().toLocaleDateString('pt-BR')}`, {
        x: width - 150,
        y: 30,
        size: 8,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
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
      .createSignedUrl(fileName, 3600); // 1 hour expiry

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
            try {
              image = await pdfDoc.embedJpg(imageBytes);
            } catch {
              image = await pdfDoc.embedPng(imageBytes);
            }
          }

          // Calculate image dimensions
          const imageWidth = Math.min(400, width - 2 * margin);
          const scaledHeight = (image.height / image.width) * imageWidth;
          const finalHeight = Math.min(scaledHeight, imageHeight);
          const finalWidth = (image.width / image.height) * finalHeight;

          // Check if we need a new page
          if (imagesPerPage >= maxImagesPerPage || imageY - finalHeight < margin) {
            currentPage = pdfDoc.addPage([595, 842]);
            imageY = height - 50;
            imagesPerPage = 0;
            
            currentPage.drawText('FOTOS DO VEÍCULO (continuação)', {
              x: margin,
              y: imageY,
              size: 16,
              font: helveticaBoldFont,
            });
            imageY -= 40;
          }

          // Draw image
          currentPage.drawImage(image, {
            x: margin + (imageWidth - finalWidth) / 2,
            y: imageY - finalHeight,
            width: finalWidth,
            height: finalHeight,
          });

          // Add image caption
          currentPage.drawText(`Foto ${i + 1}`, {
            x: margin,
            y: imageY - finalHeight - 20,
            size: 10,
            font: helveticaFont,
            color: rgb(0.5, 0.5, 0.5),
          });

          imageY -= finalHeight + imageSpacing;
          imagesPerPage++;

          console.log(`Image ${i + 1} added successfully`);
        } catch (error) {
          console.error(`Error processing image ${i + 1}:`, error);
          // Continue with next image
        }
      }
    }

    // Add footer to all pages
    const pages = pdfDoc.getPages();
    pages.forEach((page, index) => {
      page.drawText(`ReviuCar - Análise Técnica Veicular - Página ${index + 1}/${pages.length}`, {
        x: margin,
        y: 30,
        size: 8,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
      });
      
      page.drawText(`Data: ${new Date().toLocaleDateString('pt-BR')}`, {
        x: width - 150,
        y: 30,
        size: 8,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
      });
    });

    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save();
    console.log('PDF generated successfully, size:', pdfBytes.length);

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

    // Create signed URL for download (more reliable than public URL)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('laudos')
      .createSignedUrl(fileName, 3600); // 1 hour expiry

    if (signedUrlError) {
      console.error('Error creating signed URL:', signedUrlError);
      throw new Error(`Failed to create download URL: ${signedUrlError.message}`);
    }

    console.log('PDF signed URL created successfully:', signedUrlData.signedUrl);

    return new Response(
      JSON.stringify({ 
        success: true,
        pdfUrl: signedUrlData.signedUrl,
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
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Unknown error occurred',
        success: false
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