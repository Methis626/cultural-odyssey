# cultural_odyssey/settings.py

from pathlib import Path
from decouple import config  # type: ignore # .env dosyasından anahtar çekmek için kullanabilirsiniz
import os

OPENAI_API_KEY = config("OPENAI_API_KEY", default="")



BASE_DIR = Path(__file__).resolve().parent.parent


DATA_FILE_PATH = os.path.join(BASE_DIR, 'main/data/cultural_data.json')
RELIGION_DATA_PATH = os.path.join(BASE_DIR, 'main', 'data', 'rel.json')

SECRET_KEY = 'django-insecure-your-secret-key'
DEBUG = True
ALLOWED_HOSTS = []

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',   
    'main',  # Uygulamanız
    'accounts', # Kullanıcı hesapları için uygulama
]

LOGIN_REDIRECT_URL = '/explore/'  # Kullanıcı giriş yaptıktan sonra yönlendirileceği URL
LOGOUT_REDIRECT_URL = '/explore/'




MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'cultural_odyssey.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'main'/ 'templates'],  # Genel şablonlar için
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'cultural_odyssey.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'

STATICFILES_DIRS = [
    BASE_DIR / "static",
]
 
 
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# API Anahtarları ve veri dosyası yolu
MAPBOX_API_KEY = config("MAPBOX_API_KEY", default="your-mapbox-api-key")  # Harita için (sadece harita stili için)
WEATHER_API_KEY = config("WEATHER_API_KEY", default="your-openweather-api-key")
DATA_FILE_PATH = BASE_DIR / 'main' / 'data' / 'cultural_data.json'
RELIGION_DATA_PATH = os.path.join(BASE_DIR, 'main', 'data', 'rel.json')
TIMEZONEDB_API_KEY = config("TIMEZONEDB_API_KEY", default="WTVP9CH1UPJX")
CALENDARIFIC_API_KEY = config("CALENDARIFIC_API_KEY")
