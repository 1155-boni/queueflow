import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { API_BASE_URL, WS_BASE_URL } from "../config";

const StaffDashboard = ({ user }) => {
  const { t } = useTranslation();
  const [servicePoints, setServicePoints] = useState([]);
  const wsRefs = useRef({});

  useEffect(() => {
    fetchServicePoints();
  }, []);

  useEffect(() => {
    servicePoints.forEach((sp) => {
      if (!wsRefs.current[sp.id]) {
        const ws = new WebSocket(`${WS_BASE_URL}/ws/queues/${sp.id}/`);
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.queue_length !== undefined) {
            setServicePoints((prev) =>
              prev.map((s) =>
                s.id === sp.id ? { ...s, queue_length: data.queue_length } : s
              )
            );
          }
        };
        wsRefs.current[sp.id] = ws;
      }
    });

    return () => {
      Object.values(wsRefs.current).forEach((ws) => ws.close());
      wsRefs.current = {};
    };
  }, [servicePoints]);

  const fetchServicePoints = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/queues/service-points/`);
      setServicePoints(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="dashboard staff-dashboard">
      <h2>{t("app.welcome", { username: user.username })} - Staff</h2>
      <div className="service-points-management">
        <h3>Your Service Points</h3>
        {servicePoints.length > 0 ? (
          <div className="service-points-grid">
            {servicePoints.map((sp) => (
              <div key={sp.id} className="service-point-card">
                <h4>{sp.name}</h4>
                <p><strong>Location:</strong> {sp.location || 'Not specified'}</p>
                <p><strong>Queue Length:</strong> {sp.queue_length || 0}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No service points assigned.</p>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;
