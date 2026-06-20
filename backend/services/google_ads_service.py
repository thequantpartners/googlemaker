"""
services/google_ads_service.py
"""
import os
from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException
from google.api_core import protobuf_helpers

def get_google_ads_client(refresh_token: str, login_customer_id: str) -> GoogleAdsClient:
    """
    Initialize and return a GoogleAdsClient using credentials from DB/Env.
    """
    credentials = {
        "developer_token": os.getenv("GOOGLE_ADS_DEVELOPER_TOKEN", ""),
        "client_id": os.getenv("GOOGLE_ADS_CLIENT_ID", ""),
        "client_secret": os.getenv("GOOGLE_ADS_CLIENT_SECRET", ""),
        "refresh_token": refresh_token,
        "use_proto_plus": True
    }
    if login_customer_id:
        credentials["login_customer_id"] = login_customer_id.replace("-", "")
        
    return GoogleAdsClient.load_from_dict(credentials)

def fetch_accessible_customers(refresh_token: str) -> list[dict]:
    """
    Fetch accessible customers for a given refresh token.
    Returns a list of dicts containing login_customer_id and target_customer_id
    to properly handle MCC (Manager) accounts.
    """
    credentials = {
        "developer_token": os.getenv("GOOGLE_ADS_DEVELOPER_TOKEN", ""),
        "client_id": os.getenv("GOOGLE_ADS_CLIENT_ID", ""),
        "client_secret": os.getenv("GOOGLE_ADS_CLIENT_SECRET", ""),
        "refresh_token": refresh_token,
        "use_proto_plus": True
    }
    client = GoogleAdsClient.load_from_dict(credentials)
    customer_service = client.get_service("CustomerService")
    response = customer_service.list_accessible_customers()
    accessible_ids = [resource_name.split("/")[-1] for resource_name in response.resource_names]
    
    valid_accounts = []
    
    for login_id in accessible_ids:
        try:
            creds_with_login = credentials.copy()
            creds_with_login["login_customer_id"] = login_id
            client_with_login = GoogleAdsClient.load_from_dict(creds_with_login)
            ga_service = client_with_login.get_service("GoogleAdsService")
            
            # Query all linked clients (this includes the manager itself if it's in the hierarchy)
            query = """
                SELECT customer_client.id, customer_client.manager 
                FROM customer_client 
                WHERE customer_client.status = 'ENABLED'
            """
            search_response = ga_service.search(customer_id=login_id, query=query)
            for row in search_response:
                # We only want leaf accounts (non-managers) to fetch metrics
                if not row.customer_client.manager:
                    valid_accounts.append({
                        "login_customer_id": login_id,
                        "target_customer_id": str(row.customer_client.id)
                    })
        except Exception as e:
            print(f"Failed to query hierarchy for {login_id}: {e}")
            # Fallback: just add the accessible_id itself if we can't query hierarchy
            valid_accounts.append({
                "login_customer_id": login_id,
                "target_customer_id": login_id
            })
            
    # Remove duplicates based on target_customer_id to avoid creating duplicate credentials
    seen_targets = set()
    unique_accounts = []
    for acc in valid_accounts:
        if acc["target_customer_id"] not in seen_targets:
            seen_targets.add(acc["target_customer_id"])
            unique_accounts.append(acc)
            
    return unique_accounts

def fetch_campaign_metrics(client: GoogleAdsClient, target_customer_id: str) -> list[dict]:
    """
    Fetch aggregated campaign metrics for the last 30 days.
    """
    ga_service = client.get_service("GoogleAdsService")
    
    query = """
        SELECT
          campaign.id,
          campaign.name,
          campaign.status,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions
        FROM campaign
        WHERE segments.date DURING LAST_30_DAYS
          AND campaign.status != 'REMOVED'
        ORDER BY metrics.cost_micros DESC
    """
    
    try:
        customer_id_clean = target_customer_id.replace("-", "")
        response = ga_service.search(customer_id=customer_id_clean, query=query)
        
        campaigns = []
        for row in response:
            campaigns.append({
                "campaign_id": str(row.campaign.id),
                "campaign_name": row.campaign.name,
                "status": row.campaign.status.name,
                "impressions": int(row.metrics.impressions),
                "clicks": int(row.metrics.clicks),
                "cost": float(row.metrics.cost_micros / 1_000_000.0),
                "conversions": float(row.metrics.conversions)
            })
            
        return campaigns
    except GoogleAdsException as ex:
        print(f"GoogleAdsException: {ex}")
        for error in ex.failure.errors:
            print(f"Error: {error.message}")
        raise ValueError(f"Failed to fetch campaigns: {ex.failure.errors[0].message if ex.failure.errors else str(ex)}")

def apply_campaign_action(client: GoogleAdsClient, target_customer_id: str, campaign_id: str, action: str):
    """
    Apply a recommendation action (e.g. PAUSAR) to a specific campaign.
    """
    customer_id_clean = target_customer_id.replace("-", "")
    campaign_service = client.get_service("CampaignService")
    campaign_operation = client.get_type("CampaignOperation")

    campaign = campaign_operation.update
    campaign.resource_name = campaign_service.campaign_path(customer_id_clean, campaign_id)

    status_enum = client.enums.CampaignStatusEnum
    if action == "PAUSAR":
        campaign.status = status_enum.PAUSED
    elif action == "ACTIVAR":
        campaign.status = status_enum.ENABLED
    else:
        # We only support PAUSAR at the moment for status updates
        # AUMENTAR PRESUPUESTO could be implemented later via budget operations
        return

    # Update field mask
    campaign_operation.update_mask.paths.append("status")

    try:
        campaign_service.mutate_campaigns(
            customer_id=customer_id_clean, operations=[campaign_operation]
        )
    except GoogleAdsException as ex:
        print(f"GoogleAdsException: {ex}")
        for error in ex.failure.errors:
            print(f"Error: {error.message}")
        raise ValueError(f"Failed to mutate campaign: {ex.failure.errors[0].message if ex.failure.errors else str(ex)}")


# ── Campaign Creation ────────────────────────────────────────────────────────


import datetime
import uuid


def _create_campaign_budget(client: GoogleAdsClient, customer_id: str,
                            budget_name: str, daily_budget_usd: float) -> str:
    """Creates a campaign budget. Returns the budget resource_name."""
    budget_service = client.get_service("CampaignBudgetService")
    budget_operation = client.get_type("CampaignBudgetOperation")

    budget = budget_operation.create
    budget.name = f"{budget_name} ({uuid.uuid4().hex[:8]})"
    budget.amount_micros = int(daily_budget_usd * 1_000_000)
    budget.delivery_method = client.enums.BudgetDeliveryMethodEnum.STANDARD
    budget.explicitly_shared = False

    response = budget_service.mutate_campaign_budgets(
        customer_id=customer_id, operations=[budget_operation]
    )
    return response.results[0].resource_name


def _create_search_campaign(client: GoogleAdsClient, customer_id: str,
                             campaign_name: str, budget_resource_name: str) -> str:
    """Creates a SEARCH campaign in PAUSED state. Returns campaign resource_name."""
    campaign_service = client.get_service("CampaignService")
    campaign_operation = client.get_type("CampaignOperation")

    campaign = campaign_operation.create
    campaign.name = campaign_name
    campaign.advertising_channel_type = client.enums.AdvertisingChannelTypeEnum.SEARCH
    campaign.status = client.enums.CampaignStatusEnum.PAUSED
    campaign.campaign_budget = budget_resource_name

    # Bidding: Manual CPC (safest default, doesn't require conversion tracking enabled)
    campaign.manual_cpc = client.get_type("ManualCpc")()
    campaign.manual_cpc.enhanced_cpc_enabled = False

    # Network settings
    campaign.network_settings.target_google_search = True
    campaign.network_settings.target_search_network = True
    campaign.network_settings.target_content_network = False
    campaign.network_settings.target_partner_search_network = False

    response = campaign_service.mutate_campaigns(
        customer_id=customer_id, operations=[campaign_operation]
    )
    return response.results[0].resource_name


def _create_ad_group(client: GoogleAdsClient, customer_id: str,
                     campaign_resource_name: str, ad_group_name: str) -> str:
    """Creates a SEARCH_STANDARD ad group. Returns ad group resource_name."""
    ad_group_service = client.get_service("AdGroupService")
    ad_group_operation = client.get_type("AdGroupOperation")

    ad_group = ad_group_operation.create
    ad_group.name = ad_group_name
    ad_group.campaign = campaign_resource_name
    ad_group.type_ = client.enums.AdGroupTypeEnum.SEARCH_STANDARD
    ad_group.status = client.enums.AdGroupStatusEnum.ENABLED

    response = ad_group_service.mutate_ad_groups(
        customer_id=customer_id, operations=[ad_group_operation]
    )
    return response.results[0].resource_name


def _add_keywords(client: GoogleAdsClient, customer_id: str,
                  ad_group_resource_name: str, keywords: list[str]) -> int:
    """Adds BROAD match keywords to an ad group. Returns count of keywords added."""
    criterion_service = client.get_service("AdGroupCriterionService")

    operations = []
    for kw_text in keywords:
        kw_text = kw_text.strip()
        if not kw_text:
            continue
        operation = client.get_type("AdGroupCriterionOperation")
        criterion = operation.create
        criterion.ad_group = ad_group_resource_name
        criterion.keyword.text = kw_text
        criterion.keyword.match_type = client.enums.KeywordMatchTypeEnum.BROAD
        criterion.status = client.enums.AdGroupCriterionStatusEnum.ENABLED
        operations.append(operation)

    if not operations:
        return 0

    response = criterion_service.mutate_ad_group_criteria(
        customer_id=customer_id, operations=operations
    )
    return len(response.results)


def _create_responsive_search_ad(client: GoogleAdsClient, customer_id: str,
                                  ad_group_resource_name: str, final_url: str,
                                  headlines: list[str], descriptions: list[str]) -> str:
    """Creates a Responsive Search Ad. Returns ad resource_name."""
    ad_group_ad_service = client.get_service("AdGroupAdService")
    ad_group_ad_operation = client.get_type("AdGroupAdOperation")

    ad_group_ad = ad_group_ad_operation.create
    ad_group_ad.ad_group = ad_group_resource_name
    ad_group_ad.status = client.enums.AdGroupAdStatusEnum.ENABLED

    ad_group_ad.ad.final_urls.append(final_url)

    for headline_text in headlines:
        headline = client.get_type("AdTextAsset")
        headline.text = headline_text[:30]  # Enforce 30 char limit
        ad_group_ad.ad.responsive_search_ad.headlines.append(headline)

    for desc_text in descriptions:
        description = client.get_type("AdTextAsset")
        description.text = desc_text[:90]  # Enforce 90 char limit
        ad_group_ad.ad.responsive_search_ad.descriptions.append(description)

    response = ad_group_ad_service.mutate_ad_group_ads(
        customer_id=customer_id, operations=[ad_group_ad_operation]
    )
    return response.results[0].resource_name


def create_full_search_campaign(client: GoogleAdsClient, customer_id: str,
                                 config: dict) -> dict:
    """
    Creates a complete search campaign end-to-end.

    config keys:
        campaign_name, daily_budget, keywords (list[str]),
        headlines (list[str]), descriptions (list[str]), final_url (str)
    """
    customer_id_clean = customer_id.replace("-", "")

    try:
        # Step 1: Budget
        budget_rn = _create_campaign_budget(
            client, customer_id_clean,
            budget_name=config["campaign_name"],
            daily_budget_usd=config["daily_budget"],
        )

        # Step 2: Campaign (PAUSED)
        campaign_rn = _create_search_campaign(
            client, customer_id_clean,
            campaign_name=config["campaign_name"],
            budget_resource_name=budget_rn,
        )

        # Step 3: Ad Group
        ad_group_rn = _create_ad_group(
            client, customer_id_clean,
            campaign_resource_name=campaign_rn,
            ad_group_name=f"{config['campaign_name']} - Grupo 1",
        )

        # Step 4: Keywords
        kw_count = _add_keywords(
            client, customer_id_clean,
            ad_group_resource_name=ad_group_rn,
            keywords=config["keywords"],
        )

        # Step 5: Responsive Search Ad
        ad_rn = _create_responsive_search_ad(
            client, customer_id_clean,
            ad_group_resource_name=ad_group_rn,
            final_url=config["final_url"],
            headlines=config["headlines"],
            descriptions=config["descriptions"],
        )

        return {
            "status": "success",
            "campaign_name": config["campaign_name"],
            "keywords_added": kw_count,
        }

    except GoogleAdsException as ex:
        errors = [error.message for error in ex.failure.errors]
        raise ValueError(f"Error de Google Ads: {'; '.join(errors)}")

# ── Conversion Tracking ──────────────────────────────────────────────────────

def create_conversion_action(client: GoogleAdsClient, customer_id: str, name: str = "GMaker Conversion") -> dict:
    """
    Creates a WEBPAGE conversion action and fetches the global tag and event snippet.
    Returns a dict with 'snippet' and 'event_snippet'.
    """
    customer_id_clean = customer_id.replace("-", "")
    
    # 1. Create Conversion Action
    conversion_action_service = client.get_service("ConversionActionService")
    conversion_action_operation = client.get_type("ConversionActionOperation")
    
    conversion_action = conversion_action_operation.create
    conversion_action.name = f"{name} ({uuid.uuid4().hex[:4]})"
    conversion_action.type_ = client.enums.ConversionActionTypeEnum.WEBPAGE
    conversion_action.status = client.enums.ConversionActionStatusEnum.ENABLED
    conversion_action.category = client.enums.ConversionActionCategoryEnum.DEFAULT
    
    conversion_action.value_settings.default_value = 1.0
    conversion_action.value_settings.always_use_default_value = True

    try:
        response = conversion_action_service.mutate_conversion_actions(
            customer_id=customer_id_clean, operations=[conversion_action_operation]
        )
        resource_name = response.results[0].resource_name
    except GoogleAdsException as ex:
        errors = [error.message for error in ex.failure.errors]
        raise ValueError(f"Error creando conversión: {'; '.join(errors)}")
        
    # 2. Fetch the Snippets via GAQL
    ga_service = client.get_service("GoogleAdsService")
    query = f"""
        SELECT
            conversion_action.id,
            conversion_action.tag_snippets
        FROM conversion_action
        WHERE conversion_action.resource_name = '{resource_name}'
    """
    
    try:
        search_response = ga_service.search(customer_id=customer_id_clean, query=query)
        for row in search_response:
            snippets = row.conversion_action.tag_snippets
            if snippets:
                # The snippets list typically contains the global tag and the event tag
                return {
                    "global_site_tag": snippets[0].global_site_tag,
                    "event_snippet": snippets[0].event_snippet,
                    "conversion_action_id": row.conversion_action.id
                }
        return {"error": "Snippet not generated"}
    except GoogleAdsException as ex:
        errors = [error.message for error in ex.failure.errors]
        raise ValueError(f"Error obteniendo snippet: {'; '.join(errors)}")

def fetch_conversion_actions(client: GoogleAdsClient, customer_id: str) -> list[dict]:
    """Fetches all enabled or hidden conversion actions."""
    customer_id_clean = customer_id.replace("-", "")
    ga_service = client.get_service("GoogleAdsService")
    query = """
        SELECT
            conversion_action.id,
            conversion_action.name,
            conversion_action.status,
            conversion_action.category,
            conversion_action.type,
            conversion_action.tag_snippets
        FROM conversion_action
        WHERE conversion_action.status IN ('ENABLED', 'HIDDEN')
    """
    
    try:
        # First query: fetch campaigns with recent conversions
        campaigns_query = """
            SELECT
                campaign.name,
                segments.conversion_action
            FROM campaign
            WHERE segments.date DURING LAST_30_DAYS AND metrics.conversions > 0
        """
        active_campaigns_map = {}
        try:
            campaigns_response = ga_service.search(customer_id=customer_id_clean, query=campaigns_query)
            for row in campaigns_response:
                action_rn = row.segments.conversion_action
                if action_rn:
                    action_id = action_rn.split("/")[-1]
                    if action_id not in active_campaigns_map:
                        active_campaigns_map[action_id] = set()
                    active_campaigns_map[action_id].add(row.campaign.name)
        except GoogleAdsException:
            # If the account has no metrics or segments error, we just silently continue
            pass

        results = []
        search_response = ga_service.search(customer_id=customer_id_clean, query=query)
        for row in search_response:
            ca = row.conversion_action
            snippet = None
            if ca.tag_snippets:
                # Store the full HTML block
                snippet = f"<!-- Google tag (gtag.js) -->\n{ca.tag_snippets[0].global_site_tag}\n\n<!-- Event snippet -->\n{ca.tag_snippets[0].event_snippet}"
                
            active_camps = list(active_campaigns_map.get(str(ca.id), []))
            
            results.append({
                "id": ca.id,
                "name": ca.name,
                "status": ca.status.name,
                "category": ca.category.name,
                "type": ca.type_.name,
                "snippet": snippet,
                "active_campaigns": active_camps
            })
        return results
    except GoogleAdsException as ex:
        errors = [error.message for error in ex.failure.errors]
        raise ValueError(f"Error fetching conversions: {'; '.join(errors)}")

def remove_conversion_action(client: GoogleAdsClient, customer_id: str, conversion_action_id: str) -> bool:
    """Sets a conversion action status to REMOVED."""
    customer_id_clean = customer_id.replace("-", "")
    conversion_action_service = client.get_service("ConversionActionService")
    conversion_action_operation = client.get_type("ConversionActionOperation")
    
    conversion_action = conversion_action_operation.update
    conversion_action.resource_name = conversion_action_service.conversion_action_path(
        customer_id_clean, conversion_action_id
    )
    conversion_action.status = client.enums.ConversionActionStatusEnum.REMOVED
    
    # We must construct a field mask so the API knows what to update
    client.copy_from(
        conversion_action_operation.update_mask,
        protobuf_helpers.field_mask(None, conversion_action._pb),
    )
    
    try:
        conversion_action_service.mutate_conversion_actions(
            customer_id=customer_id_clean, operations=[conversion_action_operation]
        )
        return True
    except GoogleAdsException as ex:
        errors = [error.message for error in ex.failure.errors]
        raise ValueError(f"Error removing conversion: {'; '.join(errors)}")

