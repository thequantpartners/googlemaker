"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import styles from "./layout.module.css";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.adminLayout}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <span className={styles.logoMark}>G</span>
          SuperAdmin
        </div>
        
        <nav className={styles.nav}>
          <Link href="/admin" className={styles.navLink}>
            Dashboard
          </Link>
          <Link href="/admin/clients" className={styles.navLink}>
            Clientes
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
