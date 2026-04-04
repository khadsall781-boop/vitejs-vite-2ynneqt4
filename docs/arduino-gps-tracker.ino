/*
 * Storm Chaser GPS Tracker for ESP32
 *
 * Hardware Required:
 * - ESP32 development board
 * - GPS Module (NEO-6M or similar)
 * - Connect GPS TX to ESP32 RX (GPIO 16)
 * - Connect GPS RX to ESP32 TX (GPIO 17)
 *
 * Libraries Required:
 * - TinyGPSPlus by Mikal Hart
 * - ArduinoJson by Benoit Blanchon
 * - WiFi (built-in)
 * - HTTPClient (built-in)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <TinyGPSPlus.h>
#include <HardwareSerial.h>
#include <ArduinoJson.h>

// Configuration
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* CALLSIGN = "CHASE1";
const char* API_URL = "https://uklywcbgqxbhlixuxxms.supabase.co/functions/v1/share-location";
const int UPDATE_INTERVAL = 10000; // 10 seconds

// GPS Setup
TinyGPSPlus gps;
HardwareSerial GPS_Serial(1); // Use UART1

// Tracking variables
unsigned long lastUpdate = 0;
int updateCount = 0;
double lastLat = 0;
double lastLng = 0;
unsigned long lastTime = 0;

void setup() {
  Serial.begin(115200);
  GPS_Serial.begin(9600, SERIAL_8N1, 16, 17); // RX=16, TX=17

  Serial.println("\n\n");
  Serial.println("================================");
  Serial.println("Storm Chaser GPS Tracker");
  Serial.println("================================");
  Serial.printf("Callsign: %s\n", CALLSIGN);
  Serial.println("================================\n");

  // Connect to WiFi
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi Connected!");
  Serial.printf("IP Address: %s\n\n", WiFi.localIP().toString().c_str());

  Serial.println("Waiting for GPS fix...\n");
}

void loop() {
  // Read GPS data
  while (GPS_Serial.available() > 0) {
    gps.encode(GPS_Serial.read());
  }

  // Check if it's time to send update
  unsigned long currentTime = millis();
  if (currentTime - lastUpdate >= UPDATE_INTERVAL) {
    lastUpdate = currentTime;

    if (gps.location.isValid()) {
      sendLocationUpdate();
    } else {
      Serial.println("Waiting for GPS fix...");
      Serial.printf("Satellites: %d\n\n", gps.satellites.value());
    }
  }

  // Display GPS info every 2 seconds
  static unsigned long lastDisplay = 0;
  if (currentTime - lastDisplay >= 2000) {
    lastDisplay = currentTime;
    displayGPSInfo();
  }
}

void sendLocationUpdate() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected, reconnecting...");
    WiFi.reconnect();
    return;
  }

  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");

  // Calculate speed in mph
  double speed = 0;
  if (lastLat != 0 && lastLng != 0) {
    double distance = TinyGPSPlus::distanceBetween(
      lastLat, lastLng,
      gps.location.lat(), gps.location.lng()
    );

    unsigned long timeDiff = (currentTime - lastTime) / 1000.0; // seconds
    if (timeDiff > 0) {
      double speedMps = distance / timeDiff;
      speed = speedMps * 2.23694; // Convert to mph
    }
  }

  lastLat = gps.location.lat();
  lastLng = gps.location.lng();
  lastTime = millis();

  // Create JSON payload
  StaticJsonDocument<256> doc;
  doc["callsign"] = CALLSIGN;
  doc["latitude"] = gps.location.lat();
  doc["longitude"] = gps.location.lng();

  if (gps.course.isValid()) {
    doc["heading"] = (int)gps.course.deg();
  }

  if (speed > 0) {
    doc["speed"] = speed;
  } else if (gps.speed.isValid()) {
    doc["speed"] = gps.speed.mph();
  }

  if (gps.altitude.isValid()) {
    doc["altitude"] = gps.altitude.feet();
  }

  if (gps.hdop.isValid()) {
    doc["accuracy"] = gps.hdop.hdop() * 5; // Rough estimate in meters
  }

  String jsonString;
  serializeJson(doc, jsonString);

  // Send HTTP POST request
  int httpCode = http.POST(jsonString);

  if (httpCode > 0) {
    if (httpCode == 200) {
      updateCount++;
      Serial.printf("✓ Update %d sent successfully\n", updateCount);
      Serial.printf("  Location: %.6f, %.6f\n", gps.location.lat(), gps.location.lng());
      if (speed > 0 || gps.speed.isValid()) {
        Serial.printf("  Speed: %.1f mph\n", speed > 0 ? speed : gps.speed.mph());
      }
      Serial.println();
    } else {
      String response = http.getString();
      Serial.printf("✗ Error %d: %s\n\n", httpCode, response.c_str());
    }
  } else {
    Serial.printf("✗ Connection error: %s\n\n", http.errorToString(httpCode).c_str());
  }

  http.end();
}

void displayGPSInfo() {
  if (gps.location.isValid()) {
    Serial.print("GPS: ");
    Serial.print(gps.location.lat(), 6);
    Serial.print(", ");
    Serial.print(gps.location.lng(), 6);
    Serial.print(" | Sats: ");
    Serial.print(gps.satellites.value());
    Serial.print(" | Alt: ");
    Serial.print(gps.altitude.feet(), 0);
    Serial.print("ft | Speed: ");
    Serial.print(gps.speed.mph(), 1);
    Serial.println(" mph");
  }
}
