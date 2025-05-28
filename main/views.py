import json
import requests
import os

from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from decouple import config
from openai import OpenAI

client = OpenAI(api_key=config("OPENAI_API_KEY"))
from pathlib import Path

from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth import login as auth_login, authenticate
from django.contrib.auth.forms import UserCreationForm
from django.contrib import messages
from datetime import datetime
from django.shortcuts import render
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm


@csrf_exempt
def get_traditions(request):
    code = request.GET.get('country_code')
    file_path = os.path.join(settings.BASE_DIR, 'main',  'data', 'traditions.json')
    with open(file_path, encoding='utf-8') as f:
        data = json.load(f)
    traditions = data.get(code, [])
    return JsonResponse({'traditions': traditions})


def get_food_info(request):
    """
    GET /explore/get_food_info/?country=<ülke>&city=<şehir>
    cultural_data.json içinden verilen ülke ve şehrin
    meşhur yemek listesini ayrı ayrı JSON olarak döner.
    """
    country = request.GET.get('country', '').strip()
    city    = request.GET.get('city', '').strip()

    # JSON dosyasının gerçek yolu:
    file_path = os.path.join(
        settings.BASE_DIR,
        'main',
        'data',
        'cultural_data.json'
    )

    # Varsayılan boş listeler
    top_foods = []
    city_foods = []





    try:
        with open(file_path, encoding='utf-8') as f:
            data = json.load(f)
        country_data = data.get(country, {})

        # "Top" veya "General" anahtarını kontrol et (her ikisini de destekle)
        top_foods = country_data.get('Top', []) or country_data.get('General', [])

        # Şehir ismi varsa ve veri mevcutsa
        if city and city in country_data:
            city_foods = country_data[city]

    except FileNotFoundError:
        pass
    except json.JSONDecodeError:
        pass

    return JsonResponse({
        'top_foods': top_foods,
        'city_foods': city_foods,
        'city_name': city
    })



def intro_page(request):
    login_form = AuthenticationForm()
    signup_form = UserCreationForm()
    return render(request, 'main/intro.html', {
        'login_form': login_form,
        'signup_form': signup_form
    })


from django.shortcuts import render

def about_us(request):
    return render(request, 'main/about_us.html')



def intro_page(request):
    return render(request, 'main/index.html')



def signup_view(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Kayıt başarılı! Şimdi giriş yapabilirsiniz.")
            return redirect('explore')  # giriş modalını açmak için aynı sayfaya yönlendir
        else:
            messages.error(request, "Kayıt başarısız. Lütfen bilgileri kontrol edin.")
    return redirect('explore')



client = OpenAI(api_key=config("OPENAI_API_KEY"))

@csrf_exempt
def chatbot(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            user_message = data.get("message", "")

            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": user_message}
                ]
            )

            bot_reply = response.choices[0].message.content.strip()
            return JsonResponse({"reply": bot_reply})

        except Exception as e:
            return JsonResponse({"reply": f"⚠️ Hata: {str(e)}"}, status=500)

    return JsonResponse({"error": "Only POST requests are supported."}, status=400)








# API anahtarını al

def explore(request):
    return render(request, 'main/explore.html', {
        'mapbox_api_key': settings.MAPBOX_API_KEY
    })


def get_holidays(requests, iso2):
    # Takvim API'sine istek at (Calendarific API)
    # API KEY ile birlikte istek gönder
    response = requests.get("https://calendarific.com/api/v2/holidays", params={
        "api_key": "6s0Kijhl36W8b08kvZo6SZje2MSPftPQ",
        "country": iso2,
        "year": datetime.now().year
    })
    data = response.json()


    ALLOWED_TYPES = {"national", "holiday", }

    filtered_events = []
    for item in data["response"]["holidays"]:
        if set(item.get("type", [])) & ALLOWED_TYPES:
            filtered_events.append({
                "title": item["name"],
                "start": item["date"]["iso"],
                "description": item.get("description", ""),
            })
    return JsonResponse(filtered_events, safe=False)

def get_location_info(request):
    lat = request.GET.get('lat')
    lng = request.GET.get('lng')
    result = {}

    # 1. Lokasyon bilgisi (Nominatim)
    try:
        nominatim_url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lng}&format=json&zoom=8&addressdetails=1"
        headers = {
            'User-Agent': 'CulturalOdyssey/1.0',
            'Accept-Language': 'en'
        }
        nominatim_response = requests.get(nominatim_url, headers=headers).json()

        address = nominatim_response.get('address', {})
        city = (address.get('city') or address.get('province') or address.get('state') or
                address.get('county') or address.get('town') or "Unknown City")
        country = address.get('country', 'Unknown')

        result['location'] = {
            'country': country,
            'city': city
        }
    except:
        result['location'] = {'country': 'Unknown', 'city': 'Unknown'}

    # 2. Weather
    try:
        weather_url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lng}&appid={settings.WEATHER_API_KEY}&units=metric&lang=en"
        weather_response = requests.get(weather_url).json()
        result['weather'] = {
            'temperature': weather_response.get('main', {}).get('temp', 'N/A'),
            'description': weather_response.get('weather', [{}])[0].get('description', ''),
            'humidity': weather_response.get('main', {}).get('humidity', 'N/A'),
            'wind_speed': weather_response.get('wind', {}).get('speed', 'N/A'),
            'icon': weather_response.get('weather', [{}])[0].get('icon', '01d')
        }
    except:
        result['weather'] = {
            'temperature': 'N/A',
            'description': '',
            'humidity': 'N/A',
            'wind_speed': 'N/A',
            'icon': '01d'
        }

    # 3. Country Info
    try:
        rest_url = f"https://restcountries.com/v3.1/name/{country}?fullText=true"
        rest_response = requests.get(rest_url)

        if rest_response.status_code == 200:
            country_data = rest_response.json()[0]
            capital = country_data.get('capital', ['Unknown'])[0]
            borders = []

            if 'borders' in country_data:
                codes = ",".join(country_data['borders'])
                border_resp = requests.get(f"https://restcountries.com/v3.1/alpha?codes={codes}")
                if border_resp.status_code == 200:
                    borders = [c['name']['common'] for c in border_resp.json()]

            result['country_info'] = {
                'name': country_data['name'].get('common', country),
                'capital': capital,
                'iso2': country_data.get('cca2', ''),
                'region': country_data.get('region', 'Unknown'),
                'subregion': country_data.get('subregion', 'Unknown'),
                'area': country_data.get('area', 'Unknown'),
                'population': country_data.get('population', 'Unknown'),
                'currency': list(country_data.get('currencies', {}).keys())[0] if country_data.get('currencies') else 'Unknown',
                'languages': ', '.join(country_data.get('languages', {}).values()) if country_data.get('languages') else 'Unknown',
                'flag': country_data.get('flags', {}).get('png', ''),
                'borders': borders
            }
        else:
            result['country_info'] = {'error': 'Country info not retrieved'}
    except:
        result['country_info'] = {'error': 'Country info error'}

    # 4. Wikipedia (tanıtım)
    try:
        wiki_country = requests.get(f"https://en.wikipedia.org/api/rest_v1/page/summary/{country}").json()
        wiki_city = requests.get(f"https://en.wikipedia.org/api/rest_v1/page/summary/{city}").json()
        result['wiki'] = {
            'country_summary': wiki_country.get("extract", "No summary found."),
            'city_summary': wiki_city.get("extract", "No summary found.")
        }
    except:
        result['wiki'] = {'country_summary': "Error", 'city_summary': "Error"}

    # 5. TimeZone
    try:
        timezone_url = f"http://api.timezonedb.com/v2.1/get-time-zone?key={settings.TIMEZONEDB_API_KEY}&format=json&by=position&lat={lat}&lng={lng}"
        tz_response = requests.get(timezone_url).json()
        result['time_info'] = {
            'local_time': tz_response.get('formatted', 'Unknown') if tz_response.get('status') == 'OK' else 'Unknown',
            'timezone': tz_response.get('zoneName', 'Unknown')
        }
    except:
        result['time_info'] = {'local_time': 'Unknown', 'timezone': 'Unknown'}

    

    # 6. Kültürel JSON
    try:
        with open(settings.DATA_FILE_PATH, 'r', encoding='utf-8') as f:
            cultural_data = json.load(f)
        result['cultural'] = cultural_data.get(country, {'message': 'No cultural data found.'})
    except:
        result['cultural'] = {'error': 'Error loading cultural data'}


    # Din oranları (rel.json'dan)
    try:
        with open(settings.RELIGION_DATA_PATH, 'r', encoding='utf-8') as f:
            religion_data = json.load(f)
        result['religion'] = religion_data.get(country, {}).get('religion', {})
    except Exception as e:
        result['religion'] = {"error": f"Din verisi alınamadı: {str(e)}"}




    


    return JsonResponse(result)


