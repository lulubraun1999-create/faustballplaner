"use server";

import { z } from "zod";
import { addMatch } from "./data";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const MatchSchema = z.object({
  team1Id: z.string().min(1, "Please select Team 1."),
  team2Id: z.string().min(1, "Please select Team 2."),
  team1Score: z.coerce.number().min(0).max(5),
  team2Score: z.coerce.number().min(0).max(5),
}).refine(data => data.team1Id !== data.team2Id, {
    message: "Teams cannot play against themselves.",
    path: ["team2Id"],
});

export type FormState = {
  message: string;
  errors?: {
    team1Id?: string[];
    team2Id?: string[];
    team1Score?: string[];
    team2Score?: string[];
    _form?: string[];
  }
}

export async function handleAddMatch(prevState: FormState, formData: FormData) {
  const validatedFields = MatchSchema.safeParse({
    team1Id: formData.get("team1Id"),
    team2Id: formData.get("team2Id"),
    team1Score: formData.get("team1Score"),
    team2Score: formData.get("team2Score"),
  });

  if (!validatedFields.success) {
    return {
      message: "Failed to add match. Please check the errors.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  // A match must have a winner. Sum of scores should be between 3 and 5 typically.
  const { team1Score, team2Score } = validatedFields.data;
  if (team1Score === team2Score) {
      return {
          message: "Failed to add match.",
          errors: { _form: ["A match cannot end in a draw. One team must win."] }
      }
  }

  try {
    await addMatch(validatedFields.data);
  } catch (e) {
    return {
      message: "Database Error: Failed to add match.",
    };
  }
  
  revalidatePath("/");
  revalidatePath("/teams");
  redirect("/");
}
