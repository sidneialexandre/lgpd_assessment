import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Home } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { GaugeChart } from "@/components/GaugeChart";
import { generatePDFReport } from "@/components/PDFReportGenerator";

interface GroupResult {
  id: number;
  groupName: string;
  departmentName: string;
  compliancePercentage: number;
  respondentCount: number;
  completedCount: number;
  totalScore: number;
}

interface AssessmentResultsData {
  assessment: {
    id: number;
    assessmentNumber: number;
    companyId: number;
    compliancePercentage: string;
    totalScore: number;
    isCompleted: number;
    createdAt: Date;
  };
  companyName: string;  // Tornar obrigatório
  groups: GroupResult[];
  totalRespondents: number;
  completedRespondents: number;
  pendingRespondents: number;
}

// Função para calcular conformidade por pilar
function calculatePillarCompliance(groups: GroupResult[]) {
  // Total de 50 questões em 3 pilares
  // Pilar 1: Segurança da Informação (15 questões) = 15.000 pontos máximo
  // Pilar 2: Conformidade Documental (15 questões) = 15.000 pontos máximo
  // Pilar 3: Cultura de Privacidade (20 questões) = 20.000 pontos máximo
  // Total máximo: 100.000 pontos
  
  let totalScore = 0;
  groups.forEach(group => {
    totalScore += group.totalScore || 0;
  });

  // Distribuir pontos proporcionalmente entre os pilares
  const securityScore = (totalScore * 15) / 50;
  const complianceScore = (totalScore * 15) / 50;
  const privacyScore = (totalScore * 20) / 50;

  return {
    security: Math.round((securityScore / 15000) * 100),
    compliance: Math.round((complianceScore / 15000) * 100),
    privacy: Math.round((privacyScore / 20000) * 100),
  };
}

export default function AssessmentResults() {
  const [location, setLocation] = useLocation();
  const [assessmentId, setAssessmentId] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check query string first for admin flag
    const params = new URLSearchParams(window.location.search);
    const admin = params.get("admin") === "true";
    
    // Try to get ID from URL path (e.g., /assessment-results/540004)
    const pathMatch = location.match(/\/assessment-results\/(\d+)/);
    if (pathMatch && pathMatch[1]) {
      setAssessmentId(parseInt(pathMatch[1]));
      setIsAdmin(admin); // Use admin flag from query string
    } else {
      // Fallback to query string for backward compatibility
      const id = params.get("id");
      if (id) {
        setAssessmentId(parseInt(id));
        setIsAdmin(admin);
      }
    }
  }, [location]);

  const resultsQuery = trpc.assessment.getWithDetails.useQuery(
    { assessmentId: assessmentId || 0 },
    { enabled: !!assessmentId }
  );

  const handleDownloadPDF = () => {
    if (!resultsQuery.data) return;

    const data = resultsQuery.data;
    console.log('[DOWNLOAD PDF] === INICIANDO DOWNLOAD ===');
    console.log('[DOWNLOAD PDF] data.companyName:', data.companyName, 'type:', typeof data.companyName);
    console.log('[DOWNLOAD PDF] data.assessment.companyId:', data.assessment.companyId);
    console.log('[DOWNLOAD PDF] data.groups:', data.groups);
    console.log('[DOWNLOAD PDF] Dados completos da query:', JSON.stringify(data, null, 2));
    
    const compliancePercent = typeof data.assessment.compliancePercentage === "string"
      ? parseFloat(data.assessment.compliancePercentage)
      : data.assessment.compliancePercentage;

    // Calcular conformidade por pilar
    const pillarCompliance = calculatePillarCompliance(data.groups || []);
    
    const finalCompanyName = data.companyName || `Empresa ${data.assessment.companyId}`;
    console.log('[DOWNLOAD PDF] finalCompanyName:', finalCompanyName);
    
    const reportData = {
      companyName: finalCompanyName,
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
      pillars: [
        {
          name: "Segurança da Informação",
          compliancePercentage: pillarCompliance.security,
        },
        {
          name: "Conformidade Documental",
          compliancePercentage: pillarCompliance.compliance,
        },
        {
          name: "Cultura de Privacidade",
          compliancePercentage: pillarCompliance.privacy,
        },
      ],
      generatedAt: new Date(),
    };

    generatePDFReport(reportData);
  };

  const handleBackToHome = () => {
    setLocation("/");
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

  if (resultsQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando resultados da avaliação...</p>
        </div>
      </div>
    );
  }

  const data = resultsQuery.data as AssessmentResultsData | undefined;
  
  // Debug logging
  console.log('[RENDER] data:', data);
  console.log('[RENDER] data.companyName:', data?.companyName);
  console.log('[RENDER] data.companyName type:', typeof data?.companyName);
  console.log('[RENDER] data.assessment.companyId:', data?.assessment?.companyId);

  if (!data || data.assessment.isCompleted !== 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-900">Avaliação Não Finalizada</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-yellow-800">
                Os resultados só estarão disponíveis após a finalização da avaliação pelo administrador.
              </p>
              <Button onClick={handleBackToHome} className="mt-4">
                Voltar ao Início
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const compliancePercent = typeof data.assessment.compliancePercentage === "string"
    ? parseFloat(data.assessment.compliancePercentage)
    : data.assessment.compliancePercentage;

  const groupsData = (data.groups || []).map((group: any) => {
    const groupCompliance = typeof group.compliancePercentage === "string"
      ? parseFloat(group.compliancePercentage)
      : (group.compliancePercentage || 0);
    return {
      ...group,
      compliancePercentage: groupCompliance,
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
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
            Resultados da Avaliação LGPD
          </h1>
          <p className="text-slate-600">
            {data.companyName ? (
              <>
                Empresa: <span className="font-semibold">{data.companyName}</span>
                <br />
                <span className="text-sm text-slate-500">ID: {data.assessment.companyId}</span>
              </>
            ) : (
              <>
                ID da Empresa: <span className="font-semibold">{data.assessment.companyId}</span>
              </>
            )}
          </p>
        </div>

        {/* Conformidade Geral */}
        <Card className="mb-8 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader>
            <CardTitle className="text-blue-900">Conformidade Geral da Empresa</CardTitle>
            <CardDescription className="text-blue-800">
              Nível de conformidade consolidado de todos os respondentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <GaugeChart
                value={compliancePercent}
                label="Conformidade Total"
                size="large"
                minThreshold={20}
                maxThreshold={100}
              />
            </div>
          </CardContent>
        </Card>

        {/* Conformidade por Grupo */}
        {groupsData.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Conformidade por Grupo</CardTitle>
              <CardDescription>
                Nível de conformidade de cada grupo de respondentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupsData.map((group: any, index: number) => (
                  <div key={group.id} className="flex justify-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <GaugeChart
                      value={group.compliancePercentage}
                      label={`${group.groupName} - ${group.departmentName}`}
                      size="small"
                      minThreshold={20}
                      maxThreshold={100}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resumo Executivo */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Resumo Executivo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-600 font-medium">Total de Respondentes</p>
                <p className="text-3xl font-bold text-blue-900">{data.totalRespondents}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-600 font-medium">Respondentes Completados</p>
                <p className="text-3xl font-bold text-green-900">{data.completedRespondents}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-600 font-medium">Pontuação Total</p>
                <p className="text-3xl font-bold text-purple-900">{data.assessment.totalScore.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detalhes por Grupo */}
        {groupsData.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Detalhes por Grupo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Grupo</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Departamento</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-700">Respondentes</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-700">Conformidade</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-700">Pontuação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupsData.map((group: any) => (
                      <tr key={group.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 font-medium text-slate-900">{group.groupName}</td>
                        <td className="py-3 px-4 text-slate-600">{group.departmentName}</td>
                        <td className="py-3 px-4 text-center text-slate-600">
                          {group.completedCount}/{group.respondentCount}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-bold text-slate-900">{group.compliancePercentage.toFixed(1)}%</span>
                        </td>
                        <td className="py-3 px-4 text-center text-slate-600">{group.totalScore.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ações */}
        {isAdmin && (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900">Ações do Administrador</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleDownloadPDF}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Relatório PDF
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
