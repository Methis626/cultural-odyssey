# accounts/views.py
from django.shortcuts import render, redirect
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth import login, logout
from django.contrib import messages

# KAYIT OLMA GÖRÜNÜMÜ
def signup_view(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)  # Otomatik giriş
            messages.success(request, "Kayıt başarılı, hoş geldiniz!")
            return redirect('explore')  # Anasayfaya yönlendir
    else:
        form = UserCreationForm()
    return render(request, 'accounts/signup.html', {'form': form})


# GİRİŞ YAPMA GÖRÜNÜMÜ
def login_view(request):
    if request.method == 'POST':
        form = AuthenticationForm(data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            messages.success(request, f"Hoş geldin {user.username}!")
            return redirect('explore')
    else:
        form = AuthenticationForm()
    return render(request, 'accounts/login.html', {'form': form})


# ÇIKIŞ YAPMA
def logout_view(request):
    logout(request)
    messages.info(request, "Görüşmek üzere! 👋")
    return redirect('login')
