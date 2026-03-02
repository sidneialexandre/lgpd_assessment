import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Copy, Check, Trash2, Mail } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function AssessmentAdmin() {
  const [location, setLocation] = useLocation();
  const [assessmentId, setAssessmentId] = useState<number | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingEmail, setEditingEmail] = useState("");
  const [allEmailsFilled, setAllEmailsFilled] = useState(false);

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
    const baseUrl = window.location.origin;
    const respondentUrl = `${baseUrl}/respondent?token=${token}`;
    navigator.clipboard.writeText(respondentUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleFinalize = async () => {
    if (assessmentId && confirm("Tem certeza que deseja finalizar a avaliação?")) {
      await finalizeAssessmentMutation.mutateAsync({ assessmentId });
    }
  };

  const handleDelete = async () => {
    if (assessmentId && confirm("Tem certeza que deseja deletar esta avaliação completamente? Esta ação não pode ser desfeita.")) {
      await deleteAssessmentMutation.mutateAsync({ assessmentId });
    }
  };

  const handleGoToRespondentSelection = () => {
    if (assessmentId && data?.assessment) {
      setLocation(`/respondent-selection?companyId=${data.assessment.companyId}&assessmentId=${assessmentId}`);
    }
  };

  const handleBackToHome = () => {
    setLocation("/");
  };

  const handleEditStart = (session: any) => {
    setEditingSessionId(session.id);
    setEditingName(session.respondentName || "");
    setEditingEmail(session.respondentEmail || "");
  };

  const handleSaveRespondent = async () => {
    if (!editingName.trim() || !editingEmail.trim()) {
      alert("Nome e email são obrigatórios");
      return;
    }
    
    if (editingSessionId) {
      await updateRespondentInfoMutation.mutateAsync({
        respondentSessionId: editingSessionId,
        respondentName: editingName,
        respondentEmail: editingEmail,
      });
    }
  };

  const handleSendEmails = async () => {
    if (assessmentId && allEmailsFilled) {
      await sendEmailsMutation.mutateAsync({ assessmentId });
    }
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

  const progressPercentage = data.totalRespondents > 0 ? (data.completedRespondents / data.totalRespondents) * 100 : 0;

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

        {/* Groups Configuration */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Configuração de Grupos</CardTitle>
            <CardDescription>
              Definição original de grupos e status de respondentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.groups && data.groups.length > 0 ? (
                data.groups.map((group: any) => (
                  <div
                    key={group.id}
                    className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {group.groupName} - {group.departmentName}
                        </h3>
                        <p className="text-sm text-slate-500">
                          Respondentes configurados: {group.respondentCount}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-slate-600">Completados: {group.completedCount}</span>
                          <span className="text-sm text-slate-600">Faltando: {group.pendingCount}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(group.completedCount / group.respondentCount) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500">Nenhum grupo configurado</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Respondents List */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Lista de Respondentes</CardTitle>
            <CardDescription>
              Preencha nome e email para cada respondente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getSessionsWithGroupsQuery.data && getSessionsWithGroupsQuery.data.length > 0 ? (
                getSessionsWithGroupsQuery.data.map((session: any) => {
                  const baseUrl = window.location.origin;
                  const respondentUrl = `${baseUrl}/respondent?token=${session.accessToken}`;
                  const isEditing = editingSessionId === session.id;

                  return (
                    <div
                      key={session.id}
                      className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-blue-100 text-blue-700">
                            {session.groupName}
                          </Badge>
                          <span className="text-sm font-semibold text-slate-700">
                            {session.departmentName}
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
                      </div>

                      {isEditing ? (
                        <div className="space-y-3 mb-3 p-3 bg-slate-50 rounded-lg">
                          <div>
                            <label className="text-sm font-medium text-slate-700">Nome</label>
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              placeholder="Nome do respondente"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-slate-700">Email</label>
                            <Input
                              value={editingEmail}
                              onChange={(e) => setEditingEmail(e.target.value)}
                              placeholder="email@example.com"
                              type="email"
                              className="mt-1"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={handleSaveRespondent}
                              disabled={updateRespondentInfoMutation.isPending}
                              className="flex-1"
                            >
                              Salvar
                            </Button>
                            <Button
                              onClick={() => setEditingSessionId(null)}
                              variant="outline"
                              className="flex-1"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 mb-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm text-slate-600">
                                <span className="font-medium">Nome:</span> {session.respondentName || "Não preenchido"}
                              </p>
                              <p className="text-sm text-slate-600">
                                <span className="font-medium">Email:</span> {session.respondentEmail || "Não preenchido"}
                              </p>
                            </div>
                            <Button
                              onClick={() => handleEditStart(session)}
                              variant="outline"
                              size="sm"
                            >
                              Editar
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="bg-slate-100 p-3 rounded-lg mb-3 break-all font-mono text-sm text-slate-700">
                        {respondentUrl}
                      </div>

                      <Button
                        onClick={() => handleCopyToken(session.accessToken || "")}
                        disabled={!session.accessToken}
                        className="w-full"
                        variant="outline"
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
              ) : (
                <p className="text-slate-500">Nenhum respondente configurado ainda.</p>
              )}
            </div>

            {getSessionsWithGroupsQuery.data && getSessionsWithGroupsQuery.data.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-blue-900 mb-1">Enviar Links por Email</p>
                    <p className="text-sm text-blue-800">
                      {allEmailsFilled
                        ? "Todos os emails foram preenchidos. Clique para enviar links aos respondentes."
                        : "Preencha todos os emails dos respondentes para habilitar envio."}
                    </p>
                  </div>
                  <Button
                    onClick={handleSendEmails}
                    disabled={!allEmailsFilled || sendEmailsMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar Emails
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900">Adicionar Respondentes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-800 mb-4">
                Acesse o painel de seleção de respondentes para adicionar novos respondentes e gerar seus links de acesso.
              </p>
              <Button
                onClick={handleGoToRespondentSelection}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Ir para Seleção de Respondentes
              </Button>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900">Finalizar Avaliação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.pendingRespondents > 0 && (
                  <p className="text-sm text-green-800">
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
                <p className="text-xs text-green-700">
                  Ao finalizar, o percentual de conformidade será calculado com base nos respondentes que já completaram.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Section - Show only if assessment is finalized */}
        {data.assessment.isCompleted === 1 && (
          <Card className="border-blue-200 bg-blue-50 mb-8">
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
                  onClick={() => window.print()}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Gerar Relatório PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delete Assessment */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900">Remover Avaliação</CardTitle>
            <CardDescription className="text-red-800">
              Esta ação não pode ser desfeita
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-800 mb-4">
              Deletar esta avaliação removerá completamente todos os dados, respondentes e respostas do banco de dados.
            </p>
            {showDeleteConfirm ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-red-900">
                  Tem certeza que deseja deletar esta avaliação?
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={handleDelete}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    Sim, Deletar
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
