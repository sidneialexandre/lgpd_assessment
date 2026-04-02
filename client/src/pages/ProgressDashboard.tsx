import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, Users, TrendingUp, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";

interface RespondentStatus {
  id: number;
  respondentNumber: number;
  respondentName: string;
  respondentEmail: string;
  isCompleted: boolean;
  totalScore: number;
  groupName: string;
}

export default function ProgressDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [assessmentId, setAssessmentId] = useState<number | null>(null);
  const [respondents, setRespondents] = useState<RespondentStatus[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Get assessment ID from URL or query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("assessmentId");
    if (id) {
      setAssessmentId(parseInt(id));
    }
  }, []);

  // Fetch respondent sessions
  const { data: sessions, refetch } = trpc.respondent.getSessionsWithGroups.useQuery(
    { assessmentId: assessmentId || 0 },
    { enabled: !!assessmentId, refetchInterval: autoRefresh ? 5000 : false }
  );

  // Transform sessions to respondent status
  useEffect(() => {
    if (sessions) {
      const statuses: RespondentStatus[] = sessions.map((session: any) => ({
        id: session.id,
        respondentNumber: session.respondentNumber,
        respondentName: session.respondentName || `Respondente ${session.respondentNumber}`,
        respondentEmail: session.respondentEmail || "Sem email",
        isCompleted: session.isCompleted === 1,
        totalScore: session.totalScore || 0,
        groupName: session.groupName || "Sem grupo",
      }));
      setRespondents(statuses);
    }
  }, [sessions]);

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Apenas administradores podem acessar o dashboard de progresso.
            </p>
            <Button onClick={() => setLocation("/")} className="w-full">
              Voltar para Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!assessmentId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Avaliação não encontrada</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Nenhuma avaliação foi selecionada para monitoramento.
            </p>
            <Button onClick={() => setLocation("/my-assessments")} className="w-full">
              Voltar para Avaliações
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completed = respondents.filter(r => r.isCompleted).length;
  const pending = respondents.filter(r => !r.isCompleted).length;
  const completionPercentage = respondents.length > 0 ? (completed / respondents.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard de Progresso</h1>
            <p className="text-gray-600 mt-2">Monitoramento em tempo real da avaliação</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={autoRefresh ? "default" : "outline"}
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              {autoRefresh ? "Auto-atualização ativa" : "Auto-atualização desativa"}
            </Button>
            <Button onClick={() => refetch()}>Atualizar Agora</Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Respondentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{respondents.length}</div>
            <p className="text-xs text-gray-500 mt-1">respondentes esperados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Concluídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{completed}</div>
            <p className="text-xs text-gray-500 mt-1">{Math.round(completionPercentage)}% completo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{pending}</div>
            <p className="text-xs text-gray-500 mt-1">aguardando resposta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Taxa de Conclusão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{Math.round(completionPercentage)}%</div>
            <p className="text-xs text-gray-500 mt-1">do total</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <div className="max-w-6xl mx-auto mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Progresso Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-500 to-green-600 h-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-3">
              {completed} de {respondents.length} respondentes concluíram a avaliação
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Respondents List */}
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Status dos Respondentes</CardTitle>
            <CardDescription>Lista detalhada de cada respondente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {respondents.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhum respondente encontrado</p>
              ) : (
                respondents.map((respondent) => (
                  <div
                    key={respondent.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {respondent.isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      ) : (
                        <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {respondent.respondentName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {respondent.respondentEmail} • {respondent.groupName}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      {respondent.isCompleted ? (
                        <div>
                          <p className="font-semibold text-green-600">Concluído</p>
                          <p className="text-sm text-gray-500">
                            Pontuação: {respondent.totalScore}
                          </p>
                        </div>
                      ) : (
                        <p className="font-semibold text-yellow-600">Pendente</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="max-w-6xl mx-auto mt-8 text-center">
        <Button variant="outline" onClick={() => setLocation("/my-assessments")}>
          Voltar para Avaliações
        </Button>
      </div>
    </div>
  );
}
