
"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, MoreHorizontal, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from 'next/link';
import { useCollection, useFirestore } from "@/firebase";
import { collection, query, orderBy, doc, deleteDoc } from "firebase/firestore";
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Header } from "@/components/shared/header";
import React, { useMemo } from "react";

export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  imageUrls: string[];
  imageKeywords?: string;
  publicAuthor: string;
  authorId: string;
  authorName: string;
  createdAt: any; 
  updatedAt: any;
}


export default function NewsAdminPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const articlesQuery = useMemo(() => {
      if (!firestore) return null;
      return query(collection(firestore, 'news'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: articles, isLoading, error } = useCollection<NewsArticle>(articlesQuery);

  const handleDelete = async (articleId: string) => {
    if (!firestore) return;
    const articleRef = doc(firestore, 'news', articleId);
    try {
      await deleteDoc(articleRef);
      toast({ title: 'Erfolg', description: 'Artikel wurde gelöscht.' });
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Fehler', description: 'Artikel konnte nicht gelöscht werden.' });
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    // Firestore Timestamps need to be converted to JS Date objects
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'dd.MM.yyyy', { locale: de });
  };
  
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight">News</h1>
            <div className="flex items-center gap-2">
                <Button variant="outline" asChild>
                <Link href="/admin/news/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Neuen Artikel erstellen
                </Link>
                </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Bestehende Artikel</CardTitle>
              <CardDescription>
                Hier kannst du alle Nachrichtenartikel sehen, bearbeiten oder löschen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bild</TableHead>
                    <TableHead>Titel</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                      </TableCell>
                    </TableRow>
                  ) : articles && articles.length > 0 ? (
                    articles.map((article) => (
                      <TableRow key={article.id}>
                        <TableCell>
                          {article.imageUrls && article.imageUrls[0] ? (
                            <Image src={article.imageUrls[0]} alt={article.title} width={40} height={40} className="rounded-sm object-cover" data-ai-hint={article.imageKeywords}/>
                          ) : (
                            <div className="w-10 h-10 bg-muted rounded-sm" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                            <Link href={`/news/${article.id}`} className="hover:underline">
                                {article.title}
                            </Link>
                        </TableCell>
                        <TableCell>
                          <div className="bg-muted text-muted-foreground px-2 py-0.5 rounded-md text-xs inline-block" title={`Erstellt von: ${article.authorName}`}>
                              {article.publicAuthor}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(article.createdAt)}</TableCell>
                        <TableCell className="text-right">
                           <div className="flex items-center justify-end gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Menü öffnen</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                        <Link href={`/admin/news/edit/${article.id}`}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Bearbeiten
                                        </Link>
                                    </DropdownMenuItem>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <button className="w-full text-left relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-destructive hover:text-destructive focus:text-destructive">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Löschen
                                            </button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Diese Aktion kann nicht rückgängig gemacht werden. Dadurch wird der Artikel &quot;{article.title}&quot; dauerhaft gelöscht.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(article.id)} className="bg-destructive hover:bg-destructive/90">
                                                    Löschen
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        Keine Artikel gefunden.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
