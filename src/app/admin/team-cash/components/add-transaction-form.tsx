
"use client";

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface AddTransactionFormProps {
    groupId: string;
    onFinished: () => void;
}

const formSchema = z.object({
    description: z.string().min(1, 'Beschreibung ist erforderlich.'),
    amount: z.coerce.number().positive('Betrag muss positiv sein.'),
    type: z.enum(['income', 'expense'], { required_error: 'Typ ist erforderlich.'}),
    date: z.date({ required_error: 'Datum ist erforderlich.'}),
    payer: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function AddTransactionForm({ groupId, onFinished }: AddTransactionFormProps) {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const [isPending, startTransition] = useState(false);

    const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            description: '',
            amount: 0,
            type: 'expense',
            date: new Date(),
            payer: '',
        }
    });

    const onSubmit = (data: FormData) => {
        if (!user || !firestore) return;

        startTransition(true);

        const transData = {
            ...data,
            groupId,
            createdAt: serverTimestamp(),
            createdBy: user.uid,
        };

        addDoc(collection(firestore, 'team-cash-transactions'), transData)
            .then(() => {
                toast({ title: 'Erfolg', description: 'Transaktion hinzugefügt.' });
                onFinished();
            })
            .catch((e) => {
                toast({ variant: 'destructive', title: 'Fehler', description: e.message || "Transaktion konnte nicht hinzugefügt werden." });
            })
            .finally(() => {
                startTransition(false);
            });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Neue Transaktion</CardTitle>
                <CardDescription>Füge eine Einnahme oder Ausgabe hinzu.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                        <Label>Typ</Label>
                        <Controller
                            name="type"
                            control={control}
                            render={({ field }) => (
                                <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="expense" id="expense" />
                                        <Label htmlFor="expense" className="font-normal">Ausgabe</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="income" id="income" />
                                        <Label htmlFor="income" className="font-normal">Einnahme</Label>
                                    </div>
                                </RadioGroup>
                            )}
                        />
                        {errors.type && <p className="text-sm font-medium text-destructive">{errors.type.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Beschreibung</Label>
                        <Controller name="description" control={control} render={({ field }) => <Input id="description" {...field} />} />
                        {errors.description && <p className="text-sm font-medium text-destructive">{errors.description.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Betrag (€)</Label>
                            <Controller name="amount" control={control} render={({ field }) => <Input id="amount" type="number" step="0.01" {...field} />} />
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
                            {errors.date && <p className="text-sm font-medium text-destructive">{errors.date.message}</p>}
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="payer">Zahler (Optional)</Label>
                        <Controller name="payer" control={control} render={({ field }) => <Input id="payer" {...field} placeholder="Name des Zahlers oder Mitglieds" />} />
                        {errors.payer && <p className="text-sm font-medium text-destructive">{errors.payer.message}</p>}
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={onFinished} disabled={isPending}>
                            Abbrechen
                        </Button>
                        <Button type="submit" disabled={isPending} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                            {isPending ? <Loader2 className="animate-spin" /> : "Speichern"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
