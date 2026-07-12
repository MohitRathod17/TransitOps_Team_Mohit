from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DB_HOST: str = "sqlite"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_NAME: str = "transitops"
    JWT_SECRET: str = "generatesomegoodsecretkeyherefortransitopsapp"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
