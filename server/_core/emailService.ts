import { callDataApi } from "./dataApi";

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
 * Envia um email usando a Manus email_api
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

    // Preparar payload para a email_api
    const payload = {
      to: options.to,
      subject: options.subject,
      html: options.html,
      ...(options.from && { from: options.from }),
      ...(options.replyTo && { replyTo: options.replyTo }),
    };

    console.log("[EMAIL SERVICE] Payload preparado:", JSON.stringify(payload, null, 2));

    // Chamar email_api do Manus
    const result = await callDataApi("email_api", {
      body: payload,
    });

    console.log("[EMAIL SERVICE] Resposta da email_api:", JSON.stringify(result, null, 2));

    // Verificar se o envio foi bem-sucedido
    if (result && typeof result === "object") {
      const resultObj = result as Record<string, unknown>;
      
      if (resultObj.success === true || resultObj.messageId) {
        console.log("[EMAIL SERVICE] Email enviado com sucesso para:", options.to);
        return {
          success: true,
          messageId: resultObj.messageId as string | undefined,
        };
      }
      
      if (resultObj.error) {
        throw new Error(`Email API Error: ${resultObj.error}`);
      }
    }

    // Se chegou aqui, considerar como sucesso (a API pode não retornar success explicitamente)
    console.log("[EMAIL SERVICE] Email enviado (resposta ambígua) para:", options.to);
    return {
      success: true,
      messageId: (result as Record<string, unknown>)?.messageId as string | undefined,
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
