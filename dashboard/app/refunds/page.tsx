import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function RefundsPage() {
  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col font-sans selection:bg-neon-blue/30 selection:text-neon-blue">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0B0E14]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
            <span>Volver al Inicio</span>
          </Link>
          <div className="font-bold tracking-tighter text-xl">QSS Refunds</div>
        </div>
      </nav>

      <main className="flex-1 max-w-3xl mx-auto px-6 pt-32 pb-24 prose prose-invert prose-headings:text-white prose-a:text-neon-blue hover:prose-a:text-neon-purple">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 tracking-tight">Política de Reembolsos</h1>
        <p className="text-gray-400 mb-12">Última actualización: Julio 2026</p>

        <section className="mb-12 space-y-6 text-gray-300 leading-relaxed">
          <p>
            Al contratar QSS (Quant Sales System), usted adquiere acceso a una infraestructura de software, licencias tecnológicas y servicios de configuración especializados. Debido a la naturaleza de los costos irrecuperables asociados con el despliegue tecnológico y la publicidad digital, aplicamos una estricta <strong>Política de Cero Reembolsos</strong>, salvo condiciones extraordinarias especificadas en este documento.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Presupuesto Publicitario (Ad Spend) - 100% No Reembolsable</h2>
          <p>
            Es imperativo comprender que QSS <strong>no retiene ni cobra</strong> el presupuesto publicitario destinado a la generación de tráfico (ej. el dinero pagado a Google Ads, Meta Ads u otras redes).
          </p>
          <p>
            Este presupuesto se abona directamente a dichas plataformas de terceros mediante el método de pago del cliente. Bajo ninguna circunstancia QSS es responsable, ni puede procesar devoluciones o reembolsos relacionados con el dinero invertido y consumido en clics, impresiones o campañas publicitarias. El riesgo de la inversión publicitaria recae enteramente en el cliente.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. Tarifas de Setup e Instalación</h2>
          <p>
            Cualquier tarifa inicial cobrada por concepto de configuración, integración de Landing Pages, despliegue del widget de IA, redacción de anuncios (copywriting) y conexión de cuentas (Setup Fee) es <strong>estrictamente no reembolsable</strong>. Estos cargos cubren el tiempo, los recursos humanos y los costos de infraestructura inmediatos dedicados a poner en marcha su máquina de adquisición.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. Suscripciones Mensuales (Software y Mantenimiento)</h2>
          <p>
            El cargo recurrente mensual por el uso de la plataforma QSS, licencias de IA y optimización de campañas no es reembolsable. 
          </p>
          <p>
            <strong>Cancelaciones:</strong> El cliente tiene la libertad de cancelar su suscripción en cualquier momento. Al cancelar, no se emitirán más cobros en los ciclos de facturación futuros. El cliente conservará el acceso al sistema hasta el final del ciclo de facturación vigente pagado. No ofrecemos reembolsos prorrateados por cancelaciones a mitad de un mes de servicio.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. Resultados y Leads "No Calificados"</h2>
          <p>
            Como se especifica en nuestros Términos de Servicio, QSS se encarga de la pre-calificación y transferencia del lead al entorno del cliente. <strong>No emitimos reembolsos ni créditos</strong> bajo el argumento de "leads de baja calidad", "prospectos que no contestan" o "casos no cerrados".
          </p>
          <p>
            El sistema transfiere leads basados en los parámetros lógicos de la IA, pero la decisión humana del prospecto de contratar y la habilidad de ventas de la firma legal escapan al control de QSS. Si el cliente recibe leads pero no logra convertirlos, nuestro equipo proveerá guías y recursos (ej. Scripts de Cierre), pero no se aprobará ninguna solicitud de reembolso por falta de ROI (Retorno de Inversión).
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">5. Garantías Condicionales (Si Aplica)</h2>
          <p>
            En el caso exclusivo de que el contrato particular firmado con el cliente incluya una cláusula explícita de "Garantía de X Leads o Trabajamos Gratis", esta garantía aplica <strong>solo al costo de nuestra suscripción</strong> (extendiendo el servicio sin costo) y en ningún escenario ampara la devolución de meses previamente pagados o del Ad Spend de Google. Para invocar dicha garantía, el cliente debe demostrar haber cumplido con los requisitos mínimos de inversión publicitaria ininterrumpida y haber atendido a los leads en los tiempos de respuesta estipulados por el protocolo comercial de QSS.
          </p>
        </section>
      </main>

      <footer className="py-8 border-t border-white/10 text-center text-sm text-gray-500">
        © 2026 QSS. Built by TheQuantPartners. Todos los derechos reservados.
      </footer>
    </div>
  );
}
