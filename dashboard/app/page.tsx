import Link from "next/link";
import styles from "./page.module.css";

export default function LandingPage() {
  return (
    <div className={styles.main}>
      <nav className={styles.nav}>
        <div className="container flex-between" style={{ height: "100%" }}>
          <div className={styles.logo}>
            <span className={styles.logoMark}>Q</span>
            Quant Ads Orchestrator
          </div>
          <div className={styles.navLinks}>
            <Link href="/login" className="btn-outline">Sign In</Link>
          </div>
        </div>
      </nav>

      <section className={styles.hero}>
        <div className="container">
          <div className={`animate-fade-in ${styles.heroContent}`}>
            <h1 className="heading-xl">
              Tu agencia de Google Ads<br />en piloto automático
            </h1>
            <p className={styles.heroSubtitle}>
              Escalado algorítmico, protección contra gasto ineficiente y decisiones tomadas en tiempo real.
              Diseñado exclusivamente para partners de The Quant.
            </p>
            <div className={styles.ctaGroup}>
              <Link href="/login" className="btn-primary" style={{ padding: "16px 32px", fontSize: "1.1rem" }}>
                Comenzar Ahora
              </Link>
            </div>
          </div>
        </div>
        
        {/* Abstract shapes for background */}
        <div className={styles.bgGlow1}></div>
        <div className={styles.bgGlow2}></div>
      </section>

      <section className={styles.features}>
        <div className="container">
          <div className={styles.featureGrid}>
            <div className="glass-card">
              <div className={styles.featureIcon}>📈</div>
              <h3 className="heading-md" style={{ marginBottom: "12px" }}>Escalado Vertical</h3>
              <p className="text-muted">Incrementamos el presupuesto automáticamente en campañas ganadoras que demuestran tracción positiva bajo tu CPA objetivo.</p>
            </div>
            <div className="glass-card">
              <div className={styles.featureIcon}>🛡️</div>
              <h3 className="heading-md" style={{ marginBottom: "12px" }}>Protección de Capital</h3>
              <p className="text-muted">Si una campaña supera tu CPA máximo permitido o no genera conversiones, el sistema la pausa al instante.</p>
            </div>
            <div className="glass-card">
              <div className={styles.featureIcon}>🧬</div>
              <h3 className="heading-md" style={{ marginBottom: "12px" }}>Clonación Horizontal</h3>
              <p className="text-muted">Extraemos las keywords ganadoras de tus mejores campañas y creamos planes de expansión para maximizar alcance.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
