
"use client";

import { ArticleCard } from '@/components/article-card';
import { useUser, useAuth, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { Header } from '@/components/shared/header';
import { useToast } from '@/hooks/use-toast';
import { collection, query, orderBy } from 'firebase/firestore';
import type { NewsArticle } from '@/app/admin/news/page';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  // The query will only be created when the user is authenticated and firestore is available.
  const articlesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'news'), orderBy('createdAt', 'desc'));
  }, [firestore, user]);

  const { data: articles, isLoading: isLoadingArticles } = useCollection<NewsArticle>(articlesQuery);

  const handleAnonymousLogin = async () => {
    if (auth) {
      try {
        const { signInAnonymously } = await import('firebase/auth');
        await signInAnonymously(auth);
        toast({
          title: "Angemeldet",
          description: "Sie sind jetzt als Gast angemeldet.",
        });
      } catch (error) {
        console.error("Anonymous login failed:", error);
        toast({
          variant: "destructive",
          title: "Fehler",
          description: "Die Gast-Anmeldung ist fehlgeschlagen.",
        });
      }
    }
  };

  if (isUserLoading) {
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
        <div className="container mx-auto px-4 py-8 md:py-12">
          <section className="mb-8 animate-fade-in">
            <h1 className="text-2xl font-bold tracking-tight font-headline">
              Aktuelles
            </h1>
          </section>

          {!user ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-8">
              <h2 className="text-xl font-semibold">Willkommen!</h2>
              <p className="text-muted-foreground max-w-md">
                Um auf alle Inhalte zuzugreifen, melden Sie sich bitte an oder erstellen Sie ein neues Konto.
              </p>
              <div className="flex gap-4">
                  <Button asChild>
                      <Link href="/login">Anmelden</Link>
                  </Button>
                  <Button asChild variant="secondary">
                      <Link href="/signup">Registrieren</Link>
                  </Button>
              </div>
               <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-muted/20 px-2 text-muted-foreground">
                      Oder
                    </span>
                  </div>
                </div>
                <Button variant="outline" onClick={handleAnonymousLogin}>Als Gast fortfahren</Button>
            </div>
          ) : isLoadingArticles ? (
             <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'backwards' }}>
              {articles && articles.length > 0 ? articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              )) : (
                 <div className="md:col-span-2 lg:col-span-3 text-center h-48 flex flex-col items-center justify-center">
                    <p className="text-muted-foreground">Keine aktuellen Nachrichten vorhanden.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
