from google.ads.googleads.client import GoogleAdsClient

def test_campaign_goals():
    query = """
        SELECT
            campaign.id,
            campaign.name,
            conversion_goal_campaign_config.campaign,
            conversion_goal_campaign_config.custom_conversion_goal,
            custom_conversion_goal.id,
            custom_conversion_goal.conversion_actions
        FROM conversion_goal_campaign_config
        WHERE campaign.status IN ('ENABLED', 'PAUSED')
    """
    print(query)

test_campaign_goals()
