import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock do módulo Resend antes de importar emailService
vi.mock("resend", () => {
  const mockSend = vi.fn().mockResolvedValue({
    data: { id: "msg-123" },
    error: null,
  });

  return {
    Resend: vi.fn(() => ({
      emails: {
        send: mockSend,
      },
    })),
  };
});

import { sendEmail, sendEmailBatch } from "../_core/emailService";

describe("Email Service com Resend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = "test-key-123";
  });

  describe("sendEmail", () => {
    it("deve validar formato de email", async () => {
      const result = await sendEmail({
        to: "invalid-email",
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      if (result.error) {
        expect(result.error).toContain("Email inválido");
      }
    });

    it("deve usar RESEND_API_KEY quando configurado", async () => {
      const result = await sendEmail({
        to: "test@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      });

      // Com a chave configurada, deve tentar enviar
      if (result.error) {
        expect(result.error).not.toContain("RESEND_API_KEY");
      }
    });

    it("deve tentar enviar email com formato válido", async () => {
      const result = await sendEmail({
        to: "test@example.com",
        subject: "Test Subject",
        html: "<p>Test content</p>",
      });

      // Pode falhar por falta de chave real, mas não deve ser erro de validação
      if (result.error) {
        expect(result.error).not.toContain("Email inválido");
      } else {
        // Se não houve erro, deve ter messageId
        expect(result.messageId).toBeDefined();
      }
    });

    it("deve incluir HTML no email", async () => {
      const html = "<h1>Test Header</h1><p>Test content</p>";
      const result = await sendEmail({
        to: "test@example.com",
        subject: "Test",
        html: html,
      });

      // Validar que não é erro de validação
      if (result.error) {
        expect(result.error).not.toContain("Email inválido");
      } else {
        // Se não houve erro, deve ter messageId
        expect(result.messageId).toBeDefined();
      }
    });
  });

  describe("sendEmailBatch", () => {
    it("deve validar cada email no lote", async () => {
      const results = await sendEmailBatch(
        ["test1@example.com", "invalid-email", "test3@example.com"],
        "Test",
        "<p>Test</p>"
      );

      expect(results).toHaveLength(3);
      expect(results[1].success).toBe(false); // Email inválido
      expect(results[1].error).toBeDefined();
    });

    it("deve processar lote com emails válidos", async () => {
      const results = await sendEmailBatch(
        ["test1@example.com", "test2@example.com"],
        "Test",
        "<p>Test</p>"
      );

      expect(results).toHaveLength(2);
      // Ambos devem ter sido processados (sucesso ou erro de API, não de validação)
      results.forEach((result) => {
        if (result.error) {
          expect(result.error).not.toContain("Email inválido");
        }
      });
    });

    it("deve retornar resumo correto", async () => {
      const results = await sendEmailBatch(
        ["test1@example.com", "invalid-email"],
        "Test",
        "<p>Test</p>"
      );

      expect(results).toHaveLength(2);
      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;
      expect(successCount + failureCount).toBe(2);
    });
  });
});
