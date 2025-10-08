
"use client";

import { useState, useMemo, useEffect, FC } from 'react';
import Link from 'next/link';
import { Header } from "@/components/shared/header";
import { useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, doc, where } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, MoreHorizontal, PlusCircle, Trash2, Edit, BookMarked, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { Group } from '../groups/page';
import { AddTransactionForm } from './components/add-transaction-form';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { EditTransactionForm } from './components/edit-transaction-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export interface TeamCashTransaction {
    id: string;
    groupId: string;
    description: string;
    amount: number;
    date: any;
    memberId?: string;
    memberName?: string;
    createdAt: any;
    createdBy: string;
}

// =========================================================================
// TransactionView Component - Renders only when a subGroupId is selected
// =========================================================================
interface TransactionViewProps {
    subGroupId: string;
    subGroupName: string;
    onEdit: (transaction: TeamCashTransaction) => void;
}

const TransactionView: FC<TransactionViewProps> = ({ subGroupId, subGroupName, onEdit }) => {
    const firestore = useFirestore();
    const { toast } = useToast();

    // This query is now safe because it's only created and run when subGroupId is valid.
    const transactionsQuery = useMemoFirebase(() => {
        if (!firestore || !subGroupId) return null;
        return query(collection(firestore, 'team-cash-transactions'), where('groupId', '==', subGroupId), orderBy('date', 'desc'));
    }, [firestore, subGroupId]);
    
    const { data: transactions, isLoading } = useCollection<TeamCashTransaction>(transactionsQuery);

    const balance = useMemo(() => {
        return transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
    }, [transactions]);

    const formatCurrency = (amount: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
    const formatDate = (timestamp: any) => {
        if (!timestamp) return '-';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return format(date, 'dd.MM.yyyy', { locale: de });
    };

    const handleDelete = (transactionId: string) => {
        if (!firestore) return;
        const docRef = doc(firestore, 'team-cash-transactions', transactionId);
        deleteDocumentNonBlocking(docRef);
        toast({ title: "Transaktion gelöscht", description: "Die Transaktion wurde erfolgreich entfernt." });
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>{subGroupName}</CardTitle>
                    <CardDescription>Übersicht der Transaktionen</CardDescription>
                </div>
                <div className={`flex items-center gap-2 rounded-lg px-4 py-2 text-lg font-bold ${balance >= 0 ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                    <Wallet className="h-6 w-6" />
                    <span>{formatCurrency(balance)}</span>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Datum</TableHead>
                            <TableHead>Beschreibung</TableHead>
                            <TableHead>Mitglied</TableHead>
                            <TableHead className="text-right">Betrag</TableHead>
                            <TableHead className="w-[50px] text-right">Aktion</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions && transactions.length > 0 ? (
                            transactions.map(t => (
                                <TableRow key={t.id}>
                                    <TableCell>{formatDate(t.date)}</TableCell>
                                    <TableCell>{t.description}</TableCell>
                                    <TableCell>{t.memberName || '-'}</TableCell>
                                    <TableCell className={`text-right font-medium ${t.amount >= 0 ? 'text-green-600' : 'text-destructive'}`}>{formatCurrency(t.amount)}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Menü</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => onEdit(t)}><Edit className="mr-2 h-4 w-4" />Bearbeiten</DropdownMenuItem>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <button className="w-full text-left relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-destructive hover:text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Löschen</button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader><AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle><AlertDialogDescription>Die Transaktion "{t.description}" wird dauerhaft gelöscht.</AlertDialogDescription></AlertDialogHeader>
                                                        <AlertDialogFooter><AlertDialogCancel>Abbrechen</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(t.id)} className="bg-destructive hover:bg-destructive/90">Löschen</AlertDialogAction></AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center">Keine Transaktionen für diese Mannschaft.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
                )}
            </CardContent>
        </Card>
    );
};


// =========================================================================
// TeamCashPage Component - Main page controller
// =========================================================================
export default function TeamCashPage() {
    const firestore = useFirestore();
    const [isAdding, setIsAdding] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<TeamCashTransaction | null>(null);
    const [selectedSubGroupId, setSelectedSubGroupId] = useState<string>('');

    // Fetch only groups at the top level
    const groupsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'groups')) : null, [firestore]);
    const { data: allGroups, isLoading: isLoadingGroups } = useCollection<Group>(groupsQuery);

    const subGroups = useMemo(() => allGroups?.filter(g => g.parentGroupId).sort((a, b) => a.name.localeCompare(b.name)) || [], [allGroups]);
    
    // Effect to set the initial selected group once subGroups are loaded
    useEffect(() => {
        if (!selectedSubGroupId && subGroups.length > 0) {
            setSelectedSubGroupId(subGroups[0].id);
        }
    }, [subGroups, selectedSubGroupId]);

    const handleEditTransaction = (transaction: TeamCashTransaction) => {
        setEditingTransaction(transaction);
    };

    const isLoading = isLoadingGroups;
    const selectedSubGroupName = useMemo(() => subGroups.find(g => g.id === selectedSubGroupId)?.name || '', [subGroups, selectedSubGroupId]);


    if (isAdding) {
         return (
             <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1">
                    <div className="container mx-auto px-4 py-8 md:py-12">
                        <AddTransactionForm 
                            onClose={() => setIsAdding(false)} 
                            subGroups={subGroups}
                            initialGroupId={selectedSubGroupId}
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
                        <h1 className="text-3xl font-bold tracking-tight">Mannschaftskassen</h1>
                        <div className="flex items-center gap-2">
                             <Button variant="outline" asChild>
                                <Link href="/admin/team-cash/penalties">
                                    <BookMarked className="mr-2 h-4 w-4" />
                                    Strafenkatalog
                                </Link>
                            </Button>
                            <Button variant="outline" onClick={() => setIsAdding(true)} disabled={subGroups.length === 0}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Transaktion hinzufügen
                            </Button>
                        </div>
                    </div>

                    {isLoading ? (
                         <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                         </div>
                    ) : (
                        <div className="space-y-6">
                           {subGroups.length > 0 ? (
                            <>
                                <div className="max-w-xs space-y-2">
                                    <Label htmlFor="group-select">Mannschaft auswählen</Label>
                                    <Select value={selectedSubGroupId || ""} onValueChange={setSelectedSubGroupId}>
                                        <SelectTrigger id="group-select">
                                            <SelectValue placeholder="Mannschaft auswählen..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {subGroups.map(g => (
                                                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {selectedSubGroupId && (
                                    <TransactionView 
                                        subGroupId={selectedSubGroupId} 
                                        subGroupName={selectedSubGroupName}
                                        onEdit={handleEditTransaction}
                                    />
                                )}
                            </>
                            ) : (
                                <Card>
                                  <CardHeader>
                                    <CardTitle>Keine Mannschaften vorhanden</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <p className="text-muted-foreground mb-4">Es sind keine Untergruppen (Mannschaften) angelegt. Bitte legen Sie zuerst eine an.</p>
                                     <Button asChild>
                                        <Link href="/admin/groups">Gruppen verwalten</Link>
                                    </Button>
                                  </CardContent>
                                </Card>
                            )}
                        </div>
                    )}
                </div>
                 {editingTransaction && (
                    <EditTransactionForm
                        transaction={editingTransaction}
                        subGroups={subGroups}
                        isOpen={!!editingTransaction}
                        onClose={() => setEditingTransaction(null)}
                    />
                )}
            </main>
        </div>
    );
}
