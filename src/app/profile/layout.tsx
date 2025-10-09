
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth, useUser } from "@/firebase";
import { LogOut, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { Header } from "@/components/shared/header";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const sidebarNavItems = [
  {
    title: "Daten ändern",
    href: "/profile",
  },
  {
    title: "Passwort ändern",
    href: "/profile/password",
  },
];

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
     if (!isUserLoading && !user) {
        router.push('/login');
      }
  }, [user, isUserLoading, router]);

  const handleLogout = async () => {
    if (auth) {
        await auth.signOut();
    }
    router.push('/');
  };

  const handleDeleteAccount = async () => {
    if (user) {
      try {
        await user.delete();
        toast({
          title: 'Konto gelöscht',
          description: 'Ihr Konto wurde erfolgreich und dauerhaft gelöscht.',
        });
        router.push('/');
      } catch (error: any) {
        console.error("Error deleting account:", error);
        // Handle re-authentication if necessary, e.g., by showing a modal
        toast({
          variant: 'destructive',
          title: 'Fehler beim Löschen des Kontos',
          description: 'Aus Sicherheitsgründen müssen Sie sich möglicherweise erneut anmelden, um Ihr Konto zu löschen.',
        });
      }
    }
  };
  
  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-dashed border-primary"></div>
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-5xl px-4 py-8 md:py-12">
          <h1 className="text-2xl font-bold mb-8">Profileinstellungen</h1>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <aside className="md:col-span-1">
              <nav className="flex flex-col space-y-1 mb-8">
                {sidebarNavItems.map((item) => (
                  <Button
                    key={item.href}
                    asChild
                    variant={pathname === item.href ? "secondary" : "ghost"}
                    className="justify-start"
                  >
                    <Link href={item.href}>{item.title}</Link>
                  </Button>
                ))}
                <Button variant="ghost" className="justify-start text-muted-foreground" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </nav>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-center">Konto löschen</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-destructive mb-4 text-center">
                    Das Löschen Ihres Kontos ist eine endgültige Aktion und kann nicht rückgängig gemacht werden. Alle Ihre Daten gehen dabei verloren.
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Konto löschen
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Sind Sie sich absolut sicher?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Diese Aktion kann nicht rückgängig gemacht werden. Dadurch wird Ihr Konto dauerhaft gelöscht und Ihre Daten von unseren Servern entfernt.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive hover:bg-destructive/90"
                          onClick={handleDeleteAccount}
                        >
                          Fortfahren
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </aside>
            <main className="md:col-span-3">{children}</main>
          </div>
        </div>
      </main>
    </div>
  );
}
