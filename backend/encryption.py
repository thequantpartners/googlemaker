"""
encryption.py — AES-256 encryption for Google Ads credential fields.
Uses Fernet (symmetric encryption) from the cryptography library.
"""

import os

from cryptography.fernet import Fernet
from dotenv import load_dotenv

load_dotenv()

_ENCRYPTION_KEY: str = os.getenv("ENCRYPTION_KEY", "")

if not _ENCRYPTION_KEY:
    # Auto-generate a key for local dev so the app doesn't crash on first run.
    _ENCRYPTION_KEY = Fernet.generate_key().decode()
    print(
        "[WARNING] ENCRYPTION_KEY not set -- generated a temporary key. "
        "Set ENCRYPTION_KEY in .env for persistent encryption."
    )

_fernet = Fernet(_ENCRYPTION_KEY.encode() if isinstance(_ENCRYPTION_KEY, str) else _ENCRYPTION_KEY)


def encrypt_value(value: str) -> str:
    """Encrypt a plaintext string and return base64-encoded ciphertext."""
    return _fernet.encrypt(value.encode()).decode()


def decrypt_value(encrypted: str) -> str:
    """Decrypt a base64-encoded ciphertext string back to plaintext."""
    return _fernet.decrypt(encrypted.encode()).decode()
