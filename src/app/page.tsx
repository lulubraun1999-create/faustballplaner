
"use client";

import { ArticleCard } from '@/components/article-card';
import { useUser, useAuth, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Header } from '@/components/shared/header';
import { useToast } from '@/hooks/use-toast';
import { collection, query, orderBy } from 'firebase/firestore';
import type { NewsArticle } from '@/app/admin/news/page';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const articlesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'news'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: articles, isLoading: isLoadingArticles } = useCollection<NewsArticle>(articlesQuery);

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

          {isLoadingArticles ? (
             <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'backwards' }}>
              {articles && articles.length > 0 ? articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              )) : (
                <p>Keine aktuellen Nachrichten vorhanden.</p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
