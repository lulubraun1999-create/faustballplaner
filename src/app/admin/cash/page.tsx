
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirestore, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, getDoc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { Header } from '@/components/shared/header';
import { Loader2, Plus, Minus, Euro } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { MemberProfile } from '../members/page';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';


// Types based on backend.json
interface Group {
  id: string;
  name: string;
  parentGroupId?: string;
}

interface CashRegister {
    id: string;
    groupId: string;
    balance: number;
}

interface Transaction {
    id: string;
    type: 'income' | 'expense';
    description: string;
    amount: number;
    date: any;
    memberId: string;
    memberName: string;
}

const transactionSchema = z.object({
    type: z.enum(['income', 'expense']),
    description: z.string().min(1, 'Beschreibung ist erforderlich.'),
    amount: z.preprocess(
        (a) => parseFloat(z.string().parse(a)),
        z.number().positive('Betrag muss positiv sein.')
    ),
    memberId: z.string().min(1, 'Mitglied ist erforderlich.'),
});

type TransactionFormData = z.infer<typeof transactionSchema>;


const AddTransactionForm = ({ group, members, cashRegister, onTransactionAdded }: { group: Group, members: MemberProfile[], cashRegister: CashRegister | null, onTransactionAdded: () => void }) => {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isPending, startTransition] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const { control, handleSubmit, reset, formState: { errors } } = useForm<TransactionFormData>({
        resolver: zodResolver(transactionSchema),
        defaultValues: {
            type: 'expense',
            description: '',
            amount: 0,
            memberId: '',
        },
    });

    const onSubmit = (data: TransactionFormData) => {
        if (!firestore || !cashRegister) return;
        startTransition(true);

        const selectedMember = members.find(m => m.id === data.memberId);
        if (!selectedMember) {
             toast({ variant: 'destructive', title: 'Fehler', description: 'Ausgewähltes Mitglied nicht gefunden.' });
             startTransition(false);
             return;
        }

        const transactionData = {
            ...data,
            date: serverTimestamp(),
            memberName: selectedMember.name,
        };

        const newBalance = data.type === 'income'
            ? cashRegister.balance + data.amount
            : cashRegister.balance - data.amount;

        const transactionRef = collection(firestore, 'groups', group.id, 'cashRegister', cashRegister.id, 'transactions');
        const cashRegisterRef = doc(firestore, 'groups', group.id, 'cashRegister', cashRegister.id);

        addDocumentNonBlocking(transactionRef, transactionData);
        updateDocumentNonBlocking(cashRegisterRef, { balance: newBalance });

        toast({ title: 'Erfolg', description: 'Transaktion wird hinzugefügt.' });
        reset();
        onTransactionAdded();
        setIsOpen(false);
        startTransition(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Neue Transaktion
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Neue Transaktion für {group.name}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                     <Controller
                        name="type"
                        control={control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger><SelectValue placeholder="Typ wählen..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="expense">Ausgabe</SelectItem>
                                    <SelectItem value="income">Einnahme</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />

                    <div className="space-y-1">
                        <Label htmlFor="description">Beschreibung</Label>
                        <Controller name="description" control={control} render={({ field }) => <Input id="description" {...field} />} />
                        {errors.description && <p className="text-sm font-medium text-destructive">{errors.description.message}</p>}
                    </div>

                     <div className="space-y-1">
                        <Label htmlFor="amount">Betrag (€)</Label>
                        <Controller name="amount" control={control} render={({ field }) => <Input id="amount" type="number" step="0.01" {...field} />} />
                         {errors.amount && <p className="text-sm font-medium text-destructive">{errors.amount.message}</p>}
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="memberId">Mitglied</Label>
                        <Controller
                            name="memberId"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger><SelectValue placeholder="Mitglied wählen..." /></SelectTrigger>
                                    <SelectContent>
                                        {members.map(member => (
                                            <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.memberId && <p className="text-sm font-medium text-destructive">{errors.memberId.message}</p>}
                    </div>
                    
                    <DialogFooter>
                        <DialogClose asChild><Button variant="ghost">Abbrechen</Button></DialogClose>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? <Loader2 className="animate-spin" /> : 'Speichern'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default function CashPage() {
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();

    const groupsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'groups'), where('parentGroupId', '!=', null));
    }, [firestore, user]);
    const { data: subGroups, isLoading: isLoadingGroups } = useCollection<Group>(groupsQuery);

    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

    const cashRegisterQuery = useMemoFirebase(() => {
        if (!firestore || !selectedGroup) return null;
        return query(collection(firestore, 'groups', selectedGroup.id, 'cashRegister'));
    }, [firestore, selectedGroup]);
    const { data: cashRegisters, isLoading: isLoadingCashRegister } = useCollection<CashRegister>(cashRegisterQuery);

    const cashRegister = useMemo(() => cashRegisters?.[0], [cashRegisters]);

    const transactionsQuery = useMemoFirebase(() => {
        if (!firestore || !selectedGroup || !cashRegister) return null;
        return query(collection(firestore, 'groups', selectedGroup.id, 'cashRegister', cashRegister.id, 'transactions'), where('amount', '>', 0));
    }, [firestore, selectedGroup, cashRegister]);

    const { data: transactions, isLoading: isLoadingTransactions, error } = useCollection<Transaction>(transactionsQuery);

    const membersInGroupQuery = useMemoFirebase(() => {
        if (!firestore || !selectedGroup) return null;
        return query(collection(firestore, 'members'), where('groupIds', 'array-contains', selectedGroup.id));
    }, [firestore, selectedGroup]);
    const { data: membersInGroup, isLoading: isLoadingMembers } = useCollection<MemberProfile>(membersInGroupQuery);
    
    // Auto-create cash register if it doesn't exist
    useEffect(() => {
        if (firestore && selectedGroup && !isLoadingCashRegister && cashRegisters && cashRegisters.length === 0) {
            const registerRef = collection(firestore, 'groups', selectedGroup.id, 'cashRegister');
            addDoc(registerRef, {
                groupId: selectedGroup.id,
                balance: 0,
            }).then(() => {
                console.log(`Cash register created for ${selectedGroup.name}`);
            });
        }
    }, [firestore, selectedGroup, isLoadingCashRegister, cashRegisters]);

    useEffect(() => {
        if (subGroups && subGroups.length > 0 && !selectedGroup) {
            setSelectedGroup(subGroups[0]);
        }
    }, [subGroups, selectedGroup]);
    
    const formatCurrency = (amount: number | undefined | null) => {
        if (amount === undefined || amount === null) return '-,-- €';
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
    }
    
    const handleGroupSelect = (groupId: string) => {
        const group = subGroups?.find(g => g.id === groupId) || null;
        setSelectedGroup(group);
    };

    const sortedTransactions = useMemo(() => {
        if (!transactions) return [];
        return [...transactions].sort((a, b) => b.date.toMillis() - a.date.toMillis());
    }, [transactions]);

    const isLoading = isUserLoading || isLoadingGroups;

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
                <div className="container mx-auto px-4 py-8 md:py-12">
                    <section className="mb-8">
                        <h1 className="text-3xl font-bold tracking-tight">Mannschaftskasse</h1>
                        <p className="text-muted-foreground">Wähle eine Untergruppe, um die Kasse zu verwalten.</p>
                    </section>

                    {isLoading ? (
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                    ) : (
                        <div className="space-y-8">
                            <Select onValueChange={handleGroupSelect} value={selectedGroup?.id}>
                                <SelectTrigger className="w-full md:w-1/3">
                                    <SelectValue placeholder="Untergruppe wählen..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {subGroups?.map(group => (
                                        <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {selectedGroup && (
                                <>
                                    {isLoadingCashRegister || isLoadingMembers ? (
                                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                    ) : (
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between">
                                                <div>
                                                    <CardTitle>Übersicht für {selectedGroup.name}</CardTitle>
                                                    <CardDescription>Aktueller Kontostand und Transaktionen</CardDescription>
                                                </div>
                                                <AddTransactionForm 
                                                    group={selectedGroup} 
                                                    members={membersInGroup || []}
                                                    cashRegister={cashRegister || null}
                                                    onTransactionAdded={() => {
                                                        // This is a bit of a hack to force re-fetch
                                                        setSelectedGroup(null);
                                                        setTimeout(() => setSelectedGroup(selectedGroup), 100);
                                                    }}
                                                />
                                            </CardHeader>
                                            <CardContent className="space-y-6">
                                                <div className="text-center">
                                                    <p className="text-sm text-muted-foreground">Aktueller Saldo</p>
                                                    <p className={`text-4xl font-bold ${ (cashRegister?.balance ?? 0) < 0 ? 'text-destructive' : 'text-primary'}`}>
                                                        {formatCurrency(cashRegister?.balance)}
                                                    </p>
                                                </div>
                                                
                                                <h3 className="font-semibold text-lg">Letzte Transaktionen</h3>
                                                
                                                {isLoadingTransactions ? (
                                                    <Loader2 className="mx-auto h-6 w-6 animate-spin"/>
                                                ) : error ? (
                                                    <div className="text-destructive text-center">Fehler beim Laden der Transaktionen.</div>
                                                ) : (
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Datum</TableHead>
                                                                <TableHead>Beschreibung</TableHead>
                                                                <TableHead>Mitglied</TableHead>
                                                                <TableHead className="text-right">Betrag</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {sortedTransactions && sortedTransactions.length > 0 ? (
                                                                sortedTransactions.map(t => (
                                                                    <TableRow key={t.id}>
                                                                        <TableCell>{t.date ? format(t.date.toDate(), 'dd.MM.yyyy') : '-'}</TableCell>
                                                                        <TableCell>{t.description}</TableCell>
                                                                        <TableCell>{t.memberName}</TableCell>
                                                                        <TableCell className={`text-right font-medium ${t.type === 'income' ? 'text-green-600' : 'text-destructive'}`}>
                                                                            {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))
                                                            ) : (
                                                                <TableRow>
                                                                    <TableCell colSpan={4} className="h-24 text-center">
                                                                        Keine Transaktionen gefunden.
                                                                    </TableCell>
                                                                </TableRow>
                                                            )}
                                                        </TableBody>
                                                    </Table>
                                                )}
                                            </CardContent>
                                        </Card>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
