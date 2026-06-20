import React from 'react';
import StepItem, { StepStatus } from '@/components/onboarding/StepItem';
import Link from 'next/link';

export default function OnboardingPage() {
  // In a real application, this state would come from a database or API
  // We mock it for the onboarding flow
  const steps = [
    {
      id: 1,
      title: 'Conectar cuenta de Google Ads',
      description: 'Vincula tu cuenta para comenzar a gestionar tus campañas',
      status: 'completed' as StepStatus,
    },
    {
      id: 2,
      title: 'Crea tu campaña',
      description: 'Configura tu primera campaña publicitaria en minutos',
      status: 'current' as StepStatus,
      actionText: 'Crear campaña',
      actionHref: '/campaigns/new',
    },
    {
      id: 3,
      title: 'Configura tu bot de Telegram',
      description: 'Recibe notificaciones y gestiona leads directamente desde Telegram',
      status: 'pending' as StepStatus,
      actionText: 'Configurar',
      actionHref: '/settings/telegram',
    },
    {
      id: 4,
      title: 'Verifica tus datos de facturación',
      description: 'Añade un método de pago para activar los anuncios',
      status: 'pending' as StepStatus,
      actionText: 'Añadir método',
      actionHref: '/settings/billing',
    }
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col items-center py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight sm:text-4xl mb-3">
            ¡Bienvenido a GMaker!
          </h1>
          <p className="text-lg text-gray-500">
            Completa estos sencillos pasos para dejar tu sistema operativo y comenzar a crecer.
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
              Lleva tu negocio al siguiente nivel configurando todas las integraciones
            </p>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
            >
              Saltar configuración por ahora
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
