import { describe, it, expect, beforeEach, vi } from "vitest";
import { sendEmail, sendEmailBatch } from "../_core/emailService";
import * as notification from "../_core/notification";

// Mock do notifyOwner
vi.mock("../_core/notification", () => ({
  notifyOwner: vi.fn(),
}));

describe("Email Service (usando Notificações)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sendEmail", () => {
    it("deve enviar notificação com sucesso", async () => {
      const mockNotifyOwner = vi.mocked(notification.notifyOwner);
      mockNotifyOwner.mockResolvedValue(true);

      const result = await sendEmail({
        to: "test@example.com",
        subject: "Test Subject",
        html: "<p>Test content</p>",
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(mockNotifyOwner).toHaveBeenCalled();
      
      // Verificar que foi chamado com dados corretos
      const callArgs = mockNotifyOwner.mock.calls[0];
      const payload = callArgs[0];
      expect(payload.title).toContain("test@example.com");
      expect(payload.title).toContain("Test Subject");
    });

    it("deve validar formato de email", async () => {
      const mockNotifyOwner = vi.mocked(notification.notifyOwner);

      const result = await sendEmail({
        to: "invalid-email",
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Email inválido");
      expect(mockNotifyOwner).not.toHaveBeenCalled();
    });

    it("deve lidar com falha ao enviar notificação", async () => {
      const mockNotifyOwner = vi.mocked(notification.notifyOwner);
      mockNotifyOwner.mockResolvedValue(false);

      const result = await sendEmail({
        to: "test@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("não pôde ser entregue");
    });

    it("deve incluir from e replyTo na notificação quando fornecidos", async () => {
      const mockNotifyOwner = vi.mocked(notification.notifyOwner);
      mockNotifyOwner.mockResolvedValue(true);

      await sendEmail({
        to: "test@example.com",
        subject: "Test",
        html: "<p>Test</p>",
        from: "sender@example.com",
        replyTo: "reply@example.com",
      });

      expect(mockNotifyOwner).toHaveBeenCalled();
      const callArgs = mockNotifyOwner.mock.calls[0];
      const payload = callArgs[0];
      expect(payload.content).toContain("test@example.com");
    });
  });

  describe("sendEmailBatch", () => {
    it("deve enviar notificações em lote com sucesso", async () => {
      const mockNotifyOwner = vi.mocked(notification.notifyOwner);
      mockNotifyOwner.mockResolvedValue(true);

      const results = await sendEmailBatch(
        ["test1@example.com", "test2@example.com", "test3@example.com"],
        "Test",
        "<p>Test</p>"
      );

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.success)).toBe(true);
      expect(mockNotifyOwner).toHaveBeenCalledTimes(3);
    });

    it("deve lidar com falhas parciais em lote", async () => {
      const mockNotifyOwner = vi.mocked(notification.notifyOwner);

      // Primeira chamada: sucesso
      // Segunda chamada: falha
      // Terceira chamada: sucesso
      mockNotifyOwner
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const results = await sendEmailBatch(
        ["test1@example.com", "test2@example.com", "test3@example.com"],
        "Test",
        "<p>Test</p>"
      );

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
    });

    it("deve validar cada email no lote", async () => {
      const mockNotifyOwner = vi.mocked(notification.notifyOwner);
      mockNotifyOwner.mockResolvedValue(true);

      const results = await sendEmailBatch(
        ["test1@example.com", "invalid-email", "test3@example.com"],
        "Test",
        "<p>Test</p>"
      );

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false); // Email inválido
      expect(results[2].success).toBe(true);
      // Apenas 2 notificações devem ser enviadas (emails válidos)
      expect(mockNotifyOwner).toHaveBeenCalledTimes(2);
    });
  });
});
