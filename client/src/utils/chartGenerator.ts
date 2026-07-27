import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface GroupData {
  groupName: string;
  departmentName: string;
  totalScore?: number;
  compliancePercentage?: number;
}

/**
 * Gera um gráfico de barras com pontuação por departamento
 */
export async function generateScoreChart(groups: GroupData[]): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 400;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: groups.map(g => g.departmentName),
      datasets: [
        {
          label: 'Pontuação Total',
          data: groups.map(g => g.totalScore),
          backgroundColor: '#3b82f6',
          borderColor: '#1e40af',
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      indexAxis: 'x',
      plugins: {
        legend: {
          display: true,
          position: 'top',
        },
        title: {
          display: true,
          text: 'Pontuação Total por Departamento',
          font: { size: 16, weight: 'bold' },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 20000,
        },
      },
    },
  });

  // Aguardar renderização
  await new Promise(resolve => setTimeout(resolve, 500));

  return canvas.toDataURL('image/png');
}

/**
 * Gera um gráfico de pizza com percentual de conformidade por departamento
 */
export async function generateComplianceChart(groups: GroupData[]): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 400;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
  ];

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: groups.map(g => g.departmentName),
      datasets: [
        {
          data: groups.map(g => g.compliancePercentage),
          backgroundColor: colors.slice(0, groups.length),
          borderColor: '#fff',
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'right',
        },
        title: {
          display: true,
          text: 'Conformidade por Departamento (%)',
          font: { size: 16, weight: 'bold' },
        },
      },
    },
  });

  // Aguardar renderização
  await new Promise(resolve => setTimeout(resolve, 500));

  return canvas.toDataURL('image/png');
}
