import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { CheckCircle2, Shield, FileText, Users } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleStartAssessment = () => {
    window.location.href = "/company-setup";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {APP_LOGO && <img src={APP_LOGO} alt={APP_TITLE} className="h-8" />}
            <h1 className="text-2xl font-bold text-gray-900">{APP_TITLE}</h1>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-600">Bem-vindo, {user?.name || "Usuário"}</span>
                <Button
                  variant="outline"
                  onClick={() => logout()}
                >
                  Sair
                </Button>
              </>
            ) : (
              <Button
                onClick={() => (window.location.href = getLoginUrl())}
              >
                Entrar
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 py-16 sm:py-24">
        <div className="text-center mb-12">
          <h2 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-4">
            Avaliação de Conformidade
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              LGPD
            </span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Lei Geral de Proteção de Dados - Lei Nº 13.709/2018
          </p>
          <p className="text-gray-500 mb-8">
            Avalie o nível de conformidade da sua empresa com a LGPD através de uma avaliação completa
            com 50 questões divididas em 3 pilares estratégicos.
          </p>

          <Button
            onClick={handleStartAssessment}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-6 text-lg"
          >
            Iniciar Avaliação
          </Button>
        </div>
      </section>

      {/* Pillars Section */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">Três Pilares de Avaliação</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-6 h-6" />
                <CardTitle>Segurança da Informação</CardTitle>
              </div>
              <CardDescription className="text-blue-100">15 questões</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  Políticas de segurança
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  Controle de acesso
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  Criptografia de dados
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  Gestão de incidentes
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  Auditorias de segurança
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-6 h-6" />
                <CardTitle>Conformidade Documental</CardTitle>
              </div>
              <CardDescription className="text-green-100">15 questões</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Mapeamento de dados
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Políticas de privacidade
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Consentimento de dados
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Contratos com fornecedores
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Encarregado de Dados (DPO)
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-6 h-6" />
                <CardTitle>Cultura de Dados</CardTitle>
              </div>
              <CardDescription className="text-purple-100">20 questões</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  Engajamento da liderança
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  Conscientização colaboradores
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  Treinamentos periódicos
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  Privacy by Design
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  Transparência organizacional
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">Como Funciona</h3>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { step: "1", title: "Autentique-se", desc: "Faça login na plataforma" },
            { step: "2", title: "Responda", desc: "50 questões de múltipla escolha" },
            { step: "3", title: "Calcule", desc: "Pontuação automática" },
            { step: "4", title: "Analise", desc: "Percentual de conformidade" },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                {item.step}
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
              <p className="text-sm text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Scoring System Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">Sistema de Pontuação</h3>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { letter: "A", text: "Sim, certamente", points: "100 pts", color: "bg-green-500" },
              { letter: "B", text: "Sim", points: "65 pts", color: "bg-blue-500" },
              { letter: "C", text: "Não", points: "35 pts", color: "bg-yellow-500" },
              { letter: "D", text: "Não, nunca", points: "0 pts", color: "bg-red-500" },
            ].map((item) => (
              <div key={item.letter} className="text-center">
                <div className={`${item.color} w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4`}>
                  {item.points.split(" ")[0]}
                </div>
                <p className="font-semibold mb-1">{item.letter}) {item.text}</p>
                <p className="text-sm opacity-90">{item.points}</p>
              </div>
            ))}
          </div>
          <p className="text-center mt-8 text-lg font-semibold">Máximo de pontos: <span className="text-2xl">10.000</span></p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p>Avaliação de Conformidade com a Lei Geral de Proteção de Dados (LGPD)</p>
          <p className="text-sm mt-2">Lei Nº 13.709/2018 | Desenvolvido para auxiliar empresas na conformidade com a LGPD</p>
        </div>
      </footer>
    </div>
  );
}

