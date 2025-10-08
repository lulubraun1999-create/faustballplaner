
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFirestore } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Edit, Users } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import type { Survey } from '../page';
import type { Group } from "../../groups/page";
import { SurveyCard } from "@/app/surveys/components/survey-card";
import { useEffect, useState } from "react";
import { collection, onSnapshot, doc } from "firebase/firestore";

interface AdminSurveyCardProps {
  survey: Survey;
  allGroups: Group[];
  onShowResults: () => void;
}

export function AdminSurveyCard({ survey: initialSurvey, allGroups, onShowResults }: AdminSurveyCardProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [survey, setSurvey] = useState(initialSurvey);

  // This effect will re-fetch the responses for this specific survey
  // to ensure the vote count is up-to-date for admins.
  useEffect(() => {
    if (!firestore) return;
    
    // Correctly reference the 'responses' sub-collection of the specific survey
    const responsesRef = collection(firestore, 'surveys', initialSurvey.id, 'responses');

    const unsubscribe = onSnapshot(responsesRef, (snapshot) => {
        const responses = snapshot.docs.map(doc => doc.data());
        
        // Recalculate votes based on fetched responses
        const newOptions = [...initialSurvey.options].map(opt => ({ ...opt, votes: 0 }));
        
        responses.forEach((res: any) => {
            if (res.selectedOptionIds) {
                res.selectedOptionIds.forEach((id: string) => {
                    const optionIndex = newOptions.findIndex(opt => opt.id === id);
                    if (optionIndex > -1) {
                        newOptions[optionIndex].votes += 1;
                    }
                });
            }
        });
      
      // We update the local survey state to reflect the new vote counts
      setSurvey(prev => ({ ...prev, options: newOptions }));
    }, (error) => {
      // This is a minimal error handler for the snapshot listener itself.
      // Permission errors from the non-blocking updates are handled elsewhere.
      console.error("Error listening to survey responses:", error);
      toast({
        variant: "destructive",
        title: "Fehler beim Laden der Stimmen",
        description: "Die aktuellen Stimmergebnisse konnten nicht geladen werden.",
      });
    });

    return () => unsubscribe();
  }, [firestore, initialSurvey.id, initialSurvey.options, toast]);


  
  const getTargetGroupNames = () => {
    if (!survey.targetGroupIds || survey.targetGroupIds.length === 0) {
        return "Alle";
    }
    return survey.targetGroupIds.map(id => allGroups.find(g => g.id === id)?.name).filter(Boolean).join(', ');
  }

  const formatRelativeDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true, locale: de });
  }

  const totalVotes = survey.options.reduce((acc, opt) => acc + (opt.votes || 0), 0);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl">{survey.question}</CardTitle>
        <CardDescription>
          Erstellt von {survey.authorName || 'Unbekannt'} • {formatRelativeDate(survey.createdAt)}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center">
             <Users className="mr-2 h-4 w-4" />
             <span>Zielgruppe: {getTargetGroupNames()}</span>
          </div>
          <span>{totalVotes} Stimme{totalVotes !== 1 ? 'n' : ''}</span>
        </div>
        <div className="mt-4 border-t pt-4">
            {/* The user-facing SurveyCard does not need to show results, only voting mechanism */}
            <SurveyCard survey={survey} />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 border-t pt-6">
         <Button variant="ghost" size="icon" onClick={onShowResults} title="Ergebnisse anzeigen">
            <BarChart className="h-5 w-5" />
            <span className="sr-only">Ergebnisse anzeigen</span>
         </Button>
         <Button variant="ghost" size="icon" disabled title="Bearbeiten (demnächst)">
            <Edit className="h-5 w-5" />
             <span className="sr-only">Bearbeiten</span>
         </Button>
      </CardFooter>
    </Card>
  );
}
