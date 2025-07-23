import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  console.log('Function called with method:', req.method);
  
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

    const { paths, meta } = requestBody;
    
    console.log('Received analysis request:', { 
      pathsCount: paths?.length, 
      meta: meta 
    });

    // Validate required fields
    if (!paths || !Array.isArray(paths) || paths.length === 0) {
      throw new Error('No photo paths provided');
    }

    if (!meta || !meta.placa || !meta.modelo) {
      throw new Error('Missing required metadata (placa or modelo)');
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    console.log('Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseServiceKey,
      hasOpenAIKey: !!openaiApiKey
    });

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create signed URLs for the photos
    console.log('Creating signed URLs for', paths.length, 'photos');
    
    const signedUrlPromises = paths.map(async (path, index) => {
      try {
        console.log(`Creating signed URL for photo ${index + 1}: ${path}`);
        
        const { data, error } = await supabase.storage
          .from('fotos')
          .createSignedUrl(path, 3600); // 1 hour expiry
        
        if (error) {
          console.error(`Error creating signed URL for ${path}:`, error);
          throw new Error(`Failed to create signed URL for photo ${index + 1}: ${error.message}`);
        }
        
        if (!data?.signedUrl) {
          throw new Error(`No signed URL returned for photo ${index + 1}`);
        }
        
        console.log(`Signed URL created for photo ${index + 1}`);
        return data.signedUrl;
      } catch (err) {
        console.error(`Failed to process photo ${index + 1}:`, err);
        throw err;
      }
    });

    const signedUrls = await Promise.all(signedUrlPromises);
    console.log('All signed URLs created successfully:', signedUrls.length);

    // Prepare messages for OpenAI
    const messages = [
      {
        role: "system",
        content: `Você é um avaliador técnico especializado em veículos usados. Sua missão é identificar sinais de colisões, massa plástica e retoques de pintura com base em fotos, mesmo que o reparo tenha sido bem feito. Use linguagem objetiva, frases curtas, técnica e sem rodeios. Não invente. Só afirme quando houver indício técnico.

PROTOCOLO DE VERIFICAÇÃO:

1. Pintura e Brilho
- Compare o tom, brilho e textura entre peças vizinhas.
- Repare em diferenças sutis de cor, granulação ou reflexo.
- Manchas foscas, excesso de brilho ou "casca de laranja" indicam retoque.

2. Alinhamento e Geometria
- Verifique os vãos entre portas, paralamas, capô e tampa traseira.
- Folgas irregulares ou desalinhamentos laterais sugerem batida ou troca de peça.

3. Ondulações e Massa Plástica
- Observe a lataria de perfil: massa gera ondulações leves ou curvas suavizadas.
- Textura diferente ao toque ou falta de relevo indica uso de massa.

4. Parafusos e Dobradiças
- Veja se há marcas de ferramenta, tinta rompida ou reaperto em dobradiças.
- Parafuso com sinal de chave = desmontagem ou troca de peça.

5. Vidros e Faróis
- Compare datas de fabricação dos vidros e faróis.
- Diferenças revelam substituição após impacto ou quebra.

6. Teste do Ímã ou Toque Leve
- Em áreas com massa, o ímã não gruda ou tem aderência fraca.
- O som ao bater com os dedos é abafado, sem eco metálico.

7. Assoalho e Estrutura Inferior
- Marcas de solda, pintura recente, amassados ou excesso de proteção podem indicar colisão grave ou recuperação estrutural.

8. Teste de Fechamento
- Portas que exigem força ou fecham com ruído seco = desalinhamento estrutural.`
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analise tecnicamente o veículo ${meta.modelo}, placa ${meta.placa}, aplicando rigorosamente o protocolo de verificação de batidas, massa e retoques. Seja preciso e técnico.`
          },
          ...signedUrls.map(url => ({
            type: "image_url",
            image_url: { url, detail: "auto" }
          }))
        ]
      }
    ];

    console.log('Calling OpenAI API...');

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.1,
        max_tokens: 4000,
        messages,
        tools: [
          {
            type: "function",
            function: {
              name: "gerar_parecer_tecnico",
              description: "Gera parecer técnico de verificação de batidas e retoques",
              parameters: {
                type: "object",
                properties: {
                  veiculo: {
                    type: "object",
                    properties: {
                      modelo: { type: "string" },
                      placa: { type: "string" }
                    },
                    required: ["modelo", "placa"]
                  },
                  componentes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        nome: { type: "string", description: "Nome da peça ou área analisada" },
                        estado: { type: "string", enum: ["Original", "Retocado", "Repintura", "Massa", "Troca"] },
                        conclusao: { type: "string", description: "Observação técnica específica" }
                      },
                      required: ["nome", "estado", "conclusao"]
                    }
                  },
                  sintese: {
                    type: "object",
                    properties: {
                      resumo: { type: "string", description: "Parecer técnico resumido" },
                      repintura_em: { type: "string", description: "Peças com repintura ou 'nenhuma'" },
                      massa_em: { type: "string", description: "Painéis com massa plástica ou 'nenhuma'" },
                      alinhamento_comprometido: { type: "string", description: "Laterais ou peças desalinhadas ou 'nenhuma'" },
                      vidros_trocados: { type: "string", description: "Vidros ou lanternas substituídos ou 'nenhuma'" },
                      estrutura_inferior: { type: "string", enum: ["OK", "Indício de reparo", "Solda aparente"] },
                      estrutura_ok: { type: "boolean", description: "Se a estrutura está preservada" },
                      conclusao_final: { 
                        type: "string", 
                        enum: ["Veículo sem indícios de colisão", "Colisão leve", "Reparo estético", "Batida significativa", "Estrutura comprometida"]
                      }
                    },
                    required: ["resumo", "repintura_em", "massa_em", "alinhamento_comprometido", "vidros_trocados", "estrutura_inferior", "estrutura_ok", "conclusao_final"]
                  }
                },
                required: ["veiculo", "componentes", "sintese"]
              }
            }
          }
        ],
        tool_choice: "auto"
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', {
        status: openaiResponse.status,
        statusText: openaiResponse.statusText,
        error: errorText
      });
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
    }

    const aiResponse = await openaiResponse.json();
    console.log('OpenAI response received successfully');

    // Process AI response
    let laudo;
    if (aiResponse.choices?.[0]?.message?.tool_calls?.[0]) {
      try {
        laudo = JSON.parse(aiResponse.choices[0].message.tool_calls[0].function.arguments);
        console.log('Laudo parsed successfully from tool call');
      } catch (parseError) {
        console.error('Error parsing tool call arguments:', parseError);
        throw new Error('Failed to parse AI response');
      }
    } else {
      console.log('No tool call found, using fallback laudo');
      // Fallback if no tool call
      laudo = {
        veiculo: { 
          modelo: meta.modelo, 
          placa: meta.placa 
        },
        componentes: [
          { 
            nome: "Análise geral", 
            estado: "Original", 
            conclusao: "Análise não completada adequadamente pela IA" 
          }
        ],
        sintese: { 
          resumo: "Análise parcial realizada devido a limitações técnicas", 
          repintura_em: "nenhuma",
          massa_em: "nenhuma", 
          alinhamento_comprometido: "nenhuma",
          vidros_trocados: "nenhuma",
          estrutura_inferior: "OK",
          estrutura_ok: true,
          conclusao_final: "Veículo sem indícios de colisão"
        }
      };
    }

    // Save analysis to database
    console.log('Saving analysis to database...');
    
    const { data: analise, error: insertError } = await supabase
      .from('analises')
      .insert({
        user_id: meta.user_id || 'anonymous',
        placa: meta.placa,
        modelo: meta.modelo,
        json_laudo: laudo,
        status: 'gerado',
        imagens: paths // Save image paths
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error(`Database error: ${insertError.message}`);
    }

    console.log('Analysis saved with ID:', analise.id);

    // Generate PDF content
    const pdfContent = `PARECER TÉCNICO – VERIFICAÇÃO DE BATIDAS E RETOQUES
Veículo: ${meta.modelo} | Placa: ${meta.placa}

RESULTADO DA ANÁLISE:
• Presença de repintura em: ${laudo.sintese.repintura_em}
• Massa plástica aparente em: ${laudo.sintese.massa_em}
• Alinhamento comprometido em: ${laudo.sintese.alinhamento_comprometido}
• Vidros ou lanternas trocadas: ${laudo.sintese.vidros_trocados}
• Estrutura inferior: ${laudo.sintese.estrutura_inferior}
• Conclusão: ${laudo.sintese.conclusao_final}

COMPONENTES ANALISADOS:
${laudo.componentes.map((c) => `• ${c.nome}: ${c.estado} - ${c.conclusao}`).join('\n')}

PARECER FINAL:
${laudo.sintese.resumo}`;
    
    const pdfPath = `${analise.id}.pdf`;
    
    // Store technical report
    try {
      const { error: uploadError } = await supabase.storage
        .from('laudos')
        .upload(pdfPath, new Blob([pdfContent], { type: 'text/plain' }), {
          contentType: 'text/plain'
        });

      if (uploadError) {
        console.error('PDF upload error:', uploadError);
      } else {
        // Update analysis with PDF URL
        await supabase
          .from('analises')
          .update({ url_pdf: pdfPath })
          .eq('id', analise.id);
        
        console.log('PDF saved successfully');
      }
    } catch (pdfError) {
      console.error('PDF processing error:', pdfError);
      // Don't fail the entire request for PDF issues
    }

    console.log('Analysis completed successfully');

    return new Response(
      JSON.stringify({ 
        status: 'ok', 
        id: analise.id,
        laudo: laudo
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
    console.error('Error in analyze_car function:', error);
    
    const errorMessage = error.message || 'Unknown error occurred';
    const errorResponse = {
      error: errorMessage,
      status: 'error',
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