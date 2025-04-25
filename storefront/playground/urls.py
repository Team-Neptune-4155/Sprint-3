from django.urls import path
from . import views

# url configuration module
# Mapping URLs
urlpatterns = [
    path('', views.main_page, name='home'),
    path('about/', views.about, name='about'),
    path('contact/', views.contact, name='contact'),
]