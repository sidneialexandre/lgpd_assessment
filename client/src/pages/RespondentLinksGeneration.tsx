import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Copy, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";

export default function RespondentLinksGeneration() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [assessmentId, setAssessmentId] = useState<number | null>(null);
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const aId = params.get("assessmentId");
    const cId = params.get("companyId");
    if (aId && cId) {
      setAssessmentId(parseInt(aId));
      setCompanyId(parseInt(cId));
    } else {
      setError("Parâmetros inválidos");
    }
  }, []);

  const getGroupsQuery = trpc.group.getByCompany.useQuery(
    { companyId: companyId || 0 },
    { enabled: !!companyId }
  );

  const getSessionsQuery = trpc.respondent.getAssessmentSessions.useQuery(
    { assessmentId: assessmentId || 0 },
    { enabled: !!assessmentId }
  );

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
            <Button onClick={() => window.location.href = "/"} className="w-full">
              Voltar para Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900">Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-800 mb-4">{error}</p>
            <Button onClick={() => setLocation("/")} className="w-full">
              Voltar para Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (getGroupsQuery.isLoading || getSessionsQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Gerando links de acesso...</p>
        </div>
      </div>
    );
  }

  const groups = getGroupsQuery.data || [];
  const sessions = getSessionsQuery.data || [];

  const handleCopyLink = (token: string) => {
    const baseUrl = window.location.origin;
    const respondentUrl = `${baseUrl}/respondent?token=${token}`;
    navigator.clipboard.writeText(respondentUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleGoToAdmin = () => {
    if (assessmentId) {
      setLocation(`/admin?id=${assessmentId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Links de Acesso para Respondentes</h1>
          <p className="text-gray-600">Compartilhe os links abaixo com cada respondente para que possam acessar a avaliação</p>
        </div>

        {/* Groups and Links */}
        <div className="space-y-6">
          {groups.map((group) => {
            const groupSessions = sessions.filter(s => s.groupId === group.id);
            
            return (
              <Card key={group.id} className="bg-white shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{group.groupName} - {group.departmentName}</CardTitle>
                      <CardDescription>
                        {group.respondentCount} respondente(s) | {groupSessions.length} link(s) gerado(s)
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {groupSessions.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">Nenhum link gerado ainda para este grupo</p>
                        <p className="text-sm text-gray-400">Os links serão gerados quando os respondentes iniciarem a avaliação</p>
                      </div>
                    ) : (
                      groupSessions.map((session) => {
                        const baseUrl = window.location.origin;
                        const respondentUrl = `${baseUrl}/respondent?token=${session.accessToken}`;

                        return (
                          <div
                            key={session.id}
                            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-gray-900">
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
                                <p className="text-sm text-gray-500">
                                  Pontuação: {session.totalScore} pontos
                                </p>
                              </div>
                            </div>

                            <div className="bg-gray-100 p-3 rounded-lg mb-3 break-all font-mono text-sm text-gray-700">
                              {respondentUrl}
                            </div>

                            <Button
                              onClick={() => handleCopyLink(session.accessToken || "")}
                              disabled={!session.accessToken}
                              variant="outline"
                              className="w-full"
                            >
                              {copiedToken === session.accessToken ? (
                                <>
                                  <Check className="w-4 h-4 mr-2" />
                                  Link Copiado
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4 mr-2" />
                                  Copiar Link
                                </>
                              )}
                            </Button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4 justify-center">
          <Button
            onClick={() => setLocation(`/respondent-selection?companyId=${companyId}&assessmentId=${assessmentId}`)}
            variant="outline"
            size="lg"
          >
            Gerar Mais Links
          </Button>
          <Button
            onClick={handleGoToAdmin}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            Ir para Painel de Administração
          </Button>
        </div>
      </div>
    </div>
  );
}

