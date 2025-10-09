
"use client";

import React from 'react';
import { Header } from "@/components/shared/header";

export default function TeamCashPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-3xl px-4 py-8 md:py-12">
          <section className="mb-12 text-center animate-fade-in">
            <h1 className="text-4xl font-bold tracking-tight font-headline lg:text-5xl">
              Teamkasse
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              Diese Funktion wird gerade neu erstellt und ist in Kürze verfügbar.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
