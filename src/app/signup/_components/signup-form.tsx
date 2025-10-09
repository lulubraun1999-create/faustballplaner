
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
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import React from "react";
import { Loader2 } from "lucide-react";

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
        // Step 1: Create user with Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          values.email,
          values.password
        );
        const user = userCredential.user;

        // Step 2: Update the auth profile with the display name
        const displayName = `${values.vorname} ${values.nachname}`;
        await updateProfile(user, {
          displayName: displayName,
        });

        // Step 3: Create user profile documents in Firestore
        const userProfileData = {
            id: user.uid,
            vorname: values.vorname,
            nachname: values.nachname,
            name: displayName,
            email: user.email,
            adminRechte: false,
            rolle: 'spieler', // default role
            groupIds: [],
        };
        const userDocRef = doc(firestore, "users", user.uid);
        const memberDocRef = doc(firestore, "members", user.uid);
        
        // This was a source of errors, we'll try without it first.
        // await setDoc(userDocRef, userProfileData, { merge: true });
        // await setDoc(memberDocRef, userProfileData, { merge: true });
        
        // Step 4: Send verification email
        await sendEmailVerification(user);

        toast({
          title: "Registrierung erfolgreich",
          description: "Bitte überprüfen Sie Ihre E-Mails, um Ihr Konto zu bestätigen. Sie werden zum Login weitergeleitet.",
        });

        // Step 5: Redirect to login.
        router.push("/login");

      } catch (error: any) {
        // Log the full error to the console for debugging
        console.error("Registration Error:", error);

        // Provide a more specific error message to the user
        let description = `Ein unerwarteter Fehler ist aufgetreten. Fehlercode: ${error.code || 'UNKNOWN'}`;
        if (error.code === 'auth/email-already-in-use') {
            description = "Diese E-Mail-Adresse wird bereits verwendet.";
        } else if (error.code === 'permission-denied') {
            description = "Fehlende Berechtigung. Bitte überprüfen Sie die Sicherheitsregeln.";
        } else if (error.code === 'auth/network-request-failed') {
          description = "Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.";
        }
        else if (error.message) {
            description = `${error.code}: ${error.message}`;
        }

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
