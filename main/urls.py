from django.urls import path
from . import views
from django.contrib.auth import views as auth_views

urlpatterns = [
    path('', views.intro_page, name='intro'),  # Bu sayfa intro açılış sayfası
    path('explore/', views.explore, name='explore'),  # Asıl harita sayfası

    # API gibi görev yapan view’ler
    path('get_location_info/', views.get_location_info, name='get_location_info'),
    path('chatbot/', views.chatbot, name='chatbot'),
    path('get_holidays/', views.get_holidays, name='get_holidays'),
    path('get_food_info/', views.get_food_info, name='get_food_info'),
    path('get_traditions/', views.get_traditions, name='get_traditions'),

    path('about/', views.about_us, name='about'),
    # Auth işlemleri
    path('signup/', views.signup_view, name='signup'),
    path('login/', auth_views.LoginView.as_view(template_name='main/login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(next_page='intro'), name='logout'),
]