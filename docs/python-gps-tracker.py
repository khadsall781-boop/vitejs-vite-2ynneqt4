#!/usr/bin/env python3
"""
Storm Chaser GPS Tracker - Python Script
Sends GPS coordinates to the tracking server

Requirements:
    pip install requests gpsd-py3

Setup:
1. Install gpsd on your system (Raspberry Pi, Linux)
2. Connect GPS device (USB or serial)
3. Start gpsd service: sudo systemctl start gpsd
4. Run this script: python3 python-gps-tracker.py
"""

import time
import requests
import json
from datetime import datetime
import argparse

# Try to import GPS library
try:
    from gpsd import connect, get_current
    GPS_AVAILABLE = True
except ImportError:
    print("Warning: gpsd not available, using simulation mode")
    GPS_AVAILABLE = False

API_URL = 'https://uklywcbgqxbhlixuxxms.supabase.co/functions/v1/share-location'

class GPSTracker:
    def __init__(self, callsign, interval=10, simulate=False):
        self.callsign = callsign
        self.interval = interval
        self.simulate = simulate
        self.update_count = 0
        self.running = False

    def connect_gps(self):
        """Connect to GPS device"""
        if self.simulate or not GPS_AVAILABLE:
            print("Running in simulation mode")
            return True

        try:
            connect()
            print("Connected to GPS device")
            return True
        except Exception as e:
            print(f"Error connecting to GPS: {e}")
            print("Falling back to simulation mode")
            self.simulate = True
            return True

    def get_gps_data(self):
        """Get current GPS position"""
        if self.simulate or not GPS_AVAILABLE:
            # Simulate GPS data for testing
            import random
            return {
                'latitude': 35.4676 + random.uniform(-0.1, 0.1),
                'longitude': -97.5164 + random.uniform(-0.1, 0.1),
                'altitude': 1200 + random.uniform(-50, 50),
                'speed': random.uniform(0, 70),
                'heading': random.randint(0, 360),
                'accuracy': random.uniform(5, 20)
            }

        try:
            packet = get_current()

            return {
                'latitude': packet.lat,
                'longitude': packet.lon,
                'altitude': packet.alt if hasattr(packet, 'alt') else None,
                'speed': packet.hspeed * 2.23694 if hasattr(packet, 'hspeed') else None,  # m/s to mph
                'heading': int(packet.track) if hasattr(packet, 'track') else None,
                'accuracy': packet.error.get('x', None) if hasattr(packet, 'error') else None
            }
        except Exception as e:
            print(f"Error reading GPS: {e}")
            return None

    def send_location(self, location_data):
        """Send location to server"""
        data = {
            'callsign': self.callsign,
            'latitude': location_data['latitude'],
            'longitude': location_data['longitude'],
            'heading': location_data.get('heading'),
            'speed': location_data.get('speed'),
            'altitude': location_data.get('altitude'),
            'accuracy': location_data.get('accuracy')
        }

        try:
            response = requests.post(
                API_URL,
                json=data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )

            if response.status_code == 200:
                self.update_count += 1
                print(f"✓ Update {self.update_count} sent successfully")
                print(f"  Location: {data['latitude']:.6f}, {data['longitude']:.6f}")
                if data.get('speed'):
                    print(f"  Speed: {data['speed']:.1f} mph")
                return True
            else:
                error = response.json().get('error', 'Unknown error')
                print(f"✗ Error: {error}")
                return False

        except requests.exceptions.RequestException as e:
            print(f"✗ Network error: {e}")
            return False

    def start(self):
        """Start tracking"""
        print(f"\n{'='*50}")
        print(f"Storm Chaser GPS Tracker")
        print(f"{'='*50}")
        print(f"Callsign: {self.callsign}")
        print(f"Update interval: {self.interval} seconds")
        print(f"Mode: {'SIMULATION' if self.simulate else 'LIVE GPS'}")
        print(f"{'='*50}\n")

        if not self.connect_gps():
            print("Failed to connect to GPS. Exiting.")
            return

        self.running = True
        print("Tracking started. Press Ctrl+C to stop.\n")

        try:
            while self.running:
                location = self.get_gps_data()

                if location:
                    self.send_location(location)
                else:
                    print("Waiting for GPS fix...")

                time.sleep(self.interval)

        except KeyboardInterrupt:
            print("\n\nTracking stopped by user")
            self.stop()

    def stop(self):
        """Stop tracking"""
        self.running = False
        print(f"\nTotal updates sent: {self.update_count}")
        print("Goodbye!")


def main():
    parser = argparse.ArgumentParser(description='Storm Chaser GPS Tracker')
    parser.add_argument('callsign', help='Your chaser callsign (e.g., CHASE1)')
    parser.add_argument('-i', '--interval', type=int, default=10,
                       help='Update interval in seconds (default: 10)')
    parser.add_argument('-s', '--simulate', action='store_true',
                       help='Run in simulation mode (no real GPS)')

    args = parser.parse_args()

    tracker = GPSTracker(
        callsign=args.callsign,
        interval=args.interval,
        simulate=args.simulate
    )

    tracker.start()


if __name__ == '__main__':
    main()
