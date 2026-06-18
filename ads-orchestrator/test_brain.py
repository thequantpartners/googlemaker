"""
test_brain.py - Prueba de la lógica de escalado con datos simulados.
No requiere conexión a Google Ads, solo verifica que las reglas funcionen.
"""

from src.scaling_logic import evaluate_all_campaigns, generate_report

# Campañas simuladas para probar las 4 reglas del cerebro
fake_campaigns = [
    {
        "campaign_id": 1001,
        "campaign_name": "Campaña Estrella - Leads SEO",
        "cost": 45.00,
        "conversions": 12,
        "cpa": 3.75,       # CPA excelente (muy por debajo de $15)
        "clicks": 120,
        "impressions": 5000
    },
    {
        "campaign_id": 1002,
        "campaign_name": "Campaña Buena - Google Search",
        "cost": 80.00,
        "conversions": 10,
        "cpa": 8.00,        # CPA bueno (por debajo del 70% del objetivo)
        "clicks": 200,
        "impressions": 8000
    },
    {
        "campaign_id": 1003,
        "campaign_name": "Campaña Mala - Display Genérico",
        "cost": 60.00,
        "conversions": 0,
        "cpa": 0,           # Sin conversiones, gasto alto
        "clicks": 45,
        "impressions": 12000
    },
    {
        "campaign_id": 1004,
        "campaign_name": "Campaña Carísima - YouTube Ads",
        "cost": 150.00,
        "conversions": 4,
        "cpa": 37.50,       # CPA muy por encima del objetivo
        "clicks": 80,
        "impressions": 20000
    },
    {
        "campaign_id": 1005,
        "campaign_name": "Campaña Nueva - Apenas empezando",
        "cost": 5.00,
        "conversions": 1,
        "cpa": 5.00,
        "clicks": 8,        # Pocos clicks, datos insuficientes
        "impressions": 300
    }
]

if __name__ == "__main__":
    print("🧪 PRUEBA DEL CEREBRO DEL ORQUESTADOR\n")
    print("Usando campañas simuladas para verificar las reglas de decisión.\n")
    
    decisions = evaluate_all_campaigns(fake_campaigns)
    report = generate_report(decisions)
    print(report)
    
    # Verificación de resultados esperados
    print("\n🔍 VERIFICACIÓN DE REGLAS:")
    
    expected = {
        1001: "SCALE_HORIZONTAL",   # CPA $3.75 < 50% de $15 → clonar
        1002: "SCALE_VERTICAL",     # CPA $8.00 < 70% de $15 → más presupuesto
        1003: "PAUSE",              # 0 conversiones, 45 clicks → pausar
        1004: "PAUSE",              # CPA $37.50 > 1.5x de $15 → pausar
        1005: "HOLD",               # Datos insuficientes → mantener
    }
    
    all_passed = True
    for d in decisions:
        cid = d["campaign_id"]
        expected_action = expected.get(cid, "UNKNOWN")
        status = "✅ CORRECTO" if d["action"] == expected_action else "❌ FALLO"
        if d["action"] != expected_action:
            all_passed = False
        print(f"  {status}: {d['campaign_name']} → {d['action']} (esperado: {expected_action})")
    
    print(f"\n{'🎉 TODAS LAS REGLAS PASARON!' if all_passed else '⚠️ Algunas reglas fallaron.'}")
