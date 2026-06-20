import React from 'react';
import StepItem, { StepStatus } from '@/components/onboarding/StepItem';
import Link from 'next/link';

export default function OnboardingPage() {
  // In a real application, this state would come from a database or API
  // We mock it for the onboarding flow
  const steps = [
    {
      id: 1,
      title: 'Connect Google Ads Account',
      description: 'Link your account to start managing your campaigns',
      status: 'completed' as StepStatus,
    },
    {
      id: 2,
      title: 'Create your campaign',
      description: 'Set up your first advertising campaign in minutes',
      status: 'current' as StepStatus,
      actionText: 'Create campaign',
      actionHref: '/dashboard/campaigns',
    },
    {
      id: 3,
      title: 'Configure Telegram bot',
      description: 'Receive notifications and manage leads directly from Telegram',
      status: 'pending' as StepStatus,
      actionText: 'Configure',
      actionHref: '/dashboard/configuracion',
    },
    {
      id: 4,
      title: 'Verify billing details',
      description: 'Add a payment method to activate ads',
      status: 'pending' as StepStatus,
      actionText: 'Add method',
      actionHref: '/dashboard/planes',
    }
  ];

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
