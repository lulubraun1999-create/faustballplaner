
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Group } from '../page';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

interface ManageGroupsFormProps {
  onClose: () => void;
  parentGroups: Group[];
  allGroups: Group[];
}

const formSchema = z.object({
  action: z.enum(['add', 'edit', 'delete']),
  groupType: z.enum(['parent', 'subgroup']),
  targetGroupId: z.string().optional(),
  parentGroupId: z.string().optional(),
  newName: z.string().optional(),
}).refine(data => {
    if (data.action === 'add' && !data.newName) return false;
    if (data.action === 'edit' && (!data.targetGroupId || !data.newName)) return false;
    if (data.action === 'delete' && !data.targetGroupId) return false;
    if (data.groupType === 'subgroup' && data.action !== 'delete' && !data.parentGroupId) return false;
    return true;
}, { message: "Für die gewählte Aktion sind nicht alle Felder ausgefüllt." });


type FormSchemaType = z.infer<typeof formSchema>;

export function ManageGroupsForm({ onClose, parentGroups, allGroups }: ManageGroupsFormProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isPending, startTransition] = useState(false);

  const { control, handleSubmit, watch, reset, formState: { errors } } = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      action: 'add',
      groupType: 'parent',
      newName: '',
    }
  });

  const action = watch('action');
  const groupType = watch('groupType');

  const onSubmit = (data: FormSchemaType) => {
    startTransition(true);
    const groupsRef = collection(firestore, 'groups');
    
    try {
        if (data.action === 'add') {
            const newGroup: { name: string; parentGroupId?: string } = { name: data.newName! };
            if (data.groupType === 'subgroup') {
                newGroup.parentGroupId = data.parentGroupId;
            }
            addDocumentNonBlocking(groupsRef, newGroup);
            toast({ title: "Erfolg", description: "Gruppe wird hinzugefügt." });
        } else if (data.action === 'edit') {
            const groupRef = doc(firestore, 'groups', data.targetGroupId!);
            const updateData: { name: string; parentGroupId?: string } = { name: data.newName! };
            if (data.groupType === 'subgroup') {
                updateData.parentGroupId = data.parentGroupId;
            }
            updateDocumentNonBlocking(groupRef, updateData);
            toast({ title: "Erfolg", description: "Gruppe wird aktualisiert." });
        } else if (data.action === 'delete') {
             if (!data.targetGroupId) {
                 toast({ variant: 'destructive', title: "Fehler", description: "Keine Gruppe zum Löschen ausgewählt." });
                 startTransition(false);
                 return;
            }
            const groupRef = doc(firestore, 'groups', data.targetGroupId);
            deleteDocumentNonBlocking(groupRef);
            toast({ title: "Erfolg", description: "Gruppe wird gelöscht." });
        }

        // Reset the form but keep some values
        reset({
            action: data.action,
            groupType: data.groupType,
            parentGroupId: data.groupType === 'subgroup' ? data.parentGroupId : undefined,
            newName: '',
            targetGroupId: ''
        });

    } catch(e: any) {
        toast({ variant: 'destructive', title: "Fehler", description: e.message || "Ein unerwarteter Fehler ist aufgetreten." });
    } finally {
        startTransition(false);
    }
  };
  
  const getTargetGroups = () => {
    if (groupType === 'parent') {
        return parentGroups;
    }
    return allGroups.filter(g => g.parentGroupId);
  }

  return (
    <div>
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Gruppen</h1>
            <Button variant="outline" onClick={onClose}>Schließen</Button>
        </div>

        <Card>
            <CardHeader>
            <CardTitle>Gruppen verwalten</CardTitle>
            <CardDescription>Füge neue Gruppen hinzu, bearbeite oder lösche bestehende.</CardDescription>
            </CardHeader>
            <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <Controller
                        name="action"
                        control={control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger><SelectValue placeholder="Aktion wählen..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="add">Hinzufügen</SelectItem>
                                <SelectItem value="edit">Bearbeiten</SelectItem>
                                <SelectItem value="delete">Löschen</SelectItem>
                            </SelectContent>
                            </Select>
                        )}
                    />
                    <Controller
                        name="groupType"
                        control={control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger><SelectValue placeholder="Typ wählen..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="parent">Obergruppe</SelectItem>
                                <SelectItem value="subgroup">Untergruppe</SelectItem>
                            </SelectContent>
                            </Select>
                        )}
                    />
                </div>
                
                {action !== 'add' && (
                     <Controller
                        name="targetGroupId"
                        control={control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                                <SelectValue placeholder={groupType === 'parent' ? "Obergruppe zum Bearbeiten/Löschen wählen..." : "Untergruppe zum Bearbeiten/Löschen wählen..." }/>
                            </SelectTrigger>
                            <SelectContent>
                                {getTargetGroups().map(group => (
                                    <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                        )}
                    />
                )}

                {groupType === 'subgroup' && action !== 'delete' && (
                     <Controller
                        name="parentGroupId"
                        control={control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger><SelectValue placeholder="Obergruppe wählen..." /></SelectTrigger>
                            <SelectContent>
                                {parentGroups.map(group => (
                                <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                        )}
                    />
                )}

                {action !== 'delete' && (
                     <Controller
                        name="newName"
                        control={control}
                        render={({ field }) => (
                            <Input {...field} placeholder="Name für neues/bearbeitetes Element..." value={field.value || ''} />
                        )}
                    />
                )}

                {errors.root && <p className="text-sm font-medium text-destructive">{errors.root.message}</p>}

                <div className="flex justify-end">
                    <Button type="submit" disabled={isPending} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                        {isPending ? <Loader2 className="animate-spin" /> : "Aktion ausführen"}
                    </Button>
                </div>
            </form>
            </CardContent>
        </Card>
    </div>
  );
}
