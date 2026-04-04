// React Native GPS Tracker Component
// Install: npm install @react-native-community/geolocation

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';

const API_URL = 'https://uklywcbgqxbhlixuxxms.supabase.co/functions/v1/share-location';

export default function ChaserTrackerApp() {
  const [callsign, setCallsign] = useState('');
  const [tracking, setTracking] = useState(false);
  const [updateCount, setUpdateCount] = useState(0);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [status, setStatus] = useState('Not Tracking');

  const watchId = useRef(null);
  const intervalId = useRef(null);
  const lastPosition = useRef(null);

  const calculateSpeed = (pos1, pos2) => {
    if (!pos1 || !pos2) return null;

    const timeDiff = (pos2.timestamp - pos1.timestamp) / 1000;
    if (timeDiff === 0) return null;

    const lat1 = (pos1.coords.latitude * Math.PI) / 180;
    const lat2 = (pos2.coords.latitude * Math.PI) / 180;
    const lon1 = (pos1.coords.longitude * Math.PI) / 180;
    const lon2 = (pos2.coords.longitude * Math.PI) / 180;

    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = 6371000 * c;

    const speedMps = distance / timeDiff;
    const speedMph = speedMps * 2.23694;

    return speedMph;
  };

  const sendLocation = async (position) => {
    if (!callsign.trim()) {
      Alert.alert('Error', 'Please enter your callsign');
      stopTracking();
      return;
    }

    const speed = calculateSpeed(lastPosition.current, position);
    lastPosition.current = position;

    const locationData = {
      callsign: callsign.trim(),
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      heading: position.coords.heading || null,
      speed: speed || null,
      altitude: position.coords.altitude || null,
      accuracy: position.coords.accuracy || null,
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData),
      });

      const result = await response.json();

      if (response.ok) {
        setUpdateCount((prev) => prev + 1);
        setStatus(`Active - ${updateCount + 1} updates sent`);
        setCurrentLocation(position.coords);
      } else {
        setStatus(`Error: ${result.error}`);
      }
    } catch (error) {
      setStatus(`Network Error: ${error.message}`);
    }
  };

  const startTracking = () => {
    if (!callsign.trim()) {
      Alert.alert('Error', 'Please enter your callsign');
      return;
    }

    setTracking(true);
    setUpdateCount(0);
    lastPosition.current = null;
    setStatus('Acquiring GPS...');

    // Watch position continuously
    watchId.current = Geolocation.watchPosition(
      (position) => {
        sendLocation(position);
      },
      (error) => {
        setStatus(`GPS Error: ${error.message}`);
        Alert.alert('GPS Error', error.message);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10,
        interval: 10000,
        fastestInterval: 5000,
      }
    );

    // Set up interval for regular updates every 10 seconds
    intervalId.current = setInterval(() => {
      Geolocation.getCurrentPosition(
        (position) => {
          sendLocation(position);
        },
        (error) => {
          console.error('Position error:', error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 10000,
        }
      );
    }, 10000);
  };

  const stopTracking = () => {
    if (watchId.current !== null) {
      Geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }

    if (intervalId.current !== null) {
      clearInterval(intervalId.current);
      intervalId.current = null;
    }

    setTracking(false);
    setStatus('Tracking Stopped');
  };

  useEffect(() => {
    return () => {
      if (watchId.current !== null) {
        Geolocation.clearWatch(watchId.current);
      }
      if (intervalId.current !== null) {
        clearInterval(intervalId.current);
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌪️ Storm Chaser GPS</Text>
      <Text style={styles.subtitle}>Live Location Tracking</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Your Callsign</Text>
        <TextInput
          style={styles.input}
          value={callsign}
          onChangeText={setCallsign}
          placeholder="e.g., CHASE1"
          editable={!tracking}
          autoCapitalize="characters"
        />
      </View>

      <View style={[styles.status, tracking ? styles.statusActive : styles.statusInactive]}>
        <Text style={styles.statusText}>{status}</Text>
      </View>

      {!tracking ? (
        <TouchableOpacity style={styles.btnPrimary} onPress={startTracking}>
          <Text style={styles.btnText}>Start Tracking</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.btnDanger} onPress={stopTracking}>
          <Text style={styles.btnText}>Stop Tracking</Text>
        </TouchableOpacity>
      )}

      {currentLocation && (
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Latitude</Text>
            <Text style={styles.infoValue}>{currentLocation.latitude.toFixed(6)}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Longitude</Text>
            <Text style={styles.infoValue}>{currentLocation.longitude.toFixed(6)}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Accuracy</Text>
            <Text style={styles.infoValue}>{currentLocation.accuracy?.toFixed(0)}m</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Updates Sent</Text>
            <Text style={styles.infoValue}>{updateCount}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 30,
  },
  formGroup: {
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  status: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  statusActive: {
    backgroundColor: '#d1fae5',
  },
  statusInactive: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontWeight: '600',
    fontSize: 16,
  },
  btnPrimary: {
    backgroundColor: '#4f46e5',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  btnDanger: {
    backgroundColor: '#dc2626',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  btnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
  },
  infoItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});
