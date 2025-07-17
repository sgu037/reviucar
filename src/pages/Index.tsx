import React, { useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import { AuthForm } from '../components/AuthForm';
import { VehicleForm } from '../components/VehicleForm';
import { ReportViewer } from '../components/ReportViewer';
import { Navigation } from '../components/Navigation';
import { useVehicleAnalysis } from '../hooks/use-vehicle-analysis';

export default function Index() {
  const { user, loading } = useAuth();
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const { analyzeVehicle, isLoading } = useVehicleAnalysis();

  const handleAnalysisComplete = (analysis) => {
    setCurrentAnalysis(analysis);
  };

  const handleNewAnalysis = () => {
    setCurrentAnalysis(null);
  };

  const handleAuthSuccess = () => {
    // Auth success is handled by the useAuth hook
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation onHistoryClick={() => {}} />
      
      <div className="container mx-auto px-4 py-8">
        {!currentAnalysis ? (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Análise Veicular
              </h1>
              <p className="text-gray-600">
                Faça uma análise completa do seu veículo
              </p>
            </div>
            
            <VehicleForm 
              onAnalysisComplete={handleAnalysisComplete}
              analyzeVehicle={analyzeVehicle}
              isLoading={isLoading}
            />
          </div>
        ) : (
          <ReportViewer 
            analysis={currentAnalysis} 
            onNewAnalysis={handleNewAnalysis}
          />
        )}
      </div>
    </div>
  );
}