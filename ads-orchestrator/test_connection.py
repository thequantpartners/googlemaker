from src.fetch_metrics import get_campaign_metrics

def main():
    print("Conectando con Google Ads...")
    metrics = get_campaign_metrics()
    
    if not metrics:
        print("No se encontraron campañas activas o hubo un error (Revisa si la cuenta tiene campañas).")
        return
        
    print(f"\n¡Éxito! Se encontraron {len(metrics)} campañas activas:")
    print("-" * 50)
    for m in metrics:
        print(f"[{m['campaign_id']}] {m['campaign_name']}")
        print(f"CPA Actual: ${m['cpa']} | Gasto: ${m['cost']}")
        print("-" * 50)

if __name__ == "__main__":
    main()
