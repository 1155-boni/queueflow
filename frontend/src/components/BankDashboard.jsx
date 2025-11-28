import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import API_BASE_URL from "../config";
import ServicePointMap from "./ServicePointMap";

const BankDashboard = ({ user }) => {
  const { t } = useTranslation();
  const [servicePoints, setServicePoints] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [newServicePoint, setNewServicePoint] = useState({
    name: "",
    description: "",
    bank_name: "",
    branch: "",
    location: "",
    latitude: null,
    longitude: null,
    is_active: true,
  });

  const wsRefs = useRef({});

  useEffect(() => {
    fetchServicePoints();
    fetchAnalytics();
  }, []);

  useEffect(() => {
    servicePoints.forEach((sp) => {
      if (!wsRefs.current[sp.id]) {
        const ws = new WebSocket(`${API_BASE_URL.replace('http', 'ws')}/ws/queues/${sp.id}/`);
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

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/queues/analytics/`);
      setAnalytics(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const createServicePoint = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/queues/create-service-point/`, newServicePoint);
      setNewServicePoint({
        name: "",
        description: "",
        bank_name: "",
        branch: "",
        location: "",
        teller_no: "",
        is_active: true,
      });
      fetchServicePoints();
    } catch (err) {
      console.error(err);
    }
  };

  const callNext = async (servicePointId) => {
    try {
      await axios.post(`${API_BASE_URL}/api/queues/call-next/`, { service_point_id: servicePointId });
      fetchServicePoints();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteServicePoint = async (servicePointId) => {
    if (window.confirm('Are you sure you want to delete this service point?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/queues/delete-service-point/${servicePointId}/`);
        fetchServicePoints();
      } catch (err) {
        console.error(err);
      }
    }
  };



  const handleLocationPin = (location) => {
    setNewServicePoint({ ...newServicePoint, latitude: location.latitude, longitude: location.longitude });
  };

  return (
    <div className="dashboard bank-dashboard">
      <h2>{t("app.welcome", { username: user.username })} - Bank Staff</h2>
      <div className="bank-features">
        <div className="feature-card">
          <h3>🏦 Banking Services</h3>
          <p>
            Manage customer queues for account opening, loans, and general
            banking inquiries
          </p>
        </div>
        <div className="feature-card">
          <h3>💰 Financial Transactions</h3>
          <p>
            Handle deposits, withdrawals, and other financial operations
            efficiently
          </p>
        </div>
        <div className="feature-card">
          <h3>📊 Customer Analytics</h3>
          <p>Track service performance and customer satisfaction metrics</p>
        </div>
      </div>
      <div className="form-group">
        <h3>{t("staff.createServicePoint")}</h3>
        <label htmlFor="name">{t("common.name")}</label>
        <input
          id="name"
          type="text"
          placeholder={t("common.name")}
          value={newServicePoint.name}
          onChange={(e) =>
            setNewServicePoint({ ...newServicePoint, name: e.target.value })
          }
        />
        <label htmlFor="description">{t("common.description")}</label>
        <textarea
          id="description"
          placeholder={t("common.description")}
          value={newServicePoint.description}
          onChange={(e) =>
            setNewServicePoint({
              ...newServicePoint,
              description: e.target.value,
            })
          }
        />
        <label htmlFor="bank_name">Bank Name</label>
        <input
          id="bank_name"
          type="text"
          placeholder="Bank Name"
          value={newServicePoint.bank_name}
          onChange={(e) =>
            setNewServicePoint({
              ...newServicePoint,
              bank_name: e.target.value,
            })
          }
        />
        <label htmlFor="branch">Branch</label>
        <input
          id="branch"
          type="text"
          placeholder="Branch"
          value={newServicePoint.branch}
          onChange={(e) =>
            setNewServicePoint({ ...newServicePoint, branch: e.target.value })
          }
        />
        <label htmlFor="location">{t("common.location")}</label>
        <input
          id="location"
          type="text"
          placeholder={t("common.location")}
          value={newServicePoint.location}
          onChange={(e) =>
            setNewServicePoint({ ...newServicePoint, location: e.target.value })
          }
        />

        <label htmlFor="teller_no">Teller No</label>
        <input
          id="teller_no"
          type="text"
          placeholder="Teller Number"
          value={newServicePoint.teller_no || ""}
          onChange={(e) =>
            setNewServicePoint({
              ...newServicePoint,
              teller_no: e.target.value,
            })
          }
        />
        <ServicePointMap
          servicePoints={servicePoints}
          onLocationPin={handleLocationPin}
          pinnedLocation={newServicePoint.latitude && newServicePoint.longitude ? { latitude: newServicePoint.latitude, longitude: newServicePoint.longitude } : null}
        />
        <label htmlFor="is_active">
          <input
            id="is_active"
            type="checkbox"
            checked={newServicePoint.is_active}
            onChange={(e) =>
              setNewServicePoint({
                ...newServicePoint,
                is_active: e.target.checked,
              })
            }
          />
          {t("common.active")}
        </label>
        <button className="btn-primary" onClick={createServicePoint}>
          {t("staff.createServicePoint")}
        </button>
      </div>
      <div className="service-points-management">
        <h3>Your Service Points</h3>
        {servicePoints.length > 0 ? (
          <div className="service-points-grid">
            {servicePoints.map((sp) => (
              <div key={sp.id} className="service-point-card">
                <h4>{sp.name}</h4>
                <p><strong>Location:</strong> {sp.location || 'Not specified'}</p>
                <p><strong>Queue Length:</strong> {sp.queue_length || 0}</p>
                <div className="service-point-actions">
                  <button className="btn-secondary" onClick={() => callNext(sp.id)}>
                    Call Next Customer
                  </button>
                  <button className="btn-danger" onClick={() => deleteServicePoint(sp.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No service points created yet.</p>
        )}
      </div>

      <div className="analytics">
        <h3>
          {t("dashboard.analytics")}{" "}
          <span className="realtime">{t("common.realtime")}</span>
        </h3>
        <div className="metric-card">
          <h3>Average Wait Time</h3>
          <p>{analytics.average_wait_time || "0 minutes"}</p>
        </div>
        <div className="metric-card">
          <h3>Busiest Hour</h3>
          <p>{analytics.busiest_hour || "N/A"}</p>
        </div>
        <div className="metric-card">
          <h3>Abandoned Queues</h3>
          <p>{analytics.abandoned_queues || 0}</p>
        </div>
      </div>
    </div>
  );
};

export default BankDashboard;
