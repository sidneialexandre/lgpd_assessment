import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";

export default function AssessmentAdmin() {
  const [location, setLocation] = useLocation();
  const [assessmentId, setAssessmentId] = useState<number | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      setAssessmentId(parseInt(id));
    }
  }, []);

  const getDetailsQuery = trpc.assessment.getWithDetails.useQuery(
    { assessmentId: assessmentId || 0 },
    { enabled: !!assessmentId }
  );

  const finalizeAssessmentMutation = trpc.assessment.finalize.useMutation({
    onSuccess: () => {
      getDetailsQuery.refetch();
    },
  });

  const handleCopyToken = (token: string) => {
    const baseUrl = window.location.origin;
    const respondentUrl = `${baseUrl}/respondent?token=${token}`;
    navigator.clipboard.writeText(respondentUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleFinalize = async () => {
    if (assessmentId) {
      await finalizeAssessmentMutation.mutateAsync({ assessmentId });
    }
  };

  const handleBackToHome = () => {
    setLocation("/");
  };

  if (!assessmentId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900">Erro</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-800">ID da avaliação não encontrado.</p>
              <Button onClick={handleBackToHome} className="mt-4">
                Voltar ao Início
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (getDetailsQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando detalhes da avaliação...</p>
        </div>
      </div>
    );
  }

  const data = getDetailsQuery.data;

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900">Erro</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-800">Avaliação não encontrada.</p>
              <Button onClick={handleBackToHome} className="mt-4">
                Voltar ao Início
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const progressPercentage = (data.completedRespondents / data.totalRespondents) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={handleBackToHome}
            className="mb-4"
          >
            ← Voltar ao Início
          </Button>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Painel de Administração
          </h1>
          <p className="text-slate-600">
            Empresa ID: <span className="font-semibold">{data.assessment.companyId}</span>
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total de Respondentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {data.totalRespondents}
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-900">
                Respondentes Completados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">
                {data.completedRespondents}
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-orange-900">
                Respondentes Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-700">
                {data.pendingRespondents}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Progresso da Avaliação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-slate-200 rounded-full h-4 mb-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <p className="text-sm text-slate-600">
              {progressPercentage.toFixed(1)}% concluído ({data.completedRespondents} de {data.totalRespondents})
            </p>
          </CardContent>
        </Card>

        {/* Respondents List */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Lista de Respondentes</CardTitle>
            <CardDescription>
              Clique no botão "Copiar Link" para gerar um link de acesso para o respondente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-900">
                        Respondente {session.respondentNumber}
                      </span>
                      {session.isCompleted === 1 ? (
                        <Badge className="bg-green-100 text-green-800">
                          Completado
                        </Badge>
                      ) : (
                        <Badge className="bg-orange-100 text-orange-800">
                          Pendente
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">
                      Pontuação: {session.totalScore} pontos
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyToken(session.accessToken || "")}
                    disabled={!session.accessToken}
                  >
                    {copiedToken === session.accessToken ? "✓ Copiado" : "Copiar Link"}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Ações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.pendingRespondents > 0 && (
                <p className="text-sm text-blue-800">
                  Ainda há {data.pendingRespondents} respondente(s) pendente(s).
                </p>
              )}
              <Button
                onClick={handleFinalize}
                disabled={data.completedRespondents === 0}
                className="w-full"
              >
                Finalizar Avaliação
              </Button>
              <p className="text-xs text-blue-700">
                Ao finalizar, o percentual de conformidade será calculado com base nos respondentes que já completaram.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

