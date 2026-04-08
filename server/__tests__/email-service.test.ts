import { describe, it, expect, beforeEach, vi } from "vitest";
import { sendEmail, sendEmailBatch } from "../_core/emailService";

// Mock do fetch global
global.fetch = vi.fn();

describe("Email Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BUILT_IN_FORGE_API_URL = "https://api.example.com";
    process.env.BUILT_IN_FORGE_API_KEY = "test-key";
  });

  describe("sendEmail", () => {
    it("deve enviar email com sucesso", async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({ success: true, messageId: "msg-123" }),
      } as Response);

      const result = await sendEmail({
        to: "test@example.com",
        subject: "Test Subject",
        html: "<p>Test content</p>",
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("msg-123");
      expect(mockFetch).toHaveBeenCalled();
      
      // Verificar que foi chamado com o endpoint correto
      const callArgs = mockFetch.mock.calls[0];
      const url = callArgs[0] as string;
      expect(url).toContain("webdevtoken.v1.WebDevService/SendEmail");
    });

    it("deve validar formato de email", async () => {
      const mockFetch = vi.mocked(global.fetch);

      const result = await sendEmail({
        to: "invalid-email",
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Email inválido");
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("deve lidar com erro da API", async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: async () => "Server error",
      } as Response);

      const result = await sendEmail({
        to: "test@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("deve incluir from e replyTo quando fornecidos", async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({ success: true }),
      } as Response);

      await sendEmail({
        to: "test@example.com",
        subject: "Test",
        html: "<p>Test</p>",
        from: "sender@example.com",
        replyTo: "reply@example.com",
      });

      expect(mockFetch).toHaveBeenCalled();
      const callArgs = mockFetch.mock.calls[0];
      const options = callArgs[1] as RequestInit;
      const body = JSON.parse(options.body as string);
      expect(body.from).toBe("sender@example.com");
      expect(body.replyTo).toBe("reply@example.com");
    });
  });

  describe("sendEmailBatch", () => {
    it("deve enviar emails em lote com sucesso", async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({ success: true, messageId: "msg-123" }),
      } as Response);

      const results = await sendEmailBatch(
        ["test1@example.com", "test2@example.com", "test3@example.com"],
        "Test",
        "<p>Test</p>"
      );

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.success)).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("deve lidar com falhas parciais em lote", async () => {
      const mockFetch = vi.mocked(global.fetch);

      // Primeira chamada: sucesso
      // Segunda chamada: falha
      // Terceira chamada: sucesso
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: "OK",
          json: async () => ({ success: true }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          statusText: "Bad Request",
          text: async () => "Invalid email",
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: "OK",
          json: async () => ({ success: true }),
        } as Response);

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
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({ success: true }),
      } as Response);

      const results = await sendEmailBatch(
        ["test1@example.com", "invalid-email", "test3@example.com"],
        "Test",
        "<p>Test</p>"
      );

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false); // Email inválido
      expect(results[2].success).toBe(true);
    });
  });
});
