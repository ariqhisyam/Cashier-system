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
 * Get current browser/device GPS coordinates with smart fallback
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
            msg = "Sinyal GPS tidak tersedia. Pastikan Layanan Lokasi di Mac/HP Anda aktif.";
          } else if (error.code === error.TIMEOUT) {
            msg = "Waktu pencarian GPS habis. Pastikan Layanan Lokasi di Pengaturan Mac/HP aktif, atau ketik koordinat Latitude & Longitude secara manual.";
          }
          reject(new Error(msg));
        },
        {
          enableHighAccuracy: highAccuracy,
          timeout: highAccuracy ? 6000 : 12000,
          maximumAge: 60000, // allow up to 1 minute cached location
        }
      );
    };

    requestPosition(true);
  });
}
