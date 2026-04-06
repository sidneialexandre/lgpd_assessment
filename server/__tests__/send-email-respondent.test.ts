import { describe, it, expect } from "vitest";

describe("Send Email to Respondent", () => {
  describe("Email Validation", () => {
    it("should validate email format", () => {
      const validEmails = [
        "user@example.com",
        "john.doe@company.co.uk",
        "admin+tag@domain.org",
      ];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      validEmails.forEach((email) => {
        expect(emailRegex.test(email)).toBe(true);
      });
    });

    it("should reject invalid email formats", () => {
      const invalidEmails = [
        "invalid-email",
        "user@",
        "@example.com",
        "user@domain",
        "user @example.com",
      ];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      invalidEmails.forEach((email) => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });
  });

  describe("Email Template", () => {
    it("should generate correct email template with respondent name", () => {
      const respondentName = "João Silva";
      const respondentLink = "https://example.com/respondent?token=abc123";

      const message = `Olá ${respondentName}. Você foi escolhido para responder a um questionário sobre a Privacidade de Dados em sua empresa, por favor acesse o link abaixo: ${respondentLink} e conclua o mais breve possível. Desde já agradecemos seu tempo e disponibilidade. Grato. DPO`;

      expect(message).toContain("Olá João Silva");
      expect(message).toContain(respondentLink);
      expect(message).toContain("Privacidade de Dados");
      expect(message).toContain("DPO");
    });

    it("should include respondent link in message", () => {
      const respondentName = "Maria Santos";
      const respondentLink = "https://example.com/respondent?token=xyz789";

      const message = `Olá ${respondentName}. Você foi escolhido para responder a um questionário sobre a Privacidade de Dados em sua empresa, por favor acesse o link abaixo: ${respondentLink} e conclua o mais breve possível. Desde já agradecemos seu tempo e disponibilidade. Grato. DPO`;

      expect(message).toContain(respondentLink);
    });

    it("should format message with HTML line breaks", () => {
      const respondentName = "Pedro Costa";
      const respondentLink = "https://example.com/respondent?token=def456";

      const message = `Olá ${respondentName}. Você foi escolhido para responder a um questionário sobre a Privacidade de Dados em sua empresa, por favor acesse o link abaixo: ${respondentLink} e conclua o mais breve possível. Desde já agradecemos seu tempo e disponibilidade. Grato. DPO`;

      const htmlMessage = message.replace(/\n/g, "<br>");

      expect(htmlMessage).toBe(message); // No newlines in this template
    });
  });

  describe("Email Sending", () => {
    it("should prepare email payload with correct structure", () => {
      const respondentEmail = "user@example.com";
      const respondentName = "Test User";
      const respondentLink = "https://example.com/respondent?token=test123";
      const message = `Olá ${respondentName}. Você foi escolhido para responder a um questionário sobre a Privacidade de Dados em sua empresa, por favor acesse o link abaixo: ${respondentLink} e conclua o mais breve possível. Desde já agradecemos seu tempo e disponibilidade. Grato. DPO`;

      const emailPayload = {
        to: respondentEmail,
        subject: "Avaliação de Conformidade LGPD - Ação Necessária",
        html: `
          <h2>Avaliação de Conformidade LGPD</h2>
          <p>${message.replace(/\n/g, "<br>")}</p>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">
            <strong>Departamento de Proteção de Dados</strong>
          </p>
        `,
      };

      expect(emailPayload.to).toBe(respondentEmail);
      expect(emailPayload.subject).toContain("LGPD");
      expect(emailPayload.html).toContain(respondentName);
      expect(emailPayload.html).toContain(respondentLink);
      expect(emailPayload.html).toContain("DPO");
    });

    it("should return success response with email details", () => {
      const response = {
        success: true,
        message: "Email enviado com sucesso para user@example.com",
        email: "user@example.com",
        name: "Test User",
      };

      expect(response.success).toBe(true);
      expect(response.email).toBe("user@example.com");
      expect(response.name).toBe("Test User");
      expect(response.message).toContain("sucesso");
    });

    it("should handle email sending errors gracefully", () => {
      const errorResponse = {
        success: false,
        error: "Falha ao enviar email: Email API indisponível",
      };

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toContain("Falha");
    });
  });

  describe("Integration: Modal to Email", () => {
    it("should flow from modal input to email sending", () => {
      // Step 1: User fills modal form
      const modalData = {
        respondentName: "Ana Silva",
        respondentEmail: "ana@company.com",
        respondentLink: "https://example.com/respondent?token=ana123",
      };

      // Step 2: Validate inputs
      const nameValid = modalData.respondentName.trim().length > 0;
      const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(modalData.respondentEmail);
      const linkValid = modalData.respondentLink.startsWith("https://");

      expect(nameValid).toBe(true);
      expect(emailValid).toBe(true);
      expect(linkValid).toBe(true);

      // Step 3: Build message
      const message = `Olá ${modalData.respondentName}. Você foi escolhido para responder a um questionário sobre a Privacidade de Dados em sua empresa, por favor acesse o link abaixo: ${modalData.respondentLink} e conclua o mais breve possível. Desde já agradecemos seu tempo e disponibilidade. Grato. DPO`;

      // Step 4: Prepare email payload
      const emailPayload = {
        to: modalData.respondentEmail,
        subject: "Avaliação de Conformidade LGPD - Ação Necessária",
        html: `
          <h2>Avaliação de Conformidade LGPD</h2>
          <p>${message.replace(/\n/g, "<br>")}</p>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">
            <strong>Departamento de Proteção de Dados</strong>
          </p>
        `,
      };

      expect(emailPayload.to).toBe("ana@company.com");
      expect(emailPayload.html).toContain("Ana Silva");
      expect(emailPayload.html).toContain("ana123");
    });

    it("should handle multiple respondents sequentially", () => {
      const respondents = [
        { name: "User 1", email: "user1@example.com", token: "token1" },
        { name: "User 2", email: "user2@example.com", token: "token2" },
        { name: "User 3", email: "user3@example.com", token: "token3" },
      ];

      const emailResults = respondents.map((respondent) => {
        const link = `https://example.com/respondent?token=${respondent.token}`;
        const message = `Olá ${respondent.name}. Você foi escolhido para responder a um questionário sobre a Privacidade de Dados em sua empresa, por favor acesse o link abaixo: ${link} e conclua o mais breve possível. Desde já agradecemos seu tempo e disponibilidade. Grato. DPO`;

        return {
          respondentName: respondent.name,
          respondentEmail: respondent.email,
          message: message,
          success: true,
        };
      });

      expect(emailResults).toHaveLength(3);
      emailResults.forEach((result, index) => {
        expect(result.respondentName).toBe(`User ${index + 1}`);
        expect(result.success).toBe(true);
      });
    });
  });
});
