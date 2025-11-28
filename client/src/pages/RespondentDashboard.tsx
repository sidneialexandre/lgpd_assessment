import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Copy, CheckCircle2, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function RespondentDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  
  const { data: assessments, isLoading, error } = trpc.respondent.getAvailableAssessments.useQuery();

  const handleCopyLink = (token: string) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/respondent?token=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleAccessAssessment = (token: string) => {
    window.location.href = `/respondent?token=${token}`;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Autenticação Necessária</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Você precisa estar autenticado para acessar esta página.
            </p>
            <Button onClick={() => setLocation("/")} className="w-full">
              Voltar para Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando suas avaliações...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900">Erro ao Carregar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-800 mb-4">Erro ao carregar suas avaliações. Por favor, tente novamente.</p>
            <Button onClick={() => setLocation("/")} className="w-full">
              Voltar para Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasAssessments = assessments && assessments.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Minhas Avaliações</h1>
            <p className="text-gray-600">Bem-vindo, {user?.name || "Respondente"}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setLocation("/")}
          >
            Voltar
          </Button>
        </div>

        {!hasAssessments ? (
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle>Nenhuma Avaliação Disponível</CardTitle>
              <CardDescription>
                Você não possui avaliações disponíveis no momento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700">
                  Aguarde que um administrador compartilhe um link de avaliação com você.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-6">
              {assessments.map((item: any, index: number) => (
                <Card key={index} className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-2xl text-gray-900">
                          {item.company?.razaoSocial}
                        </CardTitle>
                        <CardDescription>
                          {item.group?.departmentName} - {item.group?.groupName}
                        </CardDescription>
                      </div>
                      {item.isCompleted === 1 && (
                        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-sm font-medium">Concluído</span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {item.isCompleted === 0 && (
                      <>
                        <Alert className="bg-yellow-50 border-yellow-200">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <AlertDescription className="text-yellow-700">
                            Esta avaliação ainda não foi concluída. Você tem 50 questões para responder.
                          </AlertDescription>
                        </Alert>
                        
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-3">
                            <strong>Seu link de acesso:</strong>
                          </p>
                          <div className="flex gap-2">
                            <code className="flex-1 bg-white p-3 rounded border border-gray-200 text-xs text-gray-700 overflow-auto font-mono">
                              {`${window.location.origin}/respondent?token=${item.accessToken}`}
                            </code>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCopyLink(item.accessToken)}
                              className="whitespace-nowrap"
                            >
                              {copiedToken === item.accessToken ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Copiado
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4 mr-2" />
                                  Copiar
                                </>
                              )}
                            </Button>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Button
                            onClick={() => handleAccessAssessment(item.accessToken)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Acessar Avaliação
                          </Button>
                        </div>
                      </>
                    )}
                    
                    {item.isCompleted === 1 && (
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-700">
                          Obrigado por completar a avaliação! Seus dados foram registrados com sucesso.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900">Dica</CardTitle>
              </CardHeader>
              <CardContent className="text-blue-800">
                <p>
                  Você pode compartilhar o link de acesso com outras pessoas ou salvá-lo para acessar a avaliação mais tarde.
                  Não é necessário estar logado para responder a avaliação usando o link.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
