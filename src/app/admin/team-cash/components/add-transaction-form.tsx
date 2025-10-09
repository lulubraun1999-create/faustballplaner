
"use client";

import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { MemberProfile } from '../../members/page';
import { Textarea } from '@/components/ui/textarea';

interface AddTransactionFormProps {
  groupId: string;
  onClose: () => void;
}

const transactionSchema = z.object({
  type: z.enum(['einzahlung', 'strafe']),
  amount: z.coerce.number().positive('Betrag muss positiv sein.'),
  description: z.string().min(3, 'Beschreibung ist erforderlich.'),
  memberId: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

export function AddTransactionForm({ groupId, onClose }: AddTransactionFormProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isPending, startTransition] = useState(false);

  // Fetch members of the selected group to populate the dropdown
  const membersQuery = useMemoFirebase(() => {
    if (!firestore || !groupId) return null;
    return query(collection(firestore, 'members'), where('groupIds', 'array-contains', groupId));
  }, [firestore, groupId]);
  const { data: members, isLoading: isLoadingMembers } = useCollection<MemberProfile>(membersQuery);

  const { control, handleSubmit, formState: { errors } } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'strafe',
      description: '',
    },
  });

  const onSubmit = (data: TransactionFormData) => {
    startTransition(true);

    const selectedMember = members?.find(m => m.id === data.memberId);
    
    const transactionData = {
      groupId,
      ...data,
      amount: Math.abs(data.amount), // Ensure amount is positive
      memberName: selectedMember?.name || 'Allgemein',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const transactionsRef = collection(firestore, 'team-cash-transactions');
    addDocumentNonBlocking(transactionsRef, transactionData)
      .then(() => {
        toast({ title: "Erfolg", description: "Transaktion wurde hinzugefügt." });
        onClose();
      })
      .catch((error) => {
        // Error is handled by non-blocking update, just log and inform user
        console.error("Error adding transaction:", error);
        toast({ variant: 'destructive', title: "Fehler", description: "Transaktion konnte nicht hinzugefügt werden." });
        startTransition(false);
      });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Neue Transaktion</h1>
        <Button variant="outline" onClick={onClose}>Abbrechen</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Transaktionsdetails</CardTitle>
          <CardDescription>Füge eine neue Einzahlung oder eine Strafe hinzu.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue placeholder="Typ wählen..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strafe">Strafe</SelectItem>
                    <SelectItem value="einzahlung">Einzahlung</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.type && <p className="text-sm font-medium text-destructive">{errors.type.message}</p>}
            
            <Controller
              name="memberId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingMembers ? "Lade Mitglieder..." : "Mitglied wählen (optional)..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingMembers ? (
                        <div className="flex items-center justify-center p-4"><Loader2 className="animate-spin"/></div>
                    ) : (
                        members?.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)
                    )}
                  </SelectContent>
                </Select>
              )}
            />

            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <Input {...field} type="number" step="0.01" placeholder="Betrag in €" onChange={e => field.onChange(parseFloat(e.target.value))}/>
              )}
            />
            {errors.amount && <p className="text-sm font-medium text-destructive">{errors.amount.message}</p>}

            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Textarea {...field} placeholder="Beschreibung (z.B. 'Verspätung Training')" />
              )}
            />
            {errors.description && <p className="text-sm font-medium text-destructive">{errors.description.message}</p>}

            <div className="flex justify-end">
              <Button type="submit" disabled={isPending} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                {isPending ? <Loader2 className="animate-spin" /> : "Speichern"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
