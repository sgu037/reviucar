import React, { useState, useEffect, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, ArrowLeft, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface VehicleFormProps {
  onAnalysisComplete: (data: any) => void;
  analyzeVehicle: (params: { photos: File[]; vehicleData: any; whatsapp?: string }) => Promise<any>;
  isLoading: boolean;
  photos?: File[];
  onBack?: () => void;
  onGenerateReport?: () => void;
}

export const VehicleForm: React.FC<VehicleFormProps> = ({ 
  onAnalysisComplete, 
  analyzeVehicle, 
  isLoading, 
  photos = [],
  onBack,
  onGenerateReport
}) => {
  const [placa, setPlaca] = useState('');
  const [quilometragem, setQuilometragem] = useState<number | ''>('');
  const [whatsapp, setWhatsapp] = useState('');
  const [veiculo, setVeiculo] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate FIPE data fetching
  useEffect(() => {
    if (!placa || placa.length < 6) {
      setVeiculo(null);
      setApiError(null);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      console.log(`Simulating FIPE data fetch for placa: ${placa}`);
      
      // Mock FIPE data
      const mockFipeData = {
        marca: 'MockMarca',
        modelo: 'MockModelo',
        ano: 2020,
        valor_fipe: 'R$ 50.000,00',
        codigo_fipe: '00000-0',
        combustivel: 'Gasolina',
        placa: placa,
        marcaModelo: 'MockMarca MockModelo',
        anoModelo: 2020,
        cor: 'Preto',
        municipio: 'Cidade',
        uf: 'UF',
        chassi: 'MOCKCHASSI123',
        situacao: 'OK',
        fipe: { 
          dados: [{ 
            texto_valor: 'R$ 50.000,00', 
            codigo_fipe: '00000-0', 
            combustivel: 'Gasolina' 
          }] 
        }
      };
      
      setVeiculo(mockFipeData);
      setApiError(null);
    }, 600);
  }, [placa]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!veiculo) {
      toast({
        title: 'Dados do veículo incompletos',
        description: 'Por favor, aguarde o carregamento dos dados do veículo.',
        variant: 'destructive',
      });
      return;
    }

    if (photos.length === 0) {
      toast({
        title: 'Fotos necessárias',
        description: 'Por favor, adicione fotos do veículo.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await analyzeVehicle({
        photos: photos,
        vehicleData: { 
          fipeData: veiculo, 
          placa: placa,
          quilometragem: quilometragem 
        },
        whatsapp: whatsapp || undefined
      });
      
      if (result) {
        onAnalysisComplete(result);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  const formatWhatsApp = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as (XX) XXXXX-XXXX
    if (digits.length <= 2) {
      return `(${digits}`;
    } else if (digits.length <= 7) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    } else {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
    }
  };

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatWhatsApp(e.target.value);
    setWhatsapp(formatted);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
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
            Digite a placa no formato que preferir. Campo usado para buscar os dados do veículo.
          </p>
        </div>

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
            Digite a quilometragem atual exibida no painel do veículo.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="whatsapp" className="text-sm font-medium">
            WhatsApp do Cliente (opcional)
          </Label>
          <Input
            id="whatsapp"
            type="tel"
            placeholder="(11) 99999-9999"
            value={whatsapp}
            onChange={handleWhatsAppChange}
            className="h-11"
            maxLength={15}
          />
          <p className="text-xs text-muted-foreground">
            Número para envio direto do laudo via WhatsApp (opcional).
          </p>
        </div>

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
                {veiculo.marcaModelo && (
                  <div className="col-span-2 flex items-center mb-2">
                    <span className="font-bold text-lg">{veiculo.marcaModelo}</span>
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
                  <p className="font-medium">{veiculo.combustivel}</p>
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

        <div className="flex flex-col sm:flex-row gap-3 sm:justify-between mt-6">
          {onBack && (
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="flex-1 sm:flex-none"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          )}
          <Button
            type="submit"
            disabled={!veiculo || isLoading || !placa || photos.length === 0}
            className="flex-1 sm:flex-none min-w-48"
            size="lg"
          >
            {isLoading ? (
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