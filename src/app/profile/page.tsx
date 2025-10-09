
"use client";

import { useEffect, useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, CheckIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { de } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { useFirestore, useUser, useDoc } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { MemberProfile } from '@/app/admin/members/page';


const profileSchema = z.object({
  vorname: z.string().optional(),
  nachname: z.string().optional(),
  telefon: z.string().optional(),
  wohnort: z.string().optional(),
  geschlecht: z.string().optional(),
  position: z.array(z.string()).optional(),
  geburtstag: z.date().optional(),
  rolle: z.string().optional(),
  adminRechte: z.boolean().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isPending, startTransition] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const userProfileRef = useMemo(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userProfileData } = useDoc<MemberProfile>(userProfileRef);
  const isAdmin = userProfileData?.adminRechte === true;

  const { control, handleSubmit, reset, setValue, watch, getValues } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      vorname: '',
      nachname: '',
      telefon: '',
      wohnort: '',
      geschlecht: '',
      position: [],
      geburtstag: undefined,
      rolle: '',
      adminRechte: false,
    },
  });
  
  const selectedPositions = watch('position') || [];

  useEffect(() => {
    if (user && firestore) {
      const fetchUserData = async () => {
        setIsLoading(true);
        const docRef = doc(firestore, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as any;
           // Firestore timestamps need to be converted to JS Date objects
          if (data.geburtstag && data.geburtstag.toDate) {
            data.geburtstag = data.geburtstag.toDate();
          }
          reset(data);
        }
        setIsLoading(false);
      };
      fetchUserData();
    }
  }, [user, firestore, reset]);

  const togglePosition = (position: string) => {
    const currentPositions = getValues('position') || [];
    const newPositions = currentPositions.includes(position)
      ? currentPositions.filter(p => p !== position)
      : [...currentPositions, position];
    setValue('position', newPositions);
  };
  
  const onSubmit = (data: ProfileFormData) => {
    if (!user) return;
    startTransition(true);

    const userDocRef = doc(firestore, "users", user.uid);
    const memberDocRef = doc(firestore, "members", user.uid);

    const dataToSave = {
        ...data,
        name: `${data.vorname || ''} ${data.nachname || ''}`.trim(),
        email: user.email,
    };

    // Write to both collections
    Promise.all([
        setDoc(userDocRef, dataToSave, { merge: true }),
        setDoc(memberDocRef, dataToSave, { merge: true })
    ]).then(() => {
      toast({ title: "Profil aktualisiert", description: "Ihre Daten wurden erfolgreich gespeichert." });
    }).catch((e) => {
      console.error(e);
      toast({ variant: 'destructive', title: "Fehler", description: "Ihre Daten konnten nicht gespeichert werden." });
    }).finally(() => {
      startTransition(false);
    });
  };

  if (isLoading) {
     return (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Daten ändern</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="vorname">Vorname</Label>
            <Controller
              name="vorname"
              control={control}
              render={({ field }) => <Input id="vorname" {...field} value={field.value || ''} />}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nachname">Nachname</Label>
             <Controller
              name="nachname"
              control={control}
              render={({ field }) => <Input id="nachname" {...field} value={field.value || ''}/>}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="telefon">Telefon</Label>
            <Controller
              name="telefon"
              control={control}
              render={({ field }) => <Input id="telefon" {...field} value={field.value || ''}/>}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wohnort">Wohnort</Label>             <Controller
              name="wohnort"
              control={control}
              render={({ field }) => <Input id="wohnort" {...field} value={field.value || ''} />}
            />
          </div>
        </div>
        <div className="space-y-3">
          <Label>Geschlecht</Label>
          <Controller
              name="geschlecht"
              control={control}
              render={({ field }) => (
                <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="maennlich" id="maennlich" />
                    <Label htmlFor="maennlich" className="font-normal">Männlich</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="weiblich" id="weiblich" />
                    <Label htmlFor="weiblich" className="font-normal">Weiblich</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="divers-damen" id="divers-damen" />
                    <Label htmlFor="divers-damen" className="font-normal">Divers (Damen-Team)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="divers-herren" id="divers-herren" />
                    <Label htmlFor="divers-herren" className="font-normal">Divers (Herren-Team)</Label>
                  </div>
                </RadioGroup>
              )}
            />
        </div>
        <div className="space-y-3">
          <Label>Position</Label>
          <div className="flex gap-2">
            {['Abwehr', 'Zuspiel', 'Angriff'].map(position => (
              <Button
                key={position}
                type="button"
                variant={selectedPositions.includes(position) ? "secondary" : "outline"}
                onClick={() => togglePosition(position)}
                className={cn("flex-1 justify-center", {
                  "bg-muted": selectedPositions.includes(position)
                })}
              >
                {selectedPositions.includes(position) && <CheckIcon className="mr-2 h-4 w-4" />}
                {position}
              </Button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Geburtstag</Label>
            <Controller
              name="geburtstag"
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "PPP", { locale: de }) : <span>Wähle ein Datum</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                     <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        locale={de}
                        weekStartsOn={1}
                        captionLayout="dropdown-buttons"
                        fromYear={1904}
                        toYear={new Date().getFullYear()}
                        initialFocus
                      />
                  </PopoverContent>
                </Popover>
              )}
            />
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
        </div>
        
        {isAdmin && (
            <div className="flex items-center space-x-2">
            <Controller
                name="adminRechte"
                control={control}
                render={({ field }) => (
                <Checkbox id="admin-rechte" checked={field.value} onCheckedChange={field.onChange} />
                )}
            />
            <div className="grid gap-1.5 leading-none">
                <label
                htmlFor="admin-rechte"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                Admin-Rechte
                </label>
                <p className="text-sm text-muted-foreground">
                Gewährt vollen administrativen Zugriff auf die App.
                </p>
            </div>
            </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
             {isPending ? <Loader2 className="animate-spin" /> : "Speichern"}
          </Button>
        </div>
      </form>
    </div>
  );
}
