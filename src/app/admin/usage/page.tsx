
"use client";

import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, getCountFromServer, query } from "firebase/firestore";
import { Header } from "@/components/shared/header";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, Newspaper, Vote, CandlestickChart } from "lucide-react";
import { Group } from "../groups/page";

interface UsageStats {
    name: string;
    count: number | null;
    icon: React.ComponentType<{ className?: string }>;
}

const StatCard = ({ name, count, icon: Icon }: UsageStats) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{name}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            {count === null ? (
                <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
                <div className="text-2xl font-bold">{count}</div>
            )}
        </CardContent>
    </Card>
);


export default function UsagePage() {
    const firestore = useFirestore();
    const [stats, setStats] = useState<UsageStats[]>([
        { name: "Mitglieder", count: null, icon: Users },
        { name: "Gruppen", count: null, icon: Users },
        { name: "News-Artikel", count: null, icon: Newspaper },
        { name: "Umfragen", count: null, icon: Vote },
        { name: "Transaktionen", count: null, icon: CandlestickChart },
    ]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!firestore) return;

        const fetchCounts = async () => {
            setIsLoading(true);
            const collectionsToCount = [
                { name: "Mitglieder", collectionName: "members" },
                { name: "Gruppen", collectionName: "groups" },
                { name: "News-Artikel", collectionName: "news" },
                { name: "Umfragen", collectionName: "surveys" },
                { name: "Transaktionen", collectionName: "team-cash-transactions" },
            ];

            const promises = collectionsToCount.map(async ({ name, collectionName }) => {
                const collRef = collection(firestore, collectionName);
                const snapshot = await getCountFromServer(collRef);
                return { name, count: snapshot.data().count };
            });

            try {
                const results = await Promise.all(promises);
                setStats(currentStats =>
                    currentStats.map(stat => {
                        const found = results.find(r => r.name === stat.name);
                        return found ? { ...stat, count: found.count } : stat;
                    })
                );
            } catch (error) {
                console.error("Error fetching collection counts:", error);
                // Optionally set an error state to show in the UI
            } finally {
                setIsLoading(false);
            }
        };

        fetchCounts();
    }, [firestore]);

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
                <div className="container mx-auto px-4 py-8 md:py-12">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold tracking-tight">Nutzung</h1>
                        <p className="text-muted-foreground">
                            Ein Überblick über die Anzahl der Einträge in Ihrer Datenbank.
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                         {stats.map(stat => (
                            <StatCard key={stat.name} {...stat} />
                         ))}
                    </div>
                     <div className="mt-8 text-sm text-muted-foreground">
                        <p>Diese Zahlen geben Ihnen einen Anhaltspunkt über die Nutzung Ihrer Firestore-Datenbank. Die tatsächliche Speichernutzung in Gigabyte und detaillierte Lese-/Schreibvorgänge können Sie in der <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Firebase Console</a> einsehen.</p>
                    </div>
                </div>
            </main>
        </div>
    );
}