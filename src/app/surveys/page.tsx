
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Header } from "@/components/shared/header";
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, query, where, orderBy, getDocs, onSnapshot, Timestamp, doc } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SurveyCard } from "./components/survey-card";
import type { Group } from '../admin/groups/page';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

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
    // Make responses optional as we will load them on demand
    responses?: SurveyResponse[]; 
    voterIds: string[];
}

interface UserProfile {
    groupIds?: string[];
}


export default function SurveysPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    
    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);

    const { data: userProfile, isLoading: isLoadingUserProfile } = useDoc<UserProfile>(userProfileRef);
    const userGroupIds = userProfile?.groupIds || [];
    
    const surveysQuery = useMemoFirebase(() => {
        if (!firestore || !user || isLoadingUserProfile) return null;
        
        const now = Timestamp.now();
        const visibleGroupIds = [''].concat(userGroupIds); 

        // Query for active surveys targeted to the user's groups OR public surveys
        const q = query(
            collection(firestore, 'surveys'),
            where('status', '==', 'active'),
            orderBy('createdAt', 'desc')
        );
        return q;

    }, [firestore, user, isLoadingUserProfile, userGroupIds]);

    const { data: allActiveSurveys, isLoading: isLoadingSurveys } = useCollection<Survey>(surveysQuery);

    const filteredSurveys = useMemo(() => {
        if (!allActiveSurveys) return [];
        const now = new Date();
        return allActiveSurveys.filter(survey => {
            // Client-side filtering for dates and group membership
            const isExpired = survey.expiresAt && survey.expiresAt.toDate() < now;
            const isArchived = survey.archiveAt && survey.archiveAt.toDate() < now;
            if (isExpired || isArchived) return false;

            const isPublic = survey.targetGroupIds.length === 0;
            const isTargeted = survey.targetGroupIds.some(targetId => userGroupIds.includes(targetId));

            return isPublic || isTargeted;
        });
    }, [allActiveSurveys, userGroupIds]);


    const formatRelativeDate = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return formatDistanceToNow(date, { addSuffix: true, locale: de });
    }
    
    const isLoading = isLoadingSurveys || isLoadingUserProfile;

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
                <div className="container mx-auto px-4 py-8 md:py-12">
                     <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold tracking-tight">Aktive Umfragen</h1>
                    </div>
                    
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredSurveys && filteredSurveys.length > 0 ? (
                                filteredSurveys.map(survey => (
                                   <Card key={survey.id} className="flex flex-col">
                                        <CardHeader>
                                            <CardTitle>{survey.question}</CardTitle>
                                            <CardDescription>
                                                Erstellt von {survey.authorName} • {formatRelativeDate(survey.createdAt)}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex-1">
                                            {/* SurveyCard will now fetch its own response data */}
                                            <SurveyCard survey={survey} />
                                        </CardContent>
                                        <CardFooter className="text-xs text-muted-foreground border-t pt-4">
                                            {survey.isAnonymous ? 'Anonyme Umfrage' : 'Sichtbare Abstimmung'}
                                            {survey.expiresAt && ` • Endet ${formatRelativeDate(survey.expiresAt)}`}
                                        </CardFooter>
                                    </Card>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-16">
                                    <p className="text-muted-foreground">Zurzeit gibt es keine aktiven Umfragen für deine Gruppen.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
