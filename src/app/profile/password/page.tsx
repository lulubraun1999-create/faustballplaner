"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/firebase";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Aktuelles Passwort ist erforderlich."),
  newPassword: z.string().min(6, "Neues Passwort muss mindestens 6 Zeichen haben."),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Die Passwörter stimmen nicht überein.",
  path: ["confirmPassword"],
});

export default function PasswordPage() {
  const auth = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  const onSubmit = (values: z.infer<typeof passwordSchema>) => {
    startTransition(async () => {
      const user = auth.currentUser;
      if (!user || !user.email) return;

      const credential = EmailAuthProvider.credential(user.email, values.currentPassword);

      try {
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, values.newPassword);
        
        toast({
          title: "Erfolg",
          description: "Ihr Passwort wurde geändert. Sie werden abgemeldet.",
        });
        
        await auth.signOut();
        router.push("/login");

      } catch (error: any) {
        let description = "Ein Fehler ist aufgetreten.";
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          description = "Das aktuelle Passwort ist nicht korrekt.";
        }
        toast({
          variant: "destructive",
          title: "Fehler",
          description,
        });
      }
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Passwort ändern</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-md">
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <Label htmlFor="current-password">Aktuelles Passwort</Label>
                <FormControl>
                  <Input id="current-password" type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <Label htmlFor="new-password">Neues Passwort</Label>
                <FormControl>
                  <Input id="new-password" type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <Label htmlFor="confirm-password">Neues Passwort bestätigen</Label>
                <FormControl>
                  <Input id="confirm-password" type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end">
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isPending}>
              {isPending ? <Loader2 className="animate-spin" /> : "Passwort ändern"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
