import { Resend } from "resend";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Inicializar Resend
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Envia um email usando Resend
 * @param options Opções do email
 * @returns Resultado do envio
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  try {
    console.log("[EMAIL SERVICE] Iniciando envio de email para:", options.to);

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(options.to)) {
      throw new Error(`Email inválido: ${options.to}`);
    }

    // Validar configuração
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY não está configurado");
    }

    if (!resend) {
      throw new Error("Resend não foi inicializado corretamente");
    }

    // Preparar payload para Resend
    // Usar domínio de teste do Resend (onboarding.resend.dev) para desenvolvimento
    // Para produção, configure um domínio verificado e atualize este valor
    const payload = {
      from: options.from || "onboarding@resend.dev",
      to: options.to,
      subject: options.subject,
      html: options.html,
      ...(options.replyTo && { replyTo: options.replyTo }),
    };

    console.log("[EMAIL SERVICE] Enviando email via Resend para:", options.to);

    // Chamar Resend API
    const response = await resend.emails.send(payload);

    console.log("[EMAIL SERVICE] Resposta do Resend:", JSON.stringify(response, null, 2));

    if (response.error) {
      console.error("[EMAIL SERVICE] Erro do Resend:", response.error);
      throw new Error(`Resend Error: ${response.error.message}`);
    }

    if (!response.data?.id) {
      throw new Error("Resend não retornou um ID de mensagem");
    }

    console.log("[EMAIL SERVICE] Email enviado com sucesso para:", options.to, "ID:", response.data.id);
    console.log("[EMAIL SERVICE] Domínio de envio: onboarding@resend.dev (domínio de teste)");
    return {
      success: true,
      messageId: response.data.id,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[EMAIL SERVICE] Erro ao enviar email para", options.to, ":", errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Envia emails em lote para múltiplos destinatários
 * @param recipients Lista de destinatários
 * @param subject Assunto do email
 * @param html Conteúdo HTML do email
 * @returns Array com resultados de cada envio
 */
export async function sendEmailBatch(
  recipients: string[],
  subject: string,
  html: string
): Promise<EmailResult[]> {
  console.log("[EMAIL SERVICE] Iniciando envio em lote para", recipients.length, "destinatários");

  const results: EmailResult[] = [];

  for (const recipient of recipients) {
    const result = await sendEmail({
      to: recipient,
      subject,
      html,
    });
    results.push(result);
  }

  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.filter((r) => !r.success).length;

  console.log("[EMAIL SERVICE] Resumo do lote:", {
    total: results.length,
    sucesso: successCount,
    falha: failureCount,
  });

  return results;
}
