import { describe, it, expect, beforeEach, vi } from "vitest";
import { sendEmail, sendEmailBatch } from "../_core/emailService";
import * as dataApi from "../_core/dataApi";

// Mock do callDataApi
vi.mock("../_core/dataApi", () => ({
  callDataApi: vi.fn(),
}));

describe("Email Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BUILT_IN_FORGE_API_URL = "https://api.example.com";
    process.env.BUILT_IN_FORGE_API_KEY = "test-key";
  });

  describe("sendEmail", () => {
    it("deve enviar email com sucesso", async () => {
      const mockCallDataApi = vi.mocked(dataApi.callDataApi);
      mockCallDataApi.mockResolvedValue({ success: true, messageId: "msg-123" });

      const result = await sendEmail({
        to: "test@example.com",
        subject: "Test Subject",
        html: "<p>Test content</p>",
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("msg-123");
      expect(mockCallDataApi).toHaveBeenCalledWith("Email/send", {
        body: {
          to: "test@example.com",
          subject: "Test Subject",
          html: "<p>Test content</p>",
        },
      });
    });

    it("deve validar formato de email", async () => {
      const mockCallDataApi = vi.mocked(dataApi.callDataApi);

      const result = await sendEmail({
        to: "invalid-email",
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Email inválido");
      expect(mockCallDataApi).not.toHaveBeenCalled();
    });

    it("deve lidar com erro da API", async () => {
      const mockCallDataApi = vi.mocked(dataApi.callDataApi);
      mockCallDataApi.mockRejectedValue(new Error("Data API request failed (404 Not Found)"));

      const result = await sendEmail({
        to: "test@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("deve incluir from e replyTo quando fornecidos", async () => {
      const mockCallDataApi = vi.mocked(dataApi.callDataApi);
      mockCallDataApi.mockResolvedValue({ success: true });

      await sendEmail({
        to: "test@example.com",
        subject: "Test",
        html: "<p>Test</p>",
        from: "sender@example.com",
        replyTo: "reply@example.com",
      });

      expect(mockCallDataApi).toHaveBeenCalled();
      const callArgs = mockCallDataApi.mock.calls[0];
      const options = callArgs[1] as Record<string, unknown>;
      const body = options.body as Record<string, unknown>;
      expect(body.from).toBe("sender@example.com");
      expect(body.replyTo).toBe("reply@example.com");
    });
  });

  describe("sendEmailBatch", () => {
    it("deve enviar emails em lote com sucesso", async () => {
      const mockCallDataApi = vi.mocked(dataApi.callDataApi);
      mockCallDataApi.mockResolvedValue({ success: true, messageId: "msg-123" });

      const results = await sendEmailBatch(
        ["test1@example.com", "test2@example.com", "test3@example.com"],
        "Test",
        "<p>Test</p>"
      );

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.success)).toBe(true);
      expect(mockCallDataApi).toHaveBeenCalledTimes(3);
    });

    it("deve lidar com falhas parciais em lote", async () => {
      const mockCallDataApi = vi.mocked(dataApi.callDataApi);
      
      // Primeira chamada: sucesso
      // Segunda chamada: falha
      // Terceira chamada: sucesso
      mockCallDataApi
        .mockResolvedValueOnce({ success: true })
        .mockRejectedValueOnce(new Error("API Error"))
        .mockResolvedValueOnce({ success: true });

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
      const mockCallDataApi = vi.mocked(dataApi.callDataApi);
      mockCallDataApi.mockResolvedValue({ success: true });

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
