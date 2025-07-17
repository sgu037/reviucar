import { useState, useEffect } from "react";
import { FileText, Download, Send, Calendar, Car, ArrowLeft, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ReviuCarLogo } from "@/components/ReviuCarLogo";
import { UserMenu } from "@/components/UserMenu";
import { generatePDF } from "@/components/PDFGenerator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Analysis {
  id: string;
  placa: string;
  modelo: string;
  json_laudo: any;
  status: string;
  created_at: string;
  updated_at: string;
}

interface HistoryProps {
  onBack: () => void;
}

export const History = ({ onBack }: HistoryProps) => {
  const { user, signOut } = useAuth();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadAnalyses();
  }, [user]);

  const loadAnalyses = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('analises')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setAnalyses(data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast({
        title: "Erro ao carregar histórico",
        description: "Não foi possível carregar suas análises",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (analysis: Analysis) => {
    try {
      if (!analysis.json_laudo) {
        toast({
          title: "Erro no download",
          description: "Dados da análise não encontrados",
          variant: "destructive"
        });
        return;
      }

      // Convert the stored laudo to the expected format
      const reportData = {
        veiculo: {
          marca: analysis.json_laudo.veiculo?.marca || "",
          modelo: analysis.modelo,
          ano: analysis.json_laudo.veiculo?.ano || 0,
          valor_fipe: analysis.json_laudo.veiculo?.valor_fipe || "",
          codigo_fipe: analysis.json_laudo.veiculo?.codigo_fipe || "",
          combustivel: analysis.json_laudo.veiculo?.combustivel || "",
          placa: analysis.placa
        },
        componentes: analysis.json_laudo.componentes || [],
        sintese: analysis.json_laudo.sintese || {}
      };

      await generatePDF(reportData);
      
      toast({
        title: "PDF gerado com sucesso!",
        description: "O arquivo foi baixado para seu dispositivo"
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível gerar o arquivo PDF",
        variant: "destructive"
      });
    }
  };

  const handleSendDocs = (analysis: Analysis) => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "O envio de documentos estará disponível em breve"
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'gerado':
        return 'bg-success text-success-foreground';
      case 'pendente':
        return 'bg-warning text-warning-foreground';
      case 'erro':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'gerado':
        return 'Concluído';
      case 'pendente':
        return 'Pendente';
      case 'erro':
        return 'Erro';
      default:
        return status;
    }
  };

  const filteredAnalyses = analyses.filter(analysis => {
    const matchesSearch = analysis.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         analysis.modelo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || analysis.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <ReviuCarLogo size="lg" showText={true} />
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Carregando histórico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-primary via-primary-hover to-primary text-primary-foreground py-8 shadow-2xl">
        <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut()}
            className="bg-black border-black text-white hover:bg-black/90 hover:text-white"
          >
            Sair
          </Button>
          <UserMenu />
        </div>
        
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </div>
          
          <div className="flex flex-col items-center text-center space-y-4">
            <ReviuCarLogo size="lg" showText={true} className="text-white" />
            <div>
              <h1 className="text-2xl md:text-3xl font-heading font-bold">
                Histórico de Análises
              </h1>
              <p className="text-primary-foreground/90 mt-2">
                Visualize e gerencie todas as suas análises técnicas
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por placa ou modelo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="gerado">Concluído</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="erro">Erro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {filteredAnalyses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {analyses.length === 0 ? "Nenhuma análise encontrada" : "Nenhum resultado"}
              </h3>
              <p className="text-muted-foreground">
                {analyses.length === 0 
                  ? "Você ainda não realizou nenhuma análise técnica"
                  : "Tente ajustar os filtros para encontrar suas análises"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAnalyses.map((analysis) => (
              <Card key={analysis.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="flex items-center gap-2">
                        <Car className="h-5 w-5" />
                        {analysis.modelo}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4">
                        <span className="font-mono font-bold">{analysis.placa}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(analysis.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(analysis.status)}>
                      {getStatusText(analysis.status)}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {analysis.json_laudo?.sintese && (
                    <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm">
                        <strong>Conclusão:</strong> {analysis.json_laudo.sintese.conclusao_final || "Não disponível"}
                      </p>
                      {analysis.json_laudo.sintese.resumo && (
                        <p className="text-sm mt-2 text-muted-foreground">
                          {analysis.json_laudo.sintese.resumo}
                        </p>
                      )}
                    </div>
                  )}
                  
                  <Separator className="my-4" />
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPDF(analysis)}
                      className="flex-1"
                      disabled={!analysis.json_laudo}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Baixar PDF
                    </Button>
                    
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleSendDocs(analysis)}
                      className="flex-1"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Enviar Docs
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};