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

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {QUESTIONS.map((question) => {
          const answer = answers[question.id];
          const isExpanded = expandedQuestion === question.id;
          
          return (
            <Card key={question.id} className={answer ? "border-blue-200 bg-blue-50" : "border-red-200 bg-red-50"}>
              <button
                onClick={() => setExpandedQuestion(isExpanded ? null : question.id)}
                className="w-full text-left p-4 flex items-center justify-between hover:bg-opacity-75 transition-all"
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {question.id}. {question.question}
                  </p>
                  {answer && (
                    <p className="text-sm text-blue-700 mt-1">
                      Resposta: <span className="font-bold">{answer}) {question.options[answer]}</span>
                    </p>
                  )}
                  {!answer && (
                    <p className="text-sm text-red-700 mt-1">Não respondida</p>
                  )}
                </div>
                {isExpanded ? <ChevronUp /> : <ChevronDown />}
              </button>

              {isExpanded && answer && (
                <CardContent className="pt-0 pb-4">
                  <div className="space-y-3 mt-4 border-t pt-4">
                    <p className="text-sm text-gray-600">Alterar resposta:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(question.options).map(([key, value]: [string, string]) => (
                        <Button
                          key={key}
                          onClick={() => {
                            onEdit(question.id, key as 'A' | 'B' | 'C' | 'D');
                            setExpandedQuestion(null);
                          }}
                          variant={answer === key ? "default" : "outline"}
                          className="text-xs"
                        >
                          {key}) {value}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <div className="flex gap-4 justify-between sticky bottom-0 bg-white p-4 rounded-lg border">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
        >
          ← Voltar
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isLoading || answeredQuestions.length !== QUESTIONS.length}
          className="bg-green-600 hover:bg-green-700"
        >
          {isLoading ? "Enviando..." : "✓ Enviar Avaliação"}
        </Button>
      </div>
    </div>
  );
}
