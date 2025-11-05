import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ChevronRight, Plus } from "lucide-react";

export default function MyAssessments() {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [companies, setCompanies] = useState<any[]>([]);

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

  const handleNewAssessment = () => {
    setLocation("/company-setup");
  };

  const handleViewAssessment = (companyId: number) => {
    setLocation(`/company-assessments?companyId=${companyId}`);
  };

  const handleBackToHome = () => {
    setLocation("/");
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
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">
                      Criada em {new Date(company.createdAt).toLocaleDateString("pt-BR")}
                    </span>
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

