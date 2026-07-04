import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col font-sans selection:bg-neon-blue/30 selection:text-neon-blue">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0B0E14]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
            <span>Volver al Inicio</span>
          </Link>
          <div className="font-bold tracking-tighter text-xl">QSS Legals</div>
        </div>
      </nav>

      <main className="flex-1 max-w-3xl mx-auto px-6 pt-32 pb-24 prose prose-invert prose-headings:text-white prose-a:text-neon-blue hover:prose-a:text-neon-purple">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 tracking-tight">Términos de Servicio</h1>
        <p className="text-gray-400 mb-12">Última actualización: Julio 2026</p>

        <section className="mb-12 space-y-6 text-gray-300 leading-relaxed">
          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Naturaleza del Servicio</h2>
          <p>
            QSS (Quant Sales System), operado por TheQuantPartners, proporciona una infraestructura tecnológica de marketing y filtrado de prospectos orientada a firmas legales. Nuestro servicio atrae tráfico mediante plataformas publicitarias de terceros (ej. Google Ads) y utiliza un widget automatizado para aplicar un filtro pre-establecido a los visitantes.
          </p>
          <p>
            <strong>Importante:</strong> La funcionalidad de chat y transferencia a WhatsApp de QSS actúa estrictamente como una fase de filtro unidireccional y de pre-calificación. No está diseñada para operar como un asistente conversacional avanzado, sino para recopilar información clave del prospecto de manera rápida y eficiente antes del contacto humano.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. Definición Contractual de "Lead Calificado"</h2>
          <p>
            Para efectos de este acuerdo, el trabajo y responsabilidad de QSS se considera cumplido exitosamente en el momento en que se entrega un "Lead Calificado" a la firma legal. 
          </p>
          <p>
            Un <strong>Lead Calificado</strong> se define estrictamente como un prospecto que ha interactuado con nuestros anuncios, ha pasado por nuestro filtro automatizado indicando poseer un problema legal dentro del área de práctica acordada, y cuyos datos de contacto e historial de interacción han sido transferidos al canal de comunicación (WhatsApp/CRM) del cliente.
          </p>
          <p className="p-4 bg-dark-card border border-dark-card-border rounded-xl text-gray-400 text-sm mt-4">
            QSS no garantiza en ningún momento el cierre de la venta, la contratación de los servicios de la firma legal, ni el retorno de inversión (ROI). El porcentaje de conversión final depende 100% de la velocidad de respuesta de la firma, la calidad de su atención comercial y sus honorarios. QSS se exime expresamente de cualquier responsabilidad si la firma falla en convertir al lead por demoras (ej. respuestas tardías mayores a 15 minutos), falta de seguimiento o estrategias de precios inadecuadas.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. Ausencia de Asesoría Legal</h2>
          <p>
            QSS y sus tecnologías proporcionan única y exclusivamente servicios de software y filtrado de marketing. En ningún caso nuestras herramientas emiten, sugieren o reemplazan el consejo legal profesional. La firma cliente es la única responsable de verificar los hechos del prospecto y brindar la asesoría correspondiente. QSS no asumirá responsabilidad alguna por negligencias legales, mala praxis o malentendidos generados entre el prospecto y la firma.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. Plataformas de Terceros (Google Ads, Meta/WhatsApp)</h2>
          <p>
            Nuestros servicios dependen del funcionamiento ininterrumpido de plataformas de terceros. QSS no se hace responsable por cambios en los algoritmos, políticas publicitarias, bloqueos de cuentas, suspensiones de números de WhatsApp o cualquier otra interrupción causada por Google, Meta o entidades similares. En el eventual caso de una suspensión de cuenta o restricción por parte de terceros, las obligaciones de pago del cliente por el uso del software hacia QSS permanecen vigentes.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">5. Limitación de Responsabilidad e Indemnización</h2>
          <p>
            Bajo ninguna circunstancia la responsabilidad total acumulada de TheQuantPartners y QSS, ya sea por incumplimiento de contrato, agravio o de otro tipo, excederá el monto total pagado por el cliente por el servicio de software correspondiente a los tres (3) meses inmediatamente anteriores al evento que da lugar a la reclamación.
          </p>
          <p>
            El cliente acepta indemnizar y mantener indemne a QSS frente a cualquier demanda, pérdida, daño o gasto (incluyendo honorarios de abogados) que surja del uso inadecuado del servicio por parte del cliente o de disputas de mala praxis legal iniciadas por los prospectos.
          </p>
        </section>
      </main>

      <footer className="py-8 border-t border-white/10 text-center text-sm text-gray-500">
        © 2026 QSS. Built by TheQuantPartners. Todos los derechos reservados.
      </footer>
    </div>
  );
}
