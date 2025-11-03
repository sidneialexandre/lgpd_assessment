import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import Assessment from "./Assessment";

export default function RespondentAccess() {
  const [location, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("token");
    if (accessToken) {
      setToken(accessToken);
    } else {
      setError("Token de acesso não fornecido.");
    }
  }, []);

  const getSessionQuery = trpc.respondent.getByToken.useQuery(
    { accessToken: token || "" },
    { enabled: !!token }
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <Card className="w-full max-w-md border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900">Erro de Acesso</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-800 mb-4">{error}</p>
            <Button
              onClick={() => setLocation("/")}
              className="w-full"
            >
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (getSessionQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Validando acesso...</p>
        </div>
      </div>
    );
  }

  if (getSessionQuery.isError || !getSessionQuery.data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <Card className="w-full max-w-md border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900">Token Inválido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-800 mb-4">
              O token de acesso fornecido é inválido ou expirou.
            </p>
            <Button
              onClick={() => setLocation("/")}
              className="w-full"
            >
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const session = getSessionQuery.data;

  if (session.isCompleted === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <Card className="w-full max-w-md border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Avaliação Já Completada</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-800 mb-4">
              Você já completou esta avaliação. Obrigado por sua participação!
            </p>
            <Button
              onClick={() => setLocation("/")}
              className="w-full"
            >
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Redirect to Assessment with token in query params
  window.location.href = `/assessment?token=${token}`;
  return null;
}

