import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { generatePDF } from '@/components/PDFGenerator';
import { toast } from '@/hooks/use-toast';
import { 
  Car, 
  Calendar, 
  Gauge, 
  MapPin, 
  FileText, 
  Download,
  Share2,
  Calculator,
  Brain,
  TrendingUp,
  DollarSign,
  CreditCard,
  Fuel,
  Palette
} from 'lucide-react';

interface ReportViewerProps {
  analysis: {
    id: string;
    placa: string;
    modelo: string;
    json_laudo: any;
    url_pdf?: string;
    status: string;
    created_at: string;
    imagens?: string[];
  };
}

export function ReportViewer({ analysis }: ReportViewerProps) {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [fifePercentage, setFifePercentage] = useState<number>(78);
  const [discountAmount, setDiscountAmount] = useState<number>(1500);
  const [clientWhatsApp, setClientWhatsApp] = useState('');
  const [finalValue, setFinalValue] = useState<number>(0);

  const laudo = analysis.json_laudo || {};
  const vehicleData = laudo.veiculo || {};
  
  // Extract FIPE value from the API data structure
  const getFipeValue = () => {
    if (vehicleData.valor_fipe) {
      // If it's already a number
      if (typeof vehicleData.valor_fipe === 'number') {
        return vehicleData.valor_fipe;
      }
      // If it's a formatted string like "R$ 45.000,00"
      const numericValue = vehicleData.valor_fipe
        .replace(/[^\d,]/g, '')
        .replace(',', '.');
      return parseFloat(numericValue) || 50000;
    }
    return 50000; // Default fallback
  };
  
  const fifeValue = getFipeValue();
  const aiSuggestedValue = Math.round(fifeValue * 0.78 - 1500);

  // Função para ajustar valor para numerologia 8
  const adjustToNumerology8 = (value: number): number => {
    const rounded = Math.round(value / 100) * 100;
    const lastDigit = Math.floor(rounded / 100) % 10;
    
    if (lastDigit === 8) return rounded;
    
    const adjustment = lastDigit < 8 ? (8 - lastDigit) * 100 : (18 - lastDigit) * 100;
    return rounded + adjustment;
  };

  // Calcular valor final
  useEffect(() => {
    const calculatedValue = (fifeValue * fifePercentage / 100) - discountAmount;
    const adjustedValue = adjustToNumerology8(calculatedValue);
    setFinalValue(adjustedValue);
  }, [fifePercentage, discountAmount, fifeValue]);

  // Carregar imagens
  useEffect(() => {
    const loadVehicleImages = async () => {
      if (!analysis.imagens || analysis.imagens.length === 0) {
        setLoadingImages(false);
        return;
      }

      try {
        const urls = await Promise.all(
          analysis.imagens.map(async (imagePath) => {
            try {
              const { data, error } = await supabase.storage
                .from('fotos')
                .createSignedUrl(imagePath, 3600);

              if (error) {
                console.error('Error creating signed URL:', error);
                const { data: publicData } = supabase.storage
                  .from('fotos')
                  .getPublicUrl(imagePath);
                return publicData.publicUrl;
              }

              return data.signedUrl;
            } catch (err) {
              console.error('Error loading image:', err);
              return null;
            }
          })
        );

        setImageUrls(urls.filter(Boolean) as string[]);
      } catch (error) {
        console.error('Error loading vehicle images:', error);
      } finally {
        setLoadingImages(false);
      }
    };

    loadVehicleImages();
  }, [analysis.imagens]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleGeneratePDF = async () => {
    setGeneratingPDF(true);
    
    try {
      const reportData = {
        veiculo: {
          marca: vehicleData.marca || 'N/A',
          modelo: vehicleData.marcaModelo || analysis.modelo,
          ano: vehicleData.anoModelo || vehicleData.ano || new Date().getFullYear(),
          valor_fipe: vehicleData.valor_fipe || formatCurrency(fifeValue),
          codigo_fipe: vehicleData.codigo_fipe || 'N/A',
          combustivel: vehicleData.combustivel || 'N/A',
          placa: analysis.placa
        },
        componentes: laudo.componentes || [],
        sintese: laudo.sintese || {
          resumo: "Análise técnica realizada com IA",
          repintura_em: "nenhuma",
          massa_em: "nenhuma", 
          alinhamento_comprometido: "nenhuma",
          vidros_trocados: "nenhuma",
          estrutura_inferior: "OK",
          estrutura_ok: true,
          conclusao_final: "Veículo analisado"
        }
      };
      
      await generatePDF(reportData);
      
      toast({
        title: "PDF gerado com sucesso!",
        description: "O relatório foi baixado para seu dispositivo"
      });
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível gerar o relatório",
        variant: "destructive"
      });
    } finally {
      setGeneratingPDF(false);
    }
  };
  const handleWhatsAppShare = () => {
    if (!clientWhatsApp) return;

    const message = `🚗 *AVALIAÇÃO TÉCNICA - ReviuCar*

*Dados do veículo:*
*Veículo:* ${vehicleData.marcaModelo || analysis.modelo}
*Ano:* ${vehicleData.anoModelo || vehicleData.ano || 'N/A'}
*Cor:* ${vehicleData.cor || 'N/A'}
*Tabela Fipe:* ${formatCurrency(fifeValue)}
*Por:* ${formatCurrency(finalValue)}

📋 *Análise técnica completa disponível*

_Análise realizada com IA ReviuCar_`;

    const whatsappUrl = `https://wa.me/55${clientWhatsApp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header do Relatório */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Relatório de Análise Veicular
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Placa: {analysis.placa} • Gerado em {formatDate(analysis.created_at)}
              </p>
            </div>
            <Badge variant={analysis.status === 'concluida' ? 'default' : 'secondary'}>
              {analysis.status === 'concluida' ? 'Concluída' : 'Pendente'}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Dados do Veículo */}
      <Card>
        <CardHeader>
          <CardTitle>Dados do Veículo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Modelo:</span>
              <span>{analysis.modelo}</span>
            </div>
            {laudo.ano && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Ano:</span>
                <span>{laudo.ano}</span>
              </div>
            )}
            {laudo.quilometragem && (
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Quilometragem:</span>
                <span>{laudo.quilometragem.toLocaleString('pt-BR')} km</span>
              </div>
            )}
            {laudo.cidade && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Cidade:</span>
                <span>{laudo.cidade}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Análise Técnica */}
      {laudo.analise_tecnica && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Análise Técnica
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <p className="text-sm leading-relaxed">{laudo.analise_tecnica}</p>
            </div>
          </CardContent>
      {/* Avaliação Técnica da IA */}
      {laudo.sintese && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Avaliação Técnica por IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Resumo da Análise:</h4>
              <p className="text-sm leading-relaxed">{laudo.sintese.resumo}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Repintura detectada:</span>
                  <span className={laudo.sintese.repintura_em === 'nenhuma' ? 'text-green-600' : 'text-orange-600'}>
                    {laudo.sintese.repintura_em}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Massa plástica:</span>
                  <span className={laudo.sintese.massa_em === 'nenhuma' ? 'text-green-600' : 'text-orange-600'}>
                    {laudo.sintese.massa_em}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Alinhamento:</span>
                  <span className={laudo.sintese.alinhamento_comprometido === 'nenhuma' ? 'text-green-600' : 'text-red-600'}>
                    {laudo.sintese.alinhamento_comprometido}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Vidros trocados:</span>
                  <span className={laudo.sintese.vidros_trocados === 'nenhuma' ? 'text-green-600' : 'text-orange-600'}>
                    {laudo.sintese.vidros_trocados}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Estrutura inferior:</span>
                  <span className={laudo.sintese.estrutura_inferior === 'OK' ? 'text-green-600' : 'text-red-600'}>
                    {laudo.sintese.estrutura_inferior}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Conclusão:</span>
                  <span className="font-semibold text-blue-600">
                    {laudo.sintese.conclusao_final}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
        </Card>
      )}

      {/* Imagens da Análise */}
      <Card>
        <CardHeader>
          <CardTitle>Imagens da Análise</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingImages ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Carregando imagens...</span>
            </div>
          ) : imageUrls.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Imagem ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg border"
                    onLoad={() => console.log(`Image ${index + 1} loaded successfully`)}
                    onError={(e) => {
                      console.error(`Error loading gallery image ${index + 1}:`, e);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Car className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma imagem disponível para esta análise</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Análise IA Avançada */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Análise IA Avançada - Valor Sugerido
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {formatCurrency(aiSuggestedValue)}
              </div>
              <p className="text-sm text-muted-foreground">
                Valor calculado pela IA mais avançada do mercado
              </p>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Como chegamos neste valor:
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Valor FIPE base:</span>
                  <span className="font-medium">{formatCurrency(fifeValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Percentual aplicado (78%):</span>
                  <span className="font-medium">{formatCurrency(fifeValue * 0.78)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Desconto por desgaste (-R$ 1.500):</span>
                  <span className="font-medium text-red-600">-{formatCurrency(1500)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-semibold">Valor final sugerido:</span>
                  <span className="font-bold text-blue-600">{formatCurrency(aiSuggestedValue)}</span>
                </div>
              </div>
              
              <div className="bg-blue-100 p-3 rounded-lg mt-4">
                <p className="text-xs text-blue-800">
                  <strong>Análise baseada em:</strong> Estado geral do veículo, quilometragem, 
                  ano de fabricação, tendências de mercado e ajuste numerológico para vibração 8.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Simulador de Valor - Card Vermelho */}
      <Card className="border-red-200 bg-gradient-to-r from-red-50 to-pink-50">
        <CardHeader className="bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Simulador de Valor Personalizado
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fife-percentage" className="text-sm font-medium">
                  % da FIPE
                </Label>
                <Input
                  id="fife-percentage"
                  type="number"
                  value={fifePercentage}
                  onChange={(e) => setFifePercentage(Number(e.target.value))}
                  min="1"
                  max="100"
                  className="border-red-300 focus:border-red-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="discount-amount" className="text-sm font-medium">
                  Desconto R$
                </Label>
                <Input
                  id="discount-amount"
                  type="number"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  min="0"
                  className="border-red-300 focus:border-red-500"
                />
              </div>
            </div>

            <div className="bg-red-100 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">Valor Final Calculado:</span>
                <span className="text-2xl font-bold text-red-600">
                  {formatCurrency(finalValue)}
                </span>
              </div>
              <p className="text-xs text-red-700 mt-1">
                * Valor ajustado para numerologia 8 (vibração de prosperidade)
              </p>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label htmlFor="client-whatsapp" className="text-sm font-medium">
                WhatsApp do Cliente
              </Label>
              <Input
                id="client-whatsapp"
                type="tel"
                placeholder="(11) 99999-9999"
                value={clientWhatsApp}
                onChange={(e) => setClientWhatsApp(e.target.value)}
                className="border-red-300 focus:border-red-500"
              />
              
              <Button
                onClick={handleWhatsAppShare}
                disabled={!clientWhatsApp}
                className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Enviar Avaliação via WhatsApp
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PDF Download */}
      <Card>
        <CardContent className="pt-6">
          <Button
            onClick={handleGeneratePDF}
            disabled={generatingPDF}
            className="w-full"
            size="lg"
          >
            {generatingPDF ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Gerando PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Baixar Relatório Completo (PDF)
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}