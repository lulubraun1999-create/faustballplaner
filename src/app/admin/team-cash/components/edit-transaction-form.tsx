
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore, updateDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Loader2 } from 'lucide-react';
import type { Group } from '../../groups/page';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { TeamCashTransaction } from '../page';
import type { MemberProfile } from '../../members/page';

interface EditTransactionFormProps {
    transaction: TeamCashTransaction;
    isOpen: boolean;
    onClose: () => void;
    subGroups: Group[];
}

const formSchema = z.object({
  groupId: z.string().min(1, 'Eine Gruppe muss ausgewählt sein.'),
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
});

type FormSchemaType = z.infer<typeof formSchema>;

export function EditTransactionForm({ transaction, isOpen, onClose, subGroups }: EditTransactionFormProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isPending, startTransition] = useState(false);

  const { control, handleSubmit, watch, reset, formState: { errors } } = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      groupId: '',
      description: '',
      transactionType: 'income',
      date: new Date(),
      memberId: 'none',
      amount: 0,
    }
  });

  const selectedGroupId = watch('groupId');
  
  const membersQuery = useMemoFirebase(() => {
    if (!firestore || !selectedGroupId) return null;
    return query(collection(firestore, 'members'), where('groupIds', 'array-contains', selectedGroupId));
  }, [firestore, selectedGroupId]);
  const { data: membersInGroup, isLoading: isLoadingMembers } = useCollection<MemberProfile>(membersQuery);

  const sortedMembersInGroup = useMemo(() => {
    if (!membersInGroup) return [];
    return [...membersInGroup].sort((a,b) => (a.nachname || '').localeCompare(b.nachname || ''));
  }, [membersInGroup]);


  useEffect(() => {
    if (transaction) {
      reset({
        groupId: transaction.groupId,
        description: transaction.description,
        amount: Math.abs(transaction.amount),
        transactionType: transaction.amount >= 0 ? 'income' : 'expense',
        date: transaction.date?.toDate ? transaction.date.toDate() : new Date(transaction.date),
        memberId: transaction.memberId || 'none',
      });
    }
  }, [transaction, reset]);

  const onSubmit = (data: FormSchemaType) => {
    startTransition(true);
    
    const finalAmount = data.transactionType === 'expense' ? -Math.abs(data.amount!) : Math.abs(data.amount!);
    const selectedMember = membersInGroup?.find(m => m.id === data.memberId);

    const transactionData = {
        groupId: data.groupId,
        description: data.description,
        amount: finalAmount,
        date: data.date,
        memberId: data.memberId === 'none' ? '' : data.memberId,
        memberName: selectedMember ? `${selectedMember.vorname} ${selectedMember.nachname}` : '',
    };
    
    const transactionRef = doc(firestore, 'team-cash-transactions', transaction.id);
    updateDocumentNonBlocking(transactionRef, transactionData)
        .then(() => {
            toast({ title: "Erfolg", description: "Transaktion wurde aktualisiert." });
            onClose();
        })
        .catch((error: any) => {
            toast({ variant: 'destructive', title: "Fehler", description: error.message || "Die Transaktion konnte nicht aktualisiert werden." });
        }).finally(() => {
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
                    <Label htmlFor='groupId'>Untergruppe</Label>
                    <Controller
                        name="groupId"
                        control={control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value} disabled>
                            <SelectTrigger id="groupId"><SelectValue placeholder="Untergruppe wählen..." /></SelectTrigger>
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
                                <RadioGroupItem value="income" id="edit-income" />
                                <Label htmlFor="edit-income" className="font-normal">Einnahme</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="expense" id="edit-expense" />
                                <Label htmlFor="edit-expense" className="font-normal">Ausgabe</Label>
                            </div>
                            </RadioGroup>
                        )}
                    />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Betrag (€)</Label>
                        <Controller
                            name="amount"
                            control={control}
                            render={({ field }) => <Input id="amount" type="text" placeholder="z.B. 10,50" {...field} value={field.value || ''}/>}
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
                        render={({ field }) => <Input id="description" placeholder="z.B. Strafenkatalog, Getränke..." {...field} value={field.value || ''} />}
                    />
                    {errors.description && <p className="text-sm font-medium text-destructive">{errors.description.message}</p>}
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="memberId">Mitglied (optional)</Label>
                    <Controller
                        name="memberId"
                        control={control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingMembers || !sortedMembersInGroup}>
                                <SelectTrigger id="memberId"><SelectValue placeholder={isLoadingMembers ? 'Laden...' : 'Mitglied auswählen...'}/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Kein Mitglied</SelectItem>
                                    {sortedMembersInGroup && sortedMembersInGroup.map(member => (
                                        <SelectItem key={member.id} value={member.id}>{`${member.vorname} ${member.nachname}`}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Abbrechen</Button>
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

    