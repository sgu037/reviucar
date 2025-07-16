import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AnalysisParams {
  photos: File[];
  vehicleData: {
    fipeData: any;
    placa: string;
  };
}

interface AnalysisResult {
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
  };
}

export const useVehicleAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeVehicle = async ({ photos, vehicleData }: AnalysisParams): Promise<AnalysisResult | null> => {
    setIsAnalyzing(true);
    
    try {
      toast({
        title: "Iniciando Análise",
        description: "Enviando fotos para análise com IA...",
      });

      // 1. Upload das fotos para o Supabase Storage
      const uploadPromises = photos.map(async (photo, index) => {
        const fileName = `${Date.now()}_${index}_${photo.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        
        console.log(`Uploading photo ${index + 1}/${photos.length}: ${fileName}`);
        
        const { data, error } = await supabase.storage
          .from('fotos')
          .upload(fileName, photo, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (error) {
          console.error('Erro no upload da foto:', error);
          throw new Error(`Erro no upload da foto ${index + 1}: ${error.message}`);
        }
        
        console.log(`Photo ${index + 1} uploaded successfully:`, data.path);
        return data.path;
      });

      const uploadedPaths = await Promise.all(uploadPromises);
      console.log('Fotos enviadas com sucesso:', uploadedPaths);

      toast({
        title: "Fotos Enviadas",
        description: "Processando análise técnica...",
      });

      // 2. Chamar a função edge para análise
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado. Faça login para continuar.');
      }
      
      const userId = user.id;
      
      console.log('Calling edge function with data:', {
        paths: uploadedPaths,
        meta: {
          user_id: userId,
          placa: vehicleData.placa,
          modelo: vehicleData.fipeData?.marcaModelo || vehicleData.fipeData?.Modelo || vehicleData.fipeData?.modelo || 'Modelo não identificado'
        }
      });
      
      const response = await supabase.functions.invoke('analyze_car', {
        body: {
          paths: uploadedPaths,
          meta: {
            user_id: userId,
            placa: vehicleData.placa,
            modelo: vehicleData.fipeData?.marcaModelo || vehicleData.fipeData?.Modelo || vehicleData.fipeData?.modelo || 'Modelo não identificado'
          }
        }
      });

      console.log('Edge function response:', response);

      if (response.error) {
        console.error('Edge function error:', response.error);
        
        // Try to extract meaningful error message
        let errorMessage = 'Erro desconhecido na análise';
        
        if (typeof response.error === 'string') {
          errorMessage = response.error;
        } else if (response.error?.message) {
          errorMessage = response.error.message;
        } else if (response.error?.error) {
          errorMessage = response.error.error;
        }
        
        throw new Error(`Erro na função de análise: ${errorMessage}`);
      }

      const analysisData = response.data;
      
      if (!analysisData) {
        throw new Error('Nenhum dado retornado da função de análise');
      }

      if (analysisData.status === 'error') {
        console.error('Analysis returned error:', analysisData);
        throw new Error(analysisData.error || 'A análise retornou um erro desconhecido');
      }

      console.log('Análise concluída com sucesso:', analysisData);

      // 3. Estruturar os dados do relatório
      const reportData: AnalysisResult = {
        veiculo: {
          marca: vehicleData.fipeData?.marca || analysisData.laudo?.veiculo?.marca || "",
          modelo: vehicleData.fipeData?.marcaModelo || vehicleData.fipeData?.Modelo || analysisData.laudo?.veiculo?.modelo || "",
          ano: vehicleData.fipeData?.anoModelo || vehicleData.fipeData?.AnoModelo || 0,
          valor_fipe: vehicleData.fipeData?.fipe?.dados?.[0]?.texto_valor || vehicleData.fipeData?.Valor || "",
          codigo_fipe: vehicleData.fipeData?.fipe?.dados?.[0]?.codigo_fipe || vehicleData.fipeData?.CodigoFipe || "",
          combustivel: vehicleData.fipeData?.fipe?.dados?.[0]?.combustivel || vehicleData.fipeData?.Combustivel || "",
          placa: vehicleData.placa || analysisData.laudo?.veiculo?.placa || ""
        },
        componentes: analysisData.laudo?.componentes || [],
        sintese: analysisData.laudo?.sintese || {
          resumo: "Análise não completada",
          repintura_em: "nenhuma",
          massa_em: "nenhuma",
          alinhamento_comprometido: "nenhuma",
          vidros_trocados: "nenhuma",
          estrutura_inferior: "OK",
          estrutura_ok: true,
          conclusao_final: "Veículo sem indícios de colisão"
        }
      };

      return reportData;

    } catch (error) {
      console.error('Erro completo na análise:', error);
      
      let userFriendlyMessage = 'Falha ao processar análise do veículo';
      
      if (error.message) {
        if (error.message.includes('OpenAI')) {
          userFriendlyMessage = 'Erro no serviço de IA. Tente novamente em alguns minutos.';
        } else if (error.message.includes('upload')) {
          userFriendlyMessage = 'Erro no upload das fotos. Verifique sua conexão.';
        } else if (error.message.includes('Database')) {
          userFriendlyMessage = 'Erro no banco de dados. Tente novamente.';
        } else if (error.message.includes('Supabase configuration')) {
          userFriendlyMessage = 'Erro de configuração do sistema. Contate o suporte.';
        } else {
          userFriendlyMessage = error.message;
        }
      }
      
      toast({
        title: "Erro na Análise",
        description: userFriendlyMessage,
        variant: "destructive"
      });
      
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    analyzeVehicle,
    isAnalyzing
  };
};