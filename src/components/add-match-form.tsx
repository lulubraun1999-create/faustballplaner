"use client";

import { useFormState, useFormStatus } from 'react-dom';
import { handleAddMatch, FormState } from '@/lib/actions';
import { Team } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Adding Match...' : 'Add Match'}
    </Button>
  );
}

export function AddMatchForm({ teams }: { teams: Team[] }) {
  const initialState: FormState = { message: '', errors: {} };
  const [state, dispatch] = useFormState(handleAddMatch, initialState);

  return (
    <form action={dispatch} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <div className="space-y-2">
          <Label htmlFor="team1Id">Team 1</Label>
          <Select name="team1Id" required>
            <SelectTrigger id="team1Id">
              <SelectValue placeholder="Select Team 1" />
            </SelectTrigger>
            <SelectContent>
              {teams.map(team => (
                <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state.errors?.team1Id && <p className="text-sm text-destructive">{state.errors.team1Id.join(', ')}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="team1Score">Team 1 Score</Label>
          <Input name="team1Score" id="team1Score" type="number" min="0" max="5" placeholder="Sets won" required />
           {state.errors?.team1Score && <p className="text-sm text-destructive">{state.errors.team1Score.join(', ')}</p>}
        </div>
      </div>

      <div className="flex items-center justify-center text-muted-foreground font-bold">VS</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <div className="space-y-2">
          <Label htmlFor="team2Id">Team 2</Label>
          <Select name="team2Id" required>
            <SelectTrigger id="team2Id">
              <SelectValue placeholder="Select Team 2" />
            </SelectTrigger>
            <SelectContent>
              {teams.map(team => (
                <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state.errors?.team2Id && <p className="text-sm text-destructive">{state.errors.team2Id.join(', ')}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="team2Score">Team 2 Score</Label>
          <Input name="team2Score" id="team2Score" type="number" min="0" max="5" placeholder="Sets won" required />
          {state.errors?.team2Score && <p className="text-sm text-destructive">{state.errors.team2Score.join(', ')}</p>}
        </div>
      </div>
      
      {state.errors?._form && (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{state.errors._form.join(', ')}</AlertDescription>
        </Alert>
      )}

      <SubmitButton />
    </form>
  );
}
