
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth, useFirestore } from "@/firebase";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import { doc } from 'firebase/firestore';
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import React from "react";
import { Loader2 } from "lucide-react";
import { initiateEmailSignUp } from "@/firebase/non-blocking-login";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";

const formSchema = z.object({
  vorname: z.string().min(2, { message: "Vorname muss mindestens 2 Zeichen lang sein." }),
  nachname: z.string().min(2, { message: "Nachname muss mindestens 2 Zeichen lang sein." }),
  email: z.string().email({ message: "Ungültige E-Mail-Adresse." }),
  password: z.string().min(6, { message: "Das Passwort muss mindestens 6 Zeichen lang sein." }),
  registrationCode: z.string().refine(code => code === 'Ellaisttoll', {
    message: "Ungültiger Registrierungscode.",
  }),
});

export function SignUpForm() {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vorname: "",
      nachname: "",
      email: "",
      password: "",
      registrationCode: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    startTransition(async () => {
      if (!auth || !firestore) return;
      try {
        // This will create the user but also sign them in.
        // onAuthStateChanged will pick up the new user.
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          values.email,
          values.password
        );
        const user = userCredential.user;

        const displayName = `${values.vorname} ${values.nachname}`;
        // Update the auth profile
        await updateProfile(user, {
          displayName: displayName,
        });
        
        // Send verification email
        await sendEmailVerification(user);

        // --- Create user profiles in Firestore (non-blocking) ---
        const userDocRef = doc(firestore, "users", user.uid);
        const memberDocRef = doc(firestore, "members", user.uid);

        const profileData = {
          id: user.uid,
          email: values.email,
          vorname: values.vorname,
          nachname: values.nachname,
          name: displayName,
          rolle: 'spieler', // Default role
          adminRechte: false,
          groupIds: [],
        };
        
        // Use non-blocking writes
        setDocumentNonBlocking(userDocRef, profileData, { merge: true });
        setDocumentNonBlocking(memberDocRef, profileData, { merge: true });
        
        // --- ---

        toast({
          title: "Registrierung erfolgreich",
          description: "Bitte überprüfen Sie Ihre E-Mails, um Ihr Konto zu bestätigen. Sie werden zum Login weitergeleitet.",
        });

        // Sign the user out until they verify their email
        await auth.signOut();
        router.push("/login");

      } catch (error: any) {
        let description = "Ein unerwarteter Fehler ist aufgetreten.";
        if (error.code === 'auth/email-already-in-use') {
            description = "Diese E-Mail-Adresse wird bereits verwendet.";
        } else if (error.code === 'permission-denied') {
            description = "Berechtigungsfehler beim Erstellen des Benutzerprofils. Bitte kontaktieren Sie den Administrator.";
        }
        console.error("Registration Error:", error);
        toast({
          variant: "destructive",
          title: "Registrierung fehlgeschlagen",
          description,
        });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="vorname"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vorname</FormLabel>
                <FormControl>
                  <Input placeholder="Max" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nachname"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nachname</FormLabel>
                <FormControl>
                  <Input placeholder="Mustermann" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="name@beispiel.de" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Passwort</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
            control={form.control}
            name="registrationCode"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Registrierungscode</FormLabel>
                <FormControl>
                    <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : "Konto erstellen"}
        </Button>
      </form>
    </Form>
  );
}
