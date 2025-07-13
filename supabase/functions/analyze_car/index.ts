import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paths, meta } = await req.json();
    
    console.log('Received analysis request:', { paths, meta });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create signed URLs for the photos
    const signedUrls = await Promise.all(
      paths.map(async (path: string) => {
        const { data, error } = await supabase.storage
          .from('fotos')
          .createSignedUrl(path, 1800);
        
        if (error) {
          console.error('Error creating signed URL:', error);
          throw error;
        }
        
        return data.signedUrl;
      })
    );

    console.log('Created signed URLs:', signedUrls.length);

    // Prepare messages for OpenAI
    const messages = [
      {
        role: "system",
        content: "Você é um especialista em funilaria e pintura automotiva no Brasil. Analise as fotos do véiculo e forneça um parecer técnico detalhado em formato JSON."
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analise o veículo ${meta.modelo}, placa ${meta.placa}. Forneça um parecer técnico detalhado sobre o estado da funilaria, pintura e componentes visíveis.`
          },
          ...signedUrls.map(url => ({
            type: "image_url",
            image_url: { url, detail: "auto" }
          }))
        ]
      }
    ];

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.2,
        messages,
        tools: [
          {
            type: "function",
            function: {
              name: "gerar_parecer_tecnico",
              description: "Gera um parecer técnico detalhado do veículo",
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
                        nome: { type: "string", description: "Nome do componente (ex: Para-choque dianteiro, Porta direita)" },
                        estado: { type: "string", description: "Estado do componente (Excelente/Bom/Regular/Ruim)" },
                        observacoes: { type: "string", description: "Observações específicas sobre o componente" }
                      },
                      required: ["nome", "estado", "observacoes"]
                    }
                  },
                  sintese: {
                    type: "object",
                    properties: {
                      resumo: { type: "string", description: "Resumo geral do estado do veículo" },
                      estrutura_ok: { type: "boolean", description: "Se a estrutura está íntegra" },
                      manutencoes_pendentes: {
                        type: "array",
                        items: { type: "string" },
                        description: "Lista de manutenções recomendadas"
                      },
                      valor_estimado_reparos: { type: "string", description: "Estimativa de custo dos reparos necessários" }
                    },
                    required: ["resumo", "estrutura_ok"]
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const aiResponse = await response.json();
    console.log('OpenAI response received');

    let laudo;
    if (aiResponse.choices[0].message.tool_calls) {
      laudo = JSON.parse(aiResponse.choices[0].message.tool_calls[0].function.arguments);
    } else {
      // Fallback if no tool call
      laudo = {
        veiculo: { modelo: meta.modelo, placa: meta.placa },
        componentes: [{ nome: "Análise geral", estado: "Pendente", observacoes: "Análise não completada adequadamente" }],
        sintese: { resumo: "Análise parcial realizada", estrutura_ok: true }
      };
    }

    // Save analysis to database
    const { data: analise, error: insertError } = await supabase
      .from('analises')
      .insert({
        user_id: meta.user_id,
        placa: meta.placa,
        modelo: meta.modelo,
        json_laudo: laudo,
        status: 'gerado'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw insertError;
    }

    console.log('Analysis saved with ID:', analise.id);

    // Generate PDF (simplified version)
    const pdfContent = `Laudo Técnico - ${meta.modelo} (${meta.placa})\n\nResumo: ${laudo.sintese.resumo}\n\nComponentes analisados:\n${laudo.componentes.map((c: any) => `- ${c.nome}: ${c.estado} - ${c.observacoes}`).join('\n')}`;
    
    const pdfPath = `${analise.id}.pdf`;
    
    // For now, store as text file (you can enhance with proper PDF generation later)
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
    }

    return new Response(
      JSON.stringify({ 
        status: 'ok', 
        id: analise.id,
        laudo: laudo
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in analyze_car function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        status: 'error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});