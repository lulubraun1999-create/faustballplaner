"use client";

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { MemberProfile, Group } from '../page';
import { Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface EditMemberModalProps {
  member: MemberProfile | null;
  groups: Group[];
  isOpen: boolean;
  onClose: () => void;
}

const editMemberSchema = z.object({
  rolle: z.string().min(1, 'Rolle ist erforderlich.'),
  groupIds: z.array(z.string()).optional(),
});

type EditMemberFormData = z.infer<typeof editMemberSchema>;

export function EditMemberModal({ member, groups, isOpen, onClose }: EditMemberModalProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isPending, startTransition] = useState(false);

  const { control, handleSubmit, reset, watch, setValue } = useForm<EditMemberFormData>({
    resolver: zodResolver(editMemberSchema),
    defaultValues: {
      rolle: '',
      groupIds: [],
    },
  });

  const selectedGroupIds = watch('groupIds') || [];
  
  useEffect(() => {
    if (member) {
      reset({
        rolle: member.rolle || '',
        groupIds: member.groupIds || [],
      });
    }
  }, [member, reset]);

  const parentGroups = groups.filter(g => !g.parentGroupId);
  const subGroupsByParent = parentGroups.reduce((acc, parent) => {
    acc[parent.id] = groups.filter(sub => sub.parentGroupId === parent.id);
    return acc;
  }, {} as Record<string, Group[]>);


  const onSubmit = (data: EditMemberFormData) => {
    if (!member) return;

    startTransition(true);
    const dataToSave = {
      rolle: data.rolle,
      groupIds: data.groupIds,
    };

    const userDocRef = doc(firestore, 'users', member.id);
    const memberDocRef = doc(firestore, 'members', member.id);

    // Update both documents
    updateDocumentNonBlocking(userDocRef, dataToSave);
    updateDocumentNonBlocking(memberDocRef, dataToSave);

    toast({
      title: 'Mitglied aktualisiert',
      description: `Die Daten für ${member.name} wurden gespeichert.`,
    });

    startTransition(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Mitglied bearbeiten</DialogTitle>
        </DialogHeader>
        {member && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div>
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <p className="font-semibold">{member.name}</p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="rolle">Rolle</Label>
                 <Controller
                    name="rolle"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="rolle">
                            <SelectValue placeholder="Rolle auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="trainer">Trainer</SelectItem>
                            <SelectItem value="betreuer">Betreuer</SelectItem>
                            <SelectItem value="spieler">Spieler</SelectItem>
                        </SelectContent>
                        </Select>
                    )}
                />
            </div>
             <div className="space-y-2">
                <Label>Gruppenzugehörigkeit</Label>
                <div className="space-y-3 rounded-md border p-4 max-h-60 overflow-y-auto">
                    {parentGroups.map(parent => (
                        <div key={parent.id} className="space-y-2">
                             <div className="flex items-center space-x-2">
                                <Checkbox
                                    id={`group-${parent.id}`}
                                    checked={selectedGroupIds.includes(parent.id)}
                                    onCheckedChange={(checked) => {
                                        const currentIds = selectedGroupIds;
                                        const newIds = checked
                                            ? [...currentIds, parent.id]
                                            : currentIds.filter(id => id !== parent.id);
                                        setValue('groupIds', newIds, { shouldValidate: true });
                                    }}
                                />
                                <label htmlFor={`group-${parent.id}`} className="font-semibold">{parent.name}</label>
                            </div>
                            {subGroupsByParent[parent.id]?.length > 0 && (
                                <div className="ml-6 space-y-2">
                                    {subGroupsByParent[parent.id].map(sub => (
                                         <div key={sub.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`group-${sub.id}`}
                                                checked={selectedGroupIds.includes(sub.id)}
                                                onCheckedChange={(checked) => {
                                                    const currentIds = selectedGroupIds;
                                                    const newIds = checked
                                                        ? [...currentIds, sub.id]
                                                        : currentIds.filter(id => id !== sub.id);
                                                    setValue('groupIds', newIds, { shouldValidate: true });
                                                }}
                                            />
                                            <label htmlFor={`group-${sub.id}`} className="text-sm">{sub.name}</label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
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
        )}
      </DialogContent>
    </Dialog>
  );
}
