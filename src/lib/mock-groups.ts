"use client";

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Header } from '@/components/shared/header';
import { Loader2 } from 'lucide-react';

// Define the types based on your backend.json schema
interface Group {
  id: string;
  name: string;
  parentGroupId?: string;
}

export default function GroupsPage() {
  const firestore = useFirestore();

  // Memoize the query to prevent re-renders
  const groupsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'groups'));
  }, [firestore]);
  
  // Fetch all groups
  const { data: allGroups, isLoading } = useCollection<Group>(groupsQuery);

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
    // Sort parent groups alphabetically by name
    parentGroups.sort((a, b) => a.name.localeCompare(b.name));
    return { parentGroups, subGroups };
  }, [allGroups]);

  const [selectedParentGroup, setSelectedParentGroup] = useState<Group | null>(null);

  // Set the first parent group as selected by default when data loads
  useState(() => {
    if (!selectedParentGroup && parentGroups.length > 0) {
      setSelectedParentGroup(parentGroups[0]);
    }
  });

   // Update selected group if it's no longer in the list or if none is selected
  useMemo(() => {
    if (parentGroups.length > 0) {
      if (!selectedParentGroup || !parentGroups.some(p => p.id === selectedParentGroup.id)) {
        setSelectedParentGroup(parentGroups[0]);
      }
    } else {
      setSelectedParentGroup(null);
    }
  }, [parentGroups, selectedParentGroup]);


  // Filter subgroups based on the selected parent group
  const displayedSubGroups = useMemo(() => {
    if (!selectedParentGroup) return [];
    return subGroups
      .filter(subGroup => subGroup.parentGroupId === selectedParentGroup.id)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedParentGroup, subGroups]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Gruppen</h1>
            <Button variant="outline">Gruppe bearbeiten</Button>
          </div>
          {isLoading ? (
             <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : (

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
                      onClick={() => setSelectedParentGroup(group)}
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
                        className="rounded-md border p-3 hover:bg-muted"
                      >
                        {group.name}
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">
                      Keine Untergruppen vorhanden.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          )}
        </div>
      </main>
    </div>
  );
}