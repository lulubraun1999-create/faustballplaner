
"use client";

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import type { Penalty } from '../page';

interface PenaltyFormProps {
    penalty?: Penalty | null;
    groupId: string;
    isOpen: boolean;
    onClose: () => void;
}

const formSchema = z.object({
  description: z.string().min(1, 'Eine Beschreibung ist erforderlich.'),
  amount: z.preprocess(
    (a) => {
      const parsed = parseFloat(z.string().parse(a).replace(',', '.'));
      return isNaN(parsed) ? undefined : parsed;
    },
    z.number({ required_error: 'Betrag ist erforderlich', invalid_type_error: 'Betrag muss eine Zahl sein.' }).positive("Betrag muss positiv sein")
  ),
});

type FormSchemaType = z.infer<typeof formSchema>;

export function PenaltyForm({ penalty, groupId, isOpen, onClose }: PenaltyFormProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isPending, startTransition] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      amount: undefined,
    }
  });

  const isEditing = !!penalty;

  useEffect(() => {
    if (isOpen) {
        if (penalty) {
            reset({
                description: penalty.description,
                amount: penalty.amount,
            });
        } else {
            reset({
                description: '',
                amount: undefined,
            });
        }
    }
  }, [penalty, isOpen, reset]);

  const onSubmit = (data: FormSchemaType) => {
    startTransition(true);
    
    if (isEditing) {
        const penaltyRef = doc(firestore, 'penalties', penalty.id);
        updateDocumentNonBlocking(penaltyRef, data)
            .then(() => {
                toast({ title: "Erfolg", description: "Strafe wurde aktualisiert." });
                onClose();
            })
            .catch(handleError)
            .finally(() => startTransition(false));
    } else {
        const penaltyData = {
            ...data,
            groupId,
        };
        const penaltiesRef = collection(firestore, 'penalties');
        addDocumentNonBlocking(penaltiesRef, penaltyData)
            .then(() => {
                toast({ title: "Erfolg", description: "Strafe wurde hinzugefügt." });
                onClose();
            })
            .catch(handleError)
            .finally(() => startTransition(false));
    }
  };

  const handleError = (error: any) => {
    toast({ variant: 'destructive', title: "Fehler", description: error.message || "Die Aktion konnte nicht ausgeführt werden." });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>{isEditing ? 'Strafe bearbeiten' : 'Neue Strafe hinzufügen'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
                <div className="space-y-2">
                    <Label htmlFor="description">Beschreibung</Label>
                    <Controller
                        name="description"
                        control={control}
                        render={({ field }) => <Input id="description" placeholder="z.B. Trikot vergessen" {...field} />}
                    />
                    {errors.description && <p className="text-sm font-medium text-destructive">{errors.description.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="amount">Betrag (€)</Label>
                    <Controller
                        name="amount"
                        control={control}
                        render={({ field }) => <Input id="amount" type="number" step="0.01" placeholder="z.B. 5,00" {...field} value={field.value ?? ''}/>}
                    />
                    {errors.amount && <p className="text-sm font-medium text-destructive">{errors.amount.message}</p>}
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Abbrechen</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isPending} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                        {isPending ? <Loader2 className="animate-spin" /> : "Speichern"}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>
  );
}
