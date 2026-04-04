# Storm Chaser Location Sharing Guide

This guide explains all the ways your storm chasers can share their GPS location with the tracking system.

## Quick Start - Web App (Easiest)

The simplest way to start tracking is using the built-in web app on any smartphone:

1. Open: **https://uklywcbgqxbhlixuxxms.supabase.co/chaser-tracker.html** (or host the `public/chaser-tracker.html` file)
2. Enter your callsign (e.g., "CHASE1")
3. Tap "Start Tracking"
4. Grant GPS permissions when prompted
5. Keep the app open while chasing

**Features:**
- Works on any smartphone (iOS/Android)
- No app installation required
- Automatic speed calculation
- Battery-optimized updates
- Keeps screen awake during tracking

## API Endpoint

All tracking implementations send data to:

```
POST https://uklywcbgqxbhlixuxxms.supabase.co/functions/v1/share-location
```

### Request Format

```json
{
  "callsign": "CHASE1",
  "latitude": 35.4676,
  "longitude": -97.5164,
  "heading": 180,
  "speed": 55.5,
  "altitude": 1200,
  "accuracy": 10
}
```

**Required Fields:**
- `callsign` - Your unique identifier (must match a chaser in the system)
- `latitude` - Decimal degrees (-90 to 90)
- `longitude` - Decimal degrees (-180 to 180)

**Optional Fields:**
- `heading` - Direction in degrees (0-360, where 0 is North)
- `speed` - Speed in miles per hour
- `altitude` - Altitude in feet
- `accuracy` - GPS accuracy in meters

### Response Format

**Success (200):**
```json
{
  "success": true,
  "message": "Location updated successfully"
}
```

**Error (400/404/500):**
```json
{
  "error": "Error message here"
}
```

## Implementation Options

### 1. Web App (Included)

**File:** `public/chaser-tracker.html`

**Pros:**
- No installation required
- Works on any device with a browser
- Clean, simple interface
- Battery optimized

**Cons:**
- Must keep browser tab open
- May be killed by aggressive battery savers

**Usage:**
```bash
# Deploy the HTML file to your server or use directly
# Access via browser on any smartphone
```

### 2. React Native Mobile App

**File:** `docs/react-native-example.tsx`

**Pros:**
- Native app experience
- Better battery management
- Background tracking capability
- Can run in background (with additional setup)

**Cons:**
- Requires app development and deployment
- Need separate iOS and Android builds

**Setup:**
```bash
# Create new React Native project
npx react-native init ChaserTracker

# Install dependencies
npm install @react-native-community/geolocation

# Copy the component code
# Build and deploy to app stores
```

### 3. Python GPS Tracker

**File:** `docs/python-gps-tracker.py`

**Pros:**
- Works with dedicated GPS hardware
- Great for Raspberry Pi setups
- Can run continuously on in-vehicle computer
- Simulation mode for testing

**Cons:**
- Requires Python installation
- Need GPS hardware setup

**Setup:**
```bash
# Install Python dependencies
pip install requests gpsd-py3

# Test in simulation mode
python3 python-gps-tracker.py CHASE1 --simulate

# Run with real GPS (on Raspberry Pi/Linux)
sudo systemctl start gpsd
python3 python-gps-tracker.py CHASE1 -i 10
```

**Hardware Recommendations:**
- Raspberry Pi Zero W or 4
- USB GPS Module (u-blox NEO-6M/7M/8M)
- 4G LTE USB Modem or mobile hotspot
- Power bank or vehicle power adapter

### 4. Arduino/ESP32 Tracker

**File:** `docs/arduino-gps-tracker.ino`

**Pros:**
- Low cost hardware ($20-30 total)
- Low power consumption
- Can be battery powered
- Direct WiFi connectivity

**Cons:**
- Requires Arduino programming
- Need to configure WiFi credentials
- Limited to WiFi range (use with mobile hotspot)

**Setup:**
```bash
# Install Arduino IDE and libraries:
# - TinyGPSPlus
# - ArduinoJson

# Configure WiFi credentials in code
# Upload to ESP32
# Connect GPS module (TX to GPIO 16, RX to GPIO 17)
```

**Hardware Required:**
- ESP32 Development Board ($10)
- NEO-6M GPS Module ($15)
- Jumper wires
- USB power bank

## Alternative Solutions

### 5. Garmin InReach Integration

If your chasers use Garmin InReach devices, you can integrate with their API:

```javascript
// Example: Parse Garmin tracking links
// Set up webhook to receive updates from Garmin's MapShare
```

### 6. APRS (Amateur Radio)

For ham radio operators using APRS:

```python
# Use aprslib to receive APRS packets
# Parse location and forward to tracking API
import aprslib

def callback(packet):
    # Parse packet and send to API
    pass

AIS = aprslib.IS("CALLSIGN")
AIS.connect()
AIS.consumer(callback, raw=True)
```

### 7. Spot Tracker Integration

Connect to Spot's API to import tracking data:

```javascript
// Parse Spot XML feed
// Convert to tracking API format
```

## Best Practices

### Update Frequency

**Recommended:** 10-15 seconds
- Balances accuracy with battery life
- Provides smooth map updates
- Reasonable data usage

**High Action:** 5 seconds
- Use during active intercepts
- More battery intensive

**Stationary:** 30-60 seconds
- Use when parked or waiting
- Conserves battery

### Battery Management

1. **Reduce screen brightness** when using web app
2. **Disable unnecessary features** (Bluetooth, etc.)
3. **Use car charger** during active chasing
4. **Bring power banks** as backup
5. **Enable battery saver** between active periods

### Data Usage

Each location update uses approximately:
- **200-300 bytes** per update
- **~1-2 MB per hour** at 10-second intervals
- **~20-50 MB** for a full day of tracking

### GPS Accuracy

For best GPS accuracy:
- Ensure clear view of sky
- Mount GPS antenna externally if possible
- Wait for GPS fix before starting drive
- Use external GPS antenna in metal vehicles

## Troubleshooting

### "Chaser not found" Error

- Verify your callsign is added in "Manage Chasers"
- Check spelling matches exactly (case-sensitive)
- Ensure chaser is marked as "Active"

### GPS Not Updating

- Check GPS permissions granted
- Ensure location services enabled
- Move to clear view of sky
- Restart GPS/device

### Location Not Showing on Map

- Verify chaser is marked as "Active"
- Check network connectivity
- Look for error messages in console
- Confirm API endpoint is accessible

### High Battery Drain

- Increase update interval
- Disable background refresh
- Reduce screen-on time
- Use car charger

## Security Considerations

1. **Public vs Private:** Location data is readable by anyone viewing the map
2. **Callsign Safety:** Don't use personally identifiable information
3. **HTTPS Only:** All communications use encrypted HTTPS
4. **No Authentication:** The endpoint is public for ease of use
5. **Rate Limiting:** Server may implement rate limits to prevent abuse

## Testing Your Setup

### 1. Test with Web App

1. Open the web tracker
2. Enter a test callsign
3. Start tracking
4. Verify location appears on main map

### 2. Test with cURL

```bash
curl -X POST https://uklywcbgqxbhlixuxxms.supabase.co/functions/v1/share-location \
  -H "Content-Type: application/json" \
  -d '{
    "callsign": "TEST1",
    "latitude": 35.4676,
    "longitude": -97.5164,
    "speed": 45.5,
    "heading": 180
  }'
```

### 3. Test with Simulation

```bash
# Python simulation mode
python3 python-gps-tracker.py TEST1 --simulate
```

## Support

For issues or questions:
1. Check this documentation
2. Review example implementations
3. Test with simulation mode first
4. Verify chaser is added and active in system

## Future Enhancements

Potential additions:
- SMS fallback for no data areas
- Satellite tracking (Iridium)
- Offline data buffering
- Battery status reporting
- Weather data integration
- Photo/video sharing
- Two-way messaging
