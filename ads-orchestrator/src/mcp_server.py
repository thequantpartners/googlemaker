"""
mcp_server.py - Servidor MCP del Orquestador de Google Ads
Expone las herramientas del orquestador como funciones que Antigravity
puede invocar directamente a través del Model Context Protocol.
"""

from mcp.server.fastmcp import FastMCP
from src.fetch_metrics import get_campaign_metrics
from src.scaling_logic import evaluate_all_campaigns, generate_report
from src.actions import (
    increase_campaign_budget,
    pause_campaign,
    generate_horizontal_scaling_plan,
)

# Initialize the MCP Server
mcp = FastMCP("GoogleAdsOrchestrator")


@mcp.tool()
def fetch_campaign_metrics() -> str:
    """
    Obtiene las métricas de rendimiento (Gasto, Conversiones, CPA, Clicks, Impresiones)
    de todas las campañas activas en Google Ads.
    """
    metrics = get_campaign_metrics()
    if not metrics:
        return "No se encontraron campañas activas o hubo un error de conexión."

    output = "📊 Métricas de Campañas Activas:\n\n"
    for m in metrics:
        output += f"• [{m['campaign_id']}] {m['campaign_name']}\n"
        output += f"  Gasto: ${m['cost']} | Conversiones: {m['conversions']} | CPA: ${m['cpa']}\n"
        output += f"  Clicks: {m['clicks']} | Impresiones: {m['impressions']}\n\n"

    return output


@mcp.tool()
def analyze_and_decide() -> str:
    """
    Analiza todas las campañas activas y genera un reporte con las decisiones
    del orquestador: qué campañas escalar, cuáles pausar y cuáles mantener.
    NO ejecuta cambios, solo reporta las recomendaciones.
    """
    metrics = get_campaign_metrics()
    if not metrics:
        return "No se encontraron campañas activas para evaluar."

    decisions = evaluate_all_campaigns(metrics)
    report = generate_report(decisions)
    return report


@mcp.tool()
def run_orchestrator_dry_run() -> str:
    """
    Ejecuta el ciclo completo del orquestador en MODO SIMULACIÓN (dry run).
    Lee métricas, evalúa decisiones y simula las acciones sin aplicar cambios reales.
    Ideal para revisar qué haría el sistema antes de darle permiso de actuar.
    """
    from orchestrator import run_orchestrator
    result = run_orchestrator(dry_run=True)
    
    output = f"Ciclo completado. Campañas evaluadas: {result['campaigns_evaluated']}\n\n"
    for d in result["decisions"]:
        output += f"[{d['action']}] {d['campaign']}: {d['reason']}\n\n"
    
    return output


@mcp.tool()
def run_orchestrator_live() -> str:
    """
    ⚡ Ejecuta el ciclo completo del orquestador en MODO REAL.
    Lee métricas, evalúa decisiones y APLICA los cambios en Google Ads:
    pausa campañas malas, sube presupuestos de campañas buenas.
    ¡CUIDADO! Esto modifica tu cuenta de Google Ads de verdad.
    """
    from orchestrator import run_orchestrator
    result = run_orchestrator(dry_run=False)
    
    output = f"⚡ Ciclo REAL completado. Campañas evaluadas: {result['campaigns_evaluated']}\n\n"
    for d in result["decisions"]:
        output += f"[{d['action']}] {d['campaign']}: {d['reason']}\n\n"
    
    return output


@mcp.tool()
def scale_campaign_budget(campaign_id: str, increase_percent: float = 0.25, simulate: bool = True) -> str:
    """
    Incrementa el presupuesto diario de una campaña específica.
    
    Args:
        campaign_id: El ID numérico de la campaña.
        increase_percent: Porcentaje de incremento (0.25 = 25%). Por defecto 25%.
        simulate: Si True, solo simula. Si False, aplica el cambio real.
    """
    return increase_campaign_budget(campaign_id, increase_percent, dry_run=simulate)


@mcp.tool()
def pause_ad_campaign(campaign_id: str, simulate: bool = True) -> str:
    """
    Pausa una campaña específica para detener el gasto inmediatamente.
    
    Args:
        campaign_id: El ID numérico de la campaña a pausar.
        simulate: Si True, solo simula. Si False, pausa de verdad.
    """
    return pause_campaign(campaign_id, dry_run=simulate)


@mcp.tool()
def analyze_for_horizontal_scaling(campaign_id: str) -> str:
    """
    Analiza una campaña exitosa y genera un plan de escalado horizontal:
    extrae las keywords ganadoras y sugiere cómo clonar la estructura
    hacia nuevos grupos de anuncios para capturar mercados paralelos.
    
    Args:
        campaign_id: El ID numérico de la campaña a analizar.
    """
    return generate_horizontal_scaling_plan(campaign_id)


if __name__ == "__main__":
    print("🚀 Iniciando servidor MCP de Google Ads Orchestrator...")
    print("   Herramientas disponibles:")
    print("   - fetch_campaign_metrics")
    print("   - analyze_and_decide")
    print("   - run_orchestrator_dry_run")
    print("   - run_orchestrator_live")
    print("   - scale_campaign_budget")
    print("   - pause_ad_campaign")
    print("   - analyze_for_horizontal_scaling")
    mcp.run()
