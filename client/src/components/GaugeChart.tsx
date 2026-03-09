import React from "react";

interface GaugeChartProps {
  value: number; // 0-100
  label: string;
  size?: "small" | "large";
  minThreshold?: number; // Mínimo aceitável (padrão 20)
  maxThreshold?: number; // Meta máxima (padrão 100)
}

/**
 * Componente de gráfico tipo relógio (gauge) para exibir conformidade LGPD
 * Escala: 0-100%
 * Meta: 100%
 * Mínimo: 20%
 */
export const GaugeChart: React.FC<GaugeChartProps> = ({
  value,
  label,
  size = "large",
  minThreshold = 20,
  maxThreshold = 100,
}) => {
  // Garantir que o valor está entre 0 e 100
  const normalizedValue = Math.max(0, Math.min(100, value));

  // Calcular o ângulo do ponteiro (0-180 graus)
  // 0% = -90 graus (esquerda), 100% = 90 graus (direita)
  const angle = (normalizedValue / 100) * 180 - 90;

  // Determinar a cor baseada no valor
  const getColor = () => {
    if (normalizedValue >= maxThreshold) return "#10b981"; // Verde - Meta atingida
    if (normalizedValue >= minThreshold) return "#f59e0b"; // Amarelo - Aceitável
    return "#ef4444"; // Vermelho - Abaixo do mínimo
  };

  const color = getColor();

  // Dimensões do SVG
  const isSmall = size === "small";
  const svgSize = isSmall ? 120 : 200;
  const radius = isSmall ? 50 : 80;
  const centerX = svgSize / 2;
  const centerY = svgSize / 2;

  // Calcular posição do ponteiro
  const pointerLength = isSmall ? 35 : 60;
  const pointerX = centerX + pointerLength * Math.cos((angle * Math.PI) / 180);
  const pointerY = centerY + pointerLength * Math.sin((angle * Math.PI) / 180);

  // Raio do círculo central do ponteiro
  const centerCircleRadius = isSmall ? 4 : 6;

  return (
    <div className={`flex flex-col items-center gap-2 ${isSmall ? "p-2" : "p-4"}`}>
      <svg
        width={svgSize}
        height={svgSize}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        className="drop-shadow-md"
      >
        {/* Fundo do gauge */}
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>

        {/* Arco de fundo (0-180 graus) */}
        <path
          d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
          stroke="#e5e7eb"
          strokeWidth={isSmall ? "8" : "12"}
          fill="none"
        />

        {/* Arco colorido com gradiente */}
        <path
          d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
          stroke="url(#gaugeGradient)"
          strokeWidth={isSmall ? "8" : "12"}
          fill="none"
          opacity="0.8"
        />

        {/* Marcas de escala */}
        {[0, 25, 50, 75, 100].map((mark) => {
          const markAngle = (mark / 100) * 180 - 90;
          const markX1 = centerX + (radius - (isSmall ? 6 : 10)) * Math.cos((markAngle * Math.PI) / 180);
          const markY1 = centerY + (radius - (isSmall ? 6 : 10)) * Math.sin((markAngle * Math.PI) / 180);
          const markX2 = centerX + radius * Math.cos((markAngle * Math.PI) / 180);
          const markY2 = centerY + radius * Math.sin((markAngle * Math.PI) / 180);

          return (
            <g key={mark}>
              <line
                x1={markX1}
                y1={markY1}
                x2={markX2}
                y2={markY2}
                stroke="#6b7280"
                strokeWidth={isSmall ? "1" : "2"}
              />
              <text
                x={centerX + (radius + (isSmall ? 12 : 20)) * Math.cos((markAngle * Math.PI) / 180)}
                y={centerY + (radius + (isSmall ? 12 : 20)) * Math.sin((markAngle * Math.PI) / 180)}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={isSmall ? "10" : "12"}
                fill="#374151"
                fontWeight="bold"
              >
                {mark}%
              </text>
            </g>
          );
        })}

        {/* Linha de mínimo (20%) */}
        {minThreshold !== undefined && (
          <line
            x1={centerX + (radius - (isSmall ? 8 : 12)) * Math.cos(((minThreshold / 100) * 180 - 90) * (Math.PI / 180))}
            y1={centerY + (radius - (isSmall ? 8 : 12)) * Math.sin(((minThreshold / 100) * 180 - 90) * (Math.PI / 180))}
            x2={centerX + (radius + (isSmall ? 4 : 6)) * Math.cos(((minThreshold / 100) * 180 - 90) * (Math.PI / 180))}
            y2={centerY + (radius + (isSmall ? 4 : 6)) * Math.sin(((minThreshold / 100) * 180 - 90) * (Math.PI / 180))}
            stroke="#ef4444"
            strokeWidth={isSmall ? "2" : "3"}
            strokeDasharray={isSmall ? "2,2" : "3,3"}
          />
        )}

        {/* Ponteiro */}
        <line
          x1={centerX}
          y1={centerY}
          x2={pointerX}
          y2={pointerY}
          stroke={color}
          strokeWidth={isSmall ? "3" : "4"}
          strokeLinecap="round"
        />

        {/* Círculo central do ponteiro */}
        <circle cx={centerX} cy={centerY} r={centerCircleRadius} fill={color} />

        {/* Círculo externo de borda */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke="#d1d5db"
          strokeWidth={isSmall ? "1" : "2"}
        />
      </svg>

      {/* Valor e label */}
      <div className="text-center">
        <p className={`font-bold ${isSmall ? "text-lg" : "text-3xl"}`} style={{ color }}>
          {normalizedValue.toFixed(1)}%
        </p>
        <p className={`text-gray-600 ${isSmall ? "text-xs" : "text-sm"}`}>{label}</p>
      </div>

      {/* Indicadores de status */}
      <div className={`flex gap-2 ${isSmall ? "text-xs" : "text-sm"}`}>
        {normalizedValue >= maxThreshold && (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full font-medium">
            ✓ Meta Atingida
          </span>
        )}
        {normalizedValue >= minThreshold && normalizedValue < maxThreshold && (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full font-medium">
            ⚠ Aceitável
          </span>
        )}
        {normalizedValue < minThreshold && (
          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full font-medium">
            ✗ Abaixo do Mínimo
          </span>
        )}
      </div>
    </div>
  );
};

export default GaugeChart;
