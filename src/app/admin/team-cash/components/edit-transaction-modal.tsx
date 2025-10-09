
"use client";

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Transaction } from './team-cash-view';

interface EditTransactionModalProps {
    transaction: Transaction;
    isOpen: boolean;
    onClose: () => void;
}

const formSchema = z.object({
    description: z.string().min(1, 'Beschreibung ist erforderlich.'),
    amount: z.coerce.number().positive('Betrag muss positiv sein.'),
    type: z.enum(['income', 'expense']),
    date: z.date(),
    payer: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function EditTransactionModal({ transaction, isOpen, onClose }: EditTransactionModalProps) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isPending, startTransition] = useState(false);

    const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(formSchema),
    });

    useEffect(() => {
        if (transaction) {
            reset({
                ...transaction,
                date: transaction.date.toDate ? transaction.date.toDate() : new Date(transaction.date),
            });
        }
    }, [transaction, reset]);

    const onSubmit = (data: FormData) => {
        if (!firestore) return;

        startTransition(true);

        const transRef = doc(firestore, 'team-cash-transactions', transaction.id);
        
        updateDoc(transRef, {
            ...data
        })
        .then(() => {
            toast({ title: 'Erfolg', description: 'Transaktion aktualisiert.' });
            onClose();
        })
        .catch((e) => {
            toast({ variant: 'destructive', title: 'Fehler', description: e.message || "Transaktion konnte nicht aktualisiert werden." });
        })
        .finally(() => {
            startTransition(false);
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Transaktion bearbeiten</DialogTitle>
                </DialogHeader>
                 <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label>Typ</Label>
                        <Controller
                            name="type"
                            control={control}
                            render={({ field }) => (
                                <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="expense" id="edit-expense" />
                                        <Label htmlFor="edit-expense" className="font-normal">Ausgabe</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="income" id="edit-income" />
                                        <Label htmlFor="edit-income" className="font-normal">Einnahme</Label>
                                    </div>
                                </RadioGroup>
                            )}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-description">Beschreibung</Label>
                        <Controller name="description" control={control} render={({ field }) => <Input id="edit-description" {...field} />} />
                        {errors.description && <p className="text-sm font-medium text-destructive">{errors.description.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-amount">Betrag (€)</Label>
                            <Controller name="amount" control={control} render={({ field }) => <Input id="edit-amount" type="number" step="0.01" {...field} />} />
                            {errors.amount && <p className="text-sm font-medium text-destructive">{errors.amount.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Datum</Label>
                            <Controller
                                name="date"
                                control={control}
                                render={({ field }) => (
                                     <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                            variant={"outline"}
                                            className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                                            >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {field.value ? format(field.value, "PPP", { locale: de }) : <span>Datum wählen</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={de} />
                                        </PopoverContent>
                                    </Popover>
                                )}
                            />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="edit-payer">Zahler (Optional)</Label>
                        <Controller name="payer" control={control} render={({ field }) => <Input id="edit-payer" {...field} value={field.value || ''} placeholder="Name des Zahlers oder Mitglieds" />} />
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="ghost" disabled={isPending}>Abbrechen</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isPending} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                            {isPending ? <Loader2 className="animate-spin" /> : "Änderungen speichern"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

