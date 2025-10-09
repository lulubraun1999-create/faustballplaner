"use client";

import React from 'react';
import { Header } from "@/components/shared/header";
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function TeamCashPenaltiesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-3xl px-4 py-8 md:py-12 text-center">
          <section className="mb-12 animate-fade-in">
            <h1 className="text-4xl font-bold tracking-tight font-headline lg:text-5xl">
              Strafenkatalog
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              Diese Funktion wird gerade neu erstellt und ist in Kürze verfügbar.
            </p>
            <Button asChild className="mt-4 bg-destructive hover:bg-destructive/90 text-destructive-foreground"><Link href="/admin/team-cash">Zurück zur Teamkasse</Link></Button>
          </section>
        </div>
      </main>
    </div>
  );
}
