import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ArrowUp, ArrowDown } from "lucide-react";
import { useLocation } from "wouter";

interface AssessmentData {
  id: number;
  assessmentNumber: number;
  totalScore: number;
  compliancePercentage: string;
  createdAt: Date;
  isCompleted: number;
}

export default function ComparisonPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [assessments, setAssessments] = useState<AssessmentData[]>([]);
  const [selectedAssessments, setSelectedAssessments] = useState<number[]>([]);

  // Get company ID from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("companyId");
    if (id) {
      setCompanyId(parseInt(id));
    }
  }, []);

  // Fetch company assessments
  const { data: assessmentList } = trpc.assessment.getByCompany.useQuery(
    { companyId: companyId || 0 },
    { enabled: !!companyId }
  );

  // Transform assessments
  useEffect(() => {
    if (assessmentList) {
      const transformed: AssessmentData[] = assessmentList.map((a: any) => ({
        id: a.id,
        assessmentNumber: a.assessmentNumber || 1,
        totalScore: a.totalScore || 0,
        compliancePercentage: a.compliancePercentage || "0",
        createdAt: new Date(a.createdAt),
        isCompleted: a.isCompleted || 0,
      }));
      setAssessments(transformed.sort((a, b) => a.assessmentNumber - b.assessmentNumber));
    }
  }, [assessmentList]);

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Apenas administradores podem acessar o comparativo de avaliações.
            </p>
            <Button onClick={() => setLocation("/")} className="w-full">
              Voltar para Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!companyId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Empresa não encontrada</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Nenhuma empresa foi selecionada para comparação.
            </p>
            <Button onClick={() => setLocation("/company-assessments")} className="w-full">
              Voltar para Empresas
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const toggleAssessmentSelection = (assessmentId: number) => {
    setSelectedAssessments((prev) =>
      prev.includes(assessmentId)
        ? prev.filter((id) => id !== assessmentId)
        : [...prev, assessmentId]
    );
  };

  const selectedData = assessments.filter((a) => selectedAssessments.includes(a.id));

  // Calculate trends
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Comparativo de Avaliações</h1>
          <p className="text-gray-600 mt-2">Analise a evolução de conformidade ao longo do tempo</p>
        </div>
      </div>

      {/* Assessment Selection */}
      <div className="max-w-6xl mx-auto mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Selecione as Avaliações para Comparar</CardTitle>
            <CardDescription>Escolha até 4 avaliações para visualizar lado a lado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {assessments.map((assessment) => (
                <button
                  key={assessment.id}
                  onClick={() => {
                    if (selectedAssessments.includes(assessment.id) || selectedAssessments.length < 4) {
                      toggleAssessmentSelection(assessment.id);
                    }
                  }}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedAssessments.includes(assessment.id)
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  } ${selectedAssessments.length >= 4 && !selectedAssessments.includes(assessment.id) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  disabled={selectedAssessments.length >= 4 && !selectedAssessments.includes(assessment.id)}
                >
                  <p className="font-semibold text-gray-900">Avaliação #{assessment.assessmentNumber}</p>
                  <p className="text-sm text-gray-500">{assessment.createdAt.toLocaleDateString("pt-BR")}</p>
                  <p className="text-lg font-bold text-blue-600 mt-2">{assessment.compliancePercentage}%</p>
                  <p className="text-xs text-gray-500">Conformidade</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Results */}
      {selectedData.length > 0 && (
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Compliance Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Evolução de Conformidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {selectedData.map((assessment, index) => {
                  const prevAssessment = index > 0 ? selectedData[index - 1] : null;
                  const trend = prevAssessment
                    ? calculateTrend(
                        parseFloat(assessment.compliancePercentage),
                        parseFloat(prevAssessment.compliancePercentage)
                      )
                    : 0;

                  return (
                    <div key={assessment.id} className="p-4 border rounded-lg">
                      <p className="text-sm text-gray-600">Avaliação #{assessment.assessmentNumber}</p>
                      <p className="text-3xl font-bold text-blue-600 mt-2">
                        {assessment.compliancePercentage}%
                      </p>
                      {prevAssessment && (
                        <div className="flex items-center gap-2 mt-3">
                          {trend > 0 ? (
                            <>
                              <ArrowUp className="w-4 h-4 text-green-600" />
                              <span className="text-sm text-green-600">+{trend.toFixed(1)}%</span>
                            </>
                          ) : trend < 0 ? (
                            <>
                              <ArrowDown className="w-4 h-4 text-red-600" />
                              <span className="text-sm text-red-600">{trend.toFixed(1)}%</span>
                            </>
                          ) : (
                            <span className="text-sm text-gray-600">Sem mudança</span>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-3">
                        Pontuação: {assessment.totalScore}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhes da Comparação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4 font-semibold">Métrica</th>
                      {selectedData.map((assessment) => (
                        <th key={assessment.id} className="text-center py-2 px-4 font-semibold">
                          Avaliação #{assessment.assessmentNumber}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">Data</td>
                      {selectedData.map((assessment) => (
                        <td key={assessment.id} className="text-center py-3 px-4">
                          {assessment.createdAt.toLocaleDateString("pt-BR")}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">Conformidade</td>
                      {selectedData.map((assessment) => (
                        <td key={assessment.id} className="text-center py-3 px-4">
                          <span className="font-bold text-blue-600">
                            {assessment.compliancePercentage}%
                          </span>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">Pontuação Total</td>
                      {selectedData.map((assessment) => (
                        <td key={assessment.id} className="text-center py-3 px-4">
                          {assessment.totalScore}
                        </td>
                      ))}
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">Status</td>
                      {selectedData.map((assessment) => (
                        <td key={assessment.id} className="text-center py-3 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              assessment.isCompleted
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {assessment.isCompleted ? "Concluída" : "Pendente"}
                          </span>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Insights */}
          {selectedData.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(() => {
                    const firstCompliance = parseFloat(selectedData[0].compliancePercentage);
                    const lastCompliance = parseFloat(selectedData[selectedData.length - 1].compliancePercentage);
                    const overallTrend = lastCompliance - firstCompliance;
                    const avgCompliance = selectedData.reduce((sum, a) => sum + parseFloat(a.compliancePercentage), 0) / selectedData.length;

                    return (
                      <>
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <strong>Conformidade Média:</strong> {avgCompliance.toFixed(2)}%
                          </p>
                        </div>
                        <div className={`p-3 rounded-lg ${overallTrend >= 0 ? "bg-green-50" : "bg-red-50"}`}>
                          <p className={`text-sm ${overallTrend >= 0 ? "text-green-700" : "text-red-700"}`}>
                            <strong>Tendência Geral:</strong> {overallTrend >= 0 ? "+" : ""}{overallTrend.toFixed(2)}%
                          </p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <strong>Avaliações Comparadas:</strong> {selectedData.length}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="max-w-6xl mx-auto mt-8 text-center">
        <Button variant="outline" onClick={() => setLocation("/company-assessments")}>
          Voltar para Empresas
        </Button>
      </div>
    </div>
  );
}
