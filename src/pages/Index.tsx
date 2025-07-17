import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Camera, FileText, Car, Upload, MessageCircle } from 'lucide-react';
import { PhotoUpload } from '@/components/PhotoUpload';
import { VehicleForm } from '@/components/VehicleForm';
import { ReportViewer } from '@/components/ReportViewer';
import { useAuth } from '@/hooks/use-auth';
import { useVehicleAnalysis } from '@/hooks/use-vehicle-analysis';
import { AuthForm } from '@/components/AuthForm';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('photos');
  const {
    photos,
    vehicleData,
    analysis,
    loading,
    uploadPhotos,
    submitVehicleData,
    resetAnalysis
  } = useVehicleAnalysis();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  const handleNewAnalysis = () => {
    resetAnalysis();
    setActiveTab('photos');
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const getTabStatus = (tab: string) => {
    switch (tab) {
      case 'photos':
        return photos.length > 0 ? 'completed' : 'current';
      case 'vehicle':
        return vehicleData ? 'completed' : photos.length > 0 ? 'current' : 'pending';
      case 'report':
        return analysis ? 'completed' : vehicleData ? 'current' : 'pending';
      default:
        return 'pending';
    }
  };

  const isTabDisabled = (tab: string) => {
    switch (tab) {
      case 'photos':
        return false;
      case 'vehicle':
        return photos.length === 0;
      case 'report':
        return !vehicleData;
      default:
        return true;
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Nova Análise Técnica
                  </h1>
                  <p className="text-gray-600">
                    Faça o upload das fotos e preencha os dados do veículo para gerar o relatório
                  </p>
                </div>
                {analysis && (
                  <Button onClick={handleNewAnalysis} variant="outline">
                    <Car className="w-4 h-4 mr-2" />
                    Nova Análise
                  </Button>
                )}
              </div>
            </div>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Processo de Análise
                </CardTitle>
                <CardDescription>
                  Siga os passos abaixo para completar a análise técnica do veículo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger 
                      value="photos" 
                      disabled={isTabDisabled('photos')}
                      className="flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      Fotos
                      <Badge 
                        variant={getTabStatus('photos') === 'completed' ? 'default' : 'secondary'}
                        className="ml-1"
                      >
                        {getTabStatus('photos') === 'completed' ? '✓' : '1'}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="vehicle" 
                      disabled={isTabDisabled('vehicle')}
                      className="flex items-center gap-2"
                    >
                      <Car className="w-4 h-4" />
                      Dados do Veículo
                      <Badge 
                        variant={getTabStatus('vehicle') === 'completed' ? 'default' : 'secondary'}
                        className="ml-1"
                      >
                        {getTabStatus('vehicle') === 'completed' ? '✓' : '2'}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="report" 
                      disabled={isTabDisabled('report')}
                      className="flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Relatório
                      <Badge 
                        variant={getTabStatus('report') === 'completed' ? 'default' : 'secondary'}
                        className="ml-1"
                      >
                        {getTabStatus('report') === 'completed' ? '✓' : '3'}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="photos" className="space-y-4">
                    <div className="text-center py-4">
                      <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Upload das Fotos</h3>
                      <p className="text-gray-600 mb-4">
                        Faça o upload de fotos claras do veículo para análise
                      </p>
                    </div>
                    <PhotoUpload 
                      onPhotosUploaded={uploadPhotos}
                      loading={loading}
                    />
                    {photos.length > 0 && (
                      <div className="flex justify-end mt-4">
                        <Button 
                          onClick={() => setActiveTab('vehicle')}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Próximo: Dados do Veículo
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="vehicle" className="space-y-4">
                    <div className="text-center py-4">
                      <Car className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Dados do Veículo</h3>
                      <p className="text-gray-600 mb-4">
                        Preencha as informações do veículo para completar a análise
                      </p>
                    </div>
                    <VehicleForm 
                      onSubmit={submitVehicleData}
                      loading={loading}
                      onNext={() => setActiveTab('report')}
                    />
                  </TabsContent>

                  <TabsContent value="report" className="space-y-4">
                    {analysis ? (
                      <ReportViewer 
                        analysis={analysis} 
                        vehicleData={vehicleData}
                        onNewAnalysis={handleNewAnalysis}
                      />
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Gerando Relatório</h3>
                        <p className="text-gray-600 mb-4">
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