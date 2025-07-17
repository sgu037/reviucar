import { useState, useEffect } from "react";
import { Car, ArrowLeft, Zap, ChevronDown, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useRef } from "react";

interface FipeData {
  Valor: string;
  Marca: string;
  Modelo: string;
  AnoModelo: number;
  CodigoFipe: string;
  Combustivel: string;
}

interface VehicleFormProps {
  onDataSubmit: (data: { fipeData: FipeData | null; placa: string; quilometragem: string; veiculo?: any }) => void;
  onBack: () => void;
  onGenerateReport: () => void;
  isGenerating: boolean;
  photos?: File[];
}

export const VehicleForm = ({ onDataSubmit, onBack, onGenerateReport, isGenerating, photos = [] }: VehicleFormProps) => {
  const [placa, setPlaca] = useState("");
  const [quilometragem, setQuilometragem] = useState<number | "">("");
  const [veiculo, setVeiculo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Buscar dados automaticamente ao digitar a placa
  useEffect(() => {
    if (!placa || placa.length < 6) {
      setVeiculo(null);
      setApiError(null);
      return;
    }
    setIsLoading(true);
    setApiError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        // Remove caracteres não alfanuméricos e deixa maiúsculo
        const sanitized = placa.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        const token = 'ab082f182fac508584594e45f9610a51';
        const response = await fetch(`https://wdapi2.com.br/consulta/${sanitized}/${token}`, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0'
          }
        });
        if (!response.ok) throw new Error("Não foi possível buscar os dados do veículo.");
        const data = await response.json();
        setVeiculo(data);
        setApiError(null);
        onDataSubmit({ fipeData: data, placa, quilometragem: quilometragem ? quilometragem.toString() : "", veiculo: data });
      } catch (err) {
        setVeiculo(null);
        setApiError("Não foi possível buscar os dados do veículo. Verifique a placa e tente novamente.");
        onDataSubmit({ fipeData: null, placa, quilometragem: quilometragem ? quilometragem.toString() : "", veiculo: null });
      } finally {
        setIsLoading(false);
      }
    }, 600);
    // eslint-disable-next-line
  }, [placa]);

  // Atualizar quilometragem no parent
  useEffect(() => {
    onDataSubmit({ fipeData: veiculo, placa, quilometragem: quilometragem ? quilometragem.toString() : "", veiculo });
    // eslint-disable-next-line
  }, [quilometragem, veiculo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submission started with data:', {
      photosCount: photos.length,
      hasVeiculo: !!veiculo,
      placa,
      quilometragem
    });
    
    if (photos.length === 0) {
      toast({
        title: "Fotos necessárias",
        description: "Por favor, volte e adicione fotos do veículo",
        variant: "destructive"
      });
      return;
    }
    
    if (!veiculo) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, aguarde o carregamento dos dados do veículo",
        variant: "destructive"
      });
      return;
    }
    
    console.log('All validations passed, calling onGenerateReport');
    onGenerateReport();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Placa */}
        <div className="space-y-2">
          <Label htmlFor="placa" className="text-sm font-medium">
            Placa do Veículo (obrigatório)
          </Label>
          <Input
            id="placa"
            placeholder="Ex: ABC-1234 ou ABC1D23"
            value={placa}
            onChange={(e) => setPlaca(e.target.value)}
            className="h-11 font-mono text-center text-lg tracking-wider"
            autoComplete="off"
            spellCheck={false}
            required
          />
          <p className="text-xs text-muted-foreground">
            Digite a placa no formato que preferir. Ex: ABC-1234 (antigo) ou ABC1D23 (Mercosul). Campo usado para buscar os dados do veículo.
          </p>
        </div>
        {/* Quilometragem */}
        <div className="space-y-2">
          <Label htmlFor="quilometragem" className="text-sm font-medium">
            Quilometragem do Veículo
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="quilometragem"
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Ex: 78500"
              value={quilometragem}
              onChange={(e) => setQuilometragem(e.target.value === '' ? '' : Number(e.target.value))}
              min="0"
              className="h-11 text-right"
              autoComplete="off"
            />
            <span className="text-sm">km</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Digite a quilometragem atual exibida no painel do veículo. Valor usado apenas como referência no laudo técnico.
          </p>
        </div>
        {/* Preview dos dados do veículo */}
        <div>
          {isLoading && <p className="text-sm text-muted-foreground">Buscando dados do veículo...</p>}
          {apiError && <p className="text-sm text-destructive">{apiError}</p>}
          {veiculo && (
            <Card className="bg-gradient-to-r from-metallic to-metallic/80 border-0 mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Car className="h-5 w-5" />
                  Dados do Veículo
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {veiculo.logo && (
                    <div className="col-span-2 flex items-center mb-2">
                      <img src={veiculo.logo} alt={veiculo.marca} style={{height: 32, marginRight: 8}} />
                      <span className="font-bold text-lg">{veiculo.marcaModelo || `${veiculo.marca} ${veiculo.modelo}`}</span>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Ano</p>
                    <p className="font-medium">{veiculo.ano} / {veiculo.anoModelo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Cor</p>
                    <p className="font-medium">{veiculo.cor}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Município/UF</p>
                    <p className="font-medium">{veiculo.municipio} / {veiculo.uf}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Chassi</p>
                    <p className="font-mono text-sm">{veiculo.chassi}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Situação</p>
                    <p className="font-medium">{veiculo.situacao}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Combustível</p>
                    <p className="font-medium">{veiculo.extra?.combustivel || veiculo.fipe?.dados?.[0]?.combustivel}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Valor FIPE</p>
                    <p className="font-bold text-lg text-success">{veiculo.fipe?.dados?.[0]?.texto_valor}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Código FIPE</p>
                    <p className="font-mono text-sm">{veiculo.fipe?.dados?.[0]?.codigo_fipe}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Placa</p>
                    <p className="font-mono font-bold text-lg">{veiculo.placa}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-1 sm:flex-none"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          
          <Button
            type="submit"
            disabled={!veiculo || isGenerating || !placa || photos.length === 0}
            className="flex-1 sm:flex-none min-w-48"
            size="lg"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Gerando Laudo...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                {photos.length === 0 ? 'Adicione fotos primeiro' : 
                 !veiculo ? 'Aguardando dados...' : 
                 'Gerar Laudo Técnico'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};