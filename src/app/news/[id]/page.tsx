
"use client";

import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { useParams } from "next/navigation";
import { doc } from "firebase/firestore";
import { NewsArticle } from "@/app/admin/news/page";
import { Header } from "@/components/shared/header";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import React, { useMemo } from "react";

export default function ArticleDetailPage() {
  const firestore = useFirestore();
  const params = useParams();
  const articleId = params.id as string;

  const articleRef = useMemoFirebase(() => {
    if (!firestore || !articleId) return null;
    return doc(firestore, 'news', articleId);
  }, [firestore, articleId]);

  const { data: article, isLoading } = useDoc<NewsArticle>(articleRef);
  
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, "d. MMMM yyyy", { locale: de });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Artikel wird geladen...</p>
        </main>
      </div>
    );
  }

  if (!article) {
    return (
       <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <div className="container mx-auto px-4 py-8 md:py-12 text-center">
             <h1 className="text-2xl font-bold">Artikel nicht gefunden</h1>
             <p className="text-muted-foreground">Der angeforderte Artikel konnte nicht gefunden werden.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/20">
        <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12">
            <article className="bg-card rounded-lg shadow-sm p-6 md:p-8">
                <header className="mb-6 border-b pb-4">
                    <div className="flex flex-col gap-4">
                        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight font-headline">{article.title}</h1>
                         <p className="text-muted-foreground text-sm">
                            Veröffentlicht von {article.publicAuthor} am {formatDate(article.createdAt)}
                        </p>
                    </div>
                </header>
                
                {article.imageUrls && article.imageUrls.length > 0 && (
                    <div className="mb-6">
                        <Carousel className="w-full rounded-lg overflow-hidden">
                            <CarouselContent>
                            {article.imageUrls.map((url, index) => (
                                <CarouselItem key={index}>
                                <div className="relative aspect-video w-full">
                                    <Image
                                    src={url}
                                    alt={`${article.title} - Bild ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 896px"
                                    data-ai-hint={article.imageKeywords}
                                    />
                                </div>
                                </CarouselItem>
                            ))}
                            </CarouselContent>
                             {article.imageUrls.length > 1 && (
                                <>
                                    <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10" />
                                    <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10" />
                                </>
                             )}
                        </Carousel>
                    </div>
                )}
                
                <div className="prose prose-lg max-w-none text-foreground/90 whitespace-pre-wrap">
                    {article.content}
                </div>

            </article>
        </div>
      </main>
    </div>
  );
}
