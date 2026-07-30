import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QUESTIONS } from "@shared/questions";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface ReviewScreenProps {
  answers: Record<number, string>;
  onEdit: (questionId: number, answer: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function ReviewScreen({ answers, onEdit, onBack, onSubmit, isLoading }: ReviewScreenProps) {
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  const answeredQuestions = QUESTIONS.filter(q => answers[q.id]);

  // Group questions by pillar
  const groupedByPillar = QUESTIONS.reduce((acc, question) => {
    const pillarName = question.pillar === 'security' ? 'Segurança' : 
                       question.pillar === 'compliance' ? 'Conformidade' : 'Cultura';
    if (!acc[pillarName]) {
      acc[pillarName] = [];
    }
    acc[pillarName].push(question);
    return acc;
  }, {} as Record<string, typeof QUESTIONS>);

  const pillarColors: Record<string, string> = {
    'Segurança': 'from-blue-50 to-blue-100 border-blue-300',
    'Conformidade': 'from-green-50 to-green-100 border-green-300',
    'Cultura': 'from-purple-50 to-purple-100 border-purple-300'
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            📋 Revisão Final
          </CardTitle>
          <CardDescription>
            Revise suas respostas antes de enviar a avaliação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <p className="text-lg font-semibold text-gray-900">
              {answeredQuestions.length} de {QUESTIONS.length} questões respondidas
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${(answeredQuestions.length / QUESTIONS.length) * 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grouped by Pillar */}
      <div className="space-y-6">
        {Object.entries(groupedByPillar).map(([pillarName, questions]) => {
          const pillarAnswered = questions.filter(q => answers[q.id]).length;
          const bgClass = pillarColors[pillarName] || 'from-gray-50 to-gray-100 border-gray-300';
          
          return (
            <Card key={pillarName} className={`bg-gradient-to-r ${bgClass}`}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{pillarName}</span>
                  <span className="text-sm font-normal text-gray-600">
                    {pillarAnswered}/{questions.length} respondidas
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {questions.map((question) => {
                    const answer = answers[question.id];
                    const isExpanded = expandedQuestion === question.id;
                    
                    if (!answer) return null;

                    return (
                      <Card key={question.id} className="bg-white">
                        <div
                          className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => setExpandedQuestion(isExpanded ? null : question.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{question.question}</p>
                              <p className="text-sm text-gray-600 mt-1">
                                Resposta: <span className="font-semibold">{question.options[answer as keyof typeof question.options]}</span>
                              </p>
                            </div>
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </div>

                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                              {Object.entries(question.options).map(([key, value]: [string, string]) => (
                                <Button
                                  key={key}
                                  onClick={() => {
                                    onEdit(question.id, key as 'A' | 'B' | 'C' | 'D');
                                    setExpandedQuestion(null);
                                  }}
                                  variant={answer === key ? "default" : "outline"}
                                  className="text-xs w-full justify-start"
                                >
                                  {key}) {value}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 sticky bottom-0 bg-white p-4 rounded-lg border border-gray-200">
        <Button onClick={onBack} variant="outline" className="flex-1">
          ← Voltar
        </Button>
        <Button 
          onClick={onSubmit} 
          disabled={isLoading || answeredQuestions.length === 0}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? 'Enviando...' : '✓ Enviar Avaliação'}
        </Button>
      </div>
    </div>
  );
}
