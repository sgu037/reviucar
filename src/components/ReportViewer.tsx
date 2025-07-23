import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Download, FileText, Car, AlertTriangle, CheckCircle, XCircle, Clock, Calculator, MessageCircle, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import html2pdf from 'html2pdf.js';

interface ReportViewerProps {
  analysis: Tables<'analises'>;
}

export function ReportViewer({ analysis }: ReportViewerProps) {
  const { toast } = useToast();
  const [isGeneratingPDF, setIsGeneratingPDF] = React.useState(false);
  const [vehicleImages, setVehicleImages] = React.useState<string[]>([]);
  const [customValue, setCustomValue] = React.useState('');
  const [whatsappNumber, setWhatsappNumber] = React.useState('');

  // Load vehicle images from database
  React.useEffect(() => {
    const loadVehicleImages = async () => {
      if (analysis.imagens && analysis.imagens.length > 0) {
        try {
          const imageUrls = await Promise.all(
            analysis.imagens.map(async (imagePath) => {
              try {
                // Create signed URL for better access
                const { data, error } = await supabase.storage
                  .from('fotos')
                  .createSignedUrl(imagePath, 3600); // 1 hour expiry
                
                if (error) {
                  console.error('Error creating signed URL:', error);
                  // Fallback to public URL
                  const { data: publicData } = supabase.storage.from('fotos').getPublicUrl(imagePath);
                  return publicData.publicUrl;
                }
                
                return data.signedUrl;
              } catch (err) {
                console.error('Error processing image:', err);
                // Fallback to public URL
                const { data: publicData } = supabase.storage.from('fotos').getPublicUrl(imagePath);
                return publicData.publicUrl;
              }
            })
          );
          setVehicleImages(imageUrls);
        } catch (error) {
          console.error('Error loading vehicle images:', error);
        }
      }
    };

    loadVehicleImages();
  }, [analysis]);
  const [fipePercentage, setFipePercentage] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');

  // Calculate AI suggested value
  const calculateAIValue = (fipeValue: string): string => {
    const numericValue = parseFloat(fipeValue.replace(/[^\d,]/g, '').replace(',', '.'));
    if (isNaN(numericValue)) return 'R$ 0,00';
    
    // AI calculation: 78% of FIPE - R$ 1,500 (adjusted for numerology 8)
    const baseValue = numericValue * 0.78 - 1500;
    const adjustedValue = adjustToNumerology8(baseValue);
    
    return `R$ ${adjustedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Get vehicle condition based on analysis
  const getVehicleCondition = (): string => {
    const stats = getComponentStats();
    if (stats.danificado > 0) return 'Necessita reparos';
    if (stats.retocado > 2) return 'Múltiplos retoques';
    if (stats.retocado > 0) return 'Pequenos retoques';
    return 'Excelente estado';
  };

  // Calculate final value with user inputs
  const calculateFinalValue = (): string => {
    if (!fipePercentage && !discountAmount) return '';
    
    const fipeValue = analysis.json_laudo?.veiculo?.valor_fipe;
    if (!fipeValue) return '';
    
    const numericFipe = parseFloat(fipeValue.replace(/[^\d,]/g, '').replace(',', '.'));
    if (isNaN(numericFipe)) return '';
    
    let finalValue = numericFipe;
    
    // Apply percentage
    if (fipePercentage) {
      const percentage = parseFloat(fipePercentage) / 100;
      finalValue = numericFipe * percentage;
    }
    
    // Apply discount
    if (discountAmount) {
      finalValue -= parseFloat(discountAmount);
    }
    
    // Adjust to numerology 8
    const adjustedValue = adjustToNumerology8(finalValue);
    
    return `R$ ${adjustedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

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

  const sendWhatsApp = () => {
    if (!whatsappNumber.trim()) {
      toast({
        title: "WhatsApp necessário",
        description: "Digite o número do WhatsApp para enviar",
        variant: "destructive"
      });
      return;
    }

    const finalValue = calculateFinalValue();
    if (!finalValue) {
      toast({
        title: "Valor necessário",
        description: "Configure a % da FIPE ou desconto para calcular o valor",
        variant: "destructive"
      });
      return;
    }

    const fipeValue = analysis.json_laudo?.veiculo?.valor_fipe || 'Não informado';
    const ano = analysis.json_laudo?.veiculo?.ano || 'Não informado';
    const quilometragem = '85.000 km';
    
    const message = `🚗 *AVALIAÇÃO TÉCNICA - ReviuCar*

*Dados do veículo:*
*Veículo:* ${analysis.modelo}
*Ano:* ${ano}
*Quilometragem:* ${quilometragem}
*Tabela Fipe:* ${fipeValue}
*Por:* ${finalValue}

📋 *Análise técnica completa disponível*

_Análise realizada com IA ReviuCar_`;

    const cleanNumber = whatsappNumber.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/55${cleanNumber}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "WhatsApp aberto!",
      description: "Mensagem preparada para envio"
    });
  };

  // Early return if analysis or json_laudo is not available
  if (!analysis || !analysis.json_laudo) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Análise ainda não foi processada</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleGeneratePDF = async () => {
    try {
      setIsGeneratingPDF(true);
      console.log('Iniciando geração de PDF...');

      // Wait for images to load
      await new Promise(resolve => setTimeout(resolve, 3000));

      const element = document.getElementById('pdf-content');
      if (!element) {
        throw new Error('Elemento PDF não encontrado');
      }

      const opt = {
        margin: [10, 10, 10, 10],
        filename: `Laudo_ReviuCar_${analysis.placa}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: true,
          width: 800,
          height: element.scrollHeight,
          scrollX: 0,
          scrollY: 0
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait',
          compress: true
        }
      };

      await html2pdf().set(opt).from(element).save();

      toast({
        title: "PDF gerado com sucesso!",
        description: "O download do relatório foi iniciado."
      });

    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadPDF = async () => {
    await handleGeneratePDF();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'concluido':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Concluído</Badge>;
      case 'pendente':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'erro':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Erro</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'baixo':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'médio':
      case 'medio':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'alto':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getComponentIcon = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case 'original':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'retocado':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'danificado':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getComponentStats = () => {
    if (!analysis.json_laudo?.componentes) return { original: 0, retocado: 0, danificado: 0 };
    
    return analysis.json_laudo.componentes.reduce((acc: any, comp: any) => {
      const estado = comp.estado?.toLowerCase();
      if (estado === 'original') acc.original++;
      else if (estado === 'retocado') acc.retocado++;
      else if (estado === 'danificado') acc.danificado++;
      return acc;
    }, { original: 0, retocado: 0, danificado: 0 });
  };

  const stats = getComponentStats();

  if (!analysis.json_laudo) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Análise ainda não foi processada</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hidden PDF Content */}
      <div 
        id="pdf-content" 
        style={{ 
          position: 'fixed', 
          left: '-9999px', 
          top: '0',
          width: '800px', 
          backgroundColor: 'white', 
          padding: '40px', 
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          lineHeight: '1.6',
          color: '#333'
        }}
      >
        {/* PDF Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px', paddingBottom: '20px', borderBottom: '2px solid #c10000' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#c10000', margin: '10px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
            LAUDO TÉCNICO DE AVALIAÇÃO VEICULAR
          </div>
          <div style={{ color: '#666', fontSize: '13px', marginTop: '10px' }}>
            <strong>Data:</strong> {new Date().toLocaleDateString('pt-BR')} &nbsp;&nbsp;|&nbsp;&nbsp; 
            <strong>Analista:</strong> IA ReviuCar<br/>
            <strong>Protocolo:</strong> RVC-{Date.now().toString().slice(-6)}
          </div>
        </div>

        {/* Vehicle Information */}
        <div style={{ margin: '25px 0' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#c10000', borderBottom: '2px solid #c10000', paddingBottom: '8px', marginBottom: '15px' }}>
            🚗 Veículo Avaliado
          </div>
          <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', background: '#fafafa', marginBottom: '15px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
              <div><strong>Modelo:</strong> {analysis.modelo}</div>
              <div><strong>Placa:</strong> {analysis.placa}</div>
              {analysis.json_laudo?.veiculo?.marca && (
                <div><strong>Marca:</strong> {analysis.json_laudo.veiculo.marca}</div>
              )}
              {analysis.json_laudo?.veiculo?.ano && (
                <div><strong>Ano:</strong> {analysis.json_laudo.veiculo.ano}</div>
              )}
              {analysis.json_laudo?.veiculo?.combustivel && (
                <div><strong>Combustível:</strong> {analysis.json_laudo.veiculo.combustivel}</div>
              )}
              {analysis.json_laudo?.veiculo?.valor_fipe && (
                <div><strong>Valor FIPE:</strong> {analysis.json_laudo.veiculo.valor_fipe}</div>
              )}
              {analysis.json_laudo?.veiculo?.codigo_fipe && (
                <div><strong>Código FIPE:</strong> {analysis.json_laudo.veiculo.codigo_fipe}</div>
              )}
              <div><strong>Data da Análise:</strong> {new Date(analysis.created_at).toLocaleDateString('pt-BR')}</div>
              <div><strong>Status:</strong> {analysis.status}</div>
            </div>
          </div>
        </div>

        {/* Technical Results */}
        <div style={{ margin: '25px 0' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#c10000', borderBottom: '2px solid #c10000', paddingBottom: '8px', marginBottom: '15px' }}>
            🔍 Resultados Técnicos
          </div>
          <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', background: '#fafafa', marginBottom: '15px' }}>
            {analysis.json_laudo.sintese?.repintura_em && (
              <div style={{ margin: '12px 0', paddingBottom: '8px', borderBottom: '1px solid #eee' }}>
                <strong>Repintura detectada em:</strong> {analysis.json_laudo.sintese.repintura_em}
              </div>
            )}
            {analysis.json_laudo.sintese?.massa_em && (
              <div style={{ margin: '12px 0', paddingBottom: '8px', borderBottom: '1px solid #eee' }}>
                <strong>Massa plástica visível em:</strong> {analysis.json_laudo.sintese.massa_em}
              </div>
            )}
            {analysis.json_laudo.sintese?.alinhamento_comprometido && (
              <div style={{ margin: '12px 0', paddingBottom: '8px', borderBottom: '1px solid #eee' }}>
                <strong>Alinhamento comprometido:</strong> {analysis.json_laudo.sintese.alinhamento_comprometido}
              </div>
            )}
            {analysis.json_laudo.sintese?.vidros_trocados && (
              <div style={{ margin: '12px 0', paddingBottom: '8px', borderBottom: '1px solid #eee' }}>
                <strong>Vidros/faróis trocados:</strong> {analysis.json_laudo.sintese.vidros_trocados}
              </div>
            )}
            {analysis.json_laudo.sintese?.estrutura_inferior && (
              <div style={{ margin: '12px 0' }}>
                <strong>Estrutura inferior:</strong> {analysis.json_laudo.sintese.estrutura_inferior}
              </div>
            )}
          </div>
        </div>

        {/* Risk Classification */}
        {analysis.json_laudo.sintese?.classificacao_risco && (
          <div style={{ margin: '25px 0' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#c10000', borderBottom: '2px solid #c10000', paddingBottom: '8px', marginBottom: '15px' }}>
              ⚠️ Classificação de Risco
            </div>
            <div style={{ 
              background: analysis.json_laudo.sintese.classificacao_risco?.toLowerCase() === 'baixo' ? '#d4edda' : 
                         analysis.json_laudo.sintese.classificacao_risco?.toLowerCase() === 'médio' || analysis.json_laudo.sintese.classificacao_risco?.toLowerCase() === 'medio' ? '#fff3cd' : '#f8d7da',
              border: `2px solid ${analysis.json_laudo.sintese.classificacao_risco?.toLowerCase() === 'baixo' ? '#28a745' : 
                                  analysis.json_laudo.sintese.classificacao_risco?.toLowerCase() === 'médio' || analysis.json_laudo.sintese.classificacao_risco?.toLowerCase() === 'medio' ? '#ffc107' : '#dc3545'}`,
              color: analysis.json_laudo.sintese.classificacao_risco?.toLowerCase() === 'baixo' ? '#155724' : 
                     analysis.json_laudo.sintese.classificacao_risco?.toLowerCase() === 'médio' || analysis.json_laudo.sintese.classificacao_risco?.toLowerCase() === 'medio' ? '#856404' : '#721c24',
              fontWeight: 'bold',
              padding: '20px',
              borderRadius: '8px',
              textAlign: 'center',
              fontSize: '18px',
              margin: '15px 0'
            }}>
              CLASSIFICAÇÃO DE RISCO: {analysis.json_laudo.sintese.classificacao_risco?.toUpperCase()}
            </div>
          </div>
        )}

        {/* Technical Conclusion */}
        {(analysis.json_laudo.sintese?.observacoes_gerais || analysis.json_laudo.sintese?.resumo) && (
          <div style={{ margin: '25px 0' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#c10000', borderBottom: '2px solid #c10000', paddingBottom: '8px', marginBottom: '15px' }}>
              🧾 Conclusão Técnica
            </div>
            <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', background: '#fafafa', marginBottom: '15px' }}>
              <p><strong>Resumo da Análise:</strong></p>
              <p>{analysis.json_laudo.sintese.observacoes_gerais || analysis.json_laudo.sintese.resumo}</p>
            </div>
          </div>
        )}

        {/* Components Analysis */}
        {analysis.json_laudo.componentes && analysis.json_laudo.componentes.length > 0 && (
          <div style={{ margin: '25px 0' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#c10000', borderBottom: '2px solid #c10000', paddingBottom: '8px', marginBottom: '15px' }}>
              📎 Componentes Analisados
            </div>
            <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', background: '#fafafa', marginBottom: '15px' }}>
              <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
                {analysis.json_laudo.componentes.map((componente: any, index: number) => (
                  <li key={index} style={{ margin: '8px 0', lineHeight: '1.4' }}>
                    <strong>{componente.nome || `Componente ${index + 1}`}:</strong> {componente.estado} - {componente.observacoes || componente.conclusao}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Images Section */}
        {vehicleImages.length > 0 && (
          <div style={{ margin: '25px 0' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#c10000', borderBottom: '2px solid #c10000', paddingBottom: '8px', marginBottom: '15px' }}>
              📷 Imagens da Análise
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
              {vehicleImages.slice(0, 4).map((imageUrl: string, index: number) => {
                return (
                  <div key={index} style={{ textAlign: 'center' }}>
                    <img 
                      src={imageUrl} 
                      alt={`Foto ${index + 1}`}
                      style={{ 
                        width: '100%', 
                        maxWidth: '300px', 
                        height: 'auto', 
                        borderRadius: '8px', 
                        border: '1px solid #ddd',
                        display: 'block',
                        margin: '0 auto'
                      }}
                      crossOrigin="anonymous"
                      onLoad={() => console.log(`Image ${index + 1} loaded successfully`)}
                      onError={(e) => console.error(`Error loading image ${index + 1}:`, e)}
                    />
                    <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Foto {index + 1}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: '40px', textAlign: 'center', fontSize: '12px', color: '#777', borderTop: '1px solid #ddd', paddingTop: '20px' }}>
          <div style={{ fontWeight: 'bold', color: '#c10000', marginBottom: '5px' }}>
            ReviuCar – Avaliação Inteligente de Veículos
          </div>
          🌐 www.reviucar.com.br &nbsp;&nbsp; | &nbsp;&nbsp; ✉️ contato@reviucar.com
        </div>
      </div>

      {/* Header do Relatório */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Car className="w-6 h-6 text-blue-600" />
              <div>
                <CardTitle className="text-lg sm:text-xl">Relatório de Análise Técnica</CardTitle>
                <p className="text-xs sm:text-sm text-gray-500">
                  {analysis.placa} • {analysis.modelo}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              {getStatusBadge(analysis.status)}
              <Button 
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className="w-full sm:w-auto"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                {isGeneratingPDF ? 'Gerando...' : 'Download PDF'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Vehicle Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Car className="h-5 w-5" />
            Avaliação Inteligente IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="space-y-2">
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-600">Modelo</label>
                <p className="text-sm sm:text-lg font-semibold">{analysis.modelo}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-600">Placa</label>
                <p className="text-sm sm:text-lg font-mono font-bold">{analysis.placa}</p>
        <CardContent className="space-y-6">
          {/* IA Analysis */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">IA</span>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900">Análise da IA Avançada</h4>
                <p className="text-xs text-blue-700">A IA mais avançada do mercado automotivo</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="bg-white p-3 rounded border">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Valor sugerido pela IA:</strong>
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {calculateAIValue(analysis.json_laudo.veiculo.valor_fipe)}
                </p>
              </div>
              
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong>Como chegamos neste valor:</strong></p>
                <p>• Análise do estado geral: {getVehicleCondition()}</p>
                <p>• Valor FIPE: {analysis.json_laudo.veiculo.valor_fipe}</p>
                <p>• Ajuste por condição: -15% a -25%</p>
                <p>• Numerologia otimizada (vibração 8)</p>
                <p>• Margem para negociação incluída</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Value Calculator */}
      <Card className="border-red-200 bg-gradient-to-br from-red-50 to-pink-50 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calculator className="h-5 w-5" />
            Calculadora de Valor Personalizada
          </CardTitle>
          <p className="text-sm opacity-90">Calcule o valor ideal baseado na sua estratégia</p>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-red-700">% da FIPE</Label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-red-600">%</span>
                <Input
                  type="number"
                  placeholder="78"
                  value={fipePercentage}
                  onChange={(e) => setFipePercentage(e.target.value)}
                  className="flex-1 border-red-200 focus:border-red-400"
                  min="1"
                  max="100"
                />
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-red-700">Desconto (R$)</Label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-red-600">R$</span>
                <Input
                  type="number"
                  placeholder="1000"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  className="flex-1 border-red-200 focus:border-red-400"
                  min="0"
                />
              </div>
            </div>
          </div>
          
          {/* Calculated Value Display */}
          {(fipePercentage || discountAmount) && (
            <div className="bg-white p-4 rounded-lg border-2 border-red-200">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Valor Final Calculado:</p>
                <p className="text-3xl font-bold text-red-600">
                  {calculateFinalValue()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  ✨ Ajustado para vibração 8 na numerologia
                </p>
              </div>
            </div>
          )}
          
          <div>
            <Label htmlFor="whatsapp" className="text-sm font-medium text-red-700">
              WhatsApp do Cliente
            </Label>
            <div className="flex items-center gap-2 mt-1">
              <MessageCircle className="h-4 w-4 text-red-500" />
              <Input
                id="whatsapp"
                placeholder="(11) 99999-9999"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="flex-1 border-red-200 focus:border-red-400"
              />
            </div>
          </div>
          
          <Button 
            onClick={sendWhatsApp}
            className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg"
            size="sm"
            disabled={!calculateFinalValue() || !whatsappNumber.trim()}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Enviar Proposta via WhatsApp
          </Button>

      {/* Simulador de Valor */}
      {analysis.json_laudo?.veiculo?.valor_fipe && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-green-700">
              <Calculator className="h-5 w-5" />
              Simulador de Valor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label className="text-xs sm:text-sm font-medium text-green-700">Valor FIPE</Label>
                <p className="text-lg sm:text-xl font-bold text-green-600">
                  {analysis.json_laudo.veiculo.valor_fipe}
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="custom-value" className="text-xs sm:text-sm font-medium text-green-700">
                  Valor Calculado
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <Input
                    id="custom-value"
                    placeholder="Ex: R$ 35.000,00"
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    className="flex-1"
                    required
                  />
                </div>
                <p className="text-xs text-green-600 mt-1">
                  Digite o valor que você calculou para este veículo
                </p>
              </div>
              
              <div>
                <Label htmlFor="whatsapp" className="text-xs sm:text-sm font-medium">
                  WhatsApp do Cliente
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <MessageCircle className="h-4 w-4 text-gray-500" />
                  <Input
                    id="whatsapp"
                    placeholder="(11) 99999-9999"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              
              <Button 
                onClick={sendWhatsApp}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="sm"
                disabled={!customValue.trim() || !whatsappNumber.trim()}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Enviar via WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo da Análise */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Resultado Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-600">Classificação de Risco</label>
                <div className={`mt-1 p-3 rounded-lg border ${getRiskColor(analysis.json_laudo.sintese?.classificacao_risco)}`}>
                  <span className="font-semibold text-sm sm:text-lg">
                    {analysis.json_laudo.sintese?.classificacao_risco || 'Não definido'}
                  </span>
                </div>
              </div>
              
              {analysis.json_laudo.sintese?.pontuacao_geral && (
                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-600">Pontuação Geral</label>
                  <div className="mt-1 text-xl sm:text-2xl font-bold text-blue-600">
                    {analysis.json_laudo.sintese.pontuacao_geral}/100
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Resumo dos Componentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs sm:text-sm font-medium">Original</span>
                </div>
                <span className="font-bold text-green-600">{stats.original}</span>
              </div>
              
              <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <span className="text-xs sm:text-sm font-medium">Retocado</span>
                </div>
                <span className="font-bold text-yellow-600">{stats.retocado}</span>
              </div>
              
              <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-xs sm:text-sm font-medium">Danificado</span>
                </div>
                <span className="font-bold text-red-600">{stats.danificado}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Análise por Componente */}
      {analysis.json_laudo.componentes && analysis.json_laudo.componentes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Análise por Componente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {analysis.json_laudo.componentes.map((componente: any, index: number) => (
                <div key={index} className="border rounded-lg p-3 sm:p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-800">
                      {index + 1}. {componente.nome || `Componente ${index + 1}`}
                    </h4>
                    {getComponentIcon(componente.estado)}
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs sm:text-sm font-medium text-gray-600">Estado: </span>
                      <Badge 
                        variant={
                          componente.estado?.toLowerCase() === 'original' ? 'default' :
                          componente.estado?.toLowerCase() === 'retocado' ? 'secondary' :
                          'destructive'
                        }
                        className={
                          componente.estado?.toLowerCase() === 'original' ? 'bg-green-500' :
                          componente.estado?.toLowerCase() === 'retocado' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }
                      >
                        {componente.estado || 'Não definido'}
                      </Badge>
                    </div>
                    
                    {componente.pontuacao && (
                      <div>
                        <span className="text-xs sm:text-sm font-medium text-gray-600">Pontuação: </span>
                        <span className="font-semibold">{componente.pontuacao}/100</span>
                      </div>
                    )}
                    
                    {componente.observacoes && (
                      <div>
                        <span className="text-xs sm:text-sm font-medium text-gray-600">Observações: </span>
                        <p className="text-xs sm:text-sm text-gray-700 mt-1 p-2 bg-gray-50 rounded">
                          {componente.observacoes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Observações Gerais */}
      {(analysis.json_laudo.sintese?.observacoes_gerais || analysis.json_laudo.sintese?.resumo) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Observações Gerais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                {analysis.json_laudo.sintese.observacoes_gerais || analysis.json_laudo.sintese.resumo}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recomendações */}
      {analysis.json_laudo.sintese?.recomendacoes && analysis.json_laudo.sintese.recomendacoes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Recomendações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.json_laudo.sintese.recomendacoes.map((recomendacao: string, index: number) => (
                <div key={index} className="flex items-start space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs sm:text-sm text-gray-700">{recomendacao}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vehicle Images */}
      {vehicleImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Imagens da Análise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {vehicleImages.map((imageUrl, index) => (
                <div key={index} className="relative group">
                  <img 
                    src={imageUrl} 
                    alt={`Foto ${index + 1}`}
                    className="w-full h-24 sm:h-32 object-cover rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                    onLoad={() => console.log(`Gallery image ${index + 1} loaded`)}
                    onError={(e) => {
                      console.error(`Error loading gallery image ${index + 1}:`, e);
                      // Hide broken images
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute bottom-1 left-1 bg-black/70 text-white px-1 py-0.5 rounded text-xs">
                    Foto {index + 1}
                  </div>
                </div>
              ))}
            </div>
            {vehicleImages.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma imagem disponível</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}