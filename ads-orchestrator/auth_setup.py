import os
from google_auth_oauthlib.flow import InstalledAppFlow

# You need to download the client_secrets.json from Google Cloud Console
# and place it in the same directory, or we can use the raw ID/Secret directly.

def main():
    print("\n--- GOOGLE ADS API - OAUTH2 SETUP ---")
    client_id = input("Pega tu Client ID (ID de cliente): ").strip()
    client_secret = input("Pega tu Client Secret (Secreto del cliente): ").strip()
    
    # We create a temporary client_secrets config dynamically
    client_config = {
        "installed": {
            "client_id": client_id,
            "client_secret": client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    }
    
    flow = InstalledAppFlow.from_client_config(
        client_config, scopes=["https://www.googleapis.com/auth/adwords"]
    )
    
    # Run the flow (this will open your browser)
    flow.redirect_uri = 'urn:ietf:wg:oauth:2.0:oob'
    
    auth_url, _ = flow.authorization_url(prompt='consent')
    
    print("\n" + "="*50)
    print("1. Abre esta URL en tu navegador web:")
    print(auth_url)
    print("2. Inicia sesión con la cuenta de Google que tiene acceso a Google Ads.")
    print("3. Si sale una advertencia, haz clic en Avanzado > Ir a la app (inseguro).")
    print("4. Copia el código de autorización que te da al final.")
    print("="*50 + "\n")
    
    code = input("Pega el código de autorización aquí: ").strip()
    
    try:
        flow.fetch_token(code=code)
        refresh_token = flow.credentials.refresh_token
        print("\n¡ÉXITO!")
        print("Tu REFRESH TOKEN es:")
        print(refresh_token)
        print("\nAhora copia este Refresh Token y ponlo en tu archivo .env")
    except Exception as e:
        print(f"\nHubo un error obteniendo el token: {e}")

if __name__ == "__main__":
    main()
