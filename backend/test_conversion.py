from google.ads.googleads.client import GoogleAdsClient
import uuid

client = GoogleAdsClient.load_from_dict({
    "developer_token": "test",
    "client_id": "test",
    "client_secret": "test",
    "refresh_token": "test",
    "use_proto_plus": True
})

try:
    conversion_action_operation = client.get_type("ConversionActionOperation")
    conversion_action = conversion_action_operation.create
    conversion_action.name = f"Test ({uuid.uuid4().hex[:4]})"
    conversion_action.type_ = client.enums.ConversionActionTypeEnum.WEBPAGE
    conversion_action.status = client.enums.ConversionActionStatusEnum.ENABLED
    conversion_action.category = client.enums.ConversionActionCategoryEnum.LEAD
    conversion_action.value_settings.default_value = 1.0
    conversion_action.value_settings.always_use_default_value = True
    print("Success")
except Exception as e:
    import traceback
    traceback.print_exc()
    print("Exception str:", str(e))
