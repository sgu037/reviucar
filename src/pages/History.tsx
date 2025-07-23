import { useState, useEffect } from "react";
import { FileText, Calendar, Car, Search, Filter, BarChart3, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { startOfMonth, endOfMonth, subDays, startOfDay, endOfDay } from "date-fns";

interface Analysis {
  id: string;
  placa: string;
  modelo: string;
  json_laudo: any;
  status: string;
  created_at: string;
  updated_at: string;
}

export const History = () => {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("30"); // days
  const [monthlyStats, setMonthlyStats] = useState({
    thisMonth: 0,
    completed: 0,
    pending: 0,
    total: 0
  });

  useEffect(() => {
    loadAnalyses();
  }, [user]);

  useEffect(() => {
    calculateStats();
  }, [analyses]);

  const loadAnalyses = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Calculate date range based on filter
      const now = new Date();
      let startDate: Date;
      
      switch (dateFilter) {
        case "7":
          startDate = subDays(now, 7);
          break;
        case "15":
          startDate = subDays(now, 15);
          break;
        case "30":
          startDate = subDays(now, 30);
          break;
        case "thisMonth":
          startDate = startOfMonth(now);
          break;
        default:
          startDate = subDays(now, 30);
      }
      
      const { data, error } = await supabase
        .from('analises')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
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

  const calculateStats = () => {
    const now = new Date();
    const startOfThisMonth = startOfMonth(now);
    const endOfThisMonth = endOfMonth(now);
    
    const thisMonthAnalyses = analyses.filter(analysis => {
      const analysisDate = new Date(analysis.created_at);
      return analysisDate >= startOfThisMonth && analysisDate <= endOfThisMonth;
    });
    
    const completed = analyses.filter(a => a.status === 'gerado').length;
    const pending = analyses.filter(a => a.status === 'pendente').length;
    
    setMonthlyStats({
      thisMonth: thisMonthAnalyses.length,
      completed,
      pending,
      total: analyses.length
    });
  };

  useEffect(() => {
    loadAnalyses();
  }, [dateFilter, user]);

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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Carregando histórico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">

      {/* Content */}
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Page Title */}
        <div className="mb-4 sm:mb-8">
          <h1 className="text-xl sm:text-3xl font-heading font-bold text-foreground mb-2 hidden md:block">
            Dashboard de Análises
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground hidden md:block">
            Acompanhe suas análises técnicas e estatísticas
          </p>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-blue-600">Este Mês</p>
                  <p className="text-lg sm:text-2xl font-bold text-blue-700">{monthlyStats.thisMonth}</p>
                </div>
                <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-green-600">Concluídas</p>
                  <p className="text-lg sm:text-2xl font-bold text-green-700">{monthlyStats.completed}</p>
                </div>
                <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-yellow-600">Pendentes</p>
                  <p className="text-lg sm:text-2xl font-bold text-yellow-700">{monthlyStats.pending}</p>
                </div>
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-purple-600">Total</p>
                  <p className="text-lg sm:text-2xl font-bold text-purple-700">{monthlyStats.total}</p>
                </div>
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-end">
              <div className="flex-1">
                <Label className="text-xs sm:text-sm font-medium mb-1 block">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por placa ou modelo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10"
                  />
                </div>
              </div>
              
              <div className="sm:w-40">
                <Label className="text-xs sm:text-sm font-medium mb-1 block">Período</Label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Últimos 7 dias</SelectItem>
                    <SelectItem value="15">Últimos 15 dias</SelectItem>
                    <SelectItem value="30">Últimos 30 dias</SelectItem>
                    <SelectItem value="thisMonth">Este mês</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="sm:w-48">
                <Label className="text-xs sm:text-sm font-medium mb-1 block">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full h-10">
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
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {filteredAnalyses.length === 0 ? (
          <Card>
            <CardContent className="py-8 sm:py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-medium mb-2">
                {analyses.length === 0 ? "Nenhuma análise encontrada" : "Nenhum resultado"}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                {analyses.length === 0 
                  ? `Você ainda não realizou nenhuma análise técnica ${dateFilter === 'thisMonth' ? 'este mês' : `nos últimos ${dateFilter} dias`}`
                  : "Tente ajustar os filtros para encontrar suas análises"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Mostrando {filteredAnalyses.length} análise{filteredAnalyses.length !== 1 ? 's' : ''} 
                {dateFilter === 'thisMonth' ? ' deste mês' : ` dos últimos ${dateFilter} dias`}
              </p>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              {filteredAnalyses.map((analysis) => (
                <Card key={analysis.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 sm:space-y-2 flex-1 min-w-0">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                          <Car className="h-5 w-5" />
                          <span className="truncate">{analysis.modelo}</span>
                        </CardTitle>
                        <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm">
                          <span className="font-mono font-bold">{analysis.placa}</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span className="text-xs sm:text-sm">
                              {format(new Date(analysis.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                          </span>
                        </CardDescription>
                      </div>
                      <Badge className={`${getStatusColor(analysis.status)} text-xs flex-shrink-0`}>
                        {getStatusText(analysis.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {analysis.json_laudo?.sintese && (
                      <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm">
                          <strong>Conclusão:</strong> {analysis.json_laudo.sintese.conclusao_final || "Não disponível"}
                        </p>
                        {analysis.json_laudo.sintese.resumo && (
                          <p className="text-xs sm:text-sm mt-2 text-muted-foreground">
                            {analysis.json_laudo.sintese.resumo}
                          </p>
                        )}
                      </div>
                    )}
                    
                    <Separator className="my-4" />
                    
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      <p>Análise realizada em {format(new Date(analysis.created_at), "dd/MM/yyyy", { locale: ptBR })}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};