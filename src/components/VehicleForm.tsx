import { useState, useEffect } from "react";
import { Car, ArrowLeft, Zap, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

interface FipeData {
  Valor: string;
  Marca: string;
  Modelo: string;
  AnoModelo: number;
  CodigoFipe: string;
  Combustivel: string;
}

interface VehicleFormProps {
  onDataSubmit: (data: { fipeData: FipeData | null; placa: string }) => void;
  onBack: () => void;
  onGenerateReport: () => void;
  isGenerating: boolean;
}

export const VehicleForm = ({ onDataSubmit, onBack, onGenerateReport, isGenerating }: VehicleFormProps) => {
  const [placa, setPlaca] = useState("");
  const [marcas, setMarcas] = useState<Array<{codigo: string, nome: string}>>([]);
  const [modelos, setModelos] = useState<Array<{codigo: number, nome: string}>>([]);
  const [anos, setAnos] = useState<Array<{codigo: string, nome: string}>>([]);
  const [selectedMarca, setSelectedMarca] = useState("");
  const [selectedModelo, setSelectedModelo] = useState("");
  const [selectedAno, setSelectedAno] = useState("");
  const [fipeData, setFipeData] = useState<FipeData | null>(null);
  const [isLoadingMarcas, setIsLoadingMarcas] = useState(false);
  const [isLoadingModelos, setIsLoadingModelos] = useState(false);
  const [isLoadingAnos, setIsLoadingAnos] = useState(false);
  const [isLoadingFipe, setIsLoadingFipe] = useState(false);

  // Carregar marcas ao montar o componente
  useEffect(() => {
    loadMarcas();
  }, []);

  // Atualizar dados do pai sempre que houver mudanças
  useEffect(() => {
    onDataSubmit({ fipeData, placa });
  }, [fipeData, placa, onDataSubmit]);

  const loadMarcas = async () => {
    setIsLoadingMarcas(true);
    try {
      const response = await fetch('https://parallelum.com.br/fipe/api/v1/carros/marcas');
      const data = await response.json();
      setMarcas(data);
    } catch (error) {
      toast({
        title: "Erro ao carregar marcas",
        description: "Tente novamente em alguns instantes",
        variant: "destructive"
      });
    } finally {
      setIsLoadingMarcas(false);
    }
  };

  const loadModelos = async (marcaId: string) => {
    setIsLoadingModelos(true);
    try {
      const response = await fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${marcaId}/modelos`);
      const data = await response.json();
      setModelos(data.modelos);
    } catch (error) {
      toast({
        title: "Erro ao carregar modelos",
        description: "Tente novamente em alguns instantes",
        variant: "destructive"
      });
    } finally {
      setIsLoadingModelos(false);
    }
  };

  const loadAnos = async (marcaId: string, modeloId: string) => {
    setIsLoadingAnos(true);
    try {
      const response = await fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${marcaId}/modelos/${modeloId}/anos`);
      const data = await response.json();
      setAnos(data);
    } catch (error) {
      toast({
        title: "Erro ao carregar anos",
        description: "Tente novamente em alguns instantes",
        variant: "destructive"
      });
    } finally {
      setIsLoadingAnos(false);
    }
  };

  const loadFipeData = async (marcaId: string, modeloId: string, anoCodigo: string) => {
    setIsLoadingFipe(true);
    try {
      const response = await fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${marcaId}/modelos/${modeloId}/anos/${anoCodigo}`);
      const data = await response.json();
      setFipeData(data);
      toast({
        title: "Dados FIPE carregados",
        description: `Valor: ${data.Valor}`,
      });
    } catch (error) {
      toast({
        title: "Erro ao carregar dados FIPE",
        description: "Tente novamente em alguns instantes",
        variant: "destructive"
      });
    } finally {
      setIsLoadingFipe(false);
    }
  };

  const handleMarcaChange = (value: string) => {
    setSelectedMarca(value);
    setSelectedModelo("");
    setSelectedAno("");
    setModelos([]);
    setAnos([]);
    setFipeData(null);
    loadModelos(value);
  };

  const handleModeloChange = (value: string) => {
    setSelectedModelo(value);
    setSelectedAno("");
    setAnos([]);
    setFipeData(null);
    loadAnos(selectedMarca, value);
  };

  const handleAnoChange = (value: string) => {
    setSelectedAno(value);
    setFipeData(null);
    loadFipeData(selectedMarca, selectedModelo, value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fipeData) {
      toast({
        title: "Dados do veículo obrigatórios",
        description: "Selecione marca, modelo e ano do veículo",
        variant: "destructive"
      });
      return;
    }

    if (!placa.trim()) {
      toast({
        title: "Placa obrigatória",
        description: "Informe a placa do veículo",
        variant: "destructive"
      });
      return;
    }

    // Validação básica da placa (formato brasileiro)
    const placaRegex = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/;
    const placaLimpa = placa.replace(/[^A-Z0-9]/g, '').toUpperCase();
    
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
        {/* Marca */}
        <div className="space-y-2">
          <Label htmlFor="marca" className="text-sm font-medium">
            Marca do Veículo
          </Label>
          <Select value={selectedMarca} onValueChange={handleMarcaChange} disabled={isLoadingMarcas}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder={isLoadingMarcas ? "Carregando marcas..." : "Selecione a marca"} />
            </SelectTrigger>
            <SelectContent>
              {marcas.map((marca) => (
                <SelectItem key={marca.codigo} value={marca.codigo}>
                  {marca.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Modelo */}
        <div className="space-y-2">
          <Label htmlFor="modelo" className="text-sm font-medium">
            Modelo do Veículo
          </Label>
          <Select 
            value={selectedModelo} 
            onValueChange={handleModeloChange} 
            disabled={!selectedMarca || isLoadingModelos}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder={
                !selectedMarca ? "Selecione primeiro a marca" :
                isLoadingModelos ? "Carregando modelos..." :
                "Selecione o modelo"
              } />
            </SelectTrigger>
            <SelectContent>
              {modelos.map((modelo) => (
                <SelectItem key={modelo.codigo} value={modelo.codigo.toString()}>
                  {modelo.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Ano */}
        <div className="space-y-2">
          <Label htmlFor="ano" className="text-sm font-medium">
            Ano do Veículo
          </Label>
          <Select 
            value={selectedAno} 
            onValueChange={handleAnoChange} 
            disabled={!selectedModelo || isLoadingAnos}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder={
                !selectedModelo ? "Selecione primeiro o modelo" :
                isLoadingAnos ? "Carregando anos..." :
                "Selecione o ano"
              } />
            </SelectTrigger>
            <SelectContent>
              {anos.map((ano) => (
                <SelectItem key={ano.codigo} value={ano.codigo}>
                  {ano.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Valor FIPE Loading */}
        {isLoadingFipe && (
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Consultando tabela FIPE...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* License Plate */}
        <div className="space-y-2">
          <Label htmlFor="placa" className="text-sm font-medium">
            Placa do Veículo
          </Label>
          <Input
            id="placa"
            placeholder="ABC-1234"
            value={placa}
            onChange={(e) => setPlaca(formatPlaca(e.target.value))}
            maxLength={8}
            className="h-11 font-mono text-center text-lg tracking-wider"
          />
          <p className="text-xs text-muted-foreground">
            Formatos aceitos: ABC-1234 (antigo) ou ABC-1D23 (Mercosul)
          </p>
        </div>

        {/* Preview Card */}
        {fipeData && placa && (
          <Card className="bg-gradient-to-r from-metallic to-metallic/80 border-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Car className="h-5 w-5" />
                Dados do Veículo
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Marca/Modelo</p>
                  <p className="font-medium">{fipeData.Marca} {fipeData.Modelo}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Ano</p>
                  <p className="font-medium">{fipeData.AnoModelo}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Valor FIPE</p>
                  <p className="font-bold text-lg text-success">{fipeData.Valor}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Placa</p>
                  <p className="font-mono font-bold text-lg">{placa}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Combustível</p>
                  <p className="font-medium">{fipeData.Combustivel}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Código FIPE</p>
                  <p className="font-mono text-sm">{fipeData.CodigoFipe}</p>
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
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
          <Button 
            type="button"
            variant="outline" 
            onClick={onBack}
            disabled={isGenerating}
            className="order-2 sm:order-1"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          
          <Button 
            type="submit"
            size="lg"
            disabled={!fipeData || !placa || isGenerating || isLoadingFipe}
            className="min-w-40 order-1 sm:order-2"
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