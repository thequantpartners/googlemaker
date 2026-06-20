"use client";

import React, { useState, useEffect } from 'react';
import StepItem, { StepStatus } from '@/components/onboarding/StepItem';
import Link from 'next/link';
import { useSession } from "next-auth/react";

export default function OnboardingPage() {
  const { data: session } = useSession();
  const [tier, setTier] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTier() {
      if (!session?.backendToken) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me`, {
          headers: { Authorization: `Bearer ${session.backendToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setTier(data.tier);
        }
      } catch (err) {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    
    if (session) {
      fetchTier();
    } else if (session === null) {
      setLoading(false);
    }
  }, [session]);

  // If user has a plan that is not empty/free, unlock the other steps.
  const hasPlan = tier && tier !== "free" && tier !== "none" && tier !== "";

  const steps = [
    {
      id: 1,
      title: 'Choose your plan',
      description: 'Select a subscription plan to unlock all features',
      status: (hasPlan ? 'completed' : 'current') as StepStatus,
      actionText: hasPlan ? undefined : 'Select Plan',
      actionHref: hasPlan ? undefined : '/dashboard/planes',
    },
    {
      id: 2,
      title: 'Connect Google Ads Account',
      description: 'Link your account to start managing your campaigns',
      status: (hasPlan ? 'current' : 'pending') as StepStatus,
      actionText: hasPlan ? 'Connect Account' : undefined,
      actionHref: hasPlan ? '/dashboard' : undefined,
    },
    {
      id: 3,
      title: 'Configure Telegram bot',
      description: 'Receive notifications and manage leads directly from Telegram',
      status: 'pending' as StepStatus,
      actionText: hasPlan ? 'Configure' : undefined,
      actionHref: hasPlan ? '/dashboard/configuracion' : undefined,
    },
    {
      id: 4,
      title: 'Generate AI Strategy',
      description: 'Use our AI Marketing Strategist to create high-converting ad copy',
      status: 'pending' as StepStatus,
      actionText: hasPlan ? 'Generate Strategy' : undefined,
      actionHref: hasPlan ? '/dashboard/campaigns' : undefined,
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-neon-purple/20 border-t-neon-purple rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col items-center py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight sm:text-4xl mb-3">
            Welcome to GMaker!
          </h1>
          <p className="text-lg text-gray-500">
            Complete these simple steps to get your system up and running.
          </p>
        </div>

        <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-100">
          <div className="space-y-2">
            {steps.map((step) => (
              <StepItem
                key={step.id}
                number={step.id}
                title={step.title}
                description={step.description}
                status={step.status}
                actionText={step.actionText}
                actionHref={step.actionHref}
              />
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-gray-500 mb-4">
              Take your business to the next level by configuring all integrations
            </p>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
            >
              Skip setup for now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
