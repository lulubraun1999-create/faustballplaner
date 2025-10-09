
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { MemberProfile, Group } from '../page';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Trash2, Edit, Loader2, Search } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, writeBatch, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { EditMemberModal } from './edit-member-modal';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';


interface MembersTableProps {
    allGroups: Group[];
}

export function MembersTable({ allGroups }: MembersTableProps) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [parentGroupFilter, setParentGroupFilter] = useState('all');
    const [subGroupFilter, setSubGroupFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<MemberProfile | null>(null);

    // Initial query to fetch all members, set immediately.
    const initialQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'members'));
    }, [firestore]);

    const [activeQuery, setActiveQuery] = useState<any>(initialQuery);
    
    // When firestore is ready, set the active query to the initial query
    useEffect(() => {
        if (initialQuery && !activeQuery) {
            setActiveQuery(initialQuery);
        }
    }, [initialQuery, activeQuery]);


    const membersQuery = useMemoFirebase(() => {
        if (!firestore || !activeQuery) return null;
        return activeQuery;
    }, [firestore, activeQuery]);

    const { data: users, isLoading } = useCollection<MemberProfile>(membersQuery);

    const parentGroups = useMemo(() => allGroups.filter(g => !g.parentGroupId), [allGroups]);
    
    const availableSubGroups = useMemo(() => {
        if (parentGroupFilter === 'all') return [];
        return allGroups.filter(g => g.parentGroupId === parentGroupFilter);
    }, [allGroups, parentGroupFilter]);


    const handleSearch = () => {
        if (!firestore) return;

        let q: any;
        const filters: any[] = [];
        
        if (roleFilter !== 'all') {
            filters.push(where('rolle', '==', roleFilter));
        }

        let groupIdsToFilter: string[] = [];

        if (parentGroupFilter !== 'all') {
            if (subGroupFilter !== 'all') {
                // If a specific subgroup is selected, filter by it directly
                groupIdsToFilter.push(subGroupFilter);
            } else {
                // If only a parent group is selected, find all its subgroups + the parent group itself
                const subGroupIdsOfParent = availableSubGroups.map(sg => sg.id);
                groupIdsToFilter = [parentGroupFilter, ...subGroupIdsOfParent];
            }
        }
        
        if (groupIdsToFilter.length > 0) {
            filters.push(where('groupIds', 'array-contains-any', groupIdsToFilter));
        }
        
        if (filters.length > 0) {
             q = query(collection(firestore, 'members'), ...filters);
        } else {
             // If no filters are selected, show all members
             q = query(collection(firestore, 'members'));
        }

        setActiveQuery(q);
    }
    
    // Manual search term filtering on the client side after the query
    const filteredUsers = useMemo(() => {
        if (!users) return [];
        return users.filter(user => {
            const name = `${user.vorname || ''} ${user.nachname || ''}`.toLowerCase();
            const search = searchTerm.toLowerCase();
            return name.includes(search) || (user.email && user.email.toLowerCase().includes(search));
        })
    }, [users, searchTerm]);


    const getGroupNames = (groupIds: string[] | undefined): string[] => {
        if (!groupIds || groupIds.length === 0) return [];
        return groupIds.map(id => allGroups.find(g => g.id === id)?.name).filter((name): name is string => !!name);
    };

    const handleParentGroupChange = (value: string) => {
        setParentGroupFilter(value);
        setSubGroupFilter('all'); 
    };

    const capitalize = (s: string | undefined) => {
        if (!s) return '';
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    const handleDelete = (userId: string, userName: string) => {
        if (!firestore) return;
        const userRef = doc(firestore, 'users', userId);
        const memberRef = doc(firestore, 'members', userId);
        
        deleteDocumentNonBlocking(userRef);
        deleteDocumentNonBlocking(memberRef);

        toast({
            title: "Mitglied wird gelöscht",
            description: `${userName} wird dauerhaft entfernt.`
        });
    };

    const openEditModal = (user: MemberProfile) => {
        setSelectedMember(user);
        setIsModalOpen(true);
    };
    
    const getDisplayGroupNames = (groupIds: string[] | undefined) => {
        const names = getGroupNames(groupIds);
        if (names.length > 2) {
            return names.slice(0, 2).join(', ') + '...';
        }
        return names.join(', ');
    };
    
    const processedUsers = React.useMemo(() => {
        return filteredUsers?.map(user => ({
            ...user,
            geburtstag: user.geburtstag?.toDate ? user.geburtstag.toDate().toISOString() : user.geburtstag,
        })) || [];
    }, [filteredUsers]);


    return (
        <>
        <EditMemberModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            member={selectedMember}
            groups={allGroups}
        />
        <div className="space-y-4">
             <div className="p-4 border rounded-lg space-y-4 bg-muted/50">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger><SelectValue placeholder="Nach Rolle filtern..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Alle Rollen</SelectItem>
                            <SelectItem value="trainer">Trainer</SelectItem>
                            <SelectItem value="betreuer">Betreuer</SelectItem>
                            <SelectItem value="spieler">Spieler</SelectItem>
                        </SelectContent>
                    </Select>
                     <Select value={parentGroupFilter} onValueChange={handleParentGroupChange}>
                        <SelectTrigger><SelectValue placeholder="Nach Obergruppe filtern..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Alle Obergruppen</SelectItem>
                            {parentGroups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={subGroupFilter} onValueChange={setSubGroupFilter} disabled={parentGroupFilter === 'all' || availableSubGroups.length === 0}>
                        <SelectTrigger><SelectValue placeholder="Nach Untergruppe filtern..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Alle Untergruppen</SelectItem>
                            {availableSubGroups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                 </div>
                 <div className="flex justify-end">
                     <Button onClick={handleSearch} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                        <Search className="mr-2 h-4 w-4" />
                        Mitglieder suchen
                    </Button>
                 </div>
             </div>
             
             <Input
                placeholder="Ergebnisse nach Name oder E-Mail weiter filtern..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="md:col-span-1"
                disabled={!users}
            />

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Gruppe</TableHead>
                            <TableHead>Vorname</TableHead>
                            <TableHead>Nachname</TableHead>
                            <TableHead>Position</TableHead>
                            <TableHead>Rolle</TableHead>
                            <TableHead>Geburtsdatum</TableHead>
                            <TableHead>E-Mail</TableHead>
                            <TableHead>Telefon</TableHead>
                            <TableHead>Wohnort</TableHead>
                            <TableHead className="text-right">Aktionen</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                             <TableRow>
                                <TableCell colSpan={10} className="h-24 text-center">
                                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                </TableCell>
                            </TableRow>
                        ) : processedUsers.length > 0 ? processedUsers.map(user => {
                            const userGroupNames = getGroupNames(user.groupIds);
                            const displayGroupString = getDisplayGroupNames(user.groupIds);

                            return (
                            <TableRow key={user.id}>
                                <TableCell>
                                    {userGroupNames.length > 0 ? (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <span className="truncate cursor-pointer hover:underline">{displayGroupString}</span>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto max-w-xs">
                                                <div className="space-y-2">
                                                    <h4 className="font-medium leading-none">Gruppen</h4>
                                                    <div className="text-sm text-muted-foreground">
                                                        {userGroupNames.map(name => <div key={name}>{name}</div>)}
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    ) : (
                                        '-'
                                    )}
                                </TableCell>
                                <TableCell>{user.vorname}</TableCell>
                                <TableCell>{user.nachname}</TableCell>
                                <TableCell>{user.position?.join(', ') || '-'}</TableCell>
                                <TableCell>{capitalize(user.rolle)}</TableCell>
                                <TableCell>{user.geburtstag ? format(new Date(user.geburtstag as any), 'dd.MM.yyyy', { locale: de }) : '-'}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.telefon || '-'}</TableCell>
                                <TableCell>{user.wohnort || '-'}</TableCell>
                                <TableCell className="text-right">
                                     <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Menü öffnen</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => openEditModal(user)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Bearbeiten
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
                                                            Diese Aktion kann nicht rückgängig gemacht werden. Dadurch wird das Konto von {user.name} dauerhaft gelöscht.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(user.id, user.name)} className="bg-destructive hover:bg-destructive/90">
                                                            Löschen
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                         )}) : (
                            <TableRow>
                                <TableCell colSpan={10} className="h-24 text-center">
                                    {activeQuery ? "Keine Mitglieder für die ausgewählten Filter gefunden." : "Mitglieder werden geladen..."}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
        </>
    );
}

    

    
