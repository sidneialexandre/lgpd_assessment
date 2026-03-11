import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Copy, Check, Trash2, Mail, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { generatePDFReport } from "@/components/PDFReportGenerator";

export default function AssessmentAdmin() {
  const [location, setLocation] = useLocation();
  const [assessmentId, setAssessmentId] = useState<number | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingEmail, setEditingEmail] = useState("");
  const [allEmailsFilled, setAllEmailsFilled] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      setAssessmentId(parseInt(id));
    }
  }, []);

  const getDetailsQuery = trpc.assessment.getWithDetails.useQuery(
    { assessmentId: assessmentId || 0 },
    { enabled: !!assessmentId, refetchInterval: 3000 }
  );

  const finalizeAssessmentMutation = trpc.assessment.finalize.useMutation({
    onSuccess: () => {
      getDetailsQuery.refetch();
    },
  });

  const deleteAssessmentMutation = trpc.assessment.delete.useMutation({
    onSuccess: () => {
      setLocation("/");
    },
  });

  const getSessionsWithGroupsQuery = trpc.respondent.getSessionsWithGroups.useQuery(
    { assessmentId: assessmentId || 0 },
    { enabled: !!assessmentId }
  );

  const checkAllEmailsFilledQuery = trpc.respondent.checkAllEmailsFilled.useQuery(
    { assessmentId: assessmentId || 0 },
    { enabled: !!assessmentId, refetchInterval: 2000 }
  );

  const updateRespondentInfoMutation = trpc.respondent.updateInfo.useMutation({
    onSuccess: () => {
      setEditingSessionId(null);
      getSessionsWithGroupsQuery.refetch();
      checkAllEmailsFilledQuery.refetch();
    },
  });

  const sendEmailsMutation = trpc.respondent.sendEmailsToRespondents.useMutation({
    onSuccess: () => {
      alert("Emails enviados com sucesso!");
    },
    onError: (error) => {
      alert(`Erro ao enviar emails: ${error.message}`);
    },
  });

  useEffect(() => {
    if (checkAllEmailsFilledQuery.data !== undefined) {
      setAllEmailsFilled(checkAllEmailsFilledQuery.data);
    }
  }, [checkAllEmailsFilledQuery.data]);

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleDeleteAssessment = () => {
    if (!assessmentId) return;
    deleteAssessmentMutation.mutate({ assessmentId });
  };

  const handleEditRespondent = (sessionId: number, name: string, email: string) => {
    setEditingSessionId(sessionId);
    setEditingName(name);
    setEditingEmail(email);
  };

  const handleSaveRespondent = () => {
    if (!editingSessionId) return;
    updateRespondentInfoMutation.mutate({
      respondentSessionId: editingSessionId,
      respondentName: editingName,
      respondentEmail: editingEmail,
    });
  };

  const handleSendEmails = () => {
    if (!assessmentId) return;
    sendEmailsMutation.mutate({ assessmentId });
  };

  const handleFinalize = async () => {
    if (!assessmentId) return;
    const { user } = useAuth();
    if (!user || user.role !== "admin") {
      alert("Apenas administradores podem finalizar avaliações");
      return;
    }
    try {
      await finalizeAssessmentMutation.mutateAsync({ assessmentId });
      alert("Avaliação finalizada com sucesso!");
    } catch (error) {
      console.error("[ADMIN] Erro ao finalizar avaliação:", error);
      alert(`Erro ao finalizar avaliação: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleGeneratePDF = async () => {
    if (!getDetailsQuery.data) {
      alert("Dados da avaliação não carregados");
      return;
    }

    setIsGeneratingPDF(true);

    try {
      const data = getDetailsQuery.data;
      console.log("[ADMIN] Iniciando geração de PDF");

      const compliancePercent = typeof data.assessment.compliancePercentage === "string"
        ? parseFloat(data.assessment.compliancePercentage)
        : data.assessment.compliancePercentage;

      const reportData = {
        companyName: "Empresa " + data.assessment.companyId,
        assessmentNumber: data.assessment.assessmentNumber,
        totalScore: data.assessment.totalScore,
        compliancePercentage: compliancePercent,
        totalRespondents: data.totalRespondents,
        completedRespondents: data.completedRespondents,
        groups: (data.groups || []).map((group: any) => {
          const groupCompliance = typeof group.compliancePercentage === "string"
            ? parseFloat(group.compliancePercentage)
            : (group.compliancePercentage || 0);
          return {
            groupName: group.groupName,
            departmentName: group.departmentName,
            respondentCount: group.respondentCount,
            completedCount: group.completedCount,
            totalScore: group.totalScore,
            compliancePercentage: groupCompliance,
          };
        }),
        generatedAt: new Date(),
      };

      console.log("[ADMIN] Dados do relatório preparados:", reportData);
      await generatePDFReport(reportData);
      console.log("[ADMIN] PDF gerado com sucesso");
      alert("PDF gerado com sucesso!");
    } catch (error) {
      console.error("[ADMIN] Erro ao gerar PDF:", error);
      alert(`Erro ao gerar PDF: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleBackToHome = () => {
    setLocation("/");
  };

  const data = getDetailsQuery.data;

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
                Voltar para Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (getDetailsQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-slate-600">Carregando dados da avaliação...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
                Voltar para Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Painel de Administração</h1>
            <p className="text-slate-600 mt-1">Gerenciamento da Avaliação #{data.assessment.assessmentNumber}</p>
          </div>
          <Button variant="outline" onClick={handleBackToHome}>
            Voltar
          </Button>
        </div>

        {/* Assessment Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status da Avaliação</CardTitle>
            <CardDescription>
              {data.assessment.isCompleted === 1 ? "Avaliação Finalizada" : "Avaliação em Andamento"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-slate-600">Total de Respondentes</p>
                <p className="text-2xl font-bold text-slate-900">{data.totalRespondents}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Respondentes Completos</p>
                <p className="text-2xl font-bold text-green-600">{data.completedRespondents}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Respondentes Pendentes</p>
                <p className="text-2xl font-bold text-orange-600">{data.pendingRespondents}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Taxa de Conclusão</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round((data.completedRespondents / data.totalRespondents) * 100)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Respondent Management */}
        <Card>
          <CardHeader>
            <CardTitle>Gerenciamento de Respondentes</CardTitle>
            <CardDescription>
              Edite informações de contato dos respondentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.sessions && data.sessions.length > 0 ? (
                data.sessions.map((session: any) => (
                  <div
                    key={session.id}
                    className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        {editingSessionId === session.id ? (
                          <div className="space-y-2">
                            <Input
                              placeholder="Nome"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                            />
                            <Input
                              placeholder="Email"
                              value={editingEmail}
                              onChange={(e) => setEditingEmail(e.target.value)}
                            />
                          </div>
                        ) : (
                          <div>
                            <p className="font-semibold text-slate-900">{session.respondentName || "Sem nome"}</p>
                            <p className="text-sm text-slate-600">{session.respondentEmail || "Sem email"}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {editingSessionId === session.id ? (
                          <>
                            <Button
                              size="sm"
                              onClick={handleSaveRespondent}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingSessionId(null)}
                            >
                              Cancelar
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleEditRespondent(
                                session.id,
                                session.respondentName || "",
                                session.respondentEmail || ""
                              )
                            }
                          >
                            Editar
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={session.isCompleted === 1 ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}>
                        {session.isCompleted === 1 ? "Completo" : "Pendente"}
                      </Badge>
                      <span className="text-xs text-slate-500">Token: {session.accessToken?.substring(0, 8)}...</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyToken(session.accessToken)}
                      >
                        {copiedToken === session.accessToken ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500">Nenhum respondente configurado</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Email Management */}
        {allEmailsFilled && (
          <Card>
            <CardHeader>
              <CardTitle>Envio de Emails</CardTitle>
              <CardDescription>
                Envie links de avaliação aos respondentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleSendEmails}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={sendEmailsMutation.isPending}
              >
                <Mail className="w-4 h-4 mr-2" />
                {sendEmailsMutation.isPending ? "Enviando..." : "Enviar Emails aos Respondentes"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Assessment Results */}
        {data.assessment.isCompleted === 1 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900">Resultados da Avaliação</CardTitle>
              <CardDescription className="text-blue-800">
                Conformidade total e por grupo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Overall Compliance */}
                <div className="p-4 bg-white rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-600 mb-2">Conformidade Total</p>
                  <p className="text-4xl font-bold text-blue-600">{data.assessment.compliancePercentage}%</p>
                  <p className="text-xs text-gray-500 mt-2">Pontuação Total: {data.assessment.totalScore.toLocaleString()}</p>
                </div>

                {/* Group Results */}
                {data.groups && data.groups.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">Conformidade por Grupo</h4>
                    {data.groups.map((group: any) => (
                      <div key={group.id} className="p-3 bg-white rounded-lg border border-blue-100">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-gray-900">{group.groupName} - {group.departmentName}</p>
                            <p className="text-xs text-gray-500">Respondentes: {group.completedCount}/{group.respondentCount}</p>
                          </div>
                          <p className="text-2xl font-bold text-blue-600">{group.compliancePercentage}%</p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${group.compliancePercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Download PDF Button */}
                <Button
                  onClick={handleGeneratePDF}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isGeneratingPDF}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {isGeneratingPDF ? "Gerando PDF..." : "Gerar Relatório PDF"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Finalize Assessment */}
        {data.assessment.isCompleted === 0 && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900">Finalizar Avaliação</CardTitle>
              <CardDescription className="text-green-800">
                Clique para finalizar a avaliação e calcular resultados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleFinalize}
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={finalizeAssessmentMutation.isPending}
              >
                {finalizeAssessmentMutation.isPending ? "Finalizando..." : "Finalizar Avaliação"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Delete Assessment */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900">Ações Perigosas</CardTitle>
            <CardDescription className="text-red-800">
              Essas ações não podem ser desfeitas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showDeleteConfirm ? (
              <div className="space-y-3">
                <p className="text-red-800 font-semibold">Tem certeza que deseja deletar esta avaliação?</p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleDeleteAssessment}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    disabled={deleteAssessmentMutation.isPending}
                  >
                    {deleteAssessmentMutation.isPending ? "Deletando..." : "Confirmar Deleção"}
                  </Button>
                  <Button
                    onClick={() => setShowDeleteConfirm(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Deletar Avaliação
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
