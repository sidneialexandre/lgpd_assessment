import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { CheckCircle2, Lock, FileText, Users, ArrowRight, Zap } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleStartAssessment = () => {
    window.location.href = "/company-setup";
  };

  const handleMyAssessments = () => {
    window.location.href = "/my-assessments";
  };

  const isAdmin = user?.role === "admin";
  const isRespondent = user?.role === "respondent";

  // Redirect respondents away from home page
  if (isRespondent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Respondentes devem acessar a avaliação através do link único fornecido.
            </p>
            <Button onClick={() => logout()} className="w-full">
              Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
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
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-20 sm:py-32">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center rounded-full bg-blue-100 px-4 py-2 mb-8">
              <Lock className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-sm font-semibold text-blue-600">Conformidade com LGPD</span>
            </div>

            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Avaliação de
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                Conformidade LGPD
              </span>
            </h2>

            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Lei Geral de Proteção de Dados - Lei Nº 13.709/2018
            </p>

            <p className="text-lg text-gray-500 mb-12 max-w-3xl mx-auto">
              Avalie o nível de conformidade da sua empresa com a LGPD através de uma avaliação completa
              com 50 questões divididas em 3 pilares estratégicos. Obtenha insights detalhados e recomendações
              personalizadas para melhorar sua postura de proteção de dados.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAdmin ? (
                <>
                  <Button
                    onClick={handleStartAssessment}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-6 text-lg rounded-lg shadow-lg hover:shadow-xl transition-all"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    Iniciar Avaliação
                  </Button>
                  <Button
                    onClick={handleMyAssessments}
                    size="lg"
                    variant="outline"
                    className="px-8 py-6 text-lg rounded-lg border-2 border-gray-300 hover:border-gray-400"
                  >
                    Minhas Avaliações
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </>
              ) : isAuthenticated ? (
                <>
                  <Button
                    onClick={() => (window.location.href = "/")}
                    size="lg"
                    className="bg-gray-400 text-white px-8 py-6 text-lg cursor-not-allowed rounded-lg"
                    disabled
                  >
                    Respondentes acessam via link
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => (window.location.href = getLoginUrl())}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-6 text-lg rounded-lg shadow-lg hover:shadow-xl transition-all"
                >
                  <Lock className="w-5 h-5 mr-2" />
                  Entrar para Responder
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Pillars Section */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">Três Pilares de Avaliação</h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Avaliamos sua empresa em três dimensões estratégicas para uma conformidade completa
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Pilar 1 */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-8 text-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-blue-400 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-2xl font-bold mb-3">Segurança da Informação</h4>
                <p className="text-blue-100 mb-6 text-sm">15 questões</p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-200 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Políticas de segurança</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-200 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Controle de acesso</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-200 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Criptografia de dados</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-200 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Gestão de incidentes</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-200 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Auditorias de segurança</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Pilar 2 */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 to-green-600 p-8 text-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-green-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-green-400 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-2xl font-bold mb-3">Conformidade Documental</h4>
                <p className="text-green-100 mb-6 text-sm">15 questões</p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-200 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Mapeamento de dados</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-200 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Políticas de privacidade</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-200 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Consentimento de dados</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-200 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Contratos com fornecedores</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-200 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Encarregado de Dados (DPO)</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Pilar 3 */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-8 text-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-purple-400 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-2xl font-bold mb-3">Cultura de Dados</h4>
                <p className="text-purple-100 mb-6 text-sm">20 questões</p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-purple-200 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Engajamento da liderança</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-purple-200 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Conscientização colaboradores</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-purple-200 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Treinamentos periódicos</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-purple-200 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Privacy by Design</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-purple-200 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Transparência organizacional</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 sm:py-28 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">Como Funciona</h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Um processo simples e direto para avaliar sua conformidade
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Autentique-se", desc: "Faça login na plataforma", icon: "🔐" },
              { step: "2", title: "Responda", desc: "50 questões de múltipla escolha", icon: "✍️" },
              { step: "3", title: "Analise", desc: "Relatório detalhado de conformidade", icon: "📊" },
              { step: "4", title: "Melhore", desc: "Recomendações personalizadas", icon: "🚀" },
            ].map((item, index) => (
              <div key={item.step} className="relative">
                {index < 3 && (
                  <div className="hidden md:block absolute top-6 left-full w-6 h-0.5 bg-gradient-to-r from-blue-600 to-transparent"></div>
                )}
                <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow">
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-lg font-bold mb-4">
                    {item.step}
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h4>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-28 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Pronto para avaliar sua conformidade?
          </h3>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Comece agora e obtenha um relatório completo sobre o nível de conformidade da sua empresa com a LGPD.
          </p>
          {isAdmin ? (
            <Button
              onClick={handleStartAssessment}
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-6 text-lg rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Iniciar Avaliação Agora
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          ) : isAuthenticated ? (
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-6 text-lg rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all cursor-not-allowed"
              disabled
            >
              Respondentes acessam via link
            </Button>
          ) : (
            <Button
              onClick={() => (window.location.href = getLoginUrl())}
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-6 text-lg rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Entrar para Começar
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h5 className="text-white font-semibold mb-4">Sobre</h5>
              <p className="text-sm">Avaliação de Conformidade com a Lei Geral de Proteção de Dados (LGPD)</p>
            </div>
            <div>
              <h5 className="text-white font-semibold mb-4">Legislação</h5>
              <p className="text-sm">Lei Nº 13.709/2018</p>
            </div>
            <div>
              <h5 className="text-white font-semibold mb-4">Objetivo</h5>
              <p className="text-sm">Auxiliar empresas na conformidade com a LGPD</p>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-sm">© 2026 Avaliação de Conformidade LGPD. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
