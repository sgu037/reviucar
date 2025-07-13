import { useState } from "react";
import { Car, ArrowLeft, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

interface VehicleFormProps {
  onDataSubmit: (data: { modelo: string; placa: string }) => void;
  onBack: () => void;
  onGenerateReport: () => void;
  isGenerating: boolean;
}

export const VehicleForm = ({ onDataSubmit, onBack, onGenerateReport, isGenerating }: VehicleFormProps) => {
  const [formData, setFormData] = useState({
    modelo: "",
    placa: ""
  });

  const handleInputChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onDataSubmit(newData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.modelo.trim()) {
      toast({
        title: "Modelo obrigatório",
        description: "Informe o modelo do veículo",
        variant: "destructive"
      });
      return;
    }

    if (!formData.placa.trim()) {
      toast({
        title: "Placa obrigatória",
        description: "Informe a placa do veículo",
        variant: "destructive"
      });
      return;
    }

    // Validação básica da placa (formato brasileiro)
    const placaRegex = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/;
    const placaLimpa = formData.placa.replace(/[^A-Z0-9]/g, '').toUpperCase();
    
    if (!placaRegex.test(placaLimpa)) {
      toast({
        title: "Placa inválida",
        description: "Use o formato ABC1234 ou ABC1D23",
        variant: "destructive"
      });
      return;
    }

    onGenerateReport();
  };

  const formatPlaca = (value: string) => {
    // Remove caracteres não alfanuméricos e converte para maiúscula
    const cleaned = value.replace(/[^A-Z0-9]/g, '').toUpperCase();
    
    // Aplica formatação ABC-1234 ou ABC-1D23
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 4) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    if (cleaned.length <= 7) return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 4)}${cleaned.slice(4)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 4)}${cleaned.slice(4, 6)}${cleaned.slice(6, 7)}`;
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vehicle Model */}
        <div className="space-y-2">
          <Label htmlFor="modelo" className="text-sm font-medium">
            Modelo do Veículo
          </Label>
          <Input
            id="modelo"
            placeholder="Ex: Chevrolet Spin LTZ, Honda Civic EXL..."
            value={formData.modelo}
            onChange={(e) => handleInputChange("modelo", e.target.value)}
            className="h-11"
          />
          <p className="text-xs text-muted-foreground">
            Informe marca, modelo e versão para melhor precisão
          </p>
        </div>

        {/* License Plate */}
        <div className="space-y-2">
          <Label htmlFor="placa" className="text-sm font-medium">
            Placa do Veículo
          </Label>
          <Input
            id="placa"
            placeholder="ABC-1234"
            value={formData.placa}
            onChange={(e) => handleInputChange("placa", formatPlaca(e.target.value))}
            maxLength={8}
            className="h-11 font-mono text-center text-lg tracking-wider"
          />
          <p className="text-xs text-muted-foreground">
            Formatos aceitos: ABC-1234 (antigo) ou ABC-1D23 (Mercosul)
          </p>
        </div>

        {/* Preview Card */}
        {formData.modelo && formData.placa && (
          <Card className="bg-gradient-to-r from-metallic to-metallic/80 border-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Car className="h-5 w-5" />
                Dados do Veículo
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Modelo</p>
                  <p className="font-medium">{formData.modelo}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Placa</p>
                  <p className="font-mono font-bold text-lg">{formData.placa}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Important Info */}
        <Card className="border-warning/20 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-warning mt-0.5" />
              <div className="text-sm">
                <h4 className="font-medium mb-1 text-warning">
                  Análise com IA Avançada
                </h4>
                <p className="text-muted-foreground">
                  Nosso sistema utilizará inteligência artificial para analisar as fotos 
                  e gerar um laudo técnico detalhado sobre o estado do veículo.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button 
            type="button"
            variant="outline" 
            onClick={onBack}
            disabled={isGenerating}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          
          <Button 
            type="submit"
            size="lg"
            disabled={!formData.modelo || !formData.placa || isGenerating}
            className="min-w-40"
            variant="industrial"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent mr-2" />
                Gerando Laudo...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Gerar Laudo
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};