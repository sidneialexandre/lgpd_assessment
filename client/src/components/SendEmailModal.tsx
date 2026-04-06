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

    // Construir mensagem personalizada
    const message = `Olá ${name}. Você foi escolhido para responder a um questionário sobre a Privacidade de Dados em sua empresa, por favor acesse o link abaixo: ${respondentLink} e conclua o mais breve possível. Desde já agradecemos seu tempo e disponibilidade. Grato. DPO`;

    try {
      await sendEmailMutation.mutateAsync({
        respondentEmail: email,
        respondentName: name,
        respondentLink: respondentLink,
        message: message,
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
                Olá {name || "[Nome]"}. Você foi escolhido para responder a um questionário sobre a Privacidade de Dados em sua empresa, por favor acesse o link abaixo: <br />
                <span className="text-blue-600 break-all">{respondentLink}</span>
                <br />
                e conclua o mais breve possível. Desde já agradecemos seu tempo e disponibilidade. Grato. DPO
              </p>
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
