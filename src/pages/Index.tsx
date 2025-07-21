import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Camera, FileText, Car, Upload, History } from 'lucide-react';
import { PhotoUpload } from '@/components/PhotoUpload';
import { VehicleForm } from '@/components/VehicleForm';
import { ReportViewer } from '@/components/ReportViewer';
import { useAuth } from '@/hooks/use-auth';
import { AuthForm } from '@/components/AuthForm';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { History as HistoryPage } from '@/pages/History';
import { Plans } from '@/pages/Plans';
import { Settings } from '@/pages/Settings';
import { toast } from '@/hooks/use-toast';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Menu } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<'main' | 'history' | 'plans' | 'settings'>('main');
  const [activeTab, setActiveTab] = useState('photos');
  const [photos, setPhotos] = useState<File[]>([]);
  const [vehicleData, setVehicleData] = useState<any>(null);
  const [analysisResult, setAnalysisResult] = useState<Tables<'analises'> | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onAuthSuccess={() => {}} />;
  }

  const handleNewAnalysis = () => {
    setPhotos([]);
    setVehicleData(null);
    setAnalysisResult(null);
    setActiveTab('photos');
    setCurrentPage('main');
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handlePhotosUploaded = (uploadedPhotos: File[]) => {
    setPhotos(uploadedPhotos);
  };

  const handleVehicleDataSubmit = (data: any) => {
    setVehicleData(data);
  };

  const handleGenerateReport = async () => {
    if (!photos.length || !vehicleData) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, adicione fotos e preencha os dados do veículo",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock laudo content
      const mockLaudoContent = {
        veiculo: {
          placa: vehicleData.placa || "ABC-1234",
          modelo: vehicleData.fipeData?.marcaModelo || "Corolla",
          ano: vehicleData.fipeData?.ano || "2020",
          marca: vehicleData.fipeData?.marca || "Toyota"
        },
        sintese: {
          classificacao_risco: "Baixo",
          pontuacao_geral: 85,
          observacoes_gerais: "Veículo apresenta pequenos retoques estéticos na porta dianteira esquerda. Estrutura geral em bom estado.",
          recomendacoes: [
            "Verificar histórico de manutenção da pintura",
            "Acompanhar evolução dos retoques identificados"
          ]
        },
        componentes: [
          {
            nome: "Para-choque dianteiro", 
            estado: "Original",
            pontuacao: 90,
            observacoes: "Componente em estado original, sem sinais de reparo"
          },
          {
            nome: "Porta dianteira esquerda",
            estado: "Retocado",
            pontuacao: 75,
            observacoes: "Pequenos retoques de tinta identificados"
          }
        ]
      };
      
      // Mock analysis result matching Tables<'analises'> structure
      const mockResult: Tables<'analises'> = {
        id: crypto.randomUUID(),
        user_id: user.id,
        placa: vehicleData.placa || "ABC-1234",
        modelo: vehicleData.fipeData?.marcaModelo || "Corolla",
        json_laudo: mockLaudoContent,
        url_pdf: null,
        status: "concluido",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        imagens: null
      };
      
      setAnalysisResult(mockResult);
      setActiveTab('report');
      
      toast({
        title: "Análise concluída!",
        description: "O laudo técnico foi gerado com sucesso"
      });
      
    } catch (error) {
      toast({
        title: "Erro na análise",
        description: "Ocorreu um erro ao gerar o laudo. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getTabStatus = (tab: string) => {
    switch (tab) {
      case 'photos':
        return (photos && photos.length > 0) ? 'completed' : 'current';
      case 'vehicle':
        return vehicleData ? 'completed' : (photos && photos.length > 0) ? 'current' : 'pending';
      case 'report':
        return analysisResult ? 'completed' : vehicleData ? 'current' : 'pending';
      default:
        return 'pending';
    }
  };

  const isTabDisabled = (tab: string) => {
    switch (tab) {
      case 'photos':
        return false;
      case 'vehicle':
        return !photos || photos.length === 0;
      case 'report':
        return !vehicleData;
      default:
        return true;
    }
  };

  if (currentPage === 'history') {
    return (
      <SidebarProvider>
        <AppSidebar onNavigate={setCurrentPage} currentPage={currentPage} />
        <SidebarInset>
          <div className="flex items-center gap-2 p-4 border-b md:hidden">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">Histórico</h1>
          </div>
          <HistoryPage />
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (currentPage === 'plans') {
    return (
      <SidebarProvider>
        <AppSidebar onNavigate={setCurrentPage} currentPage={currentPage} />
        <SidebarInset>
          <div className="flex items-center gap-2 p-4 border-b md:hidden">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">Planos</h1>
          </div>
          <Plans />
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (currentPage === 'settings') {
    return (
      <SidebarProvider>
        <AppSidebar onNavigate={setCurrentPage} currentPage={currentPage} />
        <SidebarInset>
          <div className="flex items-center gap-2 p-4 border-b md:hidden">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">Configurações</h1>
          </div>
          <Settings />
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar onNavigate={setCurrentPage} currentPage={currentPage} />
      <SidebarInset>
        {/* Mobile Header */}
        <div className="flex items-center gap-2 p-4 border-b md:hidden bg-white">
          <SidebarTrigger />
          <h1 className="text-lg font-semibold">Nova Análise</h1>
        </div>
        
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 md:p-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-4 md:mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-2 hidden md:block">
                    Nova Análise Técnica
                  </h1>
                  <p className="text-sm md:text-base text-gray-600 hidden md:block">
                    Faça o upload das fotos e preencha os dados do veículo para gerar o relatório
                  </p>
                </div>
                {analysisResult && (
                  <Button onClick={handleNewAnalysis} variant="outline" size="sm" className="md:size-default">
                    <Car className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Nova Análise</span>
                    <span className="sm:hidden">Nova</span>
                  </Button>
                )}
              </div>
            </div>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <FileText className="w-5 h-5" />
                  Processo de Análise
                </CardTitle>
                <CardDescription className="text-sm">
                  Siga os passos abaixo para completar a análise técnica do veículo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-4 md:mb-6 h-auto">
                    <TabsTrigger 
                      value="photos" 
                      disabled={isTabDisabled('photos')}
                      className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3"
                    >
                      <Camera className="w-4 h-4" />
                      <span className="text-xs sm:text-sm">Fotos</span>
                      <Badge 
                        variant={getTabStatus('photos') === 'completed' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {getTabStatus('photos') === 'completed' ? '✓' : '1'}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="vehicle" 
                      disabled={isTabDisabled('vehicle')}
                      className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3"
                    >
                      <Car className="w-4 h-4" />
                      <span className="text-xs sm:text-sm">Dados</span>
                      <Badge 
                        variant={getTabStatus('vehicle') === 'completed' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {getTabStatus('vehicle') === 'completed' ? '✓' : '2'}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="report" 
                      disabled={isTabDisabled('report')}
                      className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3"
                    >
                      <FileText className="w-4 h-4" />
                      <span className="text-xs sm:text-sm">Relatório</span>
                      <Badge 
                        variant={getTabStatus('report') === 'completed' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {getTabStatus('report') === 'completed' ? '✓' : '3'}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="photos" className="space-y-4">
                    <div className="text-center py-2 md:py-4">
                      <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-base md:text-lg font-semibold mb-2">Upload das Fotos</h3>
                      <p className="text-sm md:text-base text-gray-600 mb-4">
                        Faça o upload de fotos claras do veículo para análise
                      </p>
                    </div>
                    <PhotoUpload 
                      onPhotosUploaded={handlePhotosUploaded}
                      maxPhotos={10}
                      onNext={() => setActiveTab('vehicle')}
                    />
                  </TabsContent>

                  <TabsContent value="vehicle" className="space-y-4">
                    <div className="text-center py-2 md:py-4">
                      <Car className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-base md:text-lg font-semibold mb-2">Dados do Veículo</h3>
                      <p className="text-sm md:text-base text-gray-600 mb-4">
                        Preencha as informações do veículo para completar a análise
                      </p>
                    </div>
                    <VehicleForm 
                      onDataSubmit={handleVehicleDataSubmit}
                      onBack={() => setActiveTab('photos')}
                      onGenerateReport={handleGenerateReport}
                      isGenerating={isGenerating}
                      photos={photos}
                    />
                  </TabsContent>

                  <TabsContent value="report" className="space-y-4">
                    {analysisResult ? (
                      <ReportViewer 
                        analysis={analysisResult}
                      />
                    ) : (
                      <div className="text-center py-4 md:py-8">
                        <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-base md:text-lg font-semibold mb-2">Gerando Relatório</h3>
                        <p className="text-sm md:text-base text-gray-600 mb-4">
                          Aguarde enquanto processamos a análise do veículo...
                        </p>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}