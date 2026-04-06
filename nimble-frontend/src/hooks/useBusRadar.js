import { useState, useEffect } from 'react';
import api from '../services/api';

export const useBusRadar = (isEnabled = true) => {
  const [busLocations, setBusLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLocations = async () => {
    try {
      const response = await api.get('/bus-locations/');
      setBusLocations(response.data);
    } catch (error) {
      console.error("Radar Fetch Error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isEnabled) return;

    // Initial fetch
    fetchLocations();

    // Poll every 10 seconds (standard for public transport)
    const interval = setInterval(fetchLocations, 10000);

    return () => clearInterval(interval);
  }, [isEnabled]);

  return { busLocations, loading, refetch: fetchLocations };
};