
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import type { Survey, SurveyResponse } from "@/app/admin/surveys/page";
import { useFirestore, useUser, errorEmitter, FirestorePermissionError, useDoc, useMemoFirebase } from "@/firebase";
import { doc, runTransaction, arrayUnion, collection, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SurveyCardProps {
    survey: Survey;
}

export function SurveyCard({ survey }: SurveyCardProps) {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();

    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    const [newOption, setNewOption] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const responseRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, "surveys", survey.id, "responses", user.uid);
    }, [firestore, survey.id, user]);

    // Fetch the user's specific response for this survey
    const { data: userResponse, isLoading: isLoadingResponse } = useDoc<SurveyResponse>(responseRef);
    const hasVoted = !!userResponse;
    const totalVotes = survey.options.reduce((acc, opt) => acc + (opt.votes || 0), 0);

    useEffect(() => {
        // When the vote status changes (e.g., after voting), clear selections.
        if (hasVoted) {
            setSelectedOptions([]);
        }
    }, [hasVoted]);


    const handleVote = async () => {
        if (!user || !firestore) {
            toast({ variant: 'destructive', title: "Fehler", description: "Sie müssen angemeldet sein, um abzustimmen." });
            return;
        }
        if (selectedOptions.length === 0) {
            toast({ variant: 'destructive', title: "Fehler", description: "Bitte wählen Sie eine Option aus." });
            return;
        }
        setIsSubmitting(true);

        const surveyRef = doc(firestore, "surveys", survey.id);
        const userResponseRef = doc(collection(surveyRef, "responses"), user.uid);

        try {
            await runTransaction(firestore, async (transaction) => {
                const surveyDoc = await transaction.get(surveyRef);
                if (!surveyDoc.exists()) throw "Umfrage nicht gefunden.";

                const currentSurveyData = surveyDoc.data() as Survey;
                
                const existingResponsesSnap = await transaction.get(userResponseRef);
                if (existingResponsesSnap.exists()) {
                     throw "Sie haben bereits an dieser Umfrage teilgenommen.";
                }
                
                const newOptions = [...currentSurveyData.options];
                selectedOptions.forEach(selectedId => {
                    const optionIndex = newOptions.findIndex(opt => opt.id === selectedId);
                    if (optionIndex > -1) {
                        newOptions[optionIndex].votes = (newOptions[optionIndex].votes || 0) + 1;
                    }
                });

                transaction.update(surveyRef, { options: newOptions });
                
                transaction.set(userResponseRef, {
                    userId: user.uid,
                    selectedOptionIds: selectedOptions,
                    createdAt: new Date(),
                });
            });
            
             toast({ title: "Erfolg", description: "Ihre Stimme wurde gezählt." });
        } catch (error: any) {
             if (error.code === 'permission-denied') {
                const permissionError = new FirestorePermissionError({
                    path: surveyRef.path,
                    operation: 'update',
                    requestResourceData: { /* data is complex in transaction */ },
                });
                errorEmitter.emit('permission-error', permissionError);
            } else {
                toast({ variant: "destructive", title: "Fehler", description: typeof error === 'string' ? error : "Ihre Stimme konnte nicht gespeichert werden."});
            }
        } finally {
             setIsSubmitting(false);
        }
    };

    const handleRetractVote = async () => {
        if (!user || !firestore || !userResponse) return;
        setIsSubmitting(true);

        const surveyRef = doc(firestore, "surveys", survey.id);
        const userResponseRef = doc(firestore, "surveys", survey.id, "responses", user.uid);

        try {
            await runTransaction(firestore, async (transaction) => {
                const surveyDoc = await transaction.get(surveyRef);
                const responseDoc = await transaction.get(userResponseRef);

                if (!surveyDoc.exists()) throw "Umfrage nicht gefunden.";
                if (!responseDoc.exists()) throw "Keine Abstimmung zum Zurückziehen gefunden.";


                const currentSurveyData = surveyDoc.data() as Survey;
                const userResponseData = responseDoc.data();
                
                const newOptions = [...currentSurveyData.options];
                userResponseData.selectedOptionIds.forEach((votedId: string) => {
                    const optionIndex = newOptions.findIndex(opt => opt.id === votedId);
                    if (optionIndex > -1 && newOptions[optionIndex].votes > 0) {
                        newOptions[optionIndex].votes -= 1;
                    }
                });
                
                transaction.update(surveyRef, { options: newOptions });
                
                transaction.delete(userResponseRef);
            });
            toast({ title: "Erfolg", description: "Ihre Stimme wurde zurückgezogen." });
            setSelectedOptions([]);
        } catch (error: any) {
             if (error.code === 'permission-denied') {
                const permissionError = new FirestorePermissionError({
                    path: userResponseRef.path,
                    operation: 'delete',
                });
                errorEmitter.emit('permission-error', permissionError);
            } else {
                toast({ variant: "destructive", title: "Fehler", description: error.message || "Stimme konnte nicht zurückgezogen werden."});
            }
        } finally {
            setTimeout(() => setIsSubmitting(false), 200);
        }
    };
    
    const handleAddOption = async () => {
        if (!newOption.trim() || !user || !firestore) return;
        setIsSubmitting(true);
    
        const surveyRef = doc(firestore, "surveys", survey.id);
        
        const newOptionData = {
            id: crypto.randomUUID(),
            value: newOption.trim(),
            votes: 1
        };
    
        try {
             await runTransaction(firestore, async (transaction) => {
                const surveyDoc = await transaction.get(surveyRef);
                if (!surveyDoc.exists()) throw "Umfrage nicht gefunden.";

                const currentSurveyData = surveyDoc.data() as Survey;
                
                const userResponseRef = doc(firestore, 'surveys', survey.id, 'responses', user.uid);
                const responseSnap = await transaction.get(userResponseRef);
                if (responseSnap.exists()) {
                    throw "Sie haben bereits abgestimmt. Ziehen Sie Ihre Stimme zurück, um eine neue Option hinzuzufügen.";
                }
    
                if (currentSurveyData.options.some(o => o.value.toLowerCase() === newOptionData.value.toLowerCase())) {
                    throw "Diese Option existiert bereits.";
                }
    
                const newOptions = [...currentSurveyData.options, newOptionData];
                
                transaction.update(surveyRef, { options: newOptions });

                transaction.set(userResponseRef, {
                    userId: user.uid,
                    selectedOptionIds: [newOptionData.id],
                    createdAt: new Date(),
                });
            });
    
            toast({ title: "Erfolg", description: `Option "${newOptionData.value}" hinzugefügt und abgestimmt.` });
            setNewOption("");
    
        } catch (error: any) {
            if (error.code === 'permission-denied') {
                const permissionError = new FirestorePermissionError({
                    path: surveyRef.path,
                    operation: 'update',
                    requestResourceData: { options: arrayUnion(newOptionData) },
                });
                errorEmitter.emit('permission-error', permissionError);
            } else {
                toast({ variant: "destructive", title: "Fehler", description: typeof error === 'string' ? error : "Option konnte nicht hinzugefügt werden." });
            }
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleSelectionChange = (optionId: string) => {
        if (survey.allowMultipleAnswers) {
            setSelectedOptions(prev => 
                prev.includes(optionId) 
                    ? prev.filter(id => id !== optionId) 
                    : [...prev, optionId]
            );
        } else {
            setSelectedOptions([optionId]);
        }
    };

    if (isLoadingResponse) {
        return (
            <div className="flex items-center justify-center h-24">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }


    const renderContent = () => {
        if (hasVoted) {
            return (
                <div className="space-y-4">
                    <div className="space-y-3">
                        {survey.options.sort((a, b) => (b.votes || 0) - (a.votes || 0)).map((option, index) => (
                             <div key={`${survey.id}-${option.id || index}-result`}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-medium">{option.value}</span>
                                    <span className="text-sm text-muted-foreground">
                                        {option.votes || 0} ({totalVotes > 0 ? (((option.votes || 0) / totalVotes) * 100).toFixed(0) : 0}%)
                                    </span>
                                </div>
                                <Progress value={totalVotes > 0 ? ((option.votes || 0) / totalVotes) * 100 : 0} />
                            </div>
                        ))}
                    </div>
                     <Button variant="outline" size="sm" onClick={handleRetractVote} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Stimme zurückziehen
                    </Button>
                </div>
            );
        }
    
        if (survey.allowMultipleAnswers) {
            return (
                <div className="space-y-2">
                    {survey.options.map((option, index) => (
                        <div key={`${survey.id}-${option.id || index}-checkbox`} className="flex items-center space-x-2">
                            <Checkbox
                                id={`${survey.id}-${option.id || index}`}
                                onCheckedChange={() => handleSelectionChange(option.id)}
                                checked={selectedOptions.includes(option.id)}
                            />
                            <Label htmlFor={`${survey.id}-${option.id || index}`} className="font-normal cursor-pointer">{option.value}</Label>
                        </div>
                    ))}
                </div>
            );
        }
    
        return (
            <RadioGroup onValueChange={(value) => handleSelectionChange(value)} value={selectedOptions[0]}>
                <div className="space-y-2">
                    {survey.options.map((option, index) => (
                        <div key={`${survey.id}-${option.id || index}-radio`} className="flex items-center space-x-2">
                            <RadioGroupItem value={option.id} id={`${survey.id}-${option.id || index}`} />
                            <Label htmlFor={`${survey.id}-${option.id || index}`} className="font-normal cursor-pointer">{option.value}</Label>
                        </div>
                    ))}
                </div>
            </RadioGroup>
        );
    };

    return (
        <div className="flex flex-col space-y-4">
             {renderContent()}
             {!hasVoted && survey.allowOwnOptions && (
                 <div className="flex items-center gap-2 pt-2">
                     <Input 
                         placeholder="Eigene Option..." 
                         value={newOption}
                         onChange={(e) => setNewOption(e.target.value)} 
                         disabled={isSubmitting}
                     />
                     <Button variant="outline" size="icon" onClick={handleAddOption} disabled={isSubmitting || !newOption.trim()}>
                         {isSubmitting ? <Loader2 className="animate-spin" /> : <PlusCircle />}
                     </Button>
                 </div>
             )}
            {!hasVoted && (
                <Button onClick={handleVote} className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground" disabled={isSubmitting || selectedOptions.length === 0}>
                   {isSubmitting ? <Loader2 className="animate-spin" /> : "Abstimmen"}
                </Button>
            )}
        </div>
    );
}

    

    
