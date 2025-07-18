import { CheckCircle, AlertTriangle, FileDown, RotateCcw, Car, Shield, Search, Wrench, DollarSign } from "lucide-react";
import { MessageCircle } from "lucide-react";
import { generatePDF } from "./PDFGenerator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface ReportData {
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
    manutencoes_pendentes?: string[];
  };
  whatsapp?: string;
}

interface ReportViewerProps {
  reportData: ReportData;
  onNewAnalysis: () => void;
  vehicleData?: any;
}

export const ReportViewer = ({ reportData, onNewAnalysis, vehicleData }: ReportViewerProps) => {
  const [porcentagem, setPorcentagem] = useState<number>(78);
  const [subtrair, setSubtrair] = useState<number>(1000);
  const [valorFinal, setValorFinal] = useState<string>("");

  // Função para verificar se um número vibra em 8
  const vibraEm8 = (valor: number): boolean => {
    let soma = valor.toString().split('').reduce((acc, val) => acc + Number(val), 0);
    while (soma > 9) {
      soma = soma.toString().split('').reduce((acc, val) => acc + Number(val), 0);
    }
    return soma === 8;
  };

  // Função para calcular a simulação
  const calcularSimulacao = () => {
    // Extrair valor numérico da FIPE
    const valorFipeStr = reportData.veiculo.valor_fipe.replace(/[^\d,]/g, '').replace(',', '.');
    const valorFipe = parseFloat(valorFipeStr);
    
    if (isNaN(valorFipe) || !porcentagem) {
      toast({
        title: "Erro no cálculo",
        description: "Valores inválidos para simulação",
        variant: "destructive"
      });
      return;
    }

    let base = valorFipe * (porcentagem / 100) - (subtrair || 0);
    let valor = Math.floor(base);

    // Encontrar o próximo valor que vibra em 8 (para baixo)
    while (valor > 0 && !vibraEm8(valor)) {
      valor--;
    }

    setValorFinal(`R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    
    toast({
      title: "Simulação calculada!",
      description: `Valor final: ${valorFinal}`,
    });
  };

  const handleSendWhatsApp = () => {
    if (!reportData.whatsapp) {
      toast({
        title: "WhatsApp não informado",
        description: "Número do WhatsApp não foi fornecido nos dados do veículo",
        variant: "destructive"
      });
      return;
    }

    const expressValue = valorFinal || "Não calculado";
    const quilometragem = vehicleData?.quilometragem ? `${vehicleData.quilometragem} km` : "Não informado";
    
    const message = `🚗 *DADOS DO VEÍCULO*

*Modelo:* ${reportData.veiculo.modelo}
*Ano:* ${reportData.veiculo.ano}
*Placa:* ${reportData.veiculo.placa}
*Combustível:* ${reportData.veiculo.combustivel}
*Quilometragem:* ${quilometragem}
*Valor FIPE:* ${reportData.veiculo.valor_fipe}

💰 *VALOR SUGERIDO: ${expressValue}*

---
ReviuCar - Análise Técnica Veicular`;

    const phoneNumber = reportData.whatsapp.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/55${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "WhatsApp aberto!",
      description: "Mensagem preparada para envio"
    });
  };

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
      <div className="text-center px-2">
        <div className="flex items-center justify-center gap-2 mb-2">
          <CheckCircle className="h-6 w-6 text-success" />
          <h2 className="text-lg sm:text-2xl font-bold">Laudo Técnico Gerado</h2>
        </div>
        <p className="text-sm sm:text-base text-muted-foreground">
          Análise completa do veículo realizada com sucesso
        </p>
      </div>

      {/* Vehicle Info */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Car className="h-5 w-5" />
            Informações do Veículo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-sm">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Marca/Modelo</p>
              <p className="font-semibold text-sm sm:text-lg">{reportData.veiculo.marca} {reportData.veiculo.modelo}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Ano</p>
              <p className="font-semibold text-sm sm:text-lg">{reportData.veiculo.ano}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Placa</p>
              <p className="font-mono font-bold text-sm sm:text-lg">{reportData.veiculo.placa}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Valor FIPE</p>
              <p className="font-bold text-sm sm:text-lg text-success">{reportData.veiculo.valor_fipe}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Combustível</p>
              <p className="font-semibold text-sm sm:text-lg">{reportData.veiculo.combustivel}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Código FIPE</p>
              <p className="font-mono text-sm">{reportData.veiculo.codigo_fipe}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Report Section */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-xl">
            🔧 <span className="font-bold">Parecer Técnico – Verificação de Batidas, Massa e Retoques</span>
          </CardTitle>
          <CardDescription className="text-sm">Análise técnica especializada seguindo protocolo automotivo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3 sm:space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground min-w-24 sm:min-w-32">• Repintura detectada em:</span>
              <span className="font-semibold text-foreground">{reportData.sintese.repintura_em}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground min-w-24 sm:min-w-32">• Massa plástica visível em:</span>
              <span className="font-semibold text-foreground">{reportData.sintese.massa_em}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground min-w-24 sm:min-w-32">• Alinhamento comprometido em:</span>
              <span className="font-semibold text-foreground">{reportData.sintese.alinhamento_comprometido}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground min-w-24 sm:min-w-32">• Vidros/faróis trocados:</span>
              <span className="font-semibold text-foreground">{reportData.sintese.vidros_trocados}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground min-w-24 sm:min-w-32">• Estrutura inferior:</span>
              <span className="font-semibold text-foreground">{reportData.sintese.estrutura_inferior}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground min-w-24 sm:min-w-32">• Conclusão:</span>
              <span className="font-semibold text-foreground">{reportData.sintese.resumo}</span>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex items-center gap-3 p-3 sm:p-4 bg-primary/10 rounded-lg">
            {reportData.sintese.estrutura_ok ? (
              <span className="text-2xl">🛑</span>
            ) : (
              <span className="text-2xl">🛑</span>
            )}
            <div>
              <p className="font-bold text-sm sm:text-lg">Classificação de Risco: 
                <span className={reportData.sintese.conclusao_final === 'Reparo estético' ? 'text-yellow-600' : 'text-destructive'}>
                  {reportData.sintese.conclusao_final === 'Reparo estético' ? ' BAIXO' : ' MÉDIO'}
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Express Evaluation Section */}
      <Card className="bg-gradient-to-r from-success/5 to-success/10 border-success/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <DollarSign className="h-5 w-5" />
            Avaliação Expressa
          </CardTitle>
          <CardDescription className="text-sm">Análise de valor baseada em FIPE e condições técnicas</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Valor FIPE (apenas exibição) */}
          <div className="p-2 sm:p-3 bg-muted/50 rounded-lg mb-4">
            <Label className="text-sm font-medium">Valor FIPE (automático)</Label>
            <p className="text-base sm:text-lg font-bold text-success">{reportData.veiculo.valor_fipe}</p>
          </div>

          {/* Campos de configuração */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="porcentagem">Porcentagem do FIPE (%)</Label>
              <Input
                id="porcentagem"
                type="number"
                value={porcentagem}
                onChange={(e) => setPorcentagem(Number(e.target.value))}
                min="1"
                max="100"
                className="text-center h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtrair">Valor fixo para subtrair (R$)</Label>
              <Input
                id="subtrair"
                type="number"
                value={subtrair}
                onChange={(e) => setSubtrair(Number(e.target.value))}
                min="0"
                className="text-center h-10"
              />
            </div>
          </div>

          {/* Botão Simular */}
          <Button 
            onClick={calcularSimulacao}
            className="w-full mb-4"
            size="sm"
          >
            🧮 Simular Valor
          </Button>

          {/* Resultado */}
          {valorFinal && (
            <div className="p-3 sm:p-4 bg-success/10 rounded-lg border border-success/20 text-center mb-4">
              <p className="text-sm text-muted-foreground mb-1">Valor Final Calculado</p>
              <p className="text-xl sm:text-2xl font-bold text-success">{valorFinal}</p>
              <p className="text-xs text-muted-foreground mt-2">
                * Valor ajustado para vibração numerológica 8
              </p>
            </div>
          )}

          {/* Botão WhatsApp */}
          {reportData.whatsapp && valorFinal && (
            <Button
              onClick={handleSendWhatsApp}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              <span className="text-sm">Enviar para Cliente via WhatsApp</span>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Components Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Análise por Componente</CardTitle>
          <CardDescription className="text-sm">Avaliação detalhada de cada parte do veículo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            {reportData.componentes.map((componente, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm sm:text-base">{componente.nome}</h4>
                  <Badge className={`${getStatusColor(componente.estado)} flex items-center gap-1`}>
                    {getStatusIcon(componente.estado)}
                    <span className="text-xs">{componente.estado}</span>
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground pl-3 sm:pl-4 border-l-2 border-muted">
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
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full sm:w-auto sm:min-w-40"
          onClick={() => generatePDF(reportData)}
        >
          <FileDown className="mr-2 h-4 w-4" />
          <span className="text-sm">Baixar PDF</span>
        </Button>
        
        {reportData.whatsapp && (
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleSendWhatsApp}
            className="w-full sm:w-auto sm:min-w-40 bg-green-600 hover:bg-green-700"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            <span className="text-sm">Enviar por WhatsApp</span>
          </Button>
        )}
        
        <Button 
          variant="default" 
          size="sm" 
          onClick={onNewAnalysis}
          className="w-full sm:w-auto sm:min-w-40"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          <span className="text-sm">Nova Análise</span>
        </Button>
      </div>

      {/* Footer Note */}
      <Card className="bg-muted/50 border-0">
        <CardContent className="p-3 sm:p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Este laudo foi gerado pela melhor inteligência artificial do mercado.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};