import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Car, 
  Calendar, 
  Gauge, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  FileText,
  MessageCircle,
  ArrowLeft
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ReportViewerProps {
  analysis: any;
  onNewAnalysis: () => void;
  whatsapp?: string;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({ 
  analysis, 
  onNewAnalysis,
  whatsapp 
}) => {
  const handleWhatsAppSend = () => {
    if (!whatsapp) {
      toast({
        title: 'WhatsApp não informado',
        description: 'Número do WhatsApp não foi fornecido para este laudo.',
        variant: 'destructive',
      });
      return;
    }

    const cleanWhatsApp = whatsapp.replace(/\D/g, '');
    
    const message = `🚗 *LAUDO TÉCNICO VEICULAR* 🚗

📋 *DADOS DO VEÍCULO:*
• Modelo: ${analysis.modelo}
• Placa: ${analysis.placa}
• Ano: ${analysis.fipeData?.ano}/${analysis.fipeData?.anoModelo}
• Cor: ${analysis.fipeData?.cor}
• Combustível: ${analysis.fipeData?.combustivel}
• Valor FIPE: ${analysis.fipeData?.fipe?.dados?.[0]?.texto_valor}

🔍 *ANÁLISE TÉCNICA:*
${analysis.json_laudo?.conclusao || 'Análise completa disponível no relatório.'}

📊 *STATUS:* ${analysis.status === 'concluido' ? '✅ Concluído' : '⏳ Em processamento'}

📅 *Data da Análise:* ${new Date(analysis.created_at).toLocaleDateString('pt-BR')}

---
*Laudo gerado por ReviuCar*
*Sistema de Análise Veicular*`;

    const whatsappUrl = `https://wa.me/55${cleanWhatsApp}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: 'WhatsApp aberto!',
      description: 'Mensagem preparada e enviada para o WhatsApp.',
    });
  };

  if (!analysis) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Nenhuma análise selecionada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onNewAnalysis}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Nova Análise
        </Button>
        
        {whatsapp && (
          <Button
            onClick={handleWhatsAppSend}
            className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Enviar WhatsApp
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Relatório de Análise Veicular
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Vehicle Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Car className="h-4 w-4" />
                Dados do Veículo
              </h3>
              <div className="space-y-1 text-sm">
                <p><strong>Modelo:</strong> {analysis.modelo}</p>
                <p><strong>Placa:</strong> {analysis.placa}</p>
                {analysis.fipeData?.ano && (
                  <p><strong>Ano:</strong> {analysis.fipeData.ano}/{analysis.fipeData.anoModelo}</p>
                )}
                {analysis.fipeData?.cor && (
                  <p><strong>Cor:</strong> {analysis.fipeData.cor}</p>
                )}
                {analysis.fipeData?.combustivel && (
                  <p><strong>Combustível:</strong> {analysis.fipeData.combustivel}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Informações FIPE
              </h3>
              <div className="space-y-1 text-sm">
                {analysis.fipeData?.fipe?.dados?.[0]?.texto_valor && (
                  <p><strong>Valor FIPE:</strong> {analysis.fipeData.fipe.dados[0].texto_valor}</p>
                )}
                {analysis.fipeData?.fipe?.dados?.[0]?.codigo_fipe && (
                  <p><strong>Código FIPE:</strong> {analysis.fipeData.fipe.dados[0].codigo_fipe}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Analysis Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">
                Análise realizada em: {new Date(analysis.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
            <Badge variant={analysis.status === 'concluido' ? 'default' : 'secondary'}>
              {analysis.status === 'concluido' ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Concluído
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 mr-1" />
                  {analysis.status}
                </>
              )}
            </Badge>
          </div>

          {/* Analysis Results */}
          {analysis.json_laudo && (
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Resultado da Análise
              </h3>
              
              {analysis.json_laudo.conclusao && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <h4 className="font-medium mb-2">Conclusão:</h4>
                    <p className="text-sm">{analysis.json_laudo.conclusao}</p>
                  </CardContent>
                </Card>
              )}

              {analysis.json_laudo.problemas_encontrados && analysis.json_laudo.problemas_encontrados.length > 0 && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="pt-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2 text-orange-800">
                      <AlertTriangle className="h-4 w-4" />
                      Problemas Encontrados:
                    </h4>
                    <ul className="text-sm space-y-1 text-orange-700">
                      {analysis.json_laudo.problemas_encontrados.map((problema: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-orange-500 mt-1">•</span>
                          {problema}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {analysis.json_laudo.pontos_positivos && analysis.json_laudo.pontos_positivos.length > 0 && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-4 w-4" />
                      Pontos Positivos:
                    </h4>
                    <ul className="text-sm space-y-1 text-green-700">
                      {analysis.json_laudo.pontos_positivos.map((ponto: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">•</span>
                          {ponto}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};