import React from 'react';
import { Hero } from '@/components/Hero';
import { SupportedAgents } from '@/components/SupportedAgents';
import { Problem } from '@/components/Problem';
import { HowItWorks } from '@/components/HowItWorks';
import { Objection } from '@/components/Objection';
import { BuiltFor } from '@/components/BuiltFor';
import { CliFirst } from '@/components/CliFirst';
import { Waitlist } from '@/components/Waitlist';
import { Footer } from '@/components/Footer';

export default function LandingPage() {
  return (
    <main>
      <Hero />
      {/* <SupportedAgents /> */}
      <Problem />
      <HowItWorks />
      <Objection />
      <BuiltFor />
      <CliFirst />
      <Waitlist />
      <Footer />
    </main>
  );
}
