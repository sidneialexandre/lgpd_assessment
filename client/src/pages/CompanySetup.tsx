import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

interface GroupData {
  groupName: string;
  departmentName: string;
  respondentCount: number;
}

export default function CompanySetup() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [cnpj, setCnpj] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [newGroup, setNewGroup] = useState<GroupData>({
    groupName: "G1",
    departmentName: "",
    respondentCount: 1,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [hasLoadedGroups, setHasLoadedGroups] = useState(false);

  const createCompanyMutation = trpc.company.createOrGet.useMutation();
  const createGroupForAssessmentMutation = trpc.group.createForAssessment.useMutation();
  const createAssessmentMutation = trpc.assessment.create.useMutation();
  const getCompanyQuery = trpc.company.getById.useQuery(
    { companyId: companyId || 0 },
    { enabled: !!companyId }
  );
  const getLastAssessmentDataQuery = trpc.assessment.getLastAssessmentData.useQuery(
    { companyId: companyId || 0 },
    { enabled: !!companyId && getCompanyQuery.data !== undefined }
  );

  // Load companyId from URL - only runs once on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cId = params.get("companyId");
    if (cId) {
      setCompanyId(parseInt(cId));
      setIsLoadingData(true);
      setHasLoadedGroups(false);
    } else {
      // No company ID means this is a new assessment - reset everything
      setCompanyId(null);
      setCnpj("");
      setRazaoSocial("");
      setGroups([]);
      setNewGroup({
        groupName: "G1",
        departmentName: "",
        respondentCount: 1,
      });
      setHasLoadedGroups(true); // Mark as loaded to prevent further processing
    }
  }, []);

  // Pre-fill data when company is loaded
  useEffect(() => {
    if (companyId && getCompanyQuery.data && !hasLoadedGroups) {
      const company = getCompanyQuery.data;
      
      // Pre-fill company data
      setCnpj(company.cnpj);
      setRazaoSocial(company.razaoSocial);

      // IMPORTANT: Reset groups first to avoid duplicates
      setGroups([]);

      // Only load last assessment data if it exists
      if (getLastAssessmentDataQuery.data) {
        const { groups: lastGroups } = getLastAssessmentDataQuery.data;
        if (lastGroups && lastGroups.length > 0) {
          // Limit to maximum 6 groups
          const limitedGroups = lastGroups.slice(0, 6);
          const formattedGroups = limitedGroups.map(g => ({
            groupName: g.groupName,
            departmentName: g.departmentName,
            respondentCount: g.respondentCount,
          }));
          setGroups(formattedGroups);
          // Set next group number based on loaded groups
          const nextGroupNumber = formattedGroups.length + 1;
          setNewGroup({
            groupName: `G${nextGroupNumber}`,
            departmentName: "",
            respondentCount: 1,
          });
        } else {
          // No previous groups
          setNewGroup({
            groupName: "G1",
            departmentName: "",
            respondentCount: 1,
          });
        }
      } else {
        // No assessment data
        setNewGroup({
          groupName: "G1",
          departmentName: "",
          respondentCount: 1,
        });
      }

      setHasLoadedGroups(true);
      setIsLoadingData(false);
    }
  }, [companyId, getCompanyQuery.data, getLastAssessmentDataQuery.data, hasLoadedGroups]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Autenticação Necessária</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Você precisa estar autenticado para acessar esta página.
            </p>
            <Button onClick={() => window.location.href = "/"}  className="w-full">
              Voltar para Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatCNPJ = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 5) return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`;
    if (cleaned.length <= 8) return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5)}`;
    if (cleaned.length <= 12) return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8)}`;
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12, 14)}`;
  };

  const handleAddGroup = () => {
    if (!newGroup.departmentName.trim()) {
      setError("Por favor, preencha o nome do departamento");
      return;
    }

    if (groups.length >= 6) {
      setError("Máximo de 6 grupos permitido");
      return;
    }

    const nextGroupNumber = groups.length + 1;
    const currentRespondentCount = newGroup.respondentCount; // Salvar a quantidade antes de resetar
    
    setGroups([
      ...groups,
      {
        ...newGroup,
        groupName: `G${nextGroupNumber}`,
      },
    ]);

    setNewGroup({
      groupName: `G${nextGroupNumber + 1}`,
      departmentName: "",
      respondentCount: currentRespondentCount, // Manter a quantidade de respondentes do grupo anterior
    });
    setError("");
  };

  const handleRemoveGroup = (index: number) => {
    setGroups(groups.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!cnpj.trim() || !razaoSocial.trim()) {
      setError("Por favor, preencha CNPJ e Razão Social");
      return;
    }

    if (groups.length === 0) {
      setError("Por favor, adicione pelo menos um grupo de respondentes");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Step 1: Create or get company
      const company = await createCompanyMutation.mutateAsync({
        cnpj: cnpj.replace(/\D/g, ""),
        razaoSocial,
      });

      // Step 2: Create assessment with groups (this is crucial for isolation)
      const assessment = await createAssessmentMutation.mutateAsync({
        companyId: company.id,
        groups: groups,
      });

      // Redirect to respondent selection page
      setLocation(`/respondent-selection?companyId=${company.id}&assessmentId=${assessment.id}`);
    } catch (err) {
      setError("Erro ao criar empresa e grupos. Por favor, tente novamente.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingData && getCompanyQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados da empresa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Configuração da Avaliação</h1>
          <p className="text-gray-600">Defina os dados da empresa e os grupos de respondentes</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {/* Company Information Card */}
        <Card className="mb-8 bg-white shadow-lg">
          <CardHeader>
            <CardTitle>Informações da Empresa</CardTitle>
            <CardDescription>Preencha os dados da empresa que será avaliada</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  placeholder="XX.XXX.XXX/XXXX-XX"
                  value={cnpj}
                  onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                  maxLength={18}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="razaoSocial">Razão Social</Label>
                <Input
                  id="razaoSocial"
                  placeholder="Nome da empresa"
                  value={razaoSocial}
                  onChange={(e) => setRazaoSocial(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Groups Configuration Card */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle>Grupos de Respondentes</CardTitle>
            <CardDescription>
              Defina até 6 grupos de respondentes por departamento ({groups.length}/6)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add New Group */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold text-gray-900 mb-4">Adicionar Novo Grupo</h3>
              <div className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Grupo</Label>
                    <Input
                      value={newGroup.groupName}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="departmentName">Departamento</Label>
                    <Input
                      id="departmentName"
                      placeholder="Ex: TI, RH, Financeiro"
                      value={newGroup.departmentName}
                      onChange={(e) =>
                        setNewGroup({ ...newGroup, departmentName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="respondentCount">Qtd. Respondentes</Label>
                    <Input
                      id="respondentCount"
                      type="number"
                      min="1"
                      value={newGroup.respondentCount}
                      onChange={(e) =>
                        setNewGroup({
                          ...newGroup,
                          respondentCount: Math.max(1, parseInt(e.target.value) || 1),
                        })
                      }
                    />
                  </div>
                </div>
                <Button
                  onClick={handleAddGroup}
                  disabled={groups.length >= 6}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Grupo
                </Button>
              </div>
            </div>

            {/* Groups List */}
            {groups.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Grupos Configurados</h3>
                {groups.map((group, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-blue-600 text-lg">{group.groupName}</span>
                        <span className="text-gray-700">{group.departmentName}</span>
                        <span className="text-sm text-gray-500">
                          ({group.respondentCount} {group.respondentCount === 1 ? "respondente" : "respondentes"})
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveGroup(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <CheckCircle2 className="w-4 h-4 inline mr-2" />
                    Total de respondentes: <strong>{groups.reduce((sum, g) => sum + g.respondentCount, 0)}</strong>
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <Button
            variant="outline"
            onClick={() => setLocation("/")}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !cnpj.trim() || !razaoSocial.trim() || groups.length === 0}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {loading ? "Processando..." : "Próximo Passo"}
          </Button>
        </div>
      </div>
    </div>
  );
}
