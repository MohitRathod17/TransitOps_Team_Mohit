from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    DB_HOST: str = "127.0.0.1"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_NAME: str = "transitops"
    DB_SSL: bool = False
    DB_SSL_CA_PATH: Optional[str] = None
    JWT_SECRET: str = "8f753e7f9d4c4c00a4a40d7721408380transitopssecretkey"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
