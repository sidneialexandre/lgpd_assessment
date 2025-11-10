import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Copy, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function RespondentSelection() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [selectedRespondent, setSelectedRespondent] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [generatedLinks, setGeneratedLinks] = useState<Record<number, { token: string; respondentNumber: number }>>({});

  // Get query parameters
  const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const companyId = searchParams.get("companyId");
  const assessmentId = searchParams.get("assessmentId");

  const getGroupsQuery = trpc.group.getByCompany.useQuery(
    { companyId: parseInt(companyId || "0") },
    { enabled: !!companyId }
  );

  const getSessionsQuery = trpc.respondent.getAssessmentSessions.useQuery(
    { assessmentId: parseInt(assessmentId || "0") },
    { enabled: !!assessmentId }
  );

  const createSessionMutation = trpc.respondent.createSession.useMutation();

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

  if (getGroupsQuery.isLoading || getSessionsQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600">Carregando dados...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const groups = getGroupsQuery.data || [];
  const sessions = getSessionsQuery.data || [];

  // Count completed sessions per group
  const completedByGroup: Record<number, number> = {};
  for (const session of sessions) {
    if (session.isCompleted === 1) {
      completedByGroup[session.groupId] = (completedByGroup[session.groupId] || 0) + 1;
    }
  }

  const handleGenerateLink = async (respondentNumber: number) => {
    if (selectedGroup === null) {
      setError("Por favor, selecione o grupo primeiro");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const session = await createSessionMutation.mutateAsync({
        assessmentId: parseInt(assessmentId || "0"),
        groupId: selectedGroup,
        respondentNumber,
      });

      setGeneratedLinks({
        ...generatedLinks,
        [respondentNumber]: {
          token: session.accessToken || "",
          respondentNumber,
        },
      });

      // Refetch sessions to update the UI
      getSessionsQuery.refetch();
    } catch (err) {
      setError("Erro ao gerar link. Por favor, tente novamente.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (token: string) => {
    const baseUrl = window.location.origin;
    const respondentUrl = `${baseUrl}/respondent?token=${token}`;
    navigator.clipboard.writeText(respondentUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleBackToAdmin = () => {
    if (assessmentId) {
      setLocation(`/admin?id=${assessmentId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={handleBackToAdmin}
            className="mb-4"
          >
            ← Voltar ao Painel Admin
          </Button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Geração de Links para Respondentes</h1>
          <p className="text-gray-600">Gere links de acesso para cada respondente antes de enviar a avaliação</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {/* Groups Selection */}
        <Card className="mb-8 bg-white shadow-lg">
          <CardHeader>
            <CardTitle>Selecione seu Grupo</CardTitle>
            <CardDescription>Escolha o grupo para o qual deseja gerar links de respondentes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {groups.map((group) => {
                const completedCount = completedByGroup[group.id] || 0;
                const remainingCount = group.respondentCount - completedCount;

                return (
                  <button
                    key={group.id}
                    onClick={() => {
                      setSelectedGroup(group.id);
                      setSelectedRespondent(null);
                    }}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      selectedGroup === group.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{group.groupName}</h3>
                        <p className="text-sm text-gray-600">{group.departmentName}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {completedCount} de {group.respondentCount} respondentes concluídos
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Respondent Links Generation */}
        {selectedGroup !== null && (
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle>Gerar Links para Respondentes</CardTitle>
              <CardDescription>
                Clique em cada respondente para gerar seu link de acesso único
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: groups.find((g) => g.id === selectedGroup)?.respondentCount || 0 }).map(
                  (_, index) => {
                    const respondentNumber = index + 1;
                    const existingSession = sessions.find(
                      (s) => s.groupId === selectedGroup && s.respondentNumber === respondentNumber
                    );
                    const generatedLink = generatedLinks[respondentNumber];
                    const hasLink = existingSession || generatedLink;

                    return (
                      <div
                        key={respondentNumber}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-900">
                                Respondente {respondentNumber}
                              </span>
                              {existingSession?.isCompleted === 1 ? (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                  Completado
                                </span>
                              ) : hasLink ? (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  Link Gerado
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        {hasLink && (existingSession || generatedLink) ? (
                          <>
                            <div className="bg-gray-100 p-3 rounded-lg mb-3 break-all font-mono text-sm text-gray-700">
                              {window.location.origin}/respondent?token={existingSession?.accessToken || generatedLink?.token}
                            </div>
                            <Button
                              onClick={() => handleCopyLink(existingSession?.accessToken || generatedLink?.token || "")}
                              disabled={!existingSession?.accessToken && !generatedLink?.token}
                              variant="outline"
                              className="w-full"
                            >
                              {copiedToken === (existingSession?.accessToken || generatedLink?.token) ? (
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
                          </>
                        ) : (
                          <Button
                            onClick={() => handleGenerateLink(respondentNumber)}
                            disabled={loading || (existingSession && (existingSession as any).isCompleted === 1)}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                          >
                            {loading ? "Gerando..." : "Gerar Link"}
                          </Button>
                        )
                      }
                      </div>
                    );
                  }
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <Button
            variant="outline"
            onClick={handleBackToAdmin}
            className="flex-1"
          >
            Voltar ao Painel Admin
          </Button>
        </div>
      </div>
    </div>
  );
}
