/**
 * Response Validator Middleware
 * 
 * Garante que todas as respostas tRPC são JSON válido e não contêm HTML.
 * Previne erros "Unexpected token '<'" no cliente.
 */

import { TRPCError } from "@trpc/server";

export function validateJsonResponse() {
  return async (opts: any) => {
    try {
      const result = await opts.next();
      
      // Validar que o resultado é serializável para JSON
      try {
        JSON.stringify(result);
      } catch (error) {
        console.error("[Response Validator] Resultado não é JSON serializável:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Resposta do servidor não é válida",
        });
      }

      // Validar que o resultado não contém HTML
      const jsonStr = JSON.stringify(result);
      if (jsonStr.includes("<!doctype") || jsonStr.includes("<html") || jsonStr.includes("<body")) {
        console.error("[Response Validator] Resposta contém HTML:", jsonStr.substring(0, 100));
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Resposta do servidor contém HTML inválido",
        });
      }

      return result;
    } catch (error) {
      // Se for um erro tRPC, deixar passar
      if (error instanceof TRPCError) {
        throw error;
      }

      // Converter outros erros para tRPC errors
      console.error("[Response Validator] Erro ao processar resposta:", error);
      
      const message = error instanceof Error ? error.message : String(error);
      
      // Validar que a mensagem de erro não é HTML
      if (message.includes("<!doctype") || message.includes("<html")) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro interno do servidor",
        });
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: message || "Erro desconhecido",
      });
    }
  };
}

/**
 * Middleware para logar respostas em desenvolvimento
 */
export function logResponse() {
  return async (opts: any) => {
    const startTime = Date.now();
    const path = opts.path || "unknown";
    
    try {
      const result = await opts.next();
      const duration = Date.now() - startTime;
      
      console.log(`[tRPC] ${path} - ${duration}ms - OK`);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      console.error(`[tRPC] ${path} - ${duration}ms - ERROR: ${errorMessage}`);
      
      throw error;
    }
  };
}
