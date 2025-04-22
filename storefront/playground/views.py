from django.shortcuts import render
from django.http import HttpResponse, JsonResponse

def main_page(request):
    return render(request, 'index.html')

def about(request):
    return HttpResponse("About")

def contact(request):
    return render(request, 'contact.html')