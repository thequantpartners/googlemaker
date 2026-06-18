"""
actions.py - Módulo de Ejecución
Realiza los cambios reales en la cuenta de Google Ads:
  - Aumentar presupuesto de una campaña
  - Pausar un anuncio o campaña
  - Clonar un grupo de anuncios (escalado horizontal)
"""

from src.google_ads_client import get_google_ads_client, get_target_customer_id


def increase_campaign_budget(campaign_id: str, increase_percent: float, dry_run: bool = True, client=None, customer_id: str = None) -> str:
    """
    Incrementa el presupuesto diario de una campaña en un porcentaje dado.
    
    Args:
        campaign_id: ID de la campaña a escalar.
        increase_percent: Porcentaje de incremento (ej. 0.25 = 25%).
        dry_run: Si True, solo simula y reporta sin hacer cambios reales.
        client: Optional pre-built GoogleAdsClient instance (multi-tenant).
        customer_id: Optional target customer ID string (multi-tenant).
    
    Returns:
        String con el resultado de la operación.
    """
    if client is None:
        client = get_google_ads_client()
    if customer_id is None:
        customer_id = get_target_customer_id()
    ga_service = client.get_service("GoogleAdsService")

    # Primero: obtener el presupuesto actual de la campaña
    query = f"""
        SELECT
            campaign.id,
            campaign.name,
            campaign_budget.amount_micros,
            campaign_budget.resource_name
        FROM campaign
        WHERE campaign.id = {campaign_id}
    """

    request = client.get_type("SearchGoogleAdsRequest")
    request.customer_id = customer_id
    request.query = query

    try:
        response = ga_service.search(request=request)
        
        campaign_row = None
        for row in response:
            campaign_row = row
            break
        
        if not campaign_row:
            return f"Error: No se encontró la campaña con ID {campaign_id}."
        
        current_budget_micros = campaign_row.campaign_budget.amount_micros
        current_budget = current_budget_micros / 1_000_000
        new_budget = current_budget * (1 + increase_percent)
        new_budget_micros = int(new_budget * 1_000_000)
        budget_resource = campaign_row.campaign_budget.resource_name

        if dry_run:
            return (
                f"[DRY RUN] Campaña '{campaign_row.campaign.name}' (ID: {campaign_id}):\n"
                f"  Presupuesto actual: ${current_budget:.2f}\n"
                f"  Incremento: {int(increase_percent * 100)}%\n"
                f"  Nuevo presupuesto propuesto: ${new_budget:.2f}\n"
                f"  ⚠️ No se aplicó (modo simulación)."
            )

        # Ejecutar la mutación real
        campaign_budget_service = client.get_service("CampaignBudgetService")
        campaign_budget_operation = client.get_type("CampaignBudgetOperation")
        
        campaign_budget = campaign_budget_operation.update
        campaign_budget.resource_name = budget_resource
        campaign_budget.amount_micros = new_budget_micros
        
        field_mask = client.get_type("FieldMask")
        field_mask.paths.append("amount_micros")
        campaign_budget_operation.update_mask.CopyFrom(field_mask)

        response = campaign_budget_service.mutate_campaign_budgets(
            customer_id=customer_id,
            operations=[campaign_budget_operation]
        )

        return (
            f"✅ ÉXITO: Presupuesto de '{campaign_row.campaign.name}' actualizado.\n"
            f"  De: ${current_budget:.2f} → A: ${new_budget:.2f} (+{int(increase_percent * 100)}%)"
        )

    except Exception as e:
        return f"Error al modificar presupuesto de campaña {campaign_id}: {e}"


def pause_campaign(campaign_id: str, dry_run: bool = True, client=None, customer_id: str = None) -> str:
    """
    Pausa una campaña para detener el gasto.
    
    Args:
        campaign_id: ID de la campaña a pausar.
        dry_run: Si True, solo simula.
        client: Optional pre-built GoogleAdsClient instance (multi-tenant).
        customer_id: Optional target customer ID string (multi-tenant).
    
    Returns:
        String con el resultado de la operación.
    """
    if client is None:
        client = get_google_ads_client()
    if customer_id is None:
        customer_id = get_target_customer_id()

    if dry_run:
        return (
            f"[DRY RUN] Campaña ID {campaign_id}:\n"
            f"  Se pausaría inmediatamente para proteger el capital.\n"
            f"  ⚠️ No se aplicó (modo simulación)."
        )

    try:
        campaign_service = client.get_service("CampaignService")
        campaign_operation = client.get_type("CampaignOperation")

        campaign = campaign_operation.update
        campaign.resource_name = campaign_service.campaign_path(customer_id, campaign_id)
        campaign.status = client.enums.CampaignStatusEnum.PAUSED

        field_mask = client.get_type("FieldMask")
        field_mask.paths.append("status")
        campaign_operation.update_mask.CopyFrom(field_mask)

        response = campaign_service.mutate_campaigns(
            customer_id=customer_id,
            operations=[campaign_operation]
        )

        return f"🛑 ÉXITO: Campaña {campaign_id} PAUSADA correctamente."

    except Exception as e:
        return f"Error al pausar la campaña {campaign_id}: {e}"


def get_ad_group_details(campaign_id: str, client=None, customer_id: str = None) -> list[dict]:
    """
    Obtiene los grupos de anuncios y sus keywords de una campaña para clonación horizontal.
    
    Args:
        campaign_id: ID de la campaña a analizar.
        client: Optional pre-built GoogleAdsClient instance (multi-tenant).
        customer_id: Optional target customer ID string (multi-tenant).
    
    Returns:
        Lista de diccionarios con la información de los ad groups.
    """
    if client is None:
        client = get_google_ads_client()
    if customer_id is None:
        customer_id = get_target_customer_id()
    ga_service = client.get_service("GoogleAdsService")

    query = f"""
        SELECT
            ad_group.id,
            ad_group.name,
            ad_group.status,
            ad_group_criterion.keyword.text,
            ad_group_criterion.keyword.match_type,
            metrics.conversions,
            metrics.cost_micros
        FROM keyword_view
        WHERE campaign.id = {campaign_id}
            AND ad_group.status = 'ENABLED'
        ORDER BY metrics.conversions DESC
        LIMIT 50
    """

    request = client.get_type("SearchGoogleAdsRequest")
    request.customer_id = customer_id
    request.query = query

    try:
        response = ga_service.search(request=request)
        
        results = []
        for row in response:
            results.append({
                "ad_group_id": row.ad_group.id,
                "ad_group_name": row.ad_group.name,
                "keyword": row.ad_group_criterion.keyword.text,
                "match_type": row.ad_group_criterion.keyword.match_type.name,
                "conversions": round(row.metrics.conversions, 2),
                "cost": round(row.metrics.cost_micros / 1_000_000, 2)
            })
        
        return results

    except Exception as e:
        print(f"Error al obtener detalles de ad groups: {e}")
        return []


def generate_horizontal_scaling_plan(campaign_id: str, client=None, customer_id: str = None) -> str:
    """
    Analiza una campaña exitosa y genera un plan de escalado horizontal:
    extrae las keywords ganadoras y sugiere nuevos ad groups.
    
    Args:
        campaign_id: ID de la campaña a analizar.
        client: Optional pre-built GoogleAdsClient instance (multi-tenant).
        customer_id: Optional target customer ID string (multi-tenant).
    
    Returns:
        String con el plan de clonación propuesto.
    """
    ad_groups = get_ad_group_details(campaign_id, client=client, customer_id=customer_id)
    
    if not ad_groups:
        return f"No se encontraron datos de ad groups para la campaña {campaign_id}."

    # Filtrar keywords ganadoras (las que tienen conversiones)
    winning_keywords = [ag for ag in ad_groups if ag["conversions"] > 0]
    
    plan = "=" * 60 + "\n"
    plan += f"  PLAN DE ESCALADO HORIZONTAL - Campaña {campaign_id}\n"
    plan += "=" * 60 + "\n\n"
    
    if winning_keywords:
        plan += f"🏆 Keywords Ganadoras ({len(winning_keywords)} encontradas):\n"
        for kw in winning_keywords:
            plan += f"  - '{kw['keyword']}' ({kw['match_type']})\n"
            plan += f"    Conversiones: {kw['conversions']} | Costo: ${kw['cost']}\n"
        
        plan += f"\n📋 RECOMENDACIÓN:\n"
        plan += f"  Crear {len(winning_keywords)} nuevos Ad Groups en campañas paralelas\n"
        plan += f"  usando estas keywords ganadoras con variaciones de:\n"
        plan += f"    - Match Types diferentes (Broad, Phrase, Exact)\n"
        plan += f"    - Audiencias similares o mercados geográficos paralelos\n"
        plan += f"    - Copys de anuncio con ángulos diferentes\n"
    else:
        plan += "⚠️ No se encontraron keywords con conversiones aún.\n"
        plan += "   Se recomienda esperar más datos antes de escalar horizontalmente.\n"
    
    return plan
