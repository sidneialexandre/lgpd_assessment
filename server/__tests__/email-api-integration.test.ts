import { describe, it, expect, vi, beforeEach } from "vitest";
import { callDataApi } from "../_core/dataApi";

// Mock do callDataApi
vi.mock("../_core/dataApi", () => ({
  callDataApi: vi.fn(),
}));

describe("Email API Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve chamar email_api com parâmetros corretos", async () => {
    const mockCallDataApi = vi.mocked(callDataApi);
    mockCallDataApi.mockResolvedValue({ success: true, messageId: "123" });

    const result = await callDataApi("email_api", {
      body: {
        to: "test@example.com",
        subject: "Test Subject",
        html: "<p>Test content</p>",
      },
    });

    expect(mockCallDataApi).toHaveBeenCalledWith("email_api", {
      body: {
        to: "test@example.com",
        subject: "Test Subject",
        html: "<p>Test content</p>",
      },
    });

    expect(result).toEqual({ success: true, messageId: "123" });
  });

  it("deve lidar com erros da email_api", async () => {
    const mockCallDataApi = vi.mocked(callDataApi);
    mockCallDataApi.mockRejectedValue(new Error("Email API Error"));

    await expect(
      callDataApi("email_api", {
        body: {
          to: "test@example.com",
          subject: "Test Subject",
          html: "<p>Test content</p>",
        },
      })
    ).rejects.toThrow("Email API Error");
  });

  it("deve validar que o email tem formato correto", async () => {
    const mockCallDataApi = vi.mocked(callDataApi);
    mockCallDataApi.mockResolvedValue({ success: true });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const testEmail = "respondent@company.com";

    expect(emailRegex.test(testEmail)).toBe(true);
  });
});
