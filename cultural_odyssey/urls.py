# cultural_odyssey/urls.py
from django.contrib import admin
from django.urls import path, include
from main import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.intro_page, name='intro'),           # / => intro sayfası
    path('explore/', include('main.urls')),              # /explore/ => harita sayfası
    path('accounts/', include('accounts.urls')),         # kullanıcı giriş/kayıt işlemleri
]
