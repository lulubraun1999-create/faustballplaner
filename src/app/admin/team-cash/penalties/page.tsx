
"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Header } from "@/components/shared/header";
import { useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, doc, where } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, MoreHorizontal, PlusCircle, Trash2, Edit, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Group } from '../../members/page';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useToast } from '@/hooks/use-toast';
import { PenaltyForm } from './components/penalty-form';


export interface Penalty {
    id: string;
    groupId: string;
    description: string;
    amount: number;
}

export default function PenaltiesPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [selectedSubGroupId, setSelectedSubGroupId] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPenalty, setEditingPenalty] = useState<Penalty | null>(null);

    // Queries
    const groupsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'groups'));
    }, [firestore]);
    const { data: allGroups, isLoading: isLoadingGroups } = useCollection<Group>(groupsQuery);

    // Memos
    const subGroups = useMemo(() => {
        if (!allGroups) return [];
        return allGroups.filter(g => g.parentGroupId).sort((a, b) => a.name.localeCompare(b.name));
    }, [allGroups]);
    
    // Effects
    useEffect(() => {
        if (subGroups.length > 0 && selectedSubGroupId === null) {
            setSelectedSubGroupId(subGroups[0].id);
        } else if (subGroups.length === 0) {
            setSelectedSubGroupId(null);
        }
    }, [subGroups, selectedSubGroupId]);

    const penaltiesQuery = useMemoFirebase(() => {
        if (!firestore || !selectedSubGroupId) return null;
        return query(
            collection(firestore, 'penalties'), 
            where('groupId', '==', selectedSubGroupId),
            orderBy('description')
        );
    }, [firestore, selectedSubGroupId]);
    const { data: penaltiesForSelectedGroup, isLoading: isLoadingPenalties } = useCollection<Penalty>(penaltiesQuery);


    const selectedSubGroup = useMemo(() => {
        if (!selectedSubGroupId) return null;
        return subGroups.find(g => g.id === selectedSubGroupId) || null;
    }, [selectedSubGroupId, subGroups]);

    
    // Handlers
    const handleDelete = (penaltyId: string) => {
        if (!firestore) return;
        const docRef = doc(firestore, 'penalties', penaltyId);
        deleteDocumentNonBlocking(docRef);
        toast({ title: "Strafe gelöscht", description: "Die Strafe wurde erfolgreich entfernt." });
    };
    
    const openAddForm = () => {
        setEditingPenalty(null);
        setIsFormOpen(true);
    };

    const openEditForm = (penalty: Penalty) => {
        setEditingPenalty(penalty);
        setIsFormOpen(true);
    };

    // Render helpers
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
    };
    
    const pageIsLoading = isLoadingGroups || (selectedSubGroupId && isLoadingPenalties);

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
                <div className="container mx-auto px-4 py-8 md:py-12">
                     <div className="flex justify-between items-center mb-8">
                        <div className='flex items-center gap-4'>
                            <Button variant="outline" size="icon" asChild>
                                <Link href="/admin/team-cash"><ArrowLeft className="h-4 w-4" /></Link>
                            </Button>
                            <h1 className="text-3xl font-bold tracking-tight">Strafenkatalog</h1>
                        </div>
                        <Button 
                            variant="outline" 
                            onClick={openAddForm}
                            disabled={!selectedSubGroupId}
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Neue Strafe
                        </Button>
                    </div>

                    {isLoadingGroups ? (
                         <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                         </div>
                    ) : subGroups.length === 0 ? (
                        <div className="text-center text-muted-foreground p-8 border rounded-lg">
                             <p className="mb-4">Es sind keine Untergruppen vorhanden. Bitte legen Sie zuerst eine Gruppe an, um Strafen zu definieren.</p>
                            <Button asChild>
                                <Link href="/admin/groups">Gruppen anlegen</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-8">
                             <div className="max-w-xs space-y-2">
                                <Label htmlFor="group-select">Mannschaft</Label>
                                <Select onValueChange={(value) => setSelectedSubGroupId(value)} value={selectedSubGroupId || ''}>
                                    <SelectTrigger id="group-select"><SelectValue placeholder="Mannschaft auswählen..." /></SelectTrigger>
                                    <SelectContent>
                                        {subGroups.map(group => (
                                            <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedSubGroup && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Strafen für {selectedSubGroup.name}</CardTitle>
                                        <CardDescription>Definieren Sie hier die Strafen für diese Mannschaft.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                    {isLoadingPenalties ? (
                                        <div className="flex items-center justify-center h-24">
                                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        </div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Beschreibung</TableHead>
                                                    <TableHead className="text-right">Betrag</TableHead>
                                                    <TableHead className="w-[50px] text-right">Aktion</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {penaltiesForSelectedGroup && penaltiesForSelectedGroup.length > 0 ? (
                                                    penaltiesForSelectedGroup.map(p => (
                                                        <TableRow key={p.id}>
                                                            <TableCell>{p.description}</TableCell>
                                                            <TableCell className="text-right font-medium">{formatCurrency(p.amount)}</TableCell>
                                                            <TableCell className="text-right">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                         <DropdownMenuItem onClick={() => openEditForm(p)}>
                                                                            <Edit className="mr-2 h-4 w-4" /> Bearbeiten
                                                                        </DropdownMenuItem>
                                                                        <AlertDialog>
                                                                            <AlertDialogTrigger asChild>
                                                                                <button className="w-full text-left relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-destructive hover:text-destructive focus:text-destructive">
                                                                                    <Trash2 className="mr-2 h-4 w-4" />Löschen
                                                                                </button>
                                                                            </AlertDialogTrigger>
                                                                            <AlertDialogContent>
                                                                                <AlertDialogHeader>
                                                                                    <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
                                                                                    <AlertDialogDescription>
                                                                                        Diese Aktion kann nicht rückgängig gemacht werden. Die Strafe "{p.description}" wird dauerhaft gelöscht.
                                                                                    </AlertDialogDescription>
                                                                                </AlertDialogHeader>
                                                                                <AlertDialogFooter>
                                                                                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                                                                    <AlertDialogAction onClick={() => handleDelete(p.id)} className="bg-destructive hover:bg-destructive/90">Löschen</AlertDialogAction>
                                                                                </AlertDialogFooter>
                                                                            </AlertDialogContent>
                                                                        </AlertDialog>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                             
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={3} className="h-24 text-center">
                                                           {selectedSubGroupId ? "Keine Strafen für diese Gruppe definiert." : "Bitte wählen Sie eine Mannschaft aus."}
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}
                </div>
                 {isFormOpen && selectedSubGroupId && (
                    <PenaltyForm
                        penalty={editingPenalty}
                        groupId={selectedSubGroupId}
                        isOpen={isFormOpen}
                        onClose={() => setIsFormOpen(false)}
                    />
                )}
            </main>
        </div>
    );
}
