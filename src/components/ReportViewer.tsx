import { CheckCircle, AlertTriangle, FileDown, RotateCcw, Car, Shield, Search, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ReportData {
  veiculo: {
    modelo: string;
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
    manutencoes_pendentes?: string[];
  };
}

interface ReportViewerProps {
  reportData: ReportData;
  onNewAnalysis: () => void;
}

export const ReportViewer = ({ reportData, onNewAnalysis }: ReportViewerProps) => {
  const getStatusColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'original':
        return 'bg-success text-success-foreground';
      case 'retocado':
        return 'bg-warning text-warning-foreground';
      case 'repintura':
        return 'bg-destructive text-destructive-foreground';
      case 'massa':
        return 'bg-destructive text-destructive-foreground';
      case 'troca':
        return 'bg-warning text-warning-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'original':
        return <CheckCircle className="h-4 w-4" />;
      case 'retocado':
      case 'troca':
        return <Wrench className="h-4 w-4" />;
      case 'repintura':
      case 'massa':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <CheckCircle className="h-6 w-6 text-success" />
          <h2 className="text-2xl font-bold">Laudo Técnico Gerado</h2>
        </div>
        <p className="text-muted-foreground">
          Análise completa do veículo realizada com sucesso
        </p>
      </div>

      {/* Vehicle Info */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Informações do Veículo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Modelo</p>
              <p className="font-semibold text-lg">{reportData.veiculo.modelo}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Placa</p>
              <p className="font-mono font-bold text-lg">{reportData.veiculo.placa}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Report Section */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Parecer Técnico - Verificação de Batidas e Retoques
          </CardTitle>
          <CardDescription>Resultado da análise seguindo protocolo técnico especializado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Presença de repintura</p>
              <p className="font-semibold text-foreground">{reportData.sintese.repintura_em}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Massa plástica aparente</p>
              <p className="font-semibold text-foreground">{reportData.sintese.massa_em}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Alinhamento comprometido</p>
              <p className="font-semibold text-foreground">{reportData.sintese.alinhamento_comprometido}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Vidros/lanternas trocados</p>
              <p className="font-semibold text-foreground">{reportData.sintese.vidros_trocados}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Estrutura inferior</p>
              <p className="font-semibold text-foreground">{reportData.sintese.estrutura_inferior}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Conclusão</p>
              <Badge 
                variant={reportData.sintese.conclusao_final === 'Veículo sem indícios de colisão' ? 'default' : 'destructive'}
                className="font-semibold"
              >
                {reportData.sintese.conclusao_final}
              </Badge>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex items-start gap-3">
            {reportData.sintese.estrutura_ok ? (
              <CheckCircle className="h-5 w-5 text-success mt-0.5" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
            )}
            <div>
              <p className="font-medium mb-1">Parecer Final</p>
              <p className="text-muted-foreground">{reportData.sintese.resumo}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Components Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Análise por Componente</CardTitle>
          <CardDescription>Avaliação detalhada de cada parte do veículo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportData.componentes.map((componente, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{componente.nome}</h4>
                  <Badge className={`${getStatusColor(componente.estado)} flex items-center gap-1`}>
                    {getStatusIcon(componente.estado)}
                    {componente.estado}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground pl-4 border-l-2 border-muted">
                  {componente.conclusao}
                </p>
                {index < reportData.componentes.length - 1 && (
                  <Separator className="mt-4" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button variant="outline" size="lg" className="min-w-40">
          <FileDown className="mr-2 h-4 w-4" />
          Baixar PDF
        </Button>
        
        <Button 
          variant="default" 
          size="lg" 
          onClick={onNewAnalysis}
          className="min-w-40"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Nova Análise
        </Button>
      </div>

      {/* Footer Note */}
      <Card className="bg-muted/50 border-0">
        <CardContent className="p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Este laudo foi gerado pela melhor inteligência artificial do mercado.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};