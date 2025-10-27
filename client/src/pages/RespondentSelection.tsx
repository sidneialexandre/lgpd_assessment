import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2 } from "lucide-react";
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

  const handleStartAssessment = async () => {
    if (selectedGroup === null || selectedRespondent === null) {
      setError("Por favor, selecione o grupo e o número do respondente");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const session = await createSessionMutation.mutateAsync({
        assessmentId: parseInt(assessmentId || "0"),
        groupId: selectedGroup,
        respondentNumber: selectedRespondent,
      });

      // Redirect to assessment page with session info
      setLocation(`/assessment?companyId=${companyId}&assessmentId=${assessmentId}&sessionId=${session.id}`);
    } catch (err) {
      setError("Erro ao criar sessão de respondente. Por favor, tente novamente.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Seleção de Respondente</h1>
          <p className="text-gray-600">Escolha seu grupo e número de respondente para iniciar a avaliação</p>
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
            <CardDescription>Escolha o grupo/departamento ao qual você pertence</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {groups.map((group) => {
                const completedCount = completedByGroup[group.id] || 0;
                const remainingCount = group.respondentCount - completedCount;
                const isGroupComplete = remainingCount === 0;

                return (
                  <button
                    key={group.id}
                    onClick={() => {
                      if (!isGroupComplete) {
                        setSelectedGroup(group.id);
                        setSelectedRespondent(null);
                      }
                    }}
                    disabled={isGroupComplete}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      selectedGroup === group.id
                        ? "border-blue-500 bg-blue-50"
                        : isGroupComplete
                          ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
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
                      {isGroupComplete && (
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Respondent Selection */}
        {selectedGroup !== null && (
          <Card className="mb-8 bg-white shadow-lg">
            <CardHeader>
              <CardTitle>Selecione seu Número de Respondente</CardTitle>
              <CardDescription>
                Escolha um número disponível para o grupo {groups.find((g) => g.id === selectedGroup)?.groupName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Array.from({ length: groups.find((g) => g.id === selectedGroup)?.respondentCount || 0 }).map(
                  (_, index) => {
                    const respondentNumber = index + 1;
                    const isAlreadyCompleted = sessions.some(
                      (s) => s.groupId === selectedGroup && s.respondentNumber === respondentNumber && s.isCompleted === 1
                    );

                    return (
                      <button
                        key={respondentNumber}
                        onClick={() => {
                          if (!isAlreadyCompleted) {
                            setSelectedRespondent(respondentNumber);
                          }
                        }}
                        disabled={isAlreadyCompleted}
                        className={`p-4 border-2 rounded-lg font-bold text-lg transition-all ${
                          selectedRespondent === respondentNumber
                            ? "border-blue-500 bg-blue-50 text-blue-600"
                            : isAlreadyCompleted
                              ? "border-green-200 bg-green-50 text-green-600 opacity-50 cursor-not-allowed"
                              : "border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50"
                        }`}
                      >
                        {isAlreadyCompleted ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 mx-auto mb-1" />
                            <div className="text-xs">Concluído</div>
                          </>
                        ) : (
                          `Respondente ${respondentNumber}`
                        )}
                      </button>
                    );
                  }
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => setLocation("/")}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleStartAssessment}
            disabled={selectedGroup === null || selectedRespondent === null || loading}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {loading ? "Processando..." : "Iniciar Avaliação"}
          </Button>
        </div>
      </div>
    </div>
  );
}

