import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Mail, X } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  respondentName: string;
  respondentEmail: string;
  respondentLink: string;
  onSuccess?: () => void;
}

export function SendEmailModal({
  isOpen,
  onClose,
  respondentName,
  respondentEmail,
  respondentLink,
  onSuccess,
}: SendEmailModalProps) {
  const [name, setName] = useState(respondentName);
  const [email, setEmail] = useState(respondentEmail);
  const [isSending, setIsSending] = useState(false);

  const sendEmailMutation = trpc.respondent.sendEmailToRespondent.useMutation({
    onSuccess: () => {
      alert("Email enviado com sucesso!");
      setIsSending(false);
      onClose();
      onSuccess?.();
    },
    onError: (error) => {
      alert(`Erro ao enviar email: ${error.message}`);
      setIsSending(false);
    },
  });

  const handleSendEmail = async () => {
    if (!name.trim()) {
      alert("Por favor, informe o nome do respondente");
      return;
    }

    if (!email.trim()) {
      alert("Por favor, informe o email do respondente");
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Por favor, informe um email válido");
      return;
    }

    setIsSending(true);

    // Construir mensagem personalizada com HTML profissional
    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Avaliação de Conformidade LGPD</h1>
          <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Lei Geral de Proteção de Dados</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
          <p style="font-size: 16px; margin: 0 0 20px 0;">Olá <strong>${name}</strong>,</p>
          
          <p style="font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;">
            Você foi selecionado para participar de uma <strong>avaliação de conformidade com a Lei Geral de Proteção de Dados (LGPD)</strong>.
          </p>
          
          <p style="font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;">
            Esta avaliação é fundamental para identificar o nível de conformidade da organização com as regulamentações de proteção de dados e visa fortalecer a cultura de privacidade e segurança da informação em sua empresa.
          </p>
          
          <p style="font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
            <strong>Tempo estimado:</strong> 15-20 minutos<br>
            <strong>Questões:</strong> 50 questões divididas em 3 pilares estratégicos
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${respondentLink}" style="display: inline-block; background: #667eea; color: white; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; transition: background 0.3s;">Acessar Avaliação</a>
          </div>
          
          <p style="font-size: 13px; color: #666; margin: 20px 0; padding: 15px; background: #f0f0f0; border-left: 4px solid #667eea; border-radius: 4px;">
            <strong>Ou copie este link:</strong><br>
            <code style="word-break: break-all; font-size: 12px;">${respondentLink}</code>
          </p>
          
          <p style="font-size: 14px; line-height: 1.6; margin: 20px 0 0 0; color: #555;">
            Sua participação é essencial para o sucesso desta avaliação. Agradecemos antecipadamente pelo tempo e dedicação.
          </p>
        </div>
        
        <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666; border: 1px solid #e0e0e0; border-top: none;">
          <p style="margin: 0 0 8px 0;"><strong>Departamento de Proteção de Dados</strong></p>
          <p style="margin: 0;">Proteção de Dados e Privacidade</p>
        </div>
      </div>
    `;

    try {
      await sendEmailMutation.mutateAsync({
        respondentEmail: email,
        respondentName: name,
        respondentLink: respondentLink,
        message: message.trim(),
      });
    } catch (error) {
      console.error("[SEND EMAIL] Erro:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Enviar Email para Respondente
            </CardTitle>
            <CardDescription>Informe os dados e envie o link de acesso</CardDescription>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nome */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Nome do Respondente
            </label>
            <Input
              placeholder="Ex: João Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSending}
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Email do Respondente
            </label>
            <Input
              type="email"
              placeholder="Ex: joao@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSending}
            />
          </div>

          {/* Preview da Mensagem */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Prévia da Mensagem
            </label>
            <div className="bg-gray-50 p-3 rounded border border-gray-200 text-xs text-gray-700 max-h-32 overflow-y-auto">
              <p>
                <strong>Prévia do Email:</strong> Será enviado um email profissional com:
              </p>
              <ul style={{marginLeft: '16px', marginTop: '8px'}}>
                <li>Cabeçalho visual com branding LGPD</li>
                <li>Mensagem personalizada para {name || "[Nome]"}</li>
                <li>Informações sobre tempo estimado (15-20 minutos)</li>
                <li>Botão destacado para acessar a avaliação</li>
                <li>Link direto para cópia</li>
                <li>Rodapé profissional</li>
              </ul>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSending}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={isSending}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isSending ? "Enviando..." : "Enviar Email"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
