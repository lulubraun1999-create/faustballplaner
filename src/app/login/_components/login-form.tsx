
"use client";

import { useForm } from 'react-hook-form';
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
import { useAuth, useUser } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

const formSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse.'),
  password: z.string().min(1, 'Passwort ist erforderlich.'),
});

export function LoginForm() {
  const auth = useAuth();
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
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    startTransition(true);
    
    signInWithEmailAndPassword(auth, values.email, values.password)
      .then(() => {
        toast({
          title: 'Anmeldung erfolgreich',
          description: 'Willkommen zurück!',
        });
        router.push('/');
      })
      .catch((error) => {
        let description = 'Ein unerwarteter Fehler ist aufgetreten.';
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            description = 'Ungültige Anmeldedaten. Bitte überprüfen Sie Ihre E-Mail und Ihr Passwort.';
            break;
          case 'auth/invalid-email':
            description = 'Die angegebene E-Mail-Adresse ist ungültig.';
            break;
        }
        toast({
          variant: 'destructive',
          title: 'Anmeldung fehlgeschlagen',
          description,
        });
        startTransition(false);
      });
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
    <Card className="w-full max-w-sm">
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Anmelden</CardTitle>
          <CardDescription>
            Geben Sie Ihre E-Mail-Adresse ein, um sich anzumelden.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">E-Mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@beispiel.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm font-medium text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Passwort</Label>
            <Input id="password" type="password" {...register('password')} />
            {errors.password && (
              <p className="text-sm font-medium text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : 'Anmelden'}
          </Button>
          <p className="text-sm text-muted-foreground">
            Noch kein Konto?{' '}
            <Link href="/signup" className="underline hover:text-primary">
              Registrieren
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
