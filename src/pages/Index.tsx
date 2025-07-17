import React, { useState } from "react";
import { Upload, FileText, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PhotoUpload } from "@/components/PhotoUpload";
import { VehicleForm } from "@/components/VehicleForm";
import { ReportViewer } from "@/components/ReportViewer";
import { AuthForm } from "@/components/AuthForm";
import { AppSidebar } from "@/components/AppSidebar";
import { History } from "@/pages/History";
import { toast } from "@/hooks/use-toast";
import { useVehicleAnalysis } from "@/hooks/use-vehicle-analysis";
import { useAuth } from "@/hooks/use-auth";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

interface FipeData {
  Valor: string;
  Marca: string;
  Modelo: string;
  AnoModelo: number;
  CodigoFipe: string;
  Combustivel: string;
}

const Index = () => {
  const { user, loading, isAuthenticated, signOut } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [currentPage, setCurrentPage] = useState<'main' | 'history'>('main');
  const [photos, setPhotos] = useState<File[]>([]);
  const [vehicleData, setVehicleData] = useState<{ fipeData: FipeData | null; placa: string; whatsapp: string }>({ 
    fipeData: null, 
    placa: "",
    whatsapp: ""
  });
  const [reportData, setReportData] = useState(null);
  const { analyzeVehicle, isAnalyzing } = useVehicleAnalysis();

  const steps = [
    { number: 1, title: "Upload de Fotos", icon: Upload, description: "Adicione até 6 fotos do veículo" },
    { number: 2, title: "Dados do Veículo", icon: Star, description: "Consulte dados oficiais da tabela FIPE" },
    { number: 3, title: "Relatório", icon: FileText, description: "Análise completa do veículo" }
  ];

  const handlePhotoUpload = (uploadedPhotos: File[]) => {
    setPhotos(uploadedPhotos);
  };

  const handleVehicleData = (data: { fipeData: FipeData | null; placa: string; whatsapp: string }) => {
    setVehicleData(data);
  };

  const generateReport = async () => {
    // Validações antes de iniciar a análise
    if (!photos || photos.length === 0) {
      toast({
        title: "Fotos necessárias",
        description: "Por favor, adicione pelo menos uma foto do veículo",
        variant: "destructive"
      });
      return;
    }

    if (!vehicleData.placa) {
      toast({
        title: "Placa necessária",
        description: "Por favor, informe a placa do veículo",
        variant: "destructive"
      });
      return;
    }

    const result = await analyzeVehicle({
      photos,
      vehicleData
    });
    
    if (result) {
      setReportData(result);
      setCurrentStep(3);
      
      toast({
        title: "Laudo Gerado!",
        description: "Análise técnica concluída com sucesso"
      });
    }
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Show auth form if not authenticated
  if (!isAuthenticated) {
    return <AuthForm onAuthSuccess={() => {}} />;
  }

  // Show history screen
  if (currentPage === 'history') {
    return (
      <SidebarProvider>
        <AppSidebar onNavigate={setCurrentPage} currentPage={currentPage} />
        <SidebarInset>
          <History />
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (

    <SidebarProvider>
      <AppSidebar onNavigate={setCurrentPage} currentPage={currentPage} />
      <SidebarInset>
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
          {/* Modern Steps Progress */}
          <div className="container mx-auto px-4 py-8 sm:py-12">
            <div className="flex justify-center mb-8 sm:mb-12">
              <div className="flex items-center space-x-4 sm:space-x-8">
                {steps.map((step, index) => (
                  <div key={step.number} className="flex items-center">
                    <div className="flex flex-col items-center space-y-2">
                      <div className={`flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-2xl border-2 transition-all duration-300 shadow-lg ${
                        currentStep >= step.number 
                          ? 'bg-primary border-primary text-primary-foreground shadow-primary/20' 
                          : 'border-border bg-background text-muted-foreground hover:bg-muted/50'
                      }`}>
                        {currentStep > step.number ? (
                          <CheckCircle className="h-5 w-5 sm:h-7 sm:w-7" />
                        ) : (
                          <step.icon className="h-5 w-5 sm:h-7 sm:w-7" />
                        )}
                      </div>
                      <div className="text-center">
                        <p className={`text-xs sm:text-sm font-medium ${
                          currentStep >= step.number ? 'text-primary' : 'text-muted-foreground'
                        }`}>
                          {step.title}
                        </p>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-8 sm:w-20 h-0.5 mx-3 sm:mx-6 transition-colors duration-300 ${
                        currentStep > step.number ? 'bg-primary' : 'bg-border'
                      }`} />
                    )}
                  </div>
                ))}
              </div>

            {/* Modern Card */}
            <div className="max-w-5xl mx-auto">
              <Card className="shadow-2xl border-0 bg-card/60 backdrop-blur-sm" style={{ boxShadow: 'var(--shadow-card)' }}>
                <CardHeader className="text-center pb-4 sm:pb-6 px-4 sm:px-6">
                  <CardTitle className="flex items-center justify-center gap-2 sm:gap-3 text-xl sm:text-3xl font-heading font-semibold">
                    {React.createElement(steps[currentStep - 1].icon, { className: "h-6 w-6 sm:h-8 sm:w-8 text-primary" })}
                    {steps[currentStep - 1].title}
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
                    {steps[currentStep - 1].description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-8">
                  {currentStep === 1 && (
                    <PhotoUpload 
                      onPhotosUploaded={handlePhotoUpload}
                      maxPhotos={6}
                      onNext={() => setCurrentStep(2)}
                    />
                  )}
                  
                  {currentStep === 2 && (
                    <VehicleForm 
                      onDataSubmit={handleVehicleData}
                      onBack={() => setCurrentStep(1)}
                      onGenerateReport={generateReport}
                      isGenerating={isAnalyzing}
                      photos={photos}
                    />
                  )}
                  
                  {currentStep === 3 && reportData && (
                    <ReportViewer 
                      reportData={reportData}
                      onNewAnalysis={() => {
                        setCurrentStep(1);
                        setPhotos([]);
                        setVehicleData({ fipeData: null, placa: "", whatsapp: "" });
                        setReportData(null);
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Index;
