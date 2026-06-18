"""
scaling_logic.py - El Cerebro del Orquestador
Contiene todas las reglas de decisión para:
  - Escalado Vertical (inyectar más presupuesto)
  - Escalado Horizontal (clonar ad groups ganadores)
  - Apagado de Ads (pausar anuncios no rentables)
"""

import os
from dotenv import load_dotenv

load_dotenv()

TARGET_CPA = float(os.getenv("TARGET_CPA", "15.0"))
MAX_DAILY_SPEND = float(os.getenv("MAX_DAILY_SPEND", "100.0"))

# --- Umbrales configurables ---
# Porcentaje por debajo del CPA objetivo para considerar "excelente rendimiento"
VERTICAL_SCALE_THRESHOLD = 0.70   # Si el CPA real es < 70% del objetivo → escalar verticalmente
HORIZONTAL_SCALE_THRESHOLD = 0.50  # Si el CPA real es < 50% del objetivo → clonar (horizontal)
BUDGET_INCREASE_PERCENT = 0.25     # Incrementar presupuesto un 25% en cada escalada vertical
MIN_CONVERSIONS_TO_EVALUATE = 3    # Mínimo de conversiones para que la data sea confiable
MIN_CLICKS_FOR_TRACTION = 20       # Mínimo de clicks para considerar que tiene "tracción"
MAX_CPA_BEFORE_PAUSE = 1.5        # Si el CPA supera 1.5x el objetivo → pausar


def evaluate_campaign(campaign: dict, target_cpa: float = None, max_daily_spend: float = None) -> dict:
    """
    Evalúa una campaña y retorna una decisión con su justificación.
    
    Args:
        campaign: Diccionario con las métricas de la campaña:
            - campaign_id, campaign_name, cost, conversions, cpa, clicks, impressions
        target_cpa: Optional CPA goal override (multi-tenant). Falls back to .env.
        max_daily_spend: Optional max daily spend override (multi-tenant). Falls back to .env.
    
    Returns:
        Diccionario con:
            - action: "SCALE_VERTICAL" | "SCALE_HORIZONTAL" | "PAUSE" | "HOLD"
            - reason: Explicación de la decisión
            - details: Datos adicionales para ejecutar la acción
    """
    # Resolve thresholds: use provided values or fall back to module-level .env defaults
    _target_cpa = target_cpa if target_cpa is not None else TARGET_CPA
    _max_daily_spend = max_daily_spend if max_daily_spend is not None else MAX_DAILY_SPEND

    cost = campaign.get("cost", 0)
    conversions = campaign.get("conversions", 0)
    cpa = campaign.get("cpa", 0)
    clicks = campaign.get("clicks", 0)
    impressions = campaign.get("impressions", 0)
    campaign_name = campaign.get("campaign_name", "Desconocida")
    campaign_id = campaign.get("campaign_id", 0)

    # ====================================================
    # REGLA 1: APAGADO INMEDIATO (Protección de capital)
    # Si gasta dinero sin generar leads calificados
    # ====================================================
    if cost > 0 and conversions == 0 and clicks >= MIN_CLICKS_FOR_TRACTION:
        return {
            "action": "PAUSE",
            "campaign_id": campaign_id,
            "campaign_name": campaign_name,
            "reason": (
                f"APAGADO: La campaña '{campaign_name}' ha gastado ${cost:.2f} "
                f"con {clicks} clicks y 0 conversiones. "
                f"Se pausa para proteger el capital."
            ),
            "details": {
                "cost": cost,
                "clicks": clicks,
                "conversions": conversions
            }
        }

    # Si el CPA supera el límite máximo permitido (1.5x del objetivo)
    if conversions >= MIN_CONVERSIONS_TO_EVALUATE and cpa > (_target_cpa * MAX_CPA_BEFORE_PAUSE):
        return {
            "action": "PAUSE",
            "campaign_id": campaign_id,
            "campaign_name": campaign_name,
            "reason": (
                f"APAGADO: La campaña '{campaign_name}' tiene un CPA de ${cpa:.2f}, "
                f"que supera el máximo permitido de ${_target_cpa * MAX_CPA_BEFORE_PAUSE:.2f} "
                f"(1.5x del objetivo de ${_target_cpa:.2f}). Se pausa."
            ),
            "details": {
                "cpa": cpa,
                "target_cpa": _target_cpa,
                "max_allowed": _target_cpa * MAX_CPA_BEFORE_PAUSE
            }
        }

    # ====================================================
    # REGLA 2: ESCALADO HORIZONTAL (Clonar lo excepcional)
    # Si el CPA es excepcionalmente bajo → clonar estructura
    # ====================================================
    if (conversions >= MIN_CONVERSIONS_TO_EVALUATE 
        and cpa > 0 
        and cpa < (_target_cpa * HORIZONTAL_SCALE_THRESHOLD)
        and clicks >= MIN_CLICKS_FOR_TRACTION):
        return {
            "action": "SCALE_HORIZONTAL",
            "campaign_id": campaign_id,
            "campaign_name": campaign_name,
            "reason": (
                f"ESCALAR HORIZONTAL: La campaña '{campaign_name}' es excepcionalmente rentable. "
                f"CPA de ${cpa:.2f} (menos del 50% del objetivo de ${_target_cpa:.2f}). "
                f"Se recomienda clonar la estructura hacia nuevos grupos de anuncios."
            ),
            "details": {
                "cpa": cpa,
                "conversions": conversions,
                "efficiency_ratio": round(cpa / _target_cpa, 2)
            }
        }

    # ====================================================
    # REGLA 3: ESCALADO VERTICAL (Inyectar más presupuesto)
    # Si el CPA está por debajo del límite y tiene tracción
    # ====================================================
    if (conversions >= MIN_CONVERSIONS_TO_EVALUATE 
        and cpa > 0 
        and cpa < (_target_cpa * VERTICAL_SCALE_THRESHOLD)
        and clicks >= MIN_CLICKS_FOR_TRACTION):
        
        suggested_increase = BUDGET_INCREASE_PERCENT
        
        # Si el gasto actual ya se acerca al máximo diario, reducimos el incremento
        if cost > (_max_daily_spend * 0.8):
            suggested_increase = 0.10  # Solo 10% si ya está cerca del tope
        
        return {
            "action": "SCALE_VERTICAL",
            "campaign_id": campaign_id,
            "campaign_name": campaign_name,
            "reason": (
                f"ESCALAR VERTICAL: La campaña '{campaign_name}' tiene tracción positiva. "
                f"CPA de ${cpa:.2f} (por debajo del 70% del objetivo de ${_target_cpa:.2f}). "
                f"Se recomienda incrementar presupuesto un {int(suggested_increase * 100)}%."
            ),
            "details": {
                "cpa": cpa,
                "suggested_increase_percent": suggested_increase,
                "current_cost": cost
            }
        }

    # ====================================================
    # REGLA 4: MANTENER (Sin datos suficientes o rendimiento neutral)
    # ====================================================
    reason_hold = ""
    if conversions < MIN_CONVERSIONS_TO_EVALUATE:
        reason_hold = (
            f"MANTENER: La campaña '{campaign_name}' aún no tiene suficientes datos "
            f"({conversions} conversiones, necesitamos al menos {MIN_CONVERSIONS_TO_EVALUATE}). "
            f"Esperando más datos antes de tomar una decisión."
        )
    else:
        reason_hold = (
            f"MANTENER: La campaña '{campaign_name}' tiene un CPA de ${cpa:.2f} "
            f"que está dentro del rango aceptable (objetivo: ${_target_cpa:.2f}). "
            f"No se requiere acción inmediata."
        )
    
    return {
        "action": "HOLD",
        "campaign_id": campaign_id,
        "campaign_name": campaign_name,
        "reason": reason_hold,
        "details": {
            "cpa": cpa,
            "conversions": conversions,
            "clicks": clicks
        }
    }


def evaluate_all_campaigns(campaigns: list[dict], target_cpa: float = None, max_daily_spend: float = None) -> list[dict]:
    """
    Evalúa todas las campañas y retorna una lista de decisiones ordenadas por prioridad.
    Prioridad: PAUSE > SCALE_HORIZONTAL > SCALE_VERTICAL > HOLD

    Args:
        campaigns: List of campaign metric dicts.
        target_cpa: Optional CPA goal override (multi-tenant).
        max_daily_spend: Optional max daily spend override (multi-tenant).
    """
    decisions = [evaluate_campaign(c, target_cpa=target_cpa, max_daily_spend=max_daily_spend) for c in campaigns]
    
    priority = {"PAUSE": 0, "SCALE_HORIZONTAL": 1, "SCALE_VERTICAL": 2, "HOLD": 3}
    decisions.sort(key=lambda d: priority.get(d["action"], 99))
    
    return decisions


def generate_report(decisions: list[dict], target_cpa: float = None, max_daily_spend: float = None) -> str:
    """
    Genera un reporte legible con todas las decisiones tomadas.

    Args:
        decisions: List of decision dicts.
        target_cpa: Optional CPA goal override (multi-tenant).
        max_daily_spend: Optional max daily spend override (multi-tenant).
    """
    _target_cpa = target_cpa if target_cpa is not None else TARGET_CPA
    _max_daily_spend = max_daily_spend if max_daily_spend is not None else MAX_DAILY_SPEND

    report = "=" * 60 + "\n"
    report += "  REPORTE DEL ORQUESTADOR - DECISIONES AUTOMÁTICAS\n"
    report += "=" * 60 + "\n\n"
    report += f"  CPA Objetivo: ${_target_cpa:.2f}\n"
    report += f"  Gasto Diario Máximo: ${_max_daily_spend:.2f}\n\n"
    
    actions_count = {"PAUSE": 0, "SCALE_HORIZONTAL": 0, "SCALE_VERTICAL": 0, "HOLD": 0}
    
    for d in decisions:
        actions_count[d["action"]] = actions_count.get(d["action"], 0) + 1
        icon = {
            "PAUSE": "🛑",
            "SCALE_HORIZONTAL": "🔀",
            "SCALE_VERTICAL": "📈",
            "HOLD": "⏸️"
        }.get(d["action"], "❓")
        
        report += f"{icon} {d['reason']}\n"
        report += "-" * 60 + "\n"
    
    report += f"\nRESUMEN:\n"
    report += f"  🛑 Pausar: {actions_count['PAUSE']}\n"
    report += f"  🔀 Escalar Horizontal: {actions_count['SCALE_HORIZONTAL']}\n"
    report += f"  📈 Escalar Vertical: {actions_count['SCALE_VERTICAL']}\n"
    report += f"  ⏸️ Mantener: {actions_count['HOLD']}\n"
    
    return report
