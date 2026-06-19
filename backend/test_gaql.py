from google.ads.googleads.client import GoogleAdsClient

def test_fetch_conversions():
    # Load from default local config or mock
    query = """
        SELECT
            conversion_action.id,
            conversion_action.name,
            conversion_action.status,
            conversion_action.category,
            conversion_action.type
        FROM conversion_action
        WHERE conversion_action.status IN ('ENABLED', 'HIDDEN')
    """
    print(query)

test_fetch_conversions()
