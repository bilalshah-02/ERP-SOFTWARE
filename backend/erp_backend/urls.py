from django.contrib import admin
from django.urls import path, include  # Add include here
from django.views.decorators.csrf import csrf_exempt

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('erp_api.urls')),  # Keep it simple for now
]