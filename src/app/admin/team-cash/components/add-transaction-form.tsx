
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore, useUser, addDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Loader2 } from 'lucide-react';
import type { MemberProfile } from '../../members/page';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { Penalty } from '../../penalties/page';
import type { Group } from '../../groups/page';

interface AddTransactionFormProps {
    onClose: () => void;
    subGroups: Group[];
    initialGroupId: string | null;
}

const formSchema = z.object({
  groupId: z.string().min(1, 'Eine Mannschaft muss ausgewählt sein.'),
  description: z.string().min(1, 'Eine Beschreibung ist erforderlich.'),
  amount: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        const cleaned = val.replace(',', '.');
        const num = parseFloat(cleaned);
        return isNaN(num) ? undefined : num;
      }
      return val;
    },
    z.number({ invalid_type_error: 'Betrag muss eine Zahl sein.' }).positive("Betrag muss positiv sein")
  ),
  transactionType: z.enum(['income', 'expense']),
  date: z.date({ required_error: 'Ein Datum ist erforderlich.' }),
  memberId: z.string().optional(),
  penaltyId: z.string().optional(),
});


type FormSchemaType = z.infer<typeof formSchema>;

export function AddTransactionForm({ onClose, subGroups, initialGroupId }: AddTransactionFormProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      groupId: initialGroupId || '',
      description: '',
      transactionType: 'income',
      date: new Date(),
      memberId: 'none',
      penaltyId: 'none',
      amount: undefined,
    }
  });

  const transactionType = watch('transactionType');
  const penaltyId = watch('penaltyId');
  const selectedGroupId = watch('groupId');
  
  // Fetch penalties for the selected group on demand
  const penaltiesQuery = useMemoFirebase(() => {
    if (!firestore || !selectedGroupId) return null;
    return query(collection(firestore, 'penalties'), where('groupId', '==', selectedGroupId));
  }, [firestore, selectedGroupId]);
  const { data: penaltiesForGroup, isLoading: isLoadingPenalties } = useCollection<Penalty>(penaltiesQuery);

  // Fetch members for the selected group on demand
  const membersQuery = useMemoFirebase(() => {
    if (!firestore || !selectedGroupId) return null;
    return query(collection(firestore, 'members'), where('groupIds', 'array-contains', selectedGroupId));
  }, [firestore, selectedGroupId]);
  const { data: membersForGroup, isLoading: isLoadingMembers } = useCollection<MemberProfile>(membersQuery);


  useEffect(() => {
    if (penaltyId && penaltyId !== 'none' && penaltiesForGroup) {
        const selectedPenalty = penaltiesForGroup.find(p => p.id === penaltyId);
        if (selectedPenalty) {
            setValue('description', selectedPenalty.description, { shouldValidate: true });
            setValue('amount', selectedPenalty.amount, { shouldValidate: true });
        }
    } else if (penaltyId === 'none') {
        setValue('description', '');
        setValue('amount', undefined);
    }
  }, [penaltyId, penaltiesForGroup, setValue]);

  // When group changes, reset dependent fields
  useEffect(() => {
    setValue('penaltyId', 'none');
    setValue('memberId', 'none');
    setValue('description', '');
    setValue('amount', undefined);
  }, [selectedGroupId, setValue]);

  const sortedMembersForGroup = useMemo(() => {
    if (!membersForGroup) return [];
    return [...membersForGroup].sort((a,b) => (a.nachname || '').localeCompare(b.nachname || ''));
  }, [membersForGroup]);


  const onSubmit = (data: FormSchemaType) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Nicht angemeldet' });
        return;
    }
    setIsPending(true);
    
    const finalAmount = data.transactionType === 'expense' ? -Math.abs(data.amount) : Math.abs(data.amount);
    const selectedMember = membersForGroup?.find(m => m.id === data.memberId);

    const transactionData = {
        groupId: data.groupId,
        description: data.description,
        amount: finalAmount,
        date: data.date,
        memberId: data.memberId === 'none' ? '' : data.memberId,
        memberName: selectedMember ? `${selectedMember.vorname} ${selectedMember.nachname}` : '',
        createdAt: serverTimestamp(),
        createdBy: user.uid,
    };
    
    addDocumentNonBlocking(collection(firestore, 'team-cash-transactions'), transactionData)
      .then(() => {
        toast({ title: "Erfolg", description: "Transaktion wurde hinzugefügt." });
        onClose();
      })
      .catch((error: any) => {
        if (error.name !== 'FirebaseError' || (error.code && error.code !== 'permission-denied')) {
             toast({ variant: 'destructive', title: "Fehler", description: error.message || "Die Transaktion konnte nicht gespeichert werden." });
        }
      })
      .finally(() => {
        setIsPending(false);
      });
  };

  const isPenaltySelected = penaltyId !== 'none';

  return (
    <div>
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Transaktion hinzufügen</h1>
        </div>

        <Card className="max-w-xl mx-auto">
            <form onSubmit={handleSubmit(onSubmit)}>
                <CardHeader>
                    <CardTitle>Neue Transaktion</CardTitle>
                    <CardDescription>Füge eine Ein- oder Ausgabe für eine Mannschaftskasse hinzu.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div className="space-y-2">
                        <Label htmlFor='groupId'>Mannschaft</Label>
                        <Controller
                            name="groupId"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger id="groupId"><SelectValue placeholder="Mannschaft auswählen..." /></SelectTrigger>
                                <SelectContent>
                                    {subGroups.map(group => (
                                    <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                                    ))}
                                </SelectContent>
                                </Select>
                            )}
                        />
                         {errors.groupId && <p className="text-sm font-medium text-destructive">{errors.groupId.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Art der Transaktion</Label>
                        <Controller
                            name="transactionType"
                            control={control}
                            render={({ field }) => (
                                <RadioGroup onValueChange={field.onChange} value={field.value} className="flex items-center gap-4">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="income" id="income" />
                                    <Label htmlFor="income" className="font-normal">Einnahme</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="expense" id="expense" />
                                    <Label htmlFor="expense" className="font-normal">Ausgabe</Label>
                                </div>
                                </RadioGroup>
                            )}
                        />
                    </div>

                     {transactionType === 'income' && (
                        <div className="space-y-2">
                            <Label htmlFor='penaltyId'>Strafe (optional)</Label>
                            <Controller
                                name="penaltyId"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedGroupId || isLoadingPenalties}>
                                    <SelectTrigger id="penaltyId">
                                        <SelectValue placeholder={!selectedGroupId ? "Zuerst Mannschaft wählen" : (isLoadingPenalties) ? "Strafen laden..." : (penaltiesForGroup && penaltiesForGroup.length > 0) ? "Strafe auswählen..." : "Keine Strafen für diese Gruppe"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Keine</SelectItem>
                                        {penaltiesForGroup && penaltiesForGroup.map(penalty => (
                                            <SelectItem key={penalty.id} value={penalty.id}>
                                                {penalty.description} ({new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(penalty.amount)})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                    )}
                   
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Betrag (€)</Label>
                            <Controller
                                name="amount"
                                control={control}
                                render={({ field }) => <Input id="amount" type="text" placeholder="z.B. 10,50" {...field} value={field.value ?? ''} readOnly={isPenaltySelected} />}
                            />
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
                                        {field.value ? format(field.value, "PPP", { locale: de }) : <span>Wähle ein Datum</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={de}/>
                                    </PopoverContent>
                                    </Popover>
                                )}
                            />
                             {errors.date && <p className="text-sm font-medium text-destructive">{errors.date.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Beschreibung</Label>
                        <Controller
                            name="description"
                            control={control}
                            render={({ field }) => <Input id="description" placeholder="z.B. Strafenkatalog, Getränke..." {...field} value={field.value ?? ''} readOnly={isPenaltySelected} />}
                        />
                        {errors.description && <p className="text-sm font-medium text-destructive">{errors.description.message}</p>}
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="memberId">Mitglied (optional)</Label>
                        <Controller
                            name="memberId"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value} disabled={!selectedGroupId || isLoadingMembers}>
                                <SelectTrigger id="memberId"><SelectValue placeholder={!selectedGroupId ? "Zuerst Mannschaft wählen" : isLoadingMembers ? "Mitglieder laden..." : (sortedMembersForGroup && sortedMembersForGroup.length > 0) ? "Mitglied auswählen..." : "Keine Mitglieder für diese Gruppe"} /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Kein Mitglied</SelectItem>
                                    {sortedMembersForGroup && sortedMembersForGroup.map(member => (
                                    <SelectItem key={member.id} value={member.id}>{`${member.vorname} ${member.nachname}`}</SelectItem>
                                    ))}
                                </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>Abbrechen</Button>
                    <Button type="submit" disabled={isPending || !selectedGroupId} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                        {isPending ? <Loader2 className="animate-spin" /> : "Transaktion speichern"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    </div>
  );
}

    

    

    