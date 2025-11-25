import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import API_BASE_URL from "../config";

const UserDashboard = ({ user }) => {
  const { t } = useTranslation();
  const [servicePoints, setServicePoints] = useState([]);
  const [myQueue, setMyQueue] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);
  const wsRefs = useRef({});

  const getAuthToken = () => {
    // Token is now handled via HTTP-only cookies
    return null;
  };

  useEffect(() => {
    fetchServicePoints();
    fetchMyQueue();
    fetchNotifications();
  }, []);

  useEffect(() => {
    servicePoints.forEach((sp) => {
      if (!wsRefs.current[sp.id]) {
        const ws = new WebSocket(`${API_BASE_URL.replace('http', 'ws')}/ws/queues/${sp.id}/`);
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.deleted) {
            setServicePoints((prev) => prev.filter((s) => s.id !== sp.id));
          } else if (data.queue_length !== undefined) {
            setServicePoints((prev) =>
              prev.map((s) =>
                s.id === sp.id ? { ...s, queue_length: data.queue_length } : s
              )
            );
          } else if (data.user_id && data.message) {
            if (data.user_id === user.id) {
              // Refresh notifications when a new one is received
              fetchNotifications();
            }
          }
        };
        wsRefs.current[sp.id] = ws;
      }
    });

    return () => {
      Object.values(wsRefs.current).forEach((ws) => ws.close());
      wsRefs.current = {};
    };
  }, [servicePoints, user.id]);

  const fetchServicePoints = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/queues/service-points/`);
      setServicePoints(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyQueue = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/queues/my-position/`);
      setMyQueue(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/queues/notifications/`);
      setNotifications(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const markNotificationRead = async (notificationId) => {
    try {
      await axios.post(`${API_BASE_URL}/api/queues/notifications/${notificationId}/mark-read/`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Authentication failed. Please log in again.");
      } else {
        console.error(err);
      }
    }
  };

  const joinQueue = async (servicePointId) => {
    try {
      await axios.post(`${API_BASE_URL}/api/queues/join/`, {
        service_point_id: servicePointId,
      });
      fetchMyQueue();
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Authentication failed. Please log in again.");
      } else {
        console.error(err);
      }
    }
  };

  const leaveQueue = async () => {
    if (myQueue) {
      try {
        await axios.post(`${API_BASE_URL}/api/queues/leave/`, { service_point_id: myQueue.service_point.id });
        setMyQueue(null);
      } catch (err) {
        if (err.response?.status === 401) {
          setError("Authentication failed. Please log in again.");
        } else {
          console.error(err);
        }
      }
    }
  };

  return (
    <div className="dashboard">
      {error && <div className="error-message">{error}</div>}
      <h2>{t("app.welcome", { username: user.username })}</h2>
      <div className="service-points">
        <h3>
          {t("dashboard.servicePoints")}{" "}
          <span className="realtime">{t("common.realtime")}</span>
        </h3>
        {servicePoints.map((sp) => (
          <div key={sp.id} className="service-point">
            <h3>{sp.name}</h3>
            <p>{sp.description || "No description available"}</p>
            <p>Location: {sp.location || "N/A"}</p>
            <p>Queue Length: {sp.queue_length || 0}</p>
            <button className="btn-join" onClick={() => joinQueue(sp.id)}>
              {myQueue && myQueue.service_point.id === sp.id
                ? t("dashboard.joined")
                : t("dashboard.joinQueue")}
            </button>
          </div>
        ))}
      </div>
      {myQueue && (
        <div className="queue-status">
          <h3>
            {t("dashboard.queueStatus")}{" "}
            <span className="realtime">{t("common.realtime")}</span>
          </h3>
          <p>Service Point: {myQueue.service_point?.name}</p>
          <strong>
            {t("dashboard.position", { position: myQueue.position })}
          </strong>
          <p>Status: {myQueue.status}</p>
          <p>Estimated Wait Time: {myQueue.estimated_wait_time}</p>
          <button className="btn-leave" onClick={leaveQueue}>
            {t("dashboard.leaveQueue")}
          </button>
        </div>
      )}
      {!myQueue && (
        <p className="queue-status">
          No active queue. Join a service point above to start.
        </p>
      )}
      <div className="notifications">
        <h3>Notifications</h3>
        {notifications.length === 0 ? (
          <p>No notifications.</p>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification ${
                notification.is_read ? "read" : "unread"
              }`}
            >
              <p>{notification.message}</p>
              <small>
                {new Date(notification.created_at).toLocaleString()}
              </small>
              {!notification.is_read && (
                <button onClick={() => markNotificationRead(notification.id)}>
                  Mark as Read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
