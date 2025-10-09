
"use client";

import React, { useMemo } from 'react';
import { Header } from "@/components/shared/header";
import { Loader2 } from 'lucide-react';
import { MembersTable } from './components/members-table';
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, orderBy, query } from "firebase/firestore";

// Types based on backend.json.
export interface MemberProfile {
    id: string;
    vorname?: string;
    nachname?: string;
    telefon?: string;
    wohnort?: string;
    geschlecht?: string;
    position?: string[];
    geburtstag?: any; // Can be Firestore timestamp or string from form
    rolle?: string;
    adminRechte?: boolean;
    groupIds?: string[];
    email: string;
    name: string;
}

export interface Group {
    id: string;
    name:string;
    parentGroupId?: string;
}


export default function MembersPage() {
    const firestore = useFirestore();

    // The table component will handle fetching the members data itself.
    const isLoading = false; // We are no longer loading groups here.

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
                <div className="container mx-auto px-4 py-8 md:py-12">
                    <h1 className="text-3xl font-bold tracking-tight mb-8">
                        Mitgliederliste
                    </h1>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        // Pass a function to fetch groups on demand
                        <MembersTable />
                    )}
                </div>
            </main>
        </div>
    );
}
