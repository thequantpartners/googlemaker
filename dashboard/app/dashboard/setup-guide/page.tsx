"use client";

import React, { useState, useEffect } from 'react';
import StepItem, { StepStatus } from '@/components/onboarding/StepItem';
import Link from 'next/link';
import { useSession } from "next-auth/react";

export default function OnboardingPage() {
  const { data: session } = useSession();
  const [tier, setTier] = useState<string | null>(null);
  const [industry, setIndustry] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClientData() {
      if (!session?.backendToken) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/me`, {
          headers: { Authorization: `Bearer ${session.backendToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setTier(data.tier);
          setIndustry(data.industry_niche);
        }
      } catch (err) {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    
    if (session) {
      fetchClientData();
    } else if (session === null) {
      setLoading(false);
    }
  }, [session]);

  const hasPlan = tier && tier !== "none" && tier !== "";
  const hasIndustry = industry && industry !== "";

  const steps = [
    {
      id: 1,
      title: 'Configuración de Negocio (Snapshot)',
      description: 'Selecciona tu industria (Legal, Salud, Inmobiliaria) para cargar el asistente de IA pre-entrenado para tu nicho.',
      status: (hasIndustry ? 'completed' : 'current') as StepStatus,
      actionText: hasIndustry ? undefined : 'Seleccionar Industria',
      actionHref: hasIndustry ? undefined : '/dashboard/configuracion',
    },
    {
      id: 2,
      title: 'Conectar Canal de WhatsApp',
      description: 'Vincula el número donde tus clientes escriben (Vía Código QR o API Oficial).',
      status: (hasIndustry ? (hasPlan ? 'completed' : 'current') : 'pending') as StepStatus,
      actionText: hasIndustry && !hasPlan ? 'Conectar WhatsApp' : undefined,
      actionHref: hasIndustry && !hasPlan ? '/dashboard/whatsapp' : undefined,
    },
    {
      id: 3,
      title: 'Activar Suscripción',
      description: 'Activa tu plan de mensajes para que la IA empiece a responder a tus clientes 24/7.',
      status: (hasPlan ? 'completed' : (hasIndustry ? 'current' : 'pending')) as StepStatus,
      actionText: hasPlan ? undefined : 'Ver Planes',
      actionHref: hasPlan ? undefined : '/dashboard/planes',
    },
    {
      id: 4,
      title: 'Probar el Asistente (¡A-ha Moment!)',
      description: 'Envía un mensaje de prueba a tu número conectado y mira cómo la IA atiende y agenda la cita.',
      status: 'pending' as StepStatus,
      actionText: hasPlan ? 'Hacer Prueba' : undefined,
      actionHref: hasPlan ? '/dashboard/leads' : undefined,
    }
  ];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-neon-purple/20 border-t-neon-purple rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white tracking-tight sm:text-4xl mb-3">
            ¡Bienvenido a QSS!
          </h1>
          <p className="text-lg text-gray-400">
            Sigue estos 4 pasos para desplegar tu Recepcionista de IA en piloto automático.
          </p>
        </div>

        <div className="bg-[#0a0c10] rounded-3xl p-6 sm:p-10 border border-dark-card-border shadow-[0_0_40px_rgba(0,0,0,0.5)]">
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
              La IA no responderá a tus clientes reales hasta que tú la actives manualmente.
            </p>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-neon-purple hover:text-purple-700 transition-colors"
            >
              Ir al Dashboard Principal →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
