import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Download, FileText, Car, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

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

  const handleGeneratePDFWithImages = async () => {
    try {
      setIsGeneratingPDF(true);
      console.log('Iniciando geração de PDF com imagens...');

      const response = await supabase.functions.invoke('generate_pdf_with_images', {
        body: {
          analysisData: analysis.json_laudo,
          vehicleData: {
            placa: analysis.placa,
            modelo: analysis.modelo,
            created_at: analysis.created_at
          },
          images: analysis.imagens || []
        }
      });

      console.log('Resposta da função:', response);

      if (response.error) {
        console.error('Erro na função:', response.error);
        throw new Error(response.error.message || 'Erro ao gerar PDF');
      }

      if (!response.data?.pdfUrl) {
        console.error('URL do PDF não encontrada na resposta:', response.data);
        throw new Error('URL do PDF não foi gerada');
      }

      console.log('PDF gerado com sucesso:', response.data.pdfUrl);

      // Atualizar o registro com a URL do PDF
      const { error: updateError } = await supabase
        .from('analises')
        .update({ url_pdf: response.data.pdfUrl })
        .eq('id', analysis.id);

      if (updateError) {
        console.error('Erro ao atualizar URL do PDF:', updateError);
      }

      // Fazer download do PDF
      window.open(response.data.pdfUrl, '_blank');

      toast({
        title: "PDF gerado com sucesso!",
        description: "O download do relatório foi iniciado.",
      });

    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (analysis.url_pdf) {
      window.open(analysis.url_pdf, '_blank');
    } else {
      await handleGeneratePDFWithImages();
    }
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
      case 'bom':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'atenção':
      case 'atencao':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'crítico':
      case 'critico':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getComponentStats = () => {
    if (!analysis.json_laudo?.componentes) return { bom: 0, atencao: 0, critico: 0 };
    
    return analysis.json_laudo.componentes.reduce((acc: any, comp: any) => {
      const estado = comp.estado?.toLowerCase();
      if (estado === 'bom') acc.bom++;
      else if (estado === 'atenção' || estado === 'atencao') acc.atencao++;
      else if (estado === 'crítico' || estado === 'critico') acc.critico++;
      return acc;
    }, { bom: 0, atencao: 0, critico: 0 });
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
                <div className={`mt-1 p-3 rounded-lg border ${getRiskColor(analysis.json_laudo.classificacao_risco)}`}>
                  <span className="font-semibold text-lg">
                    {analysis.json_laudo.classificacao_risco || 'Não definido'}
                  </span>
                </div>
              </div>
              
              {analysis.json_laudo.pontuacao_geral && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Pontuação Geral</label>
                  <div className="mt-1 text-2xl font-bold text-blue-600">
                    {analysis.json_laudo.pontuacao_geral}/100
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
                  <span className="text-sm font-medium">Bom Estado</span>
                </div>
                <span className="font-bold text-green-600">{stats.bom}</span>
              </div>
              
              <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">Atenção</span>
                </div>
                <span className="font-bold text-yellow-600">{stats.atencao}</span>
              </div>
              
              <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium">Crítico</span>
                </div>
                <span className="font-bold text-red-600">{stats.critico}</span>
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
                          componente.estado?.toLowerCase() === 'bom' ? 'default' :
                          componente.estado?.toLowerCase() === 'atenção' || componente.estado?.toLowerCase() === 'atencao' ? 'secondary' :
                          'destructive'
                        }
                        className={
                          componente.estado?.toLowerCase() === 'bom' ? 'bg-green-500' :
                          componente.estado?.toLowerCase() === 'atenção' || componente.estado?.toLowerCase() === 'atencao' ? 'bg-yellow-500' :
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
      {analysis.json_laudo.observacoes_gerais && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Observações Gerais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-gray-700 leading-relaxed">
                {analysis.json_laudo.observacoes_gerais}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recomendações */}
      {analysis.json_laudo.recomendacoes && analysis.json_laudo.recomendacoes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recomendações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.json_laudo.recomendacoes.map((recomendacao: string, index: number) => (
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