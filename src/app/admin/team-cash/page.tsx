"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Header } from '@/components/shared/header';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
import { Loader2, PlusCircle, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { AddTransactionForm } from './components/add-transaction-form';
import { EditTransactionForm } from './components/edit-transaction-form';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Group, MemberProfile } from '../members/page';
import Link from 'next/link';


export interface Transaction {
  id: string;
  groupId: string;
  type: 'einzahlung' | 'strafe';
  amount: number;
  description: string;
  memberName: string;
  memberId?: string;
  createdAt: any;
  updatedAt: any;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
};

export default function TeamCashPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<Transaction | null>(null);

  // 1. Get current user's profile to determine their role and groups
  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userProfile, isLoading: isLoadingUserProfile } = useDoc<MemberProfile>(userProfileRef);

  const isAdmin = userProfile?.adminRechte === true;
  const userRole = userProfile?.rolle;

  // 2. Get all groups (if admin) or only the user's groups
  const groupsQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile) return null;
    if (isAdmin) {
      return query(collection(firestore, 'groups'), where('parentGroupId', '==', null), orderBy('name'));
    }
    if (userProfile.groupIds && userProfile.groupIds.length > 0) {
      return query(collection(firestore, 'groups'), where('id', 'in', userProfile.groupIds), where('parentGroupId', '==', null), orderBy('name'));
    }
    return null;
  }, [firestore, userProfile, isAdmin]);

  const { data: accessibleGroups, isLoading: isLoadingGroups } = useCollection<Group>(groupsQuery);
  
  // Set the first group as selected by default
  useEffect(() => {
    if (!selectedGroupId && accessibleGroups && accessibleGroups.length > 0) {
      setSelectedGroupId(accessibleGroups[0].id);
    }
  }, [accessibleGroups, selectedGroupId]);

  // 3. Get transactions for the selected group
  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !selectedGroupId) return null;
    return query(collection(firestore, 'team-cash-transactions'), where('groupId', '==', selectedGroupId), orderBy('createdAt', 'desc'));
  }, [firestore, selectedGroupId]);

  const { data: transactions, isLoading: isLoadingTransactions } = useCollection<Transaction>(transactionsQuery);

  const balance = useMemo(() => {
    if (!transactions) return 0;
    return transactions.reduce((acc, t) => acc + (t.type === 'einzahlung' ? t.amount : -t.amount), 0);
  }, [transactions]);
  
  const canEdit = isAdmin || userRole === 'trainer';

  const handleDelete = (transaction: Transaction) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'team-cash-transactions', transaction.id);
    deleteDocumentNonBlocking(docRef);
    toast({
      title: "Transaktion gelöscht",
      description: `Der Eintrag "${transaction.description}" wurde entfernt.`,
    });
  };

  const isLoading = isLoadingUserProfile || isLoadingGroups;

  if (isAdding && selectedGroupId) {
    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
                <div className="container mx-auto px-4 py-8 md:py-12">
                    <AddTransactionForm groupId={selectedGroupId} onClose={() => setIsAdding(false)} />
                </div>
            </main>
        </div>
    );
  }
  
   if (isEditing && selectedGroupId) {
    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
                <div className="container mx-auto px-4 py-8 md:py-12">
                    <EditTransactionForm transaction={isEditing} onClose={() => setIsEditing(null)} />
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
            <h1 className="text-3xl font-bold tracking-tight">Mannschaftskasse</h1>
            {canEdit && (
                <div className="flex items-center gap-2">
                    <Button onClick={() => setIsAdding(true)} disabled={!selectedGroupId}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Neue Transaktion
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/admin/team-cash/penalties">Strafenkatalog</Link>
                    </Button>
                </div>
            )}
          </div>
          
          <Card className="mb-8">
             <CardHeader>
                <CardTitle>Mannschaft auswählen</CardTitle>
                <CardDescription>Wähle eine Mannschaft aus, um die Kasse einzusehen.</CardDescription>
             </CardHeader>
             <CardContent>
                {isLoading ? (
                    <Loader2 className="animate-spin" />
                ) : (
                    <Select onValueChange={setSelectedGroupId} value={selectedGroupId || ''} disabled={!accessibleGroups || accessibleGroups.length === 0}>
                        <SelectTrigger>
                            <SelectValue placeholder="Mannschaft auswählen..." />
                        </SelectTrigger>
                        <SelectContent>
                            {accessibleGroups && accessibleGroups.length > 0 ? (
                                accessibleGroups.map(group => <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>)
                            ) : (
                                <p className="p-4 text-sm text-muted-foreground">Keine Mannschaften für dich verfügbar.</p>
                            )}
                        </SelectContent>
                    </Select>
                )}
             </CardContent>
          </Card>

          {selectedGroupId && (
             <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Kontostand</CardTitle>
                        <CardDescription>Aktueller Saldo der Mannschaftskasse.</CardDescription>
                    </div>
                    <p className={`text-3xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-destructive'}`}>{formatCurrency(balance)}</p>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Datum</TableHead>
                                <TableHead>Beschreibung</TableHead>
                                <TableHead>Mitglied</TableHead>
                                <TableHead className="text-right">Betrag</TableHead>
                                {canEdit && <TableHead className="text-right">Aktionen</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {isLoadingTransactions ? (
                                <TableRow>
                                    <TableCell colSpan={canEdit ? 5 : 4} className="h-24 text-center">
                                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                    </TableCell>
                                </TableRow>
                            ) : transactions && transactions.length > 0 ? (
                                transactions.map(t => (
                                    <TableRow key={t.id}>
                                        <TableCell>{t.createdAt ? format(t.createdAt.toDate(), 'dd.MM.yyyy') : '-'}</TableCell>
                                        <TableCell className="font-medium">{t.description}</TableCell>
                                        <TableCell>{t.memberName || 'N/A'}</TableCell>
                                        <TableCell className={`text-right font-mono ${t.type === 'einzahlung' ? 'text-green-600' : 'text-destructive'}`}>
                                            {t.type === 'einzahlung' ? '+' : '-'} {formatCurrency(t.amount)}
                                        </TableCell>
                                         {canEdit && (
                                            <TableCell className="text-right">
                                                 <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Menü öffnen</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => setIsEditing(t)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Bearbeiten
                                                        </DropdownMenuItem>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <button className="w-full text-left relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-destructive hover:text-destructive focus:text-destructive">
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Löschen
                                                                </button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Diese Aktion kann nicht rückgängig gemacht werden. Der Eintrag wird dauerhaft gelöscht.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleDelete(t)} className="bg-destructive hover:bg-destructive/90">
                                                                        Löschen
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={canEdit ? 5 : 4} className="h-24 text-center">
                                        Keine Transaktionen für diese Mannschaft vorhanden.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
          )}

        </div>
      </main>
    </div>
  );
}
