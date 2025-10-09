
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

const formSchema = z
  .object({
    vorname: z.string().min(1, 'Vorname ist erforderlich.'),
    nachname: z.string().min(1, 'Nachname ist erforderlich.'),
    email: z.string().email('Ungültige E-Mail-Adresse.'),
    password: z.string().min(6, 'Passwort muss mindestens 6 Zeichen haben.'),
    confirmPassword: z.string(),
    registrationCode: z.string().min(1, 'Registrierungscode ist erforderlich.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwörter stimmen nicht überein.',
    path: ['confirmPassword'],
  });

export function SignupForm() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useState(false);

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vorname: '',
      nachname: '',
      email: '',
      password: '',
      confirmPassword: '',
      registrationCode: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    startTransition(true);

    if (!auth || !firestore) {
        toast({
            variant: 'destructive',
            title: 'Registrierung fehlgeschlagen',
            description: 'Firebase ist nicht initialisiert. Bitte laden Sie die Seite neu.',
        });
        startTransition(false);
        return;
    }
    
    if (values.registrationCode !== 'Ellaisttoll') {
        toast({
            variant: 'destructive',
            title: 'Registrierung fehlgeschlagen',
            description: 'Der Registrierungscode ist falsch.',
        });
        startTransition(false);
        return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const newUser = userCredential.user;
      const fullName = `${values.vorname} ${values.nachname}`.trim();

      await updateProfile(newUser, { displayName: fullName });

      const userDocData = {
        name: fullName,
        vorname: values.vorname,
        nachname: values.nachname,
        email: newUser.email,
        rolle: 'spieler',
        adminRechte: false,
        groupIds: [],
      };

      await setDoc(doc(firestore, 'users', newUser.uid), userDocData);
      await setDoc(doc(firestore, 'members', newUser.uid), userDocData);

      toast({
        title: 'Registrierung erfolgreich',
        description: 'Ihr Konto wurde erstellt. Sie werden weitergeleitet.',
      });

      router.push('/');
    } catch (error: any) {
      let description = 'Ein unerwarteter Fehler ist aufgetreten.';
      if (error.code === 'auth/email-already-in-use') {
        description = 'Diese E-Mail-Adresse wird bereits verwendet.';
      } else if (error.code === 'auth/invalid-api-key' || error.code === 'auth/api-key-not-valid') {
        description = 'Der API-Schlüssel ist ungültig. Bitte kontaktieren Sie den Support.';
      } else {
        console.error('Registration Error:', error);
      }
      toast({
        variant: 'destructive',
        title: 'Registrierung fehlgeschlagen',
        description,
      });
      startTransition(false);
    }
  };

  if (isUserLoading || user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Lade...</p>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Konto erstellen</CardTitle>
          <CardDescription>
            Füllen Sie das Formular aus, um sich zu registrieren.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="vorname">Vorname</Label>
              <Controller
                name="vorname"
                control={control}
                render={({ field }) => <Input id="vorname" {...field} />}
              />
              {errors.vorname && (
                <p className="text-sm font-medium text-destructive">
                  {errors.vorname.message}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nachname">Nachname</Label>
              <Controller
                name="nachname"
                control={control}
                render={({ field }) => <Input id="nachname" {...field} />}
              />
              {errors.nachname && (
                <p className="text-sm font-medium text-destructive">
                  {errors.nachname.message}
                </p>
              )}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">E-Mail</Label>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input
                  id="email"
                  type="email"
                  placeholder="name@beispiel.com"
                  {...field}
                />
              )}
            />
            {errors.email && (
              <p className="text-sm font-medium text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="password">Passwort</Label>
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <Input id="password" type="password" {...field} />
                )}
              />
              {errors.password && (
                <p className="text-sm font-medium text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
              <Controller
                name="confirmPassword"
                control={control}
                render={({ field }) => (
                  <Input id="confirmPassword" type="password" {...field} />
                )}
              />
              {errors.confirmPassword && (
                <p className="text-sm font-medium text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>
            <div className="grid gap-2">
              <Label htmlFor="registrationCode">Registrierungscode</Label>
              <Controller
                name="registrationCode"
                control={control}
                render={({ field }) => <Input id="registrationCode" type="text" {...field} placeholder="Code vom Verein" />}
              />
              {errors.registrationCode && (
                <p className="text-sm font-medium text-destructive">
                  {errors.registrationCode.message}
                </p>
              )}
            </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              'Konto erstellen'
            )}
          </Button>
          <p className="text-sm text-muted-foreground">
            Haben Sie bereits ein Konto?{' '}
            <Link href="/login" className="underline hover:text-primary">
              Anmelden
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
