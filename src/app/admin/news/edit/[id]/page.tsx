
"use client";

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useFirestore, useUser } from '@/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/shared/header';

const articleSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich.'),
  content: z.string().min(1, 'Inhalt ist erforderlich.'),
  imageUrls: z.string().optional(),
  imageKeywords: z.string().optional(),
});

type ArticleFormData = z.infer<typeof articleSchema>;

export default function EditArticlePage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const articleId = params.id as string;
  
  const [isPending, startTransition] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ArticleFormData>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: '',
      content: '',
      imageUrls: '',
      imageKeywords: '',
    },
  });
  
  useEffect(() => {
    if (firestore && articleId) {
      const fetchArticle = async () => {
        setIsLoading(true);
        const articleRef = doc(firestore, 'news', articleId);
        const docSnap = await getDoc(articleRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          reset({
            title: data.title,
            content: data.content,
            imageUrls: (data.imageUrls || []).join('\n'),
            imageKeywords: data.imageKeywords || '',
          });
        } else {
          toast({ variant: 'destructive', title: 'Fehler', description: 'Artikel nicht gefunden.' });
          router.push('/admin/news');
        }
        setIsLoading(false);
      };
      fetchArticle();
    }
  }, [firestore, articleId, reset, router, toast]);

  const onSubmit = (data: ArticleFormData) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Nicht angemeldet', description: 'Sie müssen angemeldet sein, um einen Artikel zu bearbeiten.' });
      return;
    }
    startTransition(true);

    const imageUrlsArray = data.imageUrls?.split('\n').map(url => url.trim()).filter(url => url) || [];

    const articleData = {
      title: data.title,
      content: data.content,
      imageUrls: imageUrlsArray,
      imageKeywords: data.imageKeywords,
      updatedAt: serverTimestamp(),
    };

    const articleRef = doc(firestore, 'news', articleId);
    updateDoc(articleRef, articleData)
      .then(() => {
        toast({ title: 'Erfolg', description: 'Artikel wurde erfolgreich aktualisiert.' });
        router.push('/admin/news');
      })
      .catch((error) => {
        console.error('Error updating document: ', error);
        toast({ variant: 'destructive', title: 'Fehler', description: 'Artikel konnte nicht aktualisiert werden.' });
        startTransition(false);
      });
  };
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>Artikel bearbeiten</CardTitle>
              <CardDescription>
                Ändere die Felder, um den News-Beitrag zu aktualisieren.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Titel</Label>
                  <Controller
                    name="title"
                    control={control}
                    render={({ field }) => <Input id="title" {...field} />}
                  />
                  {errors.title && <p className="text-sm font-medium text-destructive">{errors.title.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Inhalt</Label>
                  <Controller
                    name="content"
                    control={control}
                    render={({ field }) => <Textarea id="content" {...field} rows={10} />}
                  />
                  {errors.content && <p className="text-sm font-medium text-destructive">{errors.content.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imageUrls">Bild-URLs</Label>
                  <Controller
                    name="imageUrls"
                    control={control}
                    render={({ field }) => <Textarea id="imageUrls" {...field} rows={3} placeholder="Füge eine URL pro Zeile ein" />}
                  />
                  <p className="text-sm text-muted-foreground">Füge für jedes Bild eine URL in einer neuen Zeile ein.</p>
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="imageKeywords">Bild-Stichwörter (für AI)</Label>
                    <Controller
                        name="imageKeywords"
                        control={control}
                        render={({field}) => <Input id="imageKeywords" {...field} placeholder="z.B. soccer celebration" />}
                    />
                    <p className="text-sm text-muted-foreground">Gib 1-2 Stichwörter an, die das Bild beschreiben.</p>
                </div>


                <div className="flex justify-end gap-2">
                  <Button variant="outline" asChild>
                    <Link href="/admin/news">Abbrechen</Link>
                  </Button>
                  <Button type="submit" disabled={isPending} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                    {isPending ? <Loader2 className="animate-spin" /> : 'Änderungen speichern'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
