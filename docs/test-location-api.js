#!/usr/bin/env node
/**
 * Test script for Storm Chaser Location API
 *
 * Usage:
 *   node test-location-api.js CHASE1
 *
 * This will send a test location update for the specified callsign
 */

const https = require('https');

const API_URL = 'https://uklywcbgqxbhlixuxxms.supabase.co/functions/v1/share-location';

// Parse command line arguments
const callsign = process.argv[2];

if (!callsign) {
  console.error('Usage: node test-location-api.js <CALLSIGN>');
  console.error('Example: node test-location-api.js CHASE1');
  process.exit(1);
}

// Generate random test location near Oklahoma City
const baseLatitude = 35.4676;
const baseLongitude = -97.5164;

const testLocation = {
  callsign: callsign,
  latitude: baseLatitude + (Math.random() - 0.5) * 0.1,
  longitude: baseLongitude + (Math.random() - 0.5) * 0.1,
  heading: Math.floor(Math.random() * 360),
  speed: Math.random() * 70,
  altitude: 1200 + Math.random() * 100,
  accuracy: 5 + Math.random() * 15
};

console.log('\n=================================');
console.log('Storm Chaser Location API Test');
console.log('=================================\n');
console.log('Sending test location update:\n');
console.log(JSON.stringify(testLocation, null, 2));
console.log('\nSending request...\n');

const url = new URL(API_URL);
const options = {
  hostname: url.hostname,
  port: 443,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`Status Code: ${res.statusCode}\n`);

    try {
      const response = JSON.parse(data);
      console.log('Response:');
      console.log(JSON.stringify(response, null, 2));

      if (res.statusCode === 200) {
        console.log('\n✓ SUCCESS! Location updated successfully.');
        console.log('\nCheck the main tracker map to see the update.');
      } else {
        console.log('\n✗ ERROR! Failed to update location.');
        console.log('Make sure the callsign exists and is active in the system.');
      }
    } catch (e) {
      console.log('Response:', data);
    }

    console.log('\n=================================\n');
  });
});

req.on('error', (error) => {
  console.error('✗ Request failed:', error.message);
  console.log('\n=================================\n');
  process.exit(1);
});

req.write(JSON.stringify(testLocation));
req.end();
