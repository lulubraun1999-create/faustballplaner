
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Header } from '@/components/shared/header';
import { Loader2 } from 'lucide-react';
import { ManageGroupsForm } from './components/manage-groups-form';
import type { MemberProfile } from '../members/page';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Define the types based on your backend.json schema
export interface Group {
  id: string;
  name: string;
  parentGroupId?: string;
}

const capitalize = (s: string | undefined) => {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function GroupsPage() {
  const firestore = useFirestore();
  const [isManaging, setIsManaging] = useState(false);
  const [selectedSubGroup, setSelectedSubGroup] = useState<Group | null>(null);

  // State to control when to fetch members
  const [shouldFetchMembers, setShouldFetchMembers] = useState(false);

  // Memoize the query to prevent re-renders
  const groupsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'groups'));
  }, [firestore]);
  
  // Fetch all groups
  const { data: allGroups, isLoading: isLoadingGroups } = useCollection<Group>(groupsQuery);

  // Fetch members only for the *selected* subgroup and if fetching is enabled
  const membersQuery = useMemo(() => {
    if (!firestore || !selectedSubGroup || !shouldFetchMembers) return null;
    return query(collection(firestore, 'members'), where('groupIds', 'array-contains', selectedSubGroup.id));
  }, [firestore, selectedSubGroup, shouldFetchMembers]);
  const { data: membersInSelectedGroup, isLoading: isLoadingMembers } = useCollection<MemberProfile>(membersQuery);


  // Separate parent and sub-groups
  const { parentGroups, subGroups } = useMemo(() => {
    const parentGroups: Group[] = [];
    const subGroups: Group[] = [];
    if (allGroups) {
      allGroups.forEach(group => {
        if (group.parentGroupId) {
          subGroups.push(group);
        } else {
          parentGroups.push(group);
        }
      });
    }
    // Sort parent groups alphanumerically
    parentGroups.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    return { parentGroups, subGroups };
  }, [allGroups]);

  const [selectedParentGroup, setSelectedParentGroup] = useState<Group | null>(null);

   // Update selected group if it's no longer in the list or if none is selected
  useEffect(() => {
    if (parentGroups.length > 0) {
      if (!selectedParentGroup || !parentGroups.some(p => p.id === selectedParentGroup.id)) {
        setSelectedParentGroup(parentGroups[0]);
      }
    } else {
      setSelectedParentGroup(null);
    }
  }, [parentGroups, selectedParentGroup]);

  // When parent group changes, reset the selected subgroup
  useEffect(() => {
    setSelectedSubGroup(null);
    setShouldFetchMembers(false); // Reset member fetching
  }, [selectedParentGroup]);


  // Filter subgroups based on the selected parent group
  const displayedSubGroups = useMemo(() => {
    if (!selectedParentGroup) return [];
    return subGroups
      .filter(subGroup => subGroup.parentGroupId === selectedParentGroup.id)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  }, [selectedParentGroup, subGroups]);
  
  const sortedMembers = useMemo(() => {
    if (!membersInSelectedGroup) return [];
    return [...membersInSelectedGroup].sort((a, b) => (a.nachname || '').localeCompare(b.nachname || ''));
  }, [membersInSelectedGroup]);

  const isLoading = isLoadingGroups; // We only show initial loading for groups

  const handleSubGroupClick = (group: Group) => {
    if (selectedSubGroup?.id === group.id) {
        // If clicking the same group, just toggle fetching off
        setSelectedSubGroup(null);
        setShouldFetchMembers(false);
    } else {
        setSelectedSubGroup(group);
        // Important: Don't fetch yet. Wait for button click.
        setShouldFetchMembers(false); 
    }
  };

  const handleShowMembersClick = () => {
    setShouldFetchMembers(true);
  }
  
  const handleParentGroupSelect = (group: Group) => {
    setSelectedParentGroup(group);
    setSelectedSubGroup(null); // Reset subgroup when parent changes
    setShouldFetchMembers(false);
  }

  if (isManaging) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <div className="container mx-auto px-4 py-8 md:py-12">
            <ManageGroupsForm 
              onClose={() => setIsManaging(false)} 
              parentGroups={parentGroups}
              allGroups={allGroups || []}
            />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Gruppen</h1>
            <Button variant="outline" onClick={() => setIsManaging(true)}>Gruppe bearbeiten</Button>
          </div>
          {isLoadingGroups ? (
             <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="md:col-span-1">
                  <CardHeader>
                    <CardTitle className="text-lg">TSV Bayer Leverkusen</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <nav className="flex flex-col space-y-1">
                      {parentGroups.map((group) => (
                        <Button
                          key={group.id}
                          variant={selectedParentGroup?.id === group.id ? 'secondary' : 'ghost'}
                          className="justify-start"
                          onClick={() => handleParentGroupSelect(group)}
                        >
                          {group.name}
                        </Button>
                      ))}
                    </nav>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">{selectedParentGroup?.name || "Obergruppe auswählen"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {displayedSubGroups.length > 0 ? (
                        displayedSubGroups.map((group) => (
                          <div
                            key={group.id}
                            className={`rounded-md border p-3 hover:bg-muted cursor-pointer transition-colors ${selectedSubGroup?.id === group.id ? 'bg-muted' : ''}`}
                            onClick={() => handleSubGroupClick(group)}
                          >
                            {group.name}
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground">
                          {parentGroups.length > 0 ? "Keine Untergruppen vorhanden." : "Keine Gruppen vorhanden. Fügen Sie eine neue Gruppe hinzu."}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

            {selectedSubGroup && (
                <Card className="animate-fade-in">
                    <CardHeader>
                        <CardTitle>Mitglieder in {selectedSubGroup.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!shouldFetchMembers && (
                             <div className="flex flex-col items-center justify-center h-24 gap-4">
                                <p>Klicken Sie, um die Mitgliederliste zu laden.</p>
                                <Button onClick={handleShowMembersClick}>Mitglieder anzeigen</Button>
                            </div>
                        )}
                        {shouldFetchMembers && isLoadingMembers ? (
                            <div className="flex items-center justify-center h-24">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : shouldFetchMembers && (
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Vorname</TableHead>
                                    <TableHead>Nachname</TableHead>
                                    <TableHead>Position</TableHead>
                                    <TableHead>Rolle</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                            {sortedMembers.length > 0 ? (
                                sortedMembers.map(member => (
                                <TableRow key={member.id}>
                                    <TableCell>{member.vorname}</TableCell>
                                    <TableCell>{member.nachname}</TableCell>
                                    <TableCell>{member.position?.join(', ') || '-'}</TableCell>
                                    <TableCell>{capitalize(member.rolle)}</TableCell>
                                </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        Keine Mitglieder in dieser Gruppe.
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
      </main>
    </div>
  );
}
