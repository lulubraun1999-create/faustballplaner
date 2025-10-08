
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NewsArticle } from '@/app/admin/news/page';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './ui/carousel';

interface ArticleCardProps {
  article: NewsArticle;
}

export function ArticleCard({ article }: ArticleCardProps) {
  
  const contentPreview = article.content.length > 150 
    ? `${article.content.substring(0, 150)}...` 
    : article.content;

  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-xl">
      <CardHeader className="p-0">
        {article.imageUrls && article.imageUrls.length > 0 && (
           <Carousel className="w-full">
            <CarouselContent>
              {article.imageUrls.map((url, index) => (
                <CarouselItem key={index}>
                  <div className="relative aspect-[3/2] w-full">
                    <Image
                      src={url}
                      alt={`${article.title} - Bild ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      data-ai-hint={article.imageKeywords}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {article.imageUrls.length > 1 && (
              <>
                <CarouselPrevious className="absolute left-2" />
                <CarouselNext className="absolute right-2" />
              </>
            )}
          </Carousel>
        )}
      </CardHeader>
      <div className="flex flex-1 flex-col p-6">
        <CardTitle className="mb-2 text-xl font-headline">{article.title}</CardTitle>
        <CardDescription className="flex-1 text-base/relaxed whitespace-pre-wrap">{contentPreview}</CardDescription>
      </div>
      <CardFooter className="flex justify-between items-center p-6 pt-0">
        <p className="text-sm text-muted-foreground font-medium">{article.publicAuthor}</p>
        <Button asChild size="sm" variant="outline">
          <Link href={`/news/${article.id}`}>
            Weiterlesen
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
