import React, { useState } from 'react';
import { StyleSheet, View, ActivityIndicator, TouchableOpacity, Text, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
const LiveMap = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);

  // This HTML uses Esri World Street Map which prioritizes English labels
  const mapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Nimble Radar</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; background-color: #f4f4f9; }
          #map { height: 100vh; width: 100vw; }
          /* Clean up the attribution for mobile */
          .leaflet-control-attribution { font-size: 7px !important; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          // Initialize map focused on Kathmandu
          var map = L.map('map', {
            zoomControl: false,
            attributionControl: true
          }).setView([27.7172, 85.3240], 14);

          // ESRI World Street Map: High quality, English-focused labels
          L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ'
          }).addTo(map);

          // Custom Marker for User/Center
          var nimbleIcon = L.divIcon({
            className: 'custom-div-icon',
            html: "<div style='background-color:#000080; width:14px; height:14px; border-radius:50%; border:3px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.3);'></div>",
            iconSize: [18, 18],
            iconAnchor: [9, 9]
          });

          L.marker([27.7172, 85.3240], {icon: nimbleIcon}).addTo(map)
            .bindPopup('<b>Nimble Center</b><br>Tracking Kathmandu Routes...')
            .openPopup();
            
          // Helper to handle window resizing
          window.addEventListener('resize', function() {
            map.invalidateSize();
          });
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      {/* Floating Header */}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft color="#000080" size={28} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>Live Radar</Text>
            <Text style={styles.subTitleText}>English Map View</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Map WebView */}
      <View style={styles.mapContainer}>
        <WebView 
          originWhitelist={['*']}
          source={{ html: mapHtml }}
          style={styles.map}
          onLoadEnd={() => setLoading(false)}
          // Prevents caching of old Nepali tiles
          cacheEnabled={false} 
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
        
        {loading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator color="#000080" size="large" />
            <Text style={styles.loadingText}>Initializing Radar...</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 10 : 30,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  backButton: {
    padding: 4,
  },
  titleContainer: {
    marginLeft: 12,
  },
  titleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000080',
  },
  subTitleText: {
    fontSize: 11,
    color: '#666',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#000080',
    fontSize: 12,
  }
});

export default LiveMap;