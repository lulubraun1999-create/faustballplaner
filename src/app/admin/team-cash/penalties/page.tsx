
"use client";

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Header } from '@/components/shared/header';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PenaltyForm } from './components/penalty-form';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { MemberProfile } from '../../members/page';
import Link from 'next/link';

export interface Penalty {
  id: string;
  description: string;
  amount: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
};

export default function TeamCashPenaltiesPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isManaging, setIsManaging] = useState(false);

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userProfile } = useDoc<MemberProfile>(userProfileRef);

  const penaltiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'team-cash-penalties'), orderBy('description'));
  }, [firestore]);

  const { data: penalties, isLoading } = useCollection<Penalty>(penaltiesQuery);

  const canEdit = userProfile?.adminRechte || userProfile?.rolle === 'trainer';

  const handleDelete = (penaltyId: string) => {
    if (!firestore || !canEdit) return;
    const penaltyRef = doc(firestore, 'team-cash-penalties', penaltyId);
    deleteDocumentNonBlocking(penaltyRef);
    toast({ title: 'Erfolg', description: 'Strafe wurde aus dem Katalog gelöscht.' });
  };
  
  if (!userProfile) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    )
  }

  if (!canEdit) {
     return (
       <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <div className="container mx-auto px-4 py-8 md:py-12 text-center">
             <h1 className="text-2xl font-bold">Zugriff verweigert</h1>
             <p className="text-muted-foreground">Du hast keine Berechtigung, den Strafenkatalog zu verwalten.</p>
             <Button asChild className="mt-4"><Link href="/admin/team-cash">Zurück zur Mannschaftskasse</Link></Button>
          </div>
        </main>
      </div>
    );
  }
  
  if (isManaging) {
    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
                <div className="container mx-auto px-4 py-8 md:py-12">
                   <PenaltyForm onClose={() => setIsManaging(false)} />
                </div>
            </main>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Strafenkatalog</h1>
            <div className='flex gap-2'>
                <Button variant="outline" asChild><Link href="/admin/team-cash">Zurück zur Kasse</Link></Button>
                <Button onClick={() => setIsManaging(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Neue Strafe
                </Button>
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Aktuelle Strafen</CardTitle>
              <CardDescription>Hier sind alle definierten Strafen für die Mannschaften aufgelistet.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Beschreibung</TableHead>
                    <TableHead>Betrag</TableHead>
                    <TableHead className="text-right">Aktion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                      </TableCell>
                    </TableRow>
                  ) : penalties && penalties.length > 0 ? (
                    penalties.map((penalty) => (
                      <TableRow key={penalty.id}>
                        <TableCell className="font-medium">{penalty.description}</TableCell>
                        <TableCell>{formatCurrency(penalty.amount)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(penalty.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                        Keine Strafen im Katalog gefunden.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

    