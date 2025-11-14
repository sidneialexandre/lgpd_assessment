import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function RespondentAccess() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("token");
    
    if (accessToken) {
      // Redirect directly to assessment with token
      window.location.href = `/assessment?token=${accessToken}`;
    } else {
      setError("Token de acesso não fornecido.");
    }
  }, []);

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

  // Loading state while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Acessando avaliação...</p>
      </div>
    </div>
  );
}
