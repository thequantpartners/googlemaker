import os
from google.ads.googleads.client import GoogleAdsClient
from dotenv import load_dotenv

def get_google_ads_client(credentials_dict: dict = None) -> GoogleAdsClient:
    """
    Initializes and returns a GoogleAdsClient.

    Args:
        credentials_dict: Optional dictionary with Google Ads API credentials.
            Expected keys: developer_token, client_id, client_secret,
            refresh_token, login_customer_id.
            If None, credentials are loaded from the .env file (local dev fallback).
    """
    if credentials_dict is not None:
        # Build credentials from the provided dict (multi-tenant path)
        credentials = {
            "developer_token": credentials_dict["developer_token"],
            "client_id": credentials_dict["client_id"],
            "client_secret": credentials_dict["client_secret"],
            "refresh_token": credentials_dict["refresh_token"],
            "login_customer_id": str(credentials_dict.get("login_customer_id", "")).replace("-", ""),
            "use_proto_plus": True
        }
    else:
        # Fallback: load from .env for local development
        load_dotenv()
        credentials = {
            "developer_token": os.getenv("DEVELOPER_TOKEN"),
            "client_id": os.getenv("CLIENT_ID"),
            "client_secret": os.getenv("CLIENT_SECRET"),
            "refresh_token": os.getenv("REFRESH_TOKEN"),
            "login_customer_id": os.getenv("LOGIN_CUSTOMER_ID", "").replace("-", ""),
            "use_proto_plus": True
        }

    # We load it from the dictionary instead of a yaml file to keep it entirely in .env
    try:
        client = GoogleAdsClient.load_from_dict(credentials)
        return client
    except Exception as e:
        print(f"Error al inicializar el cliente de Google Ads: {e}")
        raise

def get_target_customer_id(target_id: str = None) -> str:
    """
    Returns the TARGET_CUSTOMER_ID (the specific ad account with campaigns).

    Args:
        target_id: Optional customer ID string. If None, falls back to .env.
    """
    if target_id is not None:
        return str(target_id).replace("-", "")

    # Fallback: load from .env for local development
    load_dotenv()
    customer_id = os.getenv("TARGET_CUSTOMER_ID", "")
    if not customer_id:
        print("ADVERTENCIA: TARGET_CUSTOMER_ID no está definido en el archivo .env")
    return customer_id.replace("-", "")
