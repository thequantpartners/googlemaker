import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col font-sans selection:bg-neon-blue/30 selection:text-neon-blue">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0B0E14]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
            <span>Volver al Inicio</span>
          </Link>
          <div className="font-bold tracking-tighter text-xl">QSS Privacy</div>
        </div>
      </nav>

      <main className="flex-1 max-w-3xl mx-auto px-6 pt-32 pb-24 prose prose-invert prose-headings:text-white prose-a:text-neon-blue hover:prose-a:text-neon-purple">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 tracking-tight">Política de Privacidad</h1>
        <p className="text-gray-400 mb-12">Última actualización: Julio 2026</p>

        <section className="mb-12 space-y-6 text-gray-300 leading-relaxed">
          <p>
            En QSS y TheQuantPartners, tomamos muy en serio la protección de los datos de nuestros clientes (las firmas legales) y los usuarios finales (los prospectos). Esta política detalla cómo manejamos la información altamente sensible en el ámbito legal penal.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Roles en el Procesamiento de Datos</h2>
          <p>
            Bajo las normativas de protección de datos, <strong>la firma legal actúa como el "Controlador de Datos" (Data Controller)</strong> y <strong>QSS actúa como el "Procesador de Datos" (Data Processor)</strong>.
          </p>
          <p>
            Esto significa que QSS recopila, pre-califica y transfiere la información de los prospectos única y exclusivamente en nombre y bajo las instrucciones de la firma legal cliente. No vendemos, alquilamos ni compartimos la información de los prospectos con terceros externos.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. Confidencialidad y Naturaleza de los Datos Penales</h2>
          <p>
            Nuestro sistema de pre-calificación automatizada está diseñado intencionalmente para recopilar la <strong>cantidad mínima de información necesaria</strong> para determinar si un caso califica comercialmente para el despacho. 
          </p>
          <p>
            Recomendamos encarecidamente a nuestras firmas legales clientes que <strong>no soliciten</strong>, a través de nuestro widget inicial, el envío de documentos legales completos, expedientes fiscales, confesiones detalladas o contenido multimedia incriminatorio. El propósito de QSS es filtrar y conectar, no servir como un bóveda de retención a largo plazo de expedientes penales.
          </p>
          <p>
            Una vez que los datos del prospecto (ej. nombre, problema legal general, nivel de urgencia) son transferidos al entorno seguro del cliente (ej. WhatsApp Business, CRM interno), es responsabilidad exclusiva de la firma legal velar por el secreto profesional y la seguridad de dicha comunicación detallada.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. Limitación de Responsabilidad ante Brechas de Seguridad</h2>
          <p>
            QSS implementa estándares de seguridad técnicos, comerciales y organizativos acordes a la industria para proteger los datos en tránsito y en reposo (encriptación, controles de acceso). Sin embargo, ningún sistema es infalible ante ciberataques maliciosos de fuerza mayor.
          </p>
          <p>
            En el improbable caso de una brecha de datos (Data Breach) originada en la infraestructura de QSS que resulte en la exposición de datos de prospectos, nuestra responsabilidad máxima hacia la firma legal cliente estará estrictamente limitada a las condiciones y topes financieros estipulados en la sección de "Limitación de Responsabilidad" de nuestros Términos de Servicio (equivalente a un máximo de tres (3) meses de suscripción). El cliente asume el riesgo inherente de utilizar sistemas de comunicación en la nube para procesos de admisión inicial.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. Cookies y Tecnologías de Seguimiento</h2>
          <p>
            Utilizamos tecnologías como cookies, web beacons y píxeles de seguimiento (ej. Google Analytics, Meta Pixel, Google Ads Conversion Tracking) exclusivamente con el propósito de optimizar las campañas publicitarias (Ad Spend) y mejorar la conversión de la Landing Page. Esta información es estadística y seudónima, diseñada para alimentar los algoritmos de tráfico y no para identificar individualmente a los prospectos más allá del objetivo de re-targeting o medición de conversiones.
          </p>
        </section>
      </main>

      <footer className="py-8 border-t border-white/10 text-center text-sm text-gray-500">
        © 2026 QSS. Built by TheQuantPartners. Todos los derechos reservados.
      </footer>
    </div>
  );
}
