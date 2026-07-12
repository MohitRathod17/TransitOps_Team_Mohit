from pydantic_settings import BaseSettings
<<<<<<< HEAD
from typing import Optional

class Settings(BaseSettings):
    DB_HOST: str = "127.0.0.1"
=======

class Settings(BaseSettings):
    DB_HOST: str = "sqlite"
>>>>>>> 4743ddb1fcc3073d38e552c7334c81c51575aae1
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_NAME: str = "transitops"
<<<<<<< HEAD
    DB_SSL: bool = False
    DB_SSL_CA_PATH: Optional[str] = None
    JWT_SECRET: str = "8f753e7f9d4c4c00a4a40d7721408380transitopssecretkey"
=======
    JWT_SECRET: str = "generatesomegoodsecretkeyherefortransitopsapp"
>>>>>>> 4743ddb1fcc3073d38e552c7334c81c51575aae1
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
