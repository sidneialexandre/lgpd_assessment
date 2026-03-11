import { useState, useEffect } from "react";
import { QUESTIONS } from "@shared/questions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

// Function to get colors based on pillar name
function getPillarColors(pillarName: string) {
  if (pillarName.includes("Segurança")) {
    return {
      gradient: "from-blue-500 to-blue-600",
      badge: "bg-blue-100 text-blue-700",
      label: "text-blue-600",
    };
  } else if (pillarName.includes("Conformidade")) {
    return {
      gradient: "from-green-500 to-green-600",
      badge: "bg-green-100 text-green-700",
      label: "text-green-600",
    };
  } else if (pillarName.includes("Cultura")) {
    return {
      gradient: "from-purple-500 to-purple-600",
      badge: "bg-purple-100 text-purple-700",
      label: "text-purple-600",
    };
  }
  return {
    gradient: "from-blue-500 to-indigo-600",
    badge: "bg-blue-100 text-blue-700",
    label: "text-blue-600",
  };
}

export default function Assessment() {
  const [, setLocation] = useLocation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<{ 
    isCompleted: boolean; 
    totalScore: number; 
    compliancePercentage: number; 
    company?: { cnpj: string; razaoSocial: string };
    respondentsRemaining?: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // Get query parameters
  const [searchParams] = useState(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams();
  });

  const companyId = searchParams.get("companyId");
  const assessmentId = searchParams.get("assessmentId");
  const sessionId = searchParams.get("sessionId");
  const token = searchParams.get("token");

  // Get session by token if available, otherwise by sessionId
  const getSessionByTokenQuery = trpc.respondent.getByToken.useQuery(
    { accessToken: token || "" },
    { enabled: !!token }
  );

  const getSessionQuery = trpc.respondent.getSession.useQuery(
    { sessionId: parseInt(sessionId || "0") },
    { enabled: !!sessionId && !token }
  );

  // Get companyId by token if needed
  const getCompanyIdByTokenQuery = trpc.respondent.getCompanyIdByToken.useQuery(
    { accessToken: token || "" },
    { enabled: !!token }
  );

  // Use session from token or sessionId
  const currentSessionData = token ? getSessionByTokenQuery.data : getSessionQuery.data;
  const resolvedSessionId = currentSessionData?.id ? String(currentSessionData.id) : sessionId;
  const resolvedAssessmentId = currentSessionData?.assessmentId ? String(currentSessionData.assessmentId) : assessmentId;
  const resolvedCompanyId = token ? (getCompanyIdByTokenQuery.data?.companyId ? String(getCompanyIdByTokenQuery.data.companyId) : undefined) : companyId;

  const getCompanyQuery = trpc.company.getById.useQuery(
    { companyId: parseInt(resolvedCompanyId || "0") },
    { enabled: !!resolvedCompanyId }
  );

  const getGroupsQuery = trpc.group.getByCompany.useQuery(
    { companyId: parseInt(resolvedCompanyId || "0") },
    { enabled: !!resolvedCompanyId }
  );

  const checkCompletionQuery = trpc.respondent.checkCompletion.useQuery(
    { assessmentId: parseInt(resolvedAssessmentId || "0") },
    { enabled: !!resolvedAssessmentId, refetchInterval: 2000 }
  );

  const saveAnswersMutation = trpc.respondent.saveAnswers.useMutation();

  const currentQuestion = QUESTIONS[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;
  const progressPercentage = (answeredCount / QUESTIONS.length) * 100;

  const handleAnswerChange = (answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: answer,
    }));
  };

  const handleNextQuestion = () => {
    // Validate that current question is answered
    if (!answers[currentQuestion.id]) {
      alert("Por favor, responda a pergunta atual antes de avançar.");
      return;
    }
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (answeredCount !== QUESTIONS.length) {
      alert("Por favor, responda todas as questões antes de enviar.");
      return;
    }

    if (!resolvedSessionId || !resolvedAssessmentId || !resolvedCompanyId) {
      alert("Erro: Dados da sessão não encontrados.");
      return;
    }

    setLoading(true);

    try {
      // Prepare answers with scores
      const answersData = QUESTIONS.map((q) => {
        const selectedAnswer = answers[q.id] as "A" | "B" | "C" | "D";
        const score = q.scores[selectedAnswer] || 0;
        return {
          questionId: q.id,
          selectedAnswer,
          score,
        };
      });

      // Save answers
      const assessment = await saveAnswersMutation.mutateAsync({
        respondentSessionId: parseInt(resolvedSessionId),
        assessmentId: parseInt(resolvedAssessmentId),
        answers: answersData,
      });

      if (assessment) {
        // IMPORTANTE: Respondentes NUNCA devem ver o resultado da avaliacao
        // O resultado so eh exibido para administrador apos clicar "Finalizar Avaliacao"
        // Respondentes sempre veem apenas a mensagem de "Aguardando finalizacao"
        
        const groups = getGroupsQuery.data || [];
        const totalRespondents = groups.reduce((sum, g) => sum + g.respondentCount, 0);
        const respondentsRemaining = Math.max(0, totalRespondents - 1);

        // Sempre mostrar estado "nao concluido" para respondentes
        setResult({
          isCompleted: false,
          totalScore: 0,
          compliancePercentage: 0,
          respondentsRemaining,
        });
      }

      setIsCompleted(true);
    } catch (error) {
      console.error("Erro ao salvar avaliação:", error);
      alert("Erro ao salvar avaliação. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (isCompleted && result) {
    return (
      <ResultPage
        result={result}
        companyId={parseInt(companyId || "0")}
      />
    );
  }

  const isLoadingSession = token ? getSessionByTokenQuery.isLoading : getSessionQuery.isLoading;
  const isLoadingCompanyId = token ? getCompanyIdByTokenQuery.isLoading : false;

  // Check if session is already completed
  const isSessionCompleted = currentSessionData?.isCompleted === 1;
  
  // Show error if session is already completed
  if (isSessionCompleted && token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 py-8 px-4 flex items-center justify-center">
        <Card className="w-full max-w-md border-red-200 bg-red-50">
          <CardHeader className="bg-gradient-to-r from-red-500 to-orange-600 text-white">
            <CardTitle className="text-xl flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Avaliação Já Respondida
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p className="text-red-800">
                Este link de avaliação já foi utilizado e não pode ser respondido novamente.
              </p>
              <p className="text-sm text-red-700">
                Se você acredita que isso é um erro, entre em contato com o administrador da avaliação.
              </p>
              <Button
                onClick={() => setLocation("/")}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                Voltar ao Início
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (getCompanyQuery.isLoading || getGroupsQuery.isLoading || isLoadingSession || isLoadingCompanyId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600">Carregando avaliação...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentSession = currentSessionData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Avaliação de Conformidade LGPD</h1>
          <p className="text-gray-600">Lei Geral de Proteção de Dados - Lei Nº 13.709/2018</p>
        </div>

        {/* Company Info */}
        {getCompanyQuery.data && currentSession && (
          <Card className="mb-8 bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Empresa</p>
                  <p className="text-lg font-semibold text-gray-900">{getCompanyQuery.data.razaoSocial}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">CNPJ</p>
                  <p className="text-lg font-semibold text-gray-900">{getCompanyQuery.data.cnpj}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Respondente</p>
                  <p className="text-lg font-semibold text-gray-900">Respondente {currentSession.respondentNumber}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Card */}
        <Card className="mb-8 bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Progresso da Avaliação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Questão {currentQuestionIndex + 1} de {QUESTIONS.length}
                  </span>
                  <span className="text-sm font-medium text-gray-700">
                    {answeredCount} respondidas
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Pillars */}
        <Tabs
          defaultValue="security"
          value={
            currentQuestion.pillar === "security"
              ? "security"
              : currentQuestion.pillar === "compliance"
                ? "compliance"
                : "culture"
          }
          onValueChange={(value) => {
            const pillarMap: Record<string, "security" | "compliance" | "culture"> = {
              security: "security",
              compliance: "compliance",
              culture: "culture",
            };
            const targetPillar = pillarMap[value];
            const firstQuestionIndex = QUESTIONS.findIndex((q) => q.pillar === targetPillar);
            if (firstQuestionIndex !== -1) {
              setCurrentQuestionIndex(firstQuestionIndex);
            }
          }}
          className="mb-8"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="security">
              Segurança
              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                {QUESTIONS.filter((q) => q.pillar === "security").length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="compliance">
              Conformidade
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                {QUESTIONS.filter((q) => q.pillar === "compliance").length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="culture">
              Cultura
              <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                {QUESTIONS.filter((q) => q.pillar === "culture").length}
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Question Card */}
          <TabsContent value={currentQuestion.pillar} className="space-y-6">
            <Card className="bg-white shadow-lg">
              {(() => {
                const colors = getPillarColors(currentQuestion.pillarName);
                return (
                  <CardHeader className={`bg-gradient-to-r ${colors.gradient} text-white`}>
                    <CardTitle className="text-xl">{currentQuestion.pillarName}</CardTitle>
                    <CardDescription className="text-white/90">
                      Questão {currentQuestionIndex + 1} de {QUESTIONS.length}
                    </CardDescription>
                  </CardHeader>
                );
              })()}
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {/* Question Text */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{currentQuestion.question}</h3>
                  </div>

                  {/* Answer Options */}
                  <RadioGroup
                    value={answers[currentQuestion.id] || ""}
                    onValueChange={handleAnswerChange}
                  >
                    <div className="space-y-3">
                      {Object.entries(currentQuestion.options).map(([key, value]) => (
                        <div key={key} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <RadioGroupItem value={key} id={`option-${key}`} />
                          <Label
                            htmlFor={`option-${key}`}
                            className="flex-1 cursor-pointer text-gray-700"
                          >
                            <span className="font-semibold text-blue-600">{key})</span> {value}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex gap-4 justify-between">
              <Button
                variant="outline"
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
              >
                ← Anterior
              </Button>

              <div className="flex gap-2">
                {currentQuestionIndex === QUESTIONS.length - 1 ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={answeredCount !== QUESTIONS.length || loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {loading ? "Processando..." : "Enviar Avaliação"}
                  </Button>
                ) : (
                  <Button 
                    onClick={handleNextQuestion}
                    disabled={!answers[currentQuestion.id]}
                  >
                    Próxima →
                  </Button>
                )}
              </div>
            </div>

            {/* Warning if not all answered */}
            {answeredCount !== QUESTIONS.length && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Você respondeu {answeredCount} de {QUESTIONS.length} questões. Responda todas para enviar.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ResultPage({
  result,
  companyId,
}: {
  result: { 
    isCompleted: boolean; 
    totalScore: number; 
    compliancePercentage: number; 
    company?: { cnpj: string; razaoSocial: string };
    respondentsRemaining?: number;
  };
  companyId: number;
}) {
  const getComplianceLevel = (percentage: number) => {
    if (percentage >= 90) return { level: "Excelente", color: "text-green-600", bgColor: "bg-green-50" };
    if (percentage >= 75) return { level: "Bom", color: "text-blue-600", bgColor: "bg-blue-50" };
    if (percentage >= 60) return { level: "Satisfatório", color: "text-yellow-600", bgColor: "bg-yellow-50" };
    return { level: "Insuficiente", color: "text-red-600", bgColor: "bg-red-50" };
  };

  const compliance = result.isCompleted ? getComplianceLevel(result.compliancePercentage) : null;

  if (!result.isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
              <CardTitle className="text-3xl flex items-center gap-2">
                <Clock className="w-8 h-8" />
                Avaliação Enviada!
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8">
              <div className="space-y-6">
                {/* Company Info */}
                {result.company && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-600 mb-1">Empresa Avaliada</p>
                    <p className="text-lg font-semibold text-gray-900">{result.company.razaoSocial}</p>
                    <p className="text-sm text-gray-600 mt-2">CNPJ: {result.company.cnpj}</p>
                  </div>
                )}

                {/* Status Message */}
                <div className="p-6 bg-blue-50 rounded-lg border border-blue-200 text-center">
                  <p className="text-gray-700 mb-2">
                    Sua avaliação foi enviada com sucesso!
                  </p>
                  <p className="text-lg font-semibold text-blue-600 mb-4">
                    Aguardando {result.respondentsRemaining} respondente(s)...
                  </p>
                  <p className="text-sm text-gray-600">
                    O resultado final será calculado quando todos os respondentes completarem a avaliação.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6 border-t">
                  <Button
                    onClick={() => window.location.href = "/"}
                    className="flex-1"
                  >
                    Voltar para Início
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-white shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
            <CardTitle className="text-3xl flex items-center gap-2">
              <CheckCircle2 className="w-8 h-8" />
              Avaliação Concluída!
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="space-y-8">
              {/* Company Info */}
              {result.company && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-600 mb-1">Empresa Avaliada</p>
                  <p className="text-lg font-semibold text-gray-900">{result.company.razaoSocial}</p>
                  <p className="text-sm text-gray-600 mt-2">CNPJ: {result.company.cnpj}</p>
                </div>
              )}

              {/* Score Display */}
              {compliance && (
                <div className={`${compliance.bgColor} p-8 rounded-lg text-center`}>
                  <p className="text-gray-600 text-sm font-medium mb-2">Nível de Conformidade</p>
                  <p className={`${compliance.color} text-5xl font-bold mb-2`}>
                    {result.compliancePercentage}%
                  </p>
                  <p className={`${compliance.color} text-xl font-semibold`}>
                    {compliance.level}
                  </p>
                </div>
              )}

              {/* Score Breakdown */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Detalhes da Avaliação</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-blue-50">
                    <CardContent className="pt-6">
                      <p className="text-sm text-gray-600 mb-1">Pontuação Total</p>
                      <p className="text-2xl font-bold text-blue-600">{result.totalScore.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 mt-1">de 100.000 pontos</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-indigo-50">
                    <CardContent className="pt-6">
                      <p className="text-sm text-gray-600 mb-1">Questões Respondidas</p>
                      <p className="text-2xl font-bold text-indigo-600">50</p>
                      <p className="text-xs text-gray-500 mt-1">de 50 questões</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Recommendations */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900">Próximos Passos</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  {result.compliancePercentage >= 90 ? (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        <span>Sua empresa demonstra excelente conformidade com a LGPD.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        <span>Mantenha as práticas atuais e realize auditorias periódicas.</span>
                      </li>
                    </>
                  ) : result.compliancePercentage >= 75 ? (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold">→</span>
                        <span>Sua empresa está em bom caminho na conformidade com a LGPD.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold">→</span>
                        <span>Identifique as áreas de melhoria e implemente ações corretivas.</span>
                      </li>
                    </>
                  ) : result.compliancePercentage >= 60 ? (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-600 font-bold">!</span>
                        <span>Sua empresa precisa melhorar a conformidade com a LGPD.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-600 font-bold">!</span>
                        <span>Desenvolva um plano de ação para implementar as medidas necessárias.</span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-red-600 font-bold">✗</span>
                        <span>Sua empresa está com conformidade insuficiente com a LGPD.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-600 font-bold">✗</span>
                        <span>Implemente urgentemente as medidas de proteção de dados exigidas.</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => window.location.href = "/"}
                  className="flex-1"
                >
                  Voltar para Início
                </Button>
                <Button
                  onClick={() => window.print()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Imprimir Resultado
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

