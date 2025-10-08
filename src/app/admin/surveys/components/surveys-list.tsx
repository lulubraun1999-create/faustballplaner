
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { BarChart, MoreHorizontal, Trash2 } from "lucide-react";
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { Survey } from '../page';
import { useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";

interface SurveysListProps {
  surveys: Survey[];
  onShowResults: (survey: Survey) => void;
}

export function SurveysList({ surveys, onShowResults }: SurveysListProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'dd.MM.yyyy', { locale: de });
  };
  
  const getStatusBadgeVariant = (status: Survey['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'active':
        return 'default';
      case 'closed':
        return 'secondary';
      case 'archived':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const handleDelete = (surveyId: string, surveyQuestion: string) => {
    const surveyRef = doc(firestore, 'surveys', surveyId);
    // Non-blocking delete
    deleteDocumentNonBlocking(surveyRef);
    toast({
      title: "Löschung eingeleitet",
      description: `Die Umfrage "${surveyQuestion}" wird gelöscht.`,
    });
  };

  return (
    <div className="rounded-md border">
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead>Frage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Erstellt am</TableHead>
                <TableHead>Gültig bis</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {surveys.length > 0 ? surveys.map((survey) => (
                <TableRow key={survey.id}>
                <TableCell className="font-medium">{survey.question}</TableCell>
                <TableCell>
                    <Badge variant={getStatusBadgeVariant(survey.status)}>
                        {survey.status}
                    </Badge>
                </TableCell>
                <TableCell>{formatDate(survey.createdAt)}</TableCell>
                <TableCell>{survey.expiresAt ? formatDate(survey.expiresAt) : 'Unbegrenzt'}</TableCell>
                <TableCell className="text-right">
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Menü öffnen</span>
                        <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onShowResults(survey)}>
                            <BarChart className="mr-2 h-4 w-4" />
                            Ergebnisse
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
                                        Diese Aktion kann nicht rückgängig gemacht werden. Dadurch wird die Umfrage &quot;{survey.question}&quot; dauerhaft gelöscht.
                                    </D/AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(survey.id, survey.question)} className="bg-destructive hover:bg-destructive/90">
                                        Löschen
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
                </TableRow>
            )) : (
                <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                    Keine Umfragen gefunden. Erstellen Sie eine neue!
                </TableCell>
                </TableRow>
            )}
            </TableBody>
        </Table>
    </div>
  );
}
