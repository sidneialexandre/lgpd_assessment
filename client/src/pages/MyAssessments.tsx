import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ChevronRight, Plus, Trash2, TrendingUp } from "lucide-react";

export default function MyAssessments() {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [companies, setCompanies] = useState<any[]>([]);
  const [assessmentHistory, setAssessmentHistory] = useState<Record<number, any[]>>({});

  // Get user's companies
  const getCompaniesQuery = trpc.company.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  useEffect(() => {
    if (getCompaniesQuery.data) {
      setCompanies(getCompaniesQuery.data);
    }
  }, [getCompaniesQuery.data]);

  useEffect(() => {
    const loadHistories = async () => {
      const histories: Record<number, any[]> = {};
      for (const company of companies) {
        try {
          const history = await (trpc.assessment.getHistoryWithScores as any).query({ companyId: company.id });
          histories[company.id] = history;
        } catch (error) {
          console.error("Erro ao carregar historico:", error);
          histories[company.id] = [];
        }
      }
      setAssessmentHistory(histories);
    };
    if (companies.length > 0) {
      loadHistories();
    }
  }, [companies]);

  const handleNewAssessment = () => {
    setLocation("/company-setup");
  };

  const handleViewAssessment = (companyId: number) => {
    setLocation(`/company-assessments?companyId=${companyId}`);
  };

  const handleBackToHome = () => {
    setLocation("/");
  };

  const deleteCompanyMutation = trpc.company.delete.useMutation();

  const handleDeleteCompany = async (e: React.MouseEvent, companyId: number) => {
    e.stopPropagation();
    
    if (!window.confirm("Tem certeza que deseja deletar esta empresa e TODAS as suas avaliações? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      await deleteCompanyMutation.mutateAsync({ companyId });
      setCompanies(companies.filter(c => c.id !== companyId));
    } catch (error) {
      console.error("Erro ao deletar empresa:", error);
      alert("Erro ao deletar empresa. Por favor, tente novamente.");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-4xl mx-auto">
          <Button onClick={handleBackToHome} variant="outline" className="mb-4">
            ← Voltar ao Início
          </Button>
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900">Acesso Restrito</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-800 mb-4">Você precisa estar autenticado para acessar esta página.</p>
              <Button onClick={handleBackToHome}>Voltar ao Início</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
            Minhas Avaliações
          </h1>
          <p className="text-slate-600">
            Gerencie suas avaliações de conformidade LGPD
          </p>
        </div>

        {/* New Assessment Button */}
        <div className="mb-8">
          <Button
            onClick={handleNewAssessment}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            size="lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            Nova Avaliação
          </Button>
        </div>

        {/* Assessments List */}
        {getCompaniesQuery.isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Carregando avaliações...</p>
          </div>
        ) : companies.length === 0 ? (
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Nenhuma Avaliação Encontrada</CardTitle>
              <CardDescription>
                Você ainda não criou nenhuma avaliação. Clique no botão acima para começar.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4">
            {companies.map((company) => (
              <Card
                key={company.id}
                className="border-slate-200 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleViewAssessment(company.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl text-slate-900">
                        {company.razaoSocial}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        CNPJ: {company.cnpj}
                      </CardDescription>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">
                        Criada em {new Date(company.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>

                    {assessmentHistory[company.id]?.length > 0 && (
                      <div className="border-t pt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-semibold text-slate-900">Historico de Avaliacoes</span>
                        </div>
                        <div className="space-y-2">
                          {assessmentHistory[company.id].map((assessment: any) => (
                            <div key={assessment.id} className="flex items-center justify-between text-sm bg-slate-50 p-2 rounded">
                              <span className="text-slate-700">
                                Avaliacao #{assessment.assessmentNumber}
                              </span>
                              <div className="flex items-center gap-2">
                                <Badge variant={assessment.isCompleted === 1 ? "default" : "secondary"}>
                                  {assessment.isCompleted === 1 ? "Concluida" : "Pendente"}
                                </Badge>
                                {assessment.isCompleted === 1 && (
                                  <span className="text-xs font-semibold text-blue-600">
                                    {assessment.compliancePercentage}%
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewAssessment(company.id);
                          }}
                        >
                          Gerenciar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDeleteCompany(e, company.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={deleteCompanyMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
