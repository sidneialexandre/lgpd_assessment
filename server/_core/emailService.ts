import { notifyOwner } from "./notification";

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

/**
 * Envia uma notificação ao admin em vez de email direto
 * Como a Manus não oferece Email API nativa, usamos o sistema de notificações
 * que já funciona através do notifyOwner
 * 
 * @param options Opções do email
 * @returns Resultado do envio
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  try {
    console.log("[EMAIL SERVICE] Iniciando notificação para:", options.to);

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(options.to)) {
      throw new Error(`Email inválido: ${options.to}`);
    }

    // Extrair conteúdo de texto do HTML para a notificação
    const textContent = options.html
      .replace(/<[^>]*>/g, " ") // Remove tags HTML
      .replace(/\s+/g, " ") // Normaliza espaços
      .trim();

    // Enviar notificação ao admin
    const delivered = await notifyOwner({
      title: `Email para ${options.to}: ${options.subject}`,
      content: `Destinatário: ${options.to}\n\nAssunto: ${options.subject}\n\nConteúdo:\n${textContent}`,
    });

    if (!delivered) {
      console.warn("[EMAIL SERVICE] Notificação não foi entregue ao admin");
      return {
        success: false,
        error: "Notificação não pôde ser entregue ao admin",
      };
    }

    console.log("[EMAIL SERVICE] Notificação enviada com sucesso para admin sobre email para:", options.to);
    return {
      success: true,
      messageId: `notification-${Date.now()}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[EMAIL SERVICE] Erro ao enviar notificação para", options.to, ":", errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Envia notificações em lote para múltiplos destinatários
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
