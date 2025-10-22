import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { QUESTIONS } from "@shared/questions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Assessment() {
  const { user, isAuthenticated } = useAuth();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [assessmentId, setAssessmentId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<{ totalScore: number; compliancePercentage: number } | null>(null);

  const createAssessmentMutation = trpc.assessment.create.useMutation();
  const saveAnswersMutation = trpc.assessment.saveAnswers.useMutation();

  // Initialize assessment
  useEffect(() => {
    if (isAuthenticated && !assessmentId) {
      createAssessmentMutation.mutate(undefined, {
        onSuccess: (data) => {
          if (data) {
            setAssessmentId(data.id);
          }
        },
      });
    }
  }, [isAuthenticated, assessmentId]);

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
    if (!assessmentId || answeredCount !== QUESTIONS.length) {
      alert("Por favor, responda todas as questões antes de enviar.");
      return;
    }

    setIsSubmitting(true);

    const answersData = QUESTIONS.map((q) => {
      const selectedAnswer = answers[q.id] as "A" | "B" | "C" | "D";
      const score = q.scores[selectedAnswer] || 0;
      return {
        questionId: q.id,
        selectedAnswer,
        score,
      };
    });

    saveAnswersMutation.mutate(
      { assessmentId, answers: answersData },
      {
        onSuccess: (data) => {
          if (data) {
            setResult({
              totalScore: data.totalScore,
              compliancePercentage: data.compliancePercentage,
            });
            setIsCompleted(true);
          }
          setIsSubmitting(false);
        },
        onError: () => {
          alert("Erro ao salvar as respostas. Tente novamente.");
          setIsSubmitting(false);
        },
      }
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Necessário</CardTitle>
            <CardDescription>Você precisa estar autenticado para acessar a avaliação.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Por favor, faça login para continuar.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isCompleted && result) {
    return <ResultPage result={result} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Avaliação de Conformidade LGPD</h1>
          <p className="text-gray-600">Lei Geral de Proteção de Dados - Lei Nº 13.709/2018</p>
        </div>

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
              <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                <CardTitle className="text-xl">{currentQuestion.pillarName}</CardTitle>
                <CardDescription className="text-blue-100">
                  Questão {currentQuestionIndex + 1} de {QUESTIONS.length}
                </CardDescription>
              </CardHeader>
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
                          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {currentQuestion.scores[key as "A" | "B" | "C" | "D"]} pts
                          </span>
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
                    disabled={answeredCount !== QUESTIONS.length || isSubmitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? "Enviando..." : "Enviar Avaliação"}
                  </Button>
                ) : (
                  <Button onClick={handleNextQuestion}>
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
}: {
  result: { totalScore: number; compliancePercentage: number };
}) {
  const getComplianceLevel = (percentage: number) => {
    if (percentage >= 90) return { level: "Excelente", color: "text-green-600", bgColor: "bg-green-50" };
    if (percentage >= 75) return { level: "Bom", color: "text-blue-600", bgColor: "bg-blue-50" };
    if (percentage >= 60) return { level: "Satisfatório", color: "text-yellow-600", bgColor: "bg-yellow-50" };
    return { level: "Insuficiente", color: "text-red-600", bgColor: "bg-red-50" };
  };

  const compliance = getComplianceLevel(result.compliancePercentage);

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
              {/* Score Display */}
              <div className={`${compliance.bgColor} p-8 rounded-lg text-center`}>
                <p className="text-gray-600 text-sm font-medium mb-2">Nível de Conformidade</p>
                <p className={`${compliance.color} text-5xl font-bold mb-2`}>
                  {result.compliancePercentage}%
                </p>
                <p className={`${compliance.color} text-xl font-semibold`}>
                  {compliance.level}
                </p>
              </div>

              {/* Score Breakdown */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Detalhes da Avaliação</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-blue-50">
                    <CardContent className="pt-6">
                      <p className="text-sm text-gray-600 mb-1">Pontuação Total</p>
                      <p className="text-2xl font-bold text-blue-600">{result.totalScore}</p>
                      <p className="text-xs text-gray-500 mt-1">de 10.000 pontos</p>
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
                  onClick={() => window.location.reload()}
                  className="flex-1"
                >
                  Nova Avaliação
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

