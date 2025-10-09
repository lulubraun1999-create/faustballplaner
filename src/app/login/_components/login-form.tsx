
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
  sendEmailVerification,
  signInWithEmailAndPassword,
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
  const [isPending, startTransition] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  
  useEffect(() => {
    if (!isUserLoading && user) {
        if (user.emailVerified) {
            router.push("/");
        }
    }
  }, [user, isUserLoading, router]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!auth) return;
    
    startTransition(true);
    
    signInWithEmailAndPassword(auth, values.email, values.password)
      .then((userCredential) => {
        const user = userCredential.user;
        if (user.emailVerified) {
          toast({
            title: "Anmeldung erfolgreich",
            description: "Sie werden weitergeleitet.",
          });
          router.push("/");
        } else {
          sendEmailVerification(user);
          toast({
            variant: "destructive",
            title: "E-Mail nicht verifiziert",
            description: "Bitte überprüfen Sie Ihr Postfach. Eine neue Bestätigungs-E-Mail wurde gesendet.",
          });
        }
      })
      .catch((error) => {
        let description = "Ein unerwarteter Fehler ist aufgetreten.";
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            description = "Falsche E-Mail-Adresse oder falsches Passwort.";
            break;
          case 'auth/invalid-email':
            description = "Die E-Mail-Adresse ist ungültig.";
            break;
          case 'auth/api-key-not-valid':
             description = `Der API-Schlüssel ist ungültig. (${error.code})`;
             break;
          case 'auth/network-request-failed':
             description = `Netzwerkfehler. Bitte überprüfen Sie Ihre Verbindung. (${error.code})`;
             break;
          default:
            description = `Fehler: ${error.message} (${error.code})`;
        }
        toast({
          variant: "destructive",
          title: "Anmeldung fehlgeschlagen",
          description,
        });
      })
      .finally(() => {
        startTransition(false);
      });
  };

  if (isUserLoading) {
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
    </Form>
  );
}
