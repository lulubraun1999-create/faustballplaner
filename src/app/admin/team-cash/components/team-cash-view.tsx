
"use client";

import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { AddTransactionForm } from './add-transaction-form';
import { EditTransactionModal } from './edit-transaction-modal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

export interface Transaction {
    id: string;
    groupId: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    date: any; // Firestore timestamp
    createdBy: string;
    payer?: string;
}

interface TeamCashViewProps {
    groupId: string;
    canEdit: boolean;
}

export function TeamCashView({ groupId, canEdit }: TeamCashViewProps) {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const [isAdding, setIsAdding] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

    const transactionsQuery = useMemoFirebase(() => {
        if (!firestore || !groupId) return null;
        return query(
            collection(firestore, 'team-cash-transactions'),
            where('groupId', '==', groupId),
            orderBy('date', 'desc')
        );
    }, [firestore, groupId]);

    const { data: transactions, isLoading } = useCollection<Transaction>(transactionsQuery);

    const balance = useMemo(() => {
        if (!transactions) return 0;
        return transactions.reduce((acc, t) => {
            return t.type === 'income' ? acc + t.amount : acc - t.amount;
        }, 0);
    }, [transactions]);
    
    const handleDelete = async (transactionId: string) => {
        if (!firestore) return;
        const transRef = doc(firestore, 'team-cash-transactions', transactionId);
        try {
            await deleteDoc(transRef);
            toast({ title: 'Erfolg', description: 'Transaktion wurde gelöscht.' });
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Fehler', description: e.message || 'Transaktion konnte nicht gelöscht werden.' });
        }
    };


    const formatDate = (timestamp: any) => {
        if (!timestamp) return '-';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return format(date, 'dd.MM.yyyy', { locale: de });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    if (isAdding) {
        return <AddTransactionForm groupId={groupId} onFinished={() => setIsAdding(false)} />;
    }

    return (
        <>
            {editingTransaction && (
                <EditTransactionModal
                    transaction={editingTransaction}
                    isOpen={!!editingTransaction}
                    onClose={() => setEditingTransaction(null)}
                />
            )}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl">Kontostand</CardTitle>
                        <p className={`text-3xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                            {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(balance)}
                        </p>
                    </div>
                    {canEdit && (
                         <Button onClick={() => setIsAdding(true)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Neue Transaktion
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Datum</TableHead>
                                <TableHead>Beschreibung</TableHead>
                                <TableHead>Zahler</TableHead>
                                <TableHead className="text-right">Betrag</TableHead>
                                {canEdit && <TableHead className="text-right">Aktionen</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions && transactions.length > 0 ? (
                                transactions.map(t => (
                                    <TableRow key={t.id}>
                                        <TableCell>{formatDate(t.date)}</TableCell>
                                        <TableCell>{t.description}</TableCell>
                                        <TableCell>{t.payer || '-'}</TableCell>
                                        <TableCell className={`text-right font-medium ${t.type === 'income' ? 'text-green-600' : 'text-destructive'}`}>
                                            {t.type === 'income' ? '+' : '-'} {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(t.amount)}
                                        </TableCell>
                                        {canEdit && (
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => setEditingTransaction(t)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Bist du sicher?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Diese Aktion kann nicht rückgängig gemacht werden. Dies löscht die Transaktion dauerhaft.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(t.id)} className="bg-destructive hover:bg-destructive/90">Löschen</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={canEdit ? 5 : 4} className="h-24 text-center">
                                        Keine Transaktionen gefunden.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    );
}

