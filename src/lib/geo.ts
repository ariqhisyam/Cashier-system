/**
 * Calculate distance between two GPS coordinates in meters using the Haversine formula
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
}

/**
 * Check if coordinates are within outlet geofence boundary with smart GPS accuracy tolerance buffer
 */
export function isWithinGeofence(
  currentLat: number,
  currentLon: number,
  outletLat: number,
  outletLon: number,
  radiusMeters: number,
  accuracyMeters = 0
): { isWithin: boolean; distanceMeters: number; maxAllowedRadius: number } {
  const distanceMeters = calculateDistanceMeters(currentLat, currentLon, outletLat, outletLon);
  const accuracyBuffer = Math.min(Math.max(0, accuracyMeters), 50);
  const maxAllowedRadius = radiusMeters + accuracyBuffer;
  return {
    isWithin: distanceMeters <= maxAllowedRadius,
    distanceMeters,
    maxAllowedRadius,
  };
}

/**
 * Get current browser/device GPS coordinates with smart fallback and relaxed timeouts
 */
export function getCurrentPositionAsync(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      reject(new Error("Perangkat Anda tidak mendukung fitur lokasi GPS."));
      return;
    }

    const requestPosition = (highAccuracy: boolean) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          // If high accuracy timed out or was unavailable, try standard accuracy fallback
          if (highAccuracy && (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE)) {
            requestPosition(false);
            return;
          }

          let msg = "Gagal mengambil lokasi GPS.";
          if (error.code === error.PERMISSION_DENIED) {
            msg = "Akses lokasi ditolak. Silakan izinkan akses lokasi (GPS) pada browser/HP Anda untuk melakukan presensi.";
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            msg = "Sinyal GPS tidak terdeteksi. Pastikan Layanan Lokasi di perangkat Anda telah aktif.";
          } else if (error.code === error.TIMEOUT) {
            msg = "Waktu pencarian GPS habis. Pastikan Layanan Lokasi (GPS) aktif atau coba muat ulang halaman.";
          }
          reject(new Error(msg));
        },
        {
          enableHighAccuracy: highAccuracy,
          timeout: highAccuracy ? 10000 : 18000,
          maximumAge: 120000, // allow up to 2 minutes cached location
        }
      );
    };

    requestPosition(true);
  });
}
