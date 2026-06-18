"""
orchestrator.py - Script Principal del Orquestador
Une todos los módulos: lee métricas, evalúa decisiones y ejecuta acciones.
Este es el archivo que Antigravity (o un CRON job) ejecutará periódicamente.
"""

import sys
import json
from datetime import datetime

from src.google_ads_client import get_google_ads_client, get_target_customer_id
from src.fetch_metrics import get_campaign_metrics
from src.scaling_logic import evaluate_all_campaigns, generate_report
from src.actions import increase_campaign_budget, pause_campaign, generate_horizontal_scaling_plan


def run_orchestrator(dry_run: bool = True, client=None, customer_id: str = None,
                     target_cpa: float = None, max_daily_spend: float = None):
    """
    Ejecuta el ciclo completo del orquestador:
    1. Obtiene métricas de todas las campañas activas
    2. Evalúa cada campaña con las reglas de escalado
    3. Ejecuta las acciones recomendadas (o simula en dry_run)
    
    Args:
        dry_run: Si True (por defecto), solo simula sin hacer cambios reales.
        client: Optional pre-built GoogleAdsClient (multi-tenant).
        customer_id: Optional target customer ID (multi-tenant).
        target_cpa: Optional CPA goal override (multi-tenant).
        max_daily_spend: Optional max daily spend override (multi-tenant).
    """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    print(f"\n{'='*60}")
    print(f"  🤖 ORQUESTADOR DE GOOGLE ADS - {'MODO SIMULACIÓN' if dry_run else '⚡ MODO REAL ⚡'}")
    print(f"  Ejecutado: {timestamp}")
    print(f"{'='*60}\n")

    # --- PASO 1: Obtener métricas ---
    print("📊 Paso 1: Obteniendo métricas de campañas activas...")
    campaigns = get_campaign_metrics(client=client, customer_id=customer_id)
    
    if not campaigns:
        print("⚠️  No se encontraron campañas activas. Nada que evaluar.")
        return {"status": "no_data", "decisions": []}
    
    print(f"   ✅ {len(campaigns)} campañas encontradas.\n")

    # --- PASO 2: Evaluar con el cerebro ---
    print("🧠 Paso 2: Evaluando campañas con la lógica de escalado...")
    decisions = evaluate_all_campaigns(campaigns, target_cpa=target_cpa, max_daily_spend=max_daily_spend)
    
    # Mostrar reporte
    report = generate_report(decisions, target_cpa=target_cpa, max_daily_spend=max_daily_spend)
    print(report)

    # --- PASO 3: Ejecutar acciones ---
    print(f"\n⚙️  Paso 3: {'Simulando' if dry_run else 'Ejecutando'} acciones...\n")
    
    execution_results = []
    
    for decision in decisions:
        action = decision["action"]
        campaign_id = decision["campaign_id"]
        details = decision.get("details", {})
        
        if action == "PAUSE":
            result = pause_campaign(str(campaign_id), dry_run=dry_run, client=client, customer_id=customer_id)
            print(result)
            execution_results.append({"action": action, "campaign_id": campaign_id, "result": result})
            
        elif action == "SCALE_VERTICAL":
            increase = details.get("suggested_increase_percent", 0.25)
            result = increase_campaign_budget(str(campaign_id), increase, dry_run=dry_run, client=client, customer_id=customer_id)
            print(result)
            execution_results.append({"action": action, "campaign_id": campaign_id, "result": result})
            
        elif action == "SCALE_HORIZONTAL":
            plan = generate_horizontal_scaling_plan(str(campaign_id), client=client, customer_id=customer_id)
            print(plan)
            execution_results.append({"action": action, "campaign_id": campaign_id, "result": plan})
            
        elif action == "HOLD":
            print(f"⏸️  {decision['campaign_name']}: Sin acción requerida.")
            execution_results.append({"action": action, "campaign_id": campaign_id, "result": "No action"})

    # --- RESUMEN FINAL ---
    print(f"\n{'='*60}")
    print(f"  ✅ Ciclo del orquestador completado.")
    if dry_run:
        print(f"  ℹ️  Modo simulación: NO se hicieron cambios reales.")
        print(f"  💡 Para ejecutar de verdad, usa: python orchestrator.py --live")
    print(f"{'='*60}\n")
    
    return {
        "status": "completed",
        "timestamp": timestamp,
        "dry_run": dry_run,
        "campaigns_evaluated": len(campaigns),
        "decisions": [
            {"action": d["action"], "campaign": d["campaign_name"], "reason": d["reason"]}
            for d in decisions
        ],
        "execution_results": execution_results
    }

def run_for_tenant(credentials_dict: dict, target_cpa: float, max_daily_spend: float,
                   dry_run: bool = True) -> dict:
    """
    Entry-point for multi-tenant SaaS usage.
    Creates a Google Ads client from the provided credentials dictionary and
    runs the full orchestrator cycle for that specific tenant.

    Args:
        credentials_dict: Dictionary with Google Ads API credentials.
            Required keys: developer_token, client_id, client_secret,
            refresh_token, login_customer_id, target_customer_id.
        target_cpa: The tenant's CPA goal.
        max_daily_spend: The tenant's maximum daily spend.
        dry_run: If True (default), only simulate without making real changes.

    Returns:
        Dictionary with the orchestration results (same schema as run_orchestrator).
    """
    client = get_google_ads_client(credentials_dict)
    customer_id = get_target_customer_id(credentials_dict.get("target_customer_id"))

    return run_orchestrator(
        dry_run=dry_run,
        client=client,
        customer_id=customer_id,
        target_cpa=target_cpa,
        max_daily_spend=max_daily_spend,
    )


if __name__ == "__main__":
    # Si el usuario pasa --live, ejecuta en modo real
    live_mode = "--live" in sys.argv
    
    if live_mode:
        print("\n⚠️  ADVERTENCIA: Estás a punto de ejecutar en MODO REAL.")
        print("   Los cambios se aplicarán directamente en tu cuenta de Google Ads.")
        confirm = input("   ¿Estás seguro? Escribe 'SI' para confirmar: ")
        if confirm.strip().upper() != "SI":
            print("   Cancelado. Ejecutando en modo simulación...")
            live_mode = False
    
    result = run_orchestrator(dry_run=not live_mode)
