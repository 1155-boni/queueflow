import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import API_BASE_URL from "../config";

const StaffDashboard = ({ user }) => {
  const { t } = useTranslation();
  const [servicePoints, setServicePoints] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [newServicePoint, setNewServicePoint] = useState({
    name: "",
    description: "",
    location: "",
    is_active: true,
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteServicePointId, setDeleteServicePointId] = useState(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
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
      const response = await axios.get(
        `${API_BASE_URL}/api/queues/service-points/`
      );
      setServicePoints(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/queues/analytics/`
      );
      setAnalytics(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const createServicePoint = async () => {
    try {
      await axios.post(
        `${API_BASE_URL}/api/queues/create-service-point/`,
        newServicePoint
      );
      setNewServicePoint({
        name: "",
        description: "",
        location: "",
        is_active: true,
      });
      fetchServicePoints();
    } catch (err) {
      console.error(err);
    }
  };

  const callNext = async (servicePointId) => {
    try {
      await axios.post(`${API_BASE_URL}/api/queues/call-next/`, {
        service_point_id: servicePointId,
      });
      fetchServicePoints();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteClick = (servicePointId) => {
    setDeleteServicePointId(servicePointId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteAllClick = () => {
    setShowDeleteAllConfirm(true);
  };

  const confirmDeleteServicePoint = async () => {
    if (deleteServicePointId) {
      try {
        await axios.delete(
          `${API_BASE_URL}/api/queues/delete-service-point/${deleteServicePointId}/`
        );
        fetchServicePoints();
        console.log(t("queue.deleteSuccess"));
      } catch (err) {
        console.error(err);
        console.error(t("messages.deleteServicePointError"));
      }
    }
    setShowDeleteConfirm(false);
    setDeleteServicePointId(null);
  };

  const confirmDeleteAllServicePoints = async () => {
    try {
      await axios.delete(
        `${API_BASE_URL}/api/queues/delete-all-service-points/`
      );
      fetchServicePoints();
      console.log(t("messages.deleteAllSuccess"));
    } catch (err) {
      console.error(err);
      console.error(t("messages.deleteAllError"));
    }
    setShowDeleteAllConfirm(false);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteServicePointId(null);
    setShowDeleteAllConfirm(false);
  };

  return (
    <div className="dashboard">
      <h2>{t("app.welcome", { username: user.username })}</h2>
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
      <div className="service-points">
        <h3>
          {t("dashboard.servicePoints")}{" "}
          <span className="realtime">{t("common.realtime")}</span>
        </h3>
        {servicePoints.length > 0 && (
          <button className="btn-delete-all" onClick={handleDeleteAllClick}>
            Delete All Service Points
          </button>
        )}
        {servicePoints.map((sp) => (
          <div key={sp.id} className="service-point">
            <h3>{sp.name}</h3>
            <p>{sp.description || "No description available"}</p>
            <p>Location: {sp.location || "N/A"}</p>
            <p>Active: {sp.is_active ? "Yes" : "No"}</p>
            <p>{t("staff.queueLength", { length: sp.queue_length || 0 })}</p>
            <button className="btn-call" onClick={() => callNext(sp.id)}>
              {t("dashboard.callNext")}
            </button>
            <button
              className="btn-delete"
              onClick={() => handleDeleteClick(sp.id)}
            >
              {t("dashboard.delete")}
            </button>
          </div>
        ))}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>{t("queue.deleteConfirm")}</h3>
              <p>{t("common.confirmMessage")}</p>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={cancelDelete}>
                  {t("common.cancel")}
                </button>
                <button
                  className="btn-confirm"
                  onClick={confirmDeleteServicePoint}
                >
                  {t("common.confirm")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete All Confirmation Modal */}
        {showDeleteAllConfirm && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Delete All Service Points</h3>
              <p>
                Are you sure you want to delete ALL your service points? This
                action cannot be undone.
              </p>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={cancelDelete}>
                  {t("common.cancel")}
                </button>
                <button
                  className="btn-confirm"
                  onClick={confirmDeleteAllServicePoints}
                >
                  {t("common.confirm")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="analytics">
        <h3>
          {t("dashboard.analytics")}{" "}
          <span className="realtime">{t("common.realtime")}</span>
        </h3>
        <div className="stats-grid">
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
    </div>
  );
};

export default StaffDashboard;
