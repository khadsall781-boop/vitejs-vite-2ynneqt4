# Storm Chaser Tracker

A real-time GPS tracking system for storm chasing teams. View all active chasers on a live map with their streams, locations, and radar data.

## Features

- **Live Map View** - See all active chasers on an interactive map with real-time updates
- **Chaser Management** - Add, edit, and manage your team members
- **Live Stream Integration** - View YouTube live streams directly in the app
- **Real-time Updates** - Automatic location updates using Supabase Realtime
- **Mobile Responsive** - Works on desktop, tablet, and mobile devices
- **Multiple Tracking Options** - Web app, mobile apps, Python scripts, and hardware trackers

## Quick Start

### For Administrators

1. Click "Manage Chasers" to add team members
2. For each chaser, provide:
   - Name and callsign
   - Optional: Stream URL and avatar
3. Toggle chasers "Active" when they're on a chase
4. Share tracking methods with your team (see below)

### For Chasers

**Easiest Method - Web Tracker:**
1. Open: `public/chaser-tracker.html` in a browser
2. Enter your callsign
3. Tap "Start Tracking"
4. Grant GPS permissions
5. Keep the page open while chasing

**Other Methods:**
See `docs/LOCATION_SHARING_GUIDE.md` for:
- React Native mobile app
- Python GPS tracker (Raspberry Pi)
- Arduino/ESP32 hardware tracker
- Integration with existing GPS devices

## Location Sharing API

**Endpoint:** `POST https://uklywcbgqxbhlixuxxms.supabase.co/functions/v1/share-location`

**Required Data:**
```json
{
  "callsign": "CHASE1",
  "latitude": 35.4676,
  "longitude": -97.5164
}
```

**Optional Data:**
- `heading` - Direction in degrees (0-360)
- `speed` - Speed in mph
- `altitude` - Altitude in feet
- `accuracy` - GPS accuracy in meters

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── MapView.tsx           # Main map with chaser markers
│   │   ├── ChaserManagement.tsx  # Add/edit chasers
│   │   └── ChaserDetail.tsx      # Stream and radar view
│   ├── lib/
│   │   ├── supabase.ts          # Supabase client
│   │   └── database.types.ts    # TypeScript types
│   └── App.tsx                  # Main application
├── public/
│   └── chaser-tracker.html      # Standalone GPS tracker web app
├── supabase/
│   ├── migrations/              # Database schema
│   └── functions/
│       └── share-location/      # Location API endpoint
└── docs/
    ├── LOCATION_SHARING_GUIDE.md    # Complete implementation guide
    ├── react-native-example.tsx     # Mobile app code
    ├── python-gps-tracker.py        # Python tracker script
    ├── arduino-gps-tracker.ino      # Arduino/ESP32 code
    └── test-location-api.js         # API testing script
```

## Database Schema

### Chasers Table
- `id` - Unique identifier
- `name` - Display name
- `callsign` - Unique callsign for API
- `stream_url` - YouTube/Twitch stream URL
- `avatar_url` - Profile picture URL
- `is_active` - Currently on a chase

### Chaser Locations Table
- `chaser_id` - Reference to chaser
- `latitude` - GPS latitude
- `longitude` - GPS longitude
- `heading` - Direction of travel
- `speed` - Current speed (mph)
- `altitude` - Altitude (feet)
- `accuracy` - GPS accuracy (meters)
- `timestamp` - When recorded

## Testing

### Test the Location API

```bash
# Using Node.js
node docs/test-location-api.js CHASE1

# Using cURL
curl -X POST https://uklywcbgqxbhlixuxxms.supabase.co/functions/v1/share-location \
  -H "Content-Type: application/json" \
  -d '{"callsign":"CHASE1","latitude":35.4676,"longitude":-97.5164}'

# Using Python (simulation mode)
python3 docs/python-gps-tracker.py CHASE1 --simulate
```

## Development

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

## Technology Stack

- **Frontend:** React + TypeScript + Vite
- **Map:** Leaflet + React-Leaflet
- **Database:** Supabase (PostgreSQL)
- **Real-time:** Supabase Realtime subscriptions
- **API:** Supabase Edge Functions (Deno)
- **Hosting:** Any static hosting + Supabase

## Configuration

Environment variables are in `.env`:

```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Security

- All location data is publicly readable (by design)
- HTTPS encryption for all communications
- Row Level Security (RLS) enabled on database
- Public API endpoint (no auth required for ease of use)

## Troubleshooting

### Chaser not appearing on map
- Ensure chaser is marked "Active" in management
- Verify callsign matches exactly
- Check browser console for errors

### GPS not updating
- Grant location permissions when prompted
- Ensure clear view of sky
- Check device location services enabled

### Stream not loading
- Use YouTube live stream URLs
- Verify stream is currently live
- Check browser console for errors

## Future Enhancements

- Two-way messaging between chasers
- Photo/video uploads from field
- Weather radar overlay
- Historical track playback
- Geofencing and alerts
- Battery status monitoring
- Offline data buffering
- SMS fallback for no-data areas

## License

MIT License - Feel free to use and modify for your storm chasing team!

## Support

For questions or issues:
1. Check `docs/LOCATION_SHARING_GUIDE.md`
2. Review example implementations
3. Test with simulation modes first
4. Verify chasers are active in system

---

**Stay Safe Out There!** 🌪️

Remember: Safety first, footage second. Never compromise your safety for a better view.
