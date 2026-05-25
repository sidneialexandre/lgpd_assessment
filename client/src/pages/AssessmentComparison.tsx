import { useParams, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowUp, ArrowDown, TrendingUp, Download, FileJson } from 'lucide-react';
import { useExportData } from '@/hooks/useExportData';

export default function AssessmentComparison() {
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [selectedAssessment1, setSelectedAssessment1] = useState<number | null>(null);
  const [selectedAssessment2, setSelectedAssessment2] = useState<number | null>(null);
  const { exportToCSV, exportToJSON } = useExportData();

  // Get assessment history for the company
  const historyQuery = trpc.assessment.getAssessmentHistory.useQuery(
    { companyId: companyId || 0 },
    { enabled: !!companyId }
  );

  // Get comparison data
  const comparisonQuery = trpc.assessment.compareAssessments.useQuery(
    { 
      companyId: companyId || 0,
      assessmentId1: selectedAssessment1 || 0,
      assessmentId2: selectedAssessment2 || 0,
    },
    { enabled: !!selectedAssessment1 && !!selectedAssessment2 }
  );

  const assessments = historyQuery.data || [];

  // Prepare chart data
  const chartData = assessments.map((a) => ({
    name: `Ciclo ${a.assessmentNumber}`,
    conformidade: parseFloat((a.compliancePercentage || 0).toString()),
    pontuacao: a.totalScore || 0,
    data: new Date(a.createdAt).toLocaleDateString('pt-BR'),
  }));

  const comparisonData = comparisonQuery.data;
  const improvement = comparisonData?.improvement;

  const getImprovementColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const handleExportCSV = () => {
    if (!comparisonData) return;

    const exportData = [
      {
        'Métrica': 'Conformidade (%)',
        'Ciclo 1': (comparisonData.assessment1.compliancePercentage || 0).toFixed(2),
        'Ciclo 2': (comparisonData.assessment2.compliancePercentage || 0).toFixed(2),
        'Mudança': (improvement?.complianceChange || 0).toFixed(2),
      },
      {
        'Métrica': 'Pontuação Total',
        'Ciclo 1': comparisonData.assessment1.totalScore,
        'Ciclo 2': comparisonData.assessment2.totalScore,
        'Mudança': improvement?.scoreChange || 0,
      },
    ];

    exportToCSV(exportData, `comparacao-ciclos-${companyId}`);
  };

  const handleExportJSON = () => {
    if (!comparisonData) return;

    const exportData = {
      companyId,
      assessment1: {
        id: comparisonData.assessment1.id,
        ciclo: comparisonData.assessment1.assessmentNumber,
        data: new Date(comparisonData.assessment1.createdAt).toLocaleDateString('pt-BR'),
        conformidade: (comparisonData.assessment1.compliancePercentage || 0).toFixed(2),
        pontuacao: comparisonData.assessment1.totalScore,
      },
      assessment2: {
        id: comparisonData.assessment2.id,
        ciclo: comparisonData.assessment2.assessmentNumber,
        data: new Date(comparisonData.assessment2.createdAt).toLocaleDateString('pt-BR'),
        conformidade: (comparisonData.assessment2.compliancePercentage || 0).toFixed(2),
        pontuacao: comparisonData.assessment2.totalScore,
      },
      improvement: {
        conformidade: (improvement?.complianceChange || 0).toFixed(2),
        pontuacao: improvement?.scoreChange || 0,
      },
    };

    exportToJSON(exportData, `comparacao-ciclos-${companyId}`);
  };

  const getImprovementIcon = (value: number) => {
    if (value > 0) return <ArrowUp className="w-4 h-4 inline mr-1" />;
    if (value < 0) return <ArrowDown className="w-4 h-4 inline mr-1" />;
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Comparação de Ciclos de Avaliação</h1>
          <p className="text-gray-600">Acompanhe a evolução da conformidade LGPD ao longo do tempo</p>
        </div>

        {/* Company Selection */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Selecione a Empresa</h2>
          <div className="flex gap-4">
            <input
              type="number"
              placeholder="ID da Empresa"
              value={companyId || ''}
              onChange={(e) => setCompanyId(e.target.value ? parseInt(e.target.value) : null)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button onClick={() => historyQuery.refetch()}>Carregar Histórico</Button>
          </div>
        </Card>

        {/* Assessment Selection */}
        {assessments.length > 0 && (
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Selecione os Ciclos para Comparação</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ciclo 1</label>
                <Select value={selectedAssessment1?.toString() || ''} onValueChange={(v) => setSelectedAssessment1(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um ciclo" />
                  </SelectTrigger>
                  <SelectContent>
                    {assessments.map((a) => (
                      <SelectItem key={a.id} value={a.id.toString()}>
                        Ciclo {a.assessmentNumber} - {new Date(a.createdAt).toLocaleDateString('pt-BR')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ciclo 2</label>
                <Select value={selectedAssessment2?.toString() || ''} onValueChange={(v) => setSelectedAssessment2(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um ciclo" />
                  </SelectTrigger>
                  <SelectContent>
                    {assessments.map((a) => (
                      <SelectItem key={a.id} value={a.id.toString()}>
                        Ciclo {a.assessmentNumber} - {new Date(a.createdAt).toLocaleDateString('pt-BR')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        )}

        {/* Comparison Results */}
        {comparisonData && (
          <>
            {/* Improvement Indicators */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <Card className="p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Mudança na Conformidade</h3>
                <div className={`text-3xl font-bold ${getImprovementColor(improvement?.complianceChange || 0)}`}>
                {getImprovementIcon(improvement?.complianceChange || 0)}
                {(typeof improvement?.complianceChange === 'number' ? improvement.complianceChange : 0).toFixed(2)}%
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {improvement?.complianceChange && improvement.complianceChange > 0
                    ? 'Melhoria detectada'
                    : improvement?.complianceChange && improvement.complianceChange < 0
                    ? 'Redução detectada'
                    : 'Sem mudanças'}
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Mudança na Pontuação</h3>
                <div className={`text-3xl font-bold ${getImprovementColor(improvement?.scoreChange || 0)}`}>
                {getImprovementIcon(improvement?.scoreChange || 0)}
                {(typeof improvement?.scoreChange === 'number' ? improvement.scoreChange : 0).toFixed(0)} pts
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Ciclo 1: {comparisonData.assessment1.totalScore} pts | Ciclo 2: {comparisonData.assessment2.totalScore} pts
                </p>
              </Card>
            </div>

            {/* Comparison Table */}
            <Card className="p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Comparação Detalhada</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Métrica</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Ciclo {comparisonData.assessment1.assessmentNumber}</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Ciclo {comparisonData.assessment2.assessmentNumber}</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Mudança</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-700">Conformidade (%)</td>
                      <td className="text-center py-3 px-4">{(comparisonData.assessment1.compliancePercentage || 0).toFixed(2)}%</td>
                      <td className="text-center py-3 px-4">{(comparisonData.assessment2.compliancePercentage || 0).toFixed(2)}%</td>
                      <td className={`text-center py-3 px-4 font-semibold ${getImprovementColor(improvement?.complianceChange || 0)}`}>
                        {getImprovementIcon(improvement?.complianceChange || 0)}
                        {(improvement?.complianceChange || 0).toFixed(2)}%
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-700">Pontuação Total</td>
                      <td className="text-center py-3 px-4">{comparisonData.assessment1.totalScore}</td>
                      <td className="text-center py-3 px-4">{comparisonData.assessment2.totalScore}</td>
                      <td className={`text-center py-3 px-4 font-semibold ${getImprovementColor(improvement?.scoreChange || 0)}`}>
                        {getImprovementIcon(improvement?.scoreChange || 0)}
                        {(improvement?.scoreChange || 0).toFixed(0)} pts
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-700">Data da Avaliação</td>
                      <td className="text-center py-3 px-4">{new Date(comparisonData.assessment1.createdAt).toLocaleDateString('pt-BR')}</td>
                      <td className="text-center py-3 px-4">{new Date(comparisonData.assessment2.createdAt).toLocaleDateString('pt-BR')}</td>
                      <td className="text-center py-3 px-4">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

          {/* Export Buttons */}
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Exportar Dados</h3>
            <div className="flex gap-4 flex-wrap">
              <Button
                onClick={handleExportCSV}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar como CSV
              </Button>
              <Button
                onClick={handleExportJSON}
                variant="outline"
                className="flex items-center gap-2"
              >
                <FileJson className="w-4 h-4" />
                Exportar como JSON
              </Button>
            </div>
          </Card>
          </>
        )}

        {/* Compliance Evolution Chart */}
        {chartData.length > 1 && (
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Evolução da Conformidade</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="conformidade"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Conformidade (%)"
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Score Comparison Chart */}
        {chartData.length > 1 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Evolução da Pontuação</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="pontuacao" fill="#10b981" name="Pontuação Total" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* No Data Message */}
        {!historyQuery.data && !historyQuery.isLoading && (
          <Card className="p-12 text-center">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Selecione uma empresa para visualizar o histórico de avaliações</p>
          </Card>
        )}

        {historyQuery.isLoading && (
          <Card className="p-12 text-center">
            <p className="text-gray-600">Carregando histórico...</p>
          </Card>
        )}
      </div>
    </div>
  );
}
