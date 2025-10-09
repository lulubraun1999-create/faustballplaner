
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
import { useAuth, useUser } from "@/firebase";
import {
  signInWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";

const formSchema = z.object({
  email: z.string().email({ message: "Ungültige E-Mail-Adresse." }),
  password: z.string().min(1, { message: "Passwort ist erforderlich." }),
});

export function LoginForm() {
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const [isPending, startTransition] = React.useTransition();
  const [showResend, setShowResend] = useState(false);
  const [emailForResend, setEmailForResend] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!isUserLoading && user && user.emailVerified) {
      router.push("/");
    }
  }, [user, isUserLoading, router]);

  const handleResendVerification = async () => {
    if (!auth?.currentUser) {
        toast({
            variant: "destructive",
            title: "Fehler",
            description: "Es wurde kein Benutzer gefunden, für den eine E-Mail gesendet werden kann. Bitte versuchen Sie sich erneut anzumelden."
        });
        return;
    }
    try {
        await sendEmailVerification(auth.currentUser);
        toast({
            title: "E-Mail gesendet",
            description: "Eine neue Bestätigungs-E-Mail wurde an Ihre Adresse gesendet. Bitte überprüfen Sie Ihr Postfach."
        });
        setShowResend(false);
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Senden fehlgeschlagen",
            description: "Die Bestätigungs-E-Mail konnte nicht gesendet werden. Bitte versuchen Sie es später erneut."
        });
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    startTransition(async () => {
      if (!auth) return;
      setShowResend(false);
      try {
        const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
        
        if (!userCredential.user.emailVerified) {
          toast({
            variant: "destructive",
            title: "Anmeldung fehlgeschlagen",
            description: "Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse.",
          });
          setEmailForResend(values.email);
          setShowResend(true);
          // Don't sign out immediately, so we can resend verification
          // await auth.signOut();
          return;
        }

        toast({
          title: "Erfolgreich angemeldet",
          description: "Sie werden weitergeleitet.",
        });
        router.push("/");
      } catch (error: any) {
        let description = "Ein unerwarteter Fehler ist aufgetreten.";
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            description = "Falsche E-Mail-Adresse oder falsches Passwort.";
        }
        toast({
          variant: "destructive",
          title: "Anmeldung fehlgeschlagen",
          description,
        });
      }
    });
  };

  if (isUserLoading || (user && user.emailVerified)) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
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
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : "Login"}
        </Button>
      </form>
      {showResend && (
        <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">Ihre E-Mail ist nicht bestätigt.</p>
            <Button variant="outline" onClick={handleResendVerification} className="w-full">
                Bestätigungs-E-Mail erneut senden
            </Button>
        </div>
      )}
    </Form>
  );
}
