import React from 'react';
import { Check, X, ArrowRight, Star, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReviuCarLogo } from '@/components/ReviuCarLogo';

export const Plans = () => {
  const features = {
    free: [
      'Até 3 análises únicas (não renova)',
      'Consulta de placa automática',
      'Upload de fotos',
      'Geração do relatório com IA',
      'Simulador de valor',
      'Envio para WhatsApp'
    ],
    professional: [
      'Até 50 análises por mês',
      'Relatórios sem marca d\'água',
      'Consulta de placa + FIPE integrada',
      'IA para análise automática + parecer técnico',
      'Upload de até 10 imagens por carro',
      'Simulador de valor com envio direto via WhatsApp',
      'Acesso ao histórico e download dos relatórios',
      'Suporte prioritário no WhatsApp'
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <ReviuCarLogo size="lg" showText={true} />
          </div>
          <h1 className="text-3xl md:text-5xl font-heading font-bold text-gray-dark mb-4">
            Escolha o Plano Ideal
          </h1>
          <p className="text-lg text-gray-medium max-w-2xl mx-auto">
            Análise técnica veicular profissional com inteligência artificial. 
            Detecte batidas, massa plástica e retoques com precisão.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          
          {/* Free Plan */}
          <Card className="relative border-2 border-gray-light/30 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-success text-success-foreground px-4 py-1">
                <Shield className="h-3 w-3 mr-1" />
                Plano Atual
              </Badge>
            </div>
            
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield className="h-6 w-6 text-primary" />
                <CardTitle className="text-2xl font-heading font-bold text-gray-dark">
                  Plano Gratuito
                </CardTitle>
              </div>
              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-dark">R$ 0</span>
                <span className="text-gray-medium ml-2">para sempre</span>
              </div>
              <CardDescription className="text-gray-medium">
                Você está utilizando este plano atualmente
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-3">
                {features.free.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-dark">{feature}</span>
                  </div>
                ))}
              </div>
              
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Shield className="h-5 w-5 text-warning mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-warning">Limitação</p>
                    <p className="text-xs text-gray-medium mt-1">
                      Ao final das 3 análises, precisa migrar para o plano profissional
                    </p>
                  </div>
                </div>
              </div>
              
              <Button className="w-full gradient-primary text-white hover:opacity-90 shadow-primary">
                <Zap className="mr-2 h-4 w-4" />
                Começar Grátis
              </Button>
            </CardContent>
          </Card>

          {/* Professional Plan */}
          <Card className="relative border-2 border-primary/50 hover:border-primary transition-all duration-300 shadow-primary">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="gradient-primary text-white px-4 py-1">
                <Star className="h-3 w-3 mr-1" />
                Mais Popular
              </Badge>
            </div>
            
            <CardHeader className="text-center pb-4 pt-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="h-6 w-6 text-primary" />
                <CardTitle className="text-2xl font-heading font-bold text-gray-dark">
                  Plano Profissional
                </CardTitle>
              </div>
              <div className="mb-4">
                <span className="text-4xl font-bold text-primary">R$ 300</span>
                <span className="text-gray-medium ml-2">/mês</span>
              </div>
              <CardDescription className="text-gray-medium">
                Para quem precisa avaliar com frequência e manter um padrão profissional
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-3">
                {features.professional.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-dark">{feature}</span>
                  </div>
                ))}
              </div>
              
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Star className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-primary">Vantagem Profissional</p>
                    <p className="text-xs text-gray-medium mt-1">
                      Relatórios sem marca d'água e suporte prioritário
                    </p>
                  </div>
                </div>
              </div>
              
              <Button className="w-full gradient-primary text-white hover:opacity-90 shadow-primary">
                <ArrowRight className="mr-2 h-4 w-4" />
                Assinar Agora
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features Comparison */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-heading font-bold text-center text-gray-dark mb-8">
            Compare os Recursos
          </h2>
          
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="gradient-secondary">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-dark">Recursos</th>
                    <th className="text-center p-4 font-medium text-gray-dark">Gratuito</th>
                    <th className="text-center p-4 font-medium text-gray-dark">Profissional</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-light/30">
                  <tr>
                    <td className="p-4 text-gray-dark">Análises por mês</td>
                    <td className="p-4 text-center text-gray-medium">3 únicas</td>
                    <td className="p-4 text-center text-primary font-medium">50</td>
                  </tr>
                  <tr className="bg-muted/30">
                    <td className="p-4 text-gray-dark">Upload de imagens</td>
                    <td className="p-4 text-center"><Check className="h-5 w-5 text-success mx-auto" /></td>
                    <td className="p-4 text-center"><Check className="h-5 w-5 text-primary mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 text-gray-dark">Relatórios sem marca d'água</td>
                    <td className="p-4 text-center"><X className="h-5 w-5 text-destructive mx-auto" /></td>
                    <td className="p-4 text-center"><Check className="h-5 w-5 text-primary mx-auto" /></td>
                  </tr>
                  <tr className="bg-muted/30">
                    <td className="p-4 text-gray-dark">Histórico de análises</td>
                    <td className="p-4 text-center"><X className="h-5 w-5 text-destructive mx-auto" /></td>
                    <td className="p-4 text-center"><Check className="h-5 w-5 text-primary mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 text-gray-dark">Suporte prioritário</td>
                    <td className="p-4 text-center"><X className="h-5 w-5 text-destructive mx-auto" /></td>
                    <td className="p-4 text-center"><Check className="h-5 w-5 text-primary mx-auto" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};