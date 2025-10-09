
"use client";

import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

interface PenaltyFormProps {
  onClose: () => void;
}

const penaltySchema = z.object({
  description: z.string().min(3, 'Beschreibung ist erforderlich.'),
  amount: z.coerce.number().positive('Betrag muss positiv sein.'),
});

type PenaltyFormData = z.infer<typeof penaltySchema>;

export function PenaltyForm({ onClose }: PenaltyFormProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isPending, startTransition] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<PenaltyFormData>({
    resolver: zodResolver(penaltySchema),
  });

  const onSubmit = (data: PenaltyFormData) => {
    startTransition(true);

    const penaltyData = {
      ...data,
      amount: Math.abs(data.amount),
    };

    const penaltiesRef = collection(firestore, 'team-cash-penalties');
    addDocumentNonBlocking(penaltiesRef, penaltyData)
      .then(() => {
        toast({ title: "Erfolg", description: "Neue Strafe wurde zum Katalog hinzugefügt." });
        onClose();
      })
      .catch((error) => {
        console.error("Error adding penalty:", error);
        toast({ variant: 'destructive', title: "Fehler", description: "Strafe konnte nicht hinzugefügt werden." });
      }).finally(() => {
        startTransition(false);
      });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Neue Strafe hinzufügen</h1>
        <Button variant="outline" onClick={onClose}>Abbrechen</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Strafendetails</CardTitle>
          <CardDescription>Füge eine neue Strafe zum Katalog hinzu.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Textarea {...field} placeholder="Beschreibung (z.B. 'Unentschuldigtes Fehlen')" />
              )}
            />
            {errors.description && <p className="text-sm font-medium text-destructive">{errors.description.message}</p>}

            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <Input {...field} type="number" step="0.01" placeholder="Betrag in €" onChange={e => field.onChange(parseFloat(e.target.value))}/>
              )}
            />
            {errors.amount && <p className="text-sm font-medium text-destructive">{errors.amount.message}</p>}

            <div className="flex justify-end">
              <Button type="submit" disabled={isPending} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                {isPending ? <Loader2 className="animate-spin" /> : "Strafe speichern"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

    