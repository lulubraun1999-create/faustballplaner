'use server';
// This file is intentionally left empty to resolve an API key conflict.
// We can restore AI functionality later.

export const ai = {
    defineFlow: (config: any, implementation: any) => implementation,
    definePrompt: (config: any) => (input: any) => Promise.resolve({ output: null }),
};
