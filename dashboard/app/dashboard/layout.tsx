"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import styles from "../admin/layout.module.css"; // We reuse the admin sidebar styles

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  return (
    <div className={styles.adminLayout}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <span className={styles.logoMark}>Q</span>
          Mi Agencia
        </div>
        
        <div style={{ padding: "0 16px 24px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          Hola, {session?.user?.name || "Cliente"}
        </div>

        <nav className={styles.nav}>
          <Link href="/dashboard" className={styles.navLink}>
            Panel Principal
          </Link>
          <Link href="/dashboard/campaigns" className={styles.navLink}>
            Mis Campañas
          </Link>
          <Link href="/dashboard/logs" className={styles.navLink}>
            Historial del Orquestador
          </Link>
        </nav>

        <div className={styles.bottomNav}>
          <button className={styles.logoutBtn} onClick={() => signOut({ callbackUrl: "/" })}>
            Cerrar Sesión
          </button>
        </div>
      </aside>
      
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
