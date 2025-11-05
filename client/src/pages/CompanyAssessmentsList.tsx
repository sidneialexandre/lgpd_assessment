import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ChevronRight, BarChart3 } from "lucide-react";

export default function CompanyAssessmentsList() {
  const [location, setLocation] = useLocation();
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [company, setCompany] = useState<any>(null);
  const [assessments, setAssessments] = useState<any[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("companyId");
    if (id) {
      setCompanyId(parseInt(id));
    }
  }, []);

  // Get company details
  const getCompanyQuery = trpc.company.getById.useQuery(
    { companyId: companyId || 0 },
    { enabled: !!companyId }
  );

  // Get company assessments
  const getAssessmentsQuery = trpc.assessment.getByCompany.useQuery(
    { companyId: companyId || 0 },
    { enabled: !!companyId }
  );

  useEffect(() => {
    if (getCompanyQuery.data) {
      setCompany(getCompanyQuery.data);
    }
  }, [getCompanyQuery.data]);

  useEffect(() => {
    if (getAssessmentsQuery.data) {
      setAssessments(getAssessmentsQuery.data);
    }
  }, [getAssessmentsQuery.data]);

  const handleNewAssessment = () => {
    setLocation(`/company-setup?companyId=${companyId}`);
  };

  const handleViewAdmin = (assessmentId: number) => {
    setLocation(`/assessment-admin?id=${assessmentId}`);
  };

  const handleBackToMyAssessments = () => {
    setLocation("/my-assessments");
  };

  if (!companyId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900">Erro</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-800">ID da empresa não fornecido.</p>
              <Button onClick={handleBackToMyAssessments} className="mt-4">
                Voltar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (getCompanyQuery.isLoading || getAssessmentsQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando avaliações...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900">Erro</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-800">Empresa não encontrada.</p>
              <Button onClick={handleBackToMyAssessments} className="mt-4">
                Voltar
              </Button>
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
            onClick={handleBackToMyAssessments}
            className="mb-4"
          >
            ← Voltar
          </Button>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            {company.razaoSocial}
          </h1>
          <p className="text-slate-600">
            CNPJ: {company.cnpj}
          </p>
        </div>

        {/* New Assessment Button */}
        <div className="mb-8">
          <Button
            onClick={handleNewAssessment}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            size="lg"
          >
            Nova Avaliação
          </Button>
        </div>

        {/* Assessments List */}
        {assessments.length === 0 ? (
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Nenhuma Avaliação Encontrada</CardTitle>
              <CardDescription>
                Esta empresa ainda não possui nenhuma avaliação. Clique no botão acima para criar uma nova.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4">
            {assessments.map((assessment) => {
              const completionPercentage = assessment.isCompleted === 1 ? 100 : 0;
              const compliancePercentage = parseFloat(assessment.compliancePercentage || "0");

              return (
                <Card
                  key={assessment.id}
                  className="border-slate-200 hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg text-slate-900">
                            Avaliação #{assessment.id}
                          </CardTitle>
                          {assessment.isCompleted === 1 ? (
                            <Badge className="bg-green-100 text-green-800">
                              Concluída
                            </Badge>
                          ) : (
                            <Badge className="bg-orange-100 text-orange-800">
                              Em Andamento
                            </Badge>
                          )}
                        </div>
                        <CardDescription>
                          Criada em {new Date(assessment.createdAt).toLocaleDateString("pt-BR")}
                        </CardDescription>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-slate-700">
                            Conformidade LGPD
                          </span>
                          <span className="text-sm font-bold text-slate-900">
                            {compliancePercentage.toFixed(2)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${compliancePercentage}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Scores */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-3 rounded-lg">
                          <p className="text-xs text-slate-600 mb-1">Pontuação Total</p>
                          <p className="text-xl font-bold text-slate-900">
                            {assessment.totalScore}
                          </p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg">
                          <p className="text-xs text-slate-600 mb-1">Máximo</p>
                          <p className="text-xl font-bold text-slate-900">
                            100000
                          </p>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button
                        onClick={() => handleViewAdmin(assessment.id)}
                        className="w-full"
                        variant="outline"
                      >
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Painel de Administração
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

