import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Download, FileText, Car, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import html2pdf from 'html2pdf.js';

interface ReportViewerProps {
  analysis: Tables<'analises'>;
}

export function ReportViewer({ analysis }: ReportViewerProps) {
  const { toast } = useToast();
  const [isGeneratingPDF, setIsGeneratingPDF] = React.useState(false);

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

      const element = document.getElementById('pdf-content');
      if (!element) {
        throw new Error('Elemento PDF não encontrado');
      }

      const opt = {
        margin: 10,
        filename: `Laudo_ReviuCar_${analysis.placa}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait' 
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
      <div id="pdf-content" style={{ position: 'absolute', left: '-9999px', width: '794px', backgroundColor: 'white', padding: '40px', fontFamily: 'Arial, sans-serif' }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div><strong>Modelo:</strong> {analysis.modelo}</div>
              <div><strong>Placa:</strong> {analysis.placa}</div>
              <div><strong>Data da Análise:</strong> {new Date(analysis.created_at).toLocaleDateString('pt-BR')}</div>
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

        {/* Technical Conclusion */}
        {analysis.json_laudo.sintese?.observacoes_gerais && (
          <div style={{ margin: '25px 0' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#c10000', borderBottom: '2px solid #c10000', paddingBottom: '8px', marginBottom: '15px' }}>
              🧾 Conclusão Técnica
            </div>
            <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', background: '#fafafa', marginBottom: '15px' }}>
              <p><strong>Resumo da Análise:</strong></p>
              <p>{analysis.json_laudo.sintese.observacoes_gerais}</p>
            </div>
          </div>
        )}

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
        {analysis.imagens && analysis.imagens.length > 0 && (
          <div style={{ margin: '25px 0' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#c10000', borderBottom: '2px solid #c10000', paddingBottom: '8px', marginBottom: '15px' }}>
              📷 Imagens da Análise
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
              {analysis.imagens.slice(0, 4).map((imagePath: string, index: number) => {
                const { data } = supabase.storage.from('fotos').getPublicUrl(imagePath);
                return (
                  <div key={index} style={{ textAlign: 'center' }}>
                    <img 
                      src={data.publicUrl} 
                      alt={`Foto ${index + 1}`}
                      style={{ width: '100%', maxWidth: '300px', height: 'auto', borderRadius: '8px', border: '1px solid #ddd' }}
                      crossOrigin="anonymous"
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Car className="w-6 h-6 text-blue-600" />
              <div>
                <CardTitle className="text-xl">Relatório de Análise Técnica</CardTitle>
                <p className="text-sm text-gray-500">
                  {analysis.placa} • {analysis.modelo}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusBadge(analysis.status)}
              <Button 
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className="ml-2"
              >
                <Download className="w-4 h-4 mr-2" />
                {isGeneratingPDF ? 'Gerando...' : 'Download PDF'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Resumo da Análise */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resultado Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Classificação de Risco</label>
                <div className={`mt-1 p-3 rounded-lg border ${getRiskColor(analysis.json_laudo.sintese?.classificacao_risco)}`}>
                  <span className="font-semibold text-lg">
                    {analysis.json_laudo.sintese?.classificacao_risco || 'Não definido'}
                  </span>
                </div>
              </div>
              
              {analysis.json_laudo.sintese?.pontuacao_geral && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Pontuação Geral</label>
                  <div className="mt-1 text-2xl font-bold text-blue-600">
                    {analysis.json_laudo.sintese.pontuacao_geral}/100
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumo dos Componentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">Original</span>
                </div>
                <span className="font-bold text-green-600">{stats.original}</span>
              </div>
              
              <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">Retocado</span>
                </div>
                <span className="font-bold text-yellow-600">{stats.retocado}</span>
              </div>
              
              <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium">Danificado</span>
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
            <CardTitle className="text-lg">Análise por Componente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.json_laudo.componentes.map((componente: any, index: number) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-800">
                      {index + 1}. {componente.nome || `Componente ${index + 1}`}
                    </h4>
                    {getComponentIcon(componente.estado)}
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Estado: </span>
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
                        <span className="text-sm font-medium text-gray-600">Pontuação: </span>
                        <span className="font-semibold">{componente.pontuacao}/100</span>
                      </div>
                    )}
                    
                    {componente.observacoes && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Observações: </span>
                        <p className="text-sm text-gray-700 mt-1 p-2 bg-gray-50 rounded">
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
      {analysis.json_laudo.sintese?.observacoes_gerais && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Observações Gerais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-gray-700 leading-relaxed">
                {analysis.json_laudo.sintese.observacoes_gerais}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recomendações */}
      {analysis.json_laudo.sintese?.recomendacoes && analysis.json_laudo.sintese.recomendacoes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recomendações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.json_laudo.sintese.recomendacoes.map((recomendacao: string, index: number) => (
                <div key={index} className="flex items-start space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{recomendacao}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}