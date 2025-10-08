
"use client";

import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CalendarIcon, PlusCircle, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Group } from '../../groups/page';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormField, FormItem, FormControl, FormMessage, FormLabel } from '@/components/ui/form';

const surveySchema = z.object({
  question: z.string().min(1, "Die Frage darf nicht leer sein."),
  options: z.array(
      z.object({ 
          value: z.string().min(1, "Die Option darf nicht leer sein.") 
      })
  ).min(2, "Es müssen mindestens zwei Optionen vorhanden sein."),
  allowOwnOptions: z.boolean(),
  allowMultipleAnswers: z.boolean(),
  isAnonymous: z.boolean(),
  expiresAt: z.date().optional(),
  archiveAt: z.date().optional(),
  targetGroupIds: z.array(z.string()).default([]),
});


type SurveyFormData = z.infer<typeof surveySchema>;

interface CreateSurveyFormProps {
    onClose: () => void;
    parentGroups: Group[];
    subGroups: Group[];
}

export function CreateSurveyForm({ onClose, parentGroups, subGroups }: CreateSurveyFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const [isPending, setIsPending] = useState(false);
  
  const form = useForm<SurveyFormData>({
    resolver: zodResolver(surveySchema),
    defaultValues: {
      question: '',
      options: [{ value: '' }, { value: '' }],
      allowOwnOptions: false,
      allowMultipleAnswers: false,
      isAnonymous: false,
      expiresAt: undefined,
      archiveAt: undefined,
      targetGroupIds: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options",
  });
    
  const selectedGroups = form.watch('targetGroupIds') || [];

  const onSubmit = (data: SurveyFormData) => {
    if (!user) {
        toast({ variant: 'destructive', title: "Fehler", description: "Sie müssen angemeldet sein." });
        return;
    }
    setIsPending(true);
    
    const surveyData: any = {
        ...data,
        authorId: user.uid,
        authorName: user.displayName,
        createdAt: serverTimestamp(),
        status: 'active',
        voterIds: [],
        options: data.options.map(opt => ({ 
            id: crypto.randomUUID(),
            value: opt.value, 
            votes: 0 
        })),
    };
    
    // Ensure targetGroupIds is an array, even if it's empty
    if (!surveyData.targetGroupIds) {
        surveyData.targetGroupIds = [];
    }

    if (!surveyData.expiresAt) {
        delete surveyData.expiresAt;
    }
    if (!surveyData.archiveAt) {
        delete surveyData.archiveAt;
    }
    
    const surveysRef = collection(firestore, 'surveys');
    addDocumentNonBlocking(surveysRef, surveyData)
        .then(() => {
            toast({ title: "Erfolg", description: "Umfrage wurde erfolgreich erstellt." });
            onClose();
        })
        .catch((error: any) => {
             // This catch is for network errors etc., permission errors are handled by the non-blocking function
            toast({ variant: 'destructive', title: "Fehler", description: error.message || "Die Umfrage konnte nicht erstellt werden." });
        })
        .finally(() => {
            setIsPending(false);
        });
  };
  
  const handleGroupSelection = (groupId: string) => {
    const currentSelected = selectedGroups;
    const newSelected = currentSelected.includes(groupId)
      ? currentSelected.filter(id => id !== groupId)
      : [...currentSelected, groupId];
    form.setValue('targetGroupIds', newSelected, { shouldValidate: true });
  };
  
  const getSubgroupsForParent = (parentId: string) => {
    return subGroups.filter(sg => sg.parentGroupId === parentId);
  }

  return (
     <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Neue Umfrage erstellen</CardTitle>
        <CardDescription>Stelle eine Frage, füge Optionen hinzu und lege die Einstellungen für die Umfrage fest.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Frage</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. Wann sollen wir trainieren?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
                <Label className="font-semibold">Antwortmöglichkeiten</Label>
                {fields.map((field, index) => (
                    <FormField
                        control={form.control}
                        key={field.id}
                        name={`options.${index}.value`}
                        render={({ field }) => (
                            <FormItem>
                                <div className="flex items-center gap-2">
                                <FormControl>
                                    <Input {...field} placeholder={`Option ${index + 1}`} />
                                </FormControl>
                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 2}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                ))}
                 {form.formState.errors.options && form.formState.errors.options.root && <p className="text-sm font-medium text-destructive">{form.formState.errors.options.root.message}</p>}
                 {form.formState.errors.options && !form.formState.errors.options.root && <p className="text-sm font-medium text-destructive">{form.formState.errors.options.message}</p>}


                <Button type="button" variant="outline" onClick={() => append({ value: '' })}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Option hinzufügen
                </Button>
            </div>

            {/* Einstellungen */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Einstellungen</h3>
                <div className="space-y-4 rounded-md border p-4">
                    <FormField
                      control={form.control}
                      name="allowOwnOptions"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                           <div>
                            <FormLabel>Eigene Optionen</FormLabel>
                            <p className="text-sm text-muted-foreground">Teilnehmern erlauben, eigene Optionen hinzuzufügen.</p>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="allowMultipleAnswers"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                           <div>
                            <FormLabel>Mehrfachantworten</FormLabel>
                            <p className="text-sm text-muted-foreground">Teilnehmern erlauben, mehrere Optionen auszuwählen.</p>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isAnonymous"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                           <div>
                            <FormLabel>Anonyme Umfrage</FormLabel>
                            <p className="text-sm text-muted-foreground">Die Namen der Teilnehmer werden nicht erfasst.</p>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                </div>
            </div>
            
            {/* Fristen */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="expiresAt"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Ablauffrist (optional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, 'PPP', { locale: de }) : <span>Wähle ein Datum</span>}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="archiveAt"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Archivieren am (optional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                           <FormControl>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, 'PPP', { locale: de }) : <span>Wähle ein Datum</span>}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                      </Popover>
                      <p className="text-xs text-muted-foreground">Die Umfrage wird nach diesem Datum aus der Hauptansicht ausgeblendet.</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>

            {/* Zielgruppen */}
            <div className="space-y-2">
                <Label className="font-semibold">Zielgruppen (optional)</Label>
                <p className="text-sm text-muted-foreground">Wähle die Gruppen aus, die diese Umfrage sehen sollen. Wenn keine ausgewählt ist, ist sie für alle sichtbar.</p>
                <Accordion type="multiple" className="w-full">
                {parentGroups.map(pg => (
                    <AccordionItem value={pg.id} key={pg.id}>
                        <AccordionTrigger>{pg.name}</AccordionTrigger>
                        <AccordionContent>
                           <div className="space-y-2 pl-4">
                             {getSubgroupsForParent(pg.id).map(sg => (
                                <div key={sg.id} className="flex items-center space-x-2">
                                     <Checkbox
                                        id={`group-${sg.id}`}
                                        checked={selectedGroups.includes(sg.id)}
                                        onCheckedChange={() => handleGroupSelection(sg.id)}
                                    />
                                    <label htmlFor={`group-${sg.id}`} className="text-sm font-medium leading-none">
                                        {sg.name}
                                    </label>
                                </div>
                            ))}
                             {getSubgroupsForParent(pg.id).length === 0 && (
                                <p className="text-sm text-muted-foreground">Keine Untergruppen vorhanden.</p>
                            )}
                           </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
                </Accordion>
            </div>
          
            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>Abbrechen</Button>
                <Button type="submit" disabled={isPending} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                    {isPending ? <Loader2 className="animate-spin" /> : "Umfrage veröffentlichen"}
                </Button>
            </div>
        </form>
        </Form>
      </CardContent>
    </Card>
  );
}
