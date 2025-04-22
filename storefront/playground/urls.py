from django.urls import path
from . import views

# url configuration module
# Mapping URLs
urlpatterns = [
    path('', views.main_page),
    path('about/', views.about),
    path('contact/', views.contact),
]