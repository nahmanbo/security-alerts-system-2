export const AIRPORT_CONFIG = {
    name: "Ben Gurion International Airport",
    icao: "LLBG",
    iata: "TLV",
    
    // Airport coordinates
    coordinates: {
      latitude: 32.011389,
      longitude: 34.886667
    },
    
    // Monitoring area (radius in kilometers)
    monitoringRadius: 30,
    
    // Tracking bounds (calculated from center + radius)
    getBounds() {
      const latDelta = this.monitoringRadius / 111; // ~1 degree = 111km
      const lonDelta = this.monitoringRadius / (111 * Math.cos(this.coordinates.latitude * Math.PI / 180));
      
      return {
        north: this.coordinates.latitude + latDelta,
        south: this.coordinates.latitude - latDelta,
        east: this.coordinates.longitude + lonDelta,
        west: this.coordinates.longitude - lonDelta
      };
    }
  };