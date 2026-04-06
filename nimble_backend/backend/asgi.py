import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# This handles standard HTTP (which is what Polling uses)
# We remove the "websocket" key for now to stop the 'routes' error
application = ProtocolTypeRouter({
    "http": get_asgi_application(),
})