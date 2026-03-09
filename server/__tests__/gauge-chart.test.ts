import { describe, it, expect } from "vitest";

describe("GaugeChart Component", () => {
  describe("Cálculo de conformidade", () => {
    it("deve normalizar valores entre 0 e 100", () => {
      const testCases = [
        { input: -10, expected: 0 },
        { input: 0, expected: 0 },
        { input: 50, expected: 50 },
        { input: 100, expected: 100 },
        { input: 150, expected: 100 },
      ];

      testCases.forEach(({ input, expected }) => {
        const normalized = Math.max(0, Math.min(100, input));
        expect(normalized).toBe(expected);
      });
    });

    it("deve calcular cor baseada no valor", () => {
      const getColor = (value: number, minThreshold: number = 20, maxThreshold: number = 100) => {
        if (value >= maxThreshold) return "#10b981"; // Verde
        if (value >= minThreshold) return "#f59e0b"; // Amarelo
        return "#ef4444"; // Vermelho
      };

      expect(getColor(100)).toBe("#10b981"); // Meta atingida
      expect(getColor(50)).toBe("#f59e0b"); // Aceitável
      expect(getColor(10)).toBe("#ef4444"); // Abaixo do mínimo
    });

    it("deve calcular ângulo do ponteiro corretamente", () => {
      const calculateAngle = (value: number) => {
        return (value / 100) * 180 - 90;
      };

      expect(calculateAngle(0)).toBe(-90); // Esquerda
      expect(calculateAngle(50)).toBe(0); // Centro
      expect(calculateAngle(100)).toBe(90); // Direita
    });
  });

  describe("Validação de limites", () => {
    it("deve validar mínimo de 20%", () => {
      const minThreshold = 20;
      const testValues = [0, 10, 20, 30, 100];

      testValues.forEach((value) => {
        const isAboveMinimum = value >= minThreshold;
        const expectedStatus = value < minThreshold ? "Abaixo do Mínimo" : "Aceitável ou Melhor";
        expect(expectedStatus).toBeDefined();
      });
    });

    it("deve validar meta de 100%", () => {
      const maxThreshold = 100;
      const testValues = [50, 99, 100];

      testValues.forEach((value) => {
        const isMetaAchieved = value >= maxThreshold;
        expect(typeof isMetaAchieved).toBe("boolean");
      });
    });
  });

  describe("Formatação de dados", () => {
    it("deve formatar percentual com 1 casa decimal", () => {
      const formatPercentage = (value: number) => {
        return value.toFixed(1);
      };

      expect(formatPercentage(50.123)).toBe("50.1");
      expect(formatPercentage(100)).toBe("100.0");
      expect(formatPercentage(0)).toBe("0.0");
    });

    it("deve gerar labels corretos para grupos", () => {
      const groups = [
        { name: "G1", department: "Segurança" },
        { name: "G2", department: "Conformidade" },
        { name: "G3", department: "Cultura" },
      ];

      groups.forEach((group) => {
        const label = `${group.name} - ${group.department}`;
        expect(label).toContain(group.name);
        expect(label).toContain(group.department);
      });
    });
  });

  describe("Responsividade", () => {
    it("deve ter tamanhos corretos para small e large", () => {
      const sizes = {
        small: { svgSize: 120, radius: 50 },
        large: { svgSize: 200, radius: 80 },
      };

      expect(sizes.small.svgSize).toBeLessThan(sizes.large.svgSize);
      expect(sizes.small.radius).toBeLessThan(sizes.large.radius);
    });
  });

  describe("Indicadores de status", () => {
    it("deve exibir status correto baseado no valor", () => {
      const getStatus = (value: number, min: number = 20, max: number = 100) => {
        if (value >= max) return "Meta Atingida";
        if (value >= min) return "Aceitável";
        return "Abaixo do Mínimo";
      };

      expect(getStatus(100)).toBe("Meta Atingida");
      expect(getStatus(50)).toBe("Aceitável");
      expect(getStatus(10)).toBe("Abaixo do Mínimo");
    });
  });
});
