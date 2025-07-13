import React, { useState } from "react";
import { Upload, Car, FileText, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PhotoUpload } from "@/components/PhotoUpload";
import { VehicleForm } from "@/components/VehicleForm";
import { ReportViewer } from "@/components/ReportViewer";
import { toast } from "@/hooks/use-toast";
import heroImage from "@/assets/hero-automotive.jpg";

const Index = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [photos, setPhotos] = useState<File[]>([]);
  const [vehicleData, setVehicleData] = useState({ modelo: "", placa: "" });
  const [reportData, setReportData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const steps = [
    { number: 1, title: "Upload de Fotos", icon: Upload, description: "Adicione até 6 fotos do veículo" },
    { number: 2, title: "Dados do Veículo", icon: Car, description: "Informe modelo e placa" },
    { number: 3, title: "Laudo Técnico", icon: FileText, description: "Visualize o relatório gerado" }
  ];

  const handlePhotoUpload = (uploadedPhotos: File[]) => {
    setPhotos(uploadedPhotos);
  };

  const handleVehicleData = (data: { modelo: string; placa: string }) => {
    setVehicleData(data);
  };

  const generateReport = async () => {
    setIsGenerating(true);
    toast({
      title: "Gerando Laudo",
      description: "Aguarde enquanto analisamos as imagens..."
    });

    try {
      // Simulação da geração do laudo
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockReport = {
        veiculo: {
          modelo: vehicleData.modelo,
          placa: vehicleData.placa
        },
        componentes: [
          { nome: "Carroceria Lateral Direita", estado: "Original", conclusao: "Pintura original preservada, sem indícios de reparo" },
          { nome: "Para-choque Dianteiro", estado: "Retocado", conclusao: "Leve diferença de tonalidade, possível retoque localizado" },
          { nome: "Capô", estado: "Original", conclusao: "Estrutura íntegra, pintura original sem ondulações" },
          { nome: "Porta Traseira Esquerda", estado: "Original", conclusao: "Alinhamento correto, vãos regulares" }
        ],
        sintese: {
          resumo: "Veículo apresenta características predominantemente originais com único indício de retoque no para-choque dianteiro",
          repintura_em: "Para-choque dianteiro",
          massa_em: "nenhuma",
          alinhamento_comprometido: "nenhuma",
          vidros_trocados: "nenhuma",
          estrutura_inferior: "OK",
          estrutura_ok: true,
          conclusao_final: "Reparo estético",
          manutencoes_pendentes: ["Padronização da cor do para-choque"]
        }
      };

      setReportData(mockReport);
      setCurrentStep(3);
      
      toast({
        title: "Laudo Gerado!",
        description: "Análise concluída com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao gerar o laudo",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-primary to-primary-hover text-primary-foreground py-12 shadow-lg overflow-hidden">
        <div 
          className="absolute inset-0 opacity-20 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="relative container mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Car className="h-8 w-8" />
            <h1 className="text-4xl font-bold">ReviuCar</h1>
          </div>
          <p className="text-primary-foreground/90 text-lg max-w-2xl">
            Sistema profissional de análise técnica veicular com inteligência artificial
          </p>
        </div>
      </div>

      {/* Steps Progress */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-colors ${
                  currentStep >= step.number 
                    ? 'bg-primary border-primary text-primary-foreground' 
                    : 'border-muted-foreground text-muted-foreground'
                }`}>
                  {currentStep > step.number ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <step.icon className="h-6 w-6" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    currentStep > step.number ? 'bg-primary' : 'bg-muted-foreground'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current Step Content */}
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg border-0" style={{ boxShadow: 'var(--shadow-card)' }}>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                {React.createElement(steps[currentStep - 1].icon, { className: "h-6 w-6" })}
                {steps[currentStep - 1].title}
              </CardTitle>
              <CardDescription className="text-base">
                {steps[currentStep - 1].description}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
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
                  isGenerating={isGenerating}
                />
              )}
              
              {currentStep === 3 && reportData && (
                <ReportViewer 
                  reportData={reportData}
                  onNewAnalysis={() => {
                    setCurrentStep(1);
                    setPhotos([]);
                    setVehicleData({ modelo: "", placa: "" });
                    setReportData(null);
                  }}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
