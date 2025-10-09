
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
import { Header } from '@/components/shared/header';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TeamCashView } from './components/team-cash-view';
import type { Group } from '@/app/admin/members/page';
import type { MemberProfile } from '@/app/admin/members/page';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function TeamCashPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

    // 1. Get the current user's profile to determine their role and group memberships
    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);

    const { data: userProfile, isLoading: isLoadingUserProfile } = useDoc<MemberProfile>(userProfileRef);
    const userGroupIds = useMemo(() => userProfile?.groupIds || [], [userProfile]);

    const hasAdminRights = userProfile?.adminRechte === true;
    const isTrainer = userProfile?.rolle === 'trainer';

    // 2. Determine which groups to fetch based on the user's role
    const groupsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        // Wait for user profile to be loaded before deciding which groups to fetch
        if (isLoadingUserProfile) return null; 

        if (hasAdminRights) {
            // Admins can see all groups
            return query(collection(firestore, 'groups'), orderBy('name'));
        }
        if (userGroupIds.length > 0) {
            // Non-admins see only the groups they are members of
            return query(collection(firestore, 'groups'), where('__name__', 'in', userGroupIds), orderBy('name'));
        }
        return null;
    }, [firestore, hasAdminRights, userGroupIds, isLoadingUserProfile]);

    const { data: accessibleGroups, isLoading: isLoadingGroups } = useCollection<Group>(groupsQuery);

    // 3. Set the default selected group
    useEffect(() => {
        if (!selectedGroupId && accessibleGroups && accessibleGroups.length > 0) {
            setSelectedGroupId(accessibleGroups[0].id);
        }
    }, [accessibleGroups, selectedGroupId]);

    const isLoading = isLoadingUserProfile || (groupsQuery && isLoadingGroups);
    const canEdit = hasAdminRights || (isTrainer && userGroupIds.includes(selectedGroupId || ''));

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
                <div className="container mx-auto px-4 py-8 md:py-12">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                        <h1 className="text-3xl font-bold tracking-tight">Teamkasse</h1>
                        { hasAdminRights && (
                            <div className="flex items-center gap-2">
                                 <Button variant="outline" asChild>
                                    <Link href="/admin/team-cash/penalties">Strafenkatalog</Link>
                                </Button>
                            </div>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {accessibleGroups && accessibleGroups.length > 0 ? (
                                <div className="max-w-sm">
                                    <Select
                                        value={selectedGroupId || ''}
                                        onValueChange={setSelectedGroupId}
                                        disabled={!hasAdminRights && accessibleGroups.length <= 1}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Team auswählen..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {accessibleGroups.map(group => (
                                                <SelectItem key={group.id} value={group.id}>
                                                    {group.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : (
                                 <p className="text-muted-foreground">
                                    {hasAdminRights ? "Keine Gruppen gefunden. Bitte fügen Sie welche hinzu." : "Sie sind keiner Gruppe zugeordnet, die eine Teamkasse hat."}
                                </p>
                            )}
                            
                            {selectedGroupId && (
                                <TeamCashView
                                    key={selectedGroupId} 
                                    groupId={selectedGroupId}
                                    canEdit={canEdit}
                                />
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
