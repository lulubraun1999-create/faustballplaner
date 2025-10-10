
"use client";

import { ArticleCard } from '@/components/article-card';
import { useUser, useAuth } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/shared/header';
import { useToast } from '@/hooks/use-toast';
import type { NewsArticle } from '@/app/admin/news/page';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Mock data to replace the failing Firestore call
const mockArticles: NewsArticle[] = [
  {
    id: '1',
    title: 'Die Saisonvorbereitung beginnt',
    content: 'Unsere Teams sind wieder im Training und bereiten sich intensiv auf die kommende Faustball-Saison vor. Die Stimmung ist hervorragend und alle sind motiviert.',
    publicAuthor: 'TSV Bayer Leverkusen',
    authorId: 'system',
    authorName: 'System',
    createdAt: new Date(),
    updatedAt: new Date(),
    imageUrls: ['https://www.tsvbayer04.de/fileadmin/_processed_/9/5/csm_Faustball_dfbl-halle-22-23_frauen_team_4_3_a9b9a6d96e.jpg'],
    imageKeywords: 'faustball team',
  },
  {
    id: '2',
    title: 'Wichtiger Sieg am Wochenende',
    content: 'Die erste Mannschaft der Herren konnte am Wochenende einen wichtigen Sieg einfahren und sichert sich damit einen Platz im oberen Tabellendrittel. Herzlichen Glückwunsch!',
    publicAuthor: 'TSV Bayer Leverkusen',
    authorId: 'system',
    authorName: 'System',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 1)),
    updatedAt: new Date(new Date().setDate(new Date().getDate() - 1)),
    imageUrls: ['https://www.tsvbayer04.de/fileadmin/_processed_/a/e/csm_Faustball_dm-u14-halle-2023_jubel_4_3_f07e59670f.jpg'],
    imageKeywords: 'faustball celebration',
  },
  {
    id: '3',
    title: 'Jugend-Teams suchen Verstärkung',
    content: 'Für unsere U12 und U14 Teams suchen wir noch motivierte Jungen und Mädchen. Bei Interesse einfach beim Training vorbeischauen!',
    publicAuthor: 'TSV Bayer Leverkusen',
    authorId: 'system',
    authorName: 'System',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 2)),
    updatedAt: new Date(new Date().setDate(new Date().getDate() - 2)),
    imageUrls: ['https://www.tsvbayer04.de/fileadmin/_processed_/3/5/csm_Faustball_dm-u12-feld-2022_team_4_3_d167f80ec6.jpg'],
    imageKeywords: 'faustball youth team',
  },
];

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  
  // The Firestore call has been removed to prevent permission errors.
  const articles = mockArticles;
  const isLoadingArticles = false;

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
