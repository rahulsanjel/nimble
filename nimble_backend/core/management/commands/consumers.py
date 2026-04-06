import json
from channels.generic.websocket import AsyncWebsocketConsumer

class BusTrackerConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.route_name = self.scope['url_route']['kwargs']['route_id']
        self.group_name = f"bus_{self.route_name}"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def receive(self, text_data):
        data = json.loads(text_data)
        # This receives data from the DRIVER and sends it to the GROUP (Passengers)
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "bus_update",
                "lat": data["lat"],
                "lng": data["lng"],
                "bus_id": data["bus_id"]
            }
        )

    async def bus_update(self, event):
        # This sends the data to the PASSENGER'S phone
        await self.send(text_data=json.dumps({
            "lat": event["lat"],
            "lng": event["lng"],
            "bus_id": event["bus_id"]
        }))