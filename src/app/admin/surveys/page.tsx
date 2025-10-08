
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Header } from "@/components/shared/header";
import { useCollection, useFirestore, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, orderBy, getDocs, onSnapshot, doc } from "firebase/firestore";
import { Loader2, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateSurveyForm } from './components/create-survey-form';
import type { Group } from '../groups/page';
import { AdminSurveyCard } from './components/admin-survey-card';
import { SurveyResultsModal } from './components/survey-results-modal';
import React from 'react';

export interface SurveyResponse {
    id: string;
    userId: string;
    selectedOptionIds: string[];
    createdAt: any;
}

export interface Survey {
    id: string;
    question: string;
    options: { id: string; value: string; votes: number }[];
    authorId: string;
    authorName: string;
    createdAt: any;
    expiresAt?: any;
    archiveAt?: any;
    status: 'active' | 'closed' | 'archived';
    allowMultipleAnswers: boolean;
    allowOwnOptions: boolean;
    isAnonymous: boolean;
    targetGroupIds: string[];
    responses?: SurveyResponse[];
}

export default function AdminSurveysPage() {
    const firestore = useFirestore();
    const [isCreating, setIsCreating] = useState(false);
    const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
    
    // Fetch Groups
    const groupsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'groups'));
    }, [firestore]);
    const { data: allGroups, isLoading: isLoadingGroups } = useCollection<Group>(groupsQuery);
    
    // Fetch Surveys - no longer fetches subcollections here
    const surveysQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'surveys'), orderBy('createdAt', 'desc'));
    }, [firestore]);
    const { data: surveys, isLoading: isLoadingSurveys } = useCollection<Survey>(surveysQuery);


    // Separate parent and sub-groups
    const { parentGroups, subGroups } = useMemo(() => {
        const parentGroups: Group[] = [];
        const subGroups: Group[] = [];
        if (allGroups) {
            allGroups.forEach(group => {
            if (group.parentGroupId) {
                subGroups.push(group);
            } else {
                parentGroups.push(group);
            }
            });
        }
        parentGroups.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
        return { parentGroups, subGroups };
    }, [allGroups]);


    const isLoading = isLoadingSurveys || isLoadingGroups;
    
    if (isCreating) {
         return (
            <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1">
                    <div className="container mx-auto px-4 py-8 md:py-12">
                       <CreateSurveyForm
                          onClose={() => setIsCreating(false)}
                          parentGroups={parentGroups}
                          subGroups={subGroups}
                       />
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
                <div className="container mx-auto px-4 py-8 md:py-12">
                     <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold tracking-tight">Umfragen</h1>
                        <Button 
                            variant="outline" 
                            onClick={() => setIsCreating(true)}
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Neue Umfrage
                        </Button>
                    </div>
                    
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {surveys && surveys.length > 0 ? (
                                surveys.map(survey => (
                                    <AdminSurveyCard 
                                        key={survey.id} 
                                        survey={survey} 
                                        allGroups={allGroups || []}
                                        onShowResults={() => setSelectedSurvey(survey)}
                                    />
                                ))
                            ) : (
                                <p className="col-span-full text-center text-muted-foreground">Keine Umfragen vorhanden. Erstellen Sie eine neue!</p>
                            )}
                        </div>
                    )}
                </div>
                 <SurveyResultsModal 
                    survey={selectedSurvey}
                    isOpen={!!selectedSurvey}
                    onClose={() => setSelectedSurvey(null)}
                />
            </main>
        </div>
    );
}

    
