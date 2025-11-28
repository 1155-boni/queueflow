import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { API_BASE_URL, WS_BASE_URL } from "../config";
import ServicePointMap from "./ServicePointMap";

const UserDashboard = ({ user }) => {
  const { t } = useTranslation();
  const [servicePoints, setServicePoints] = useState([]);
  const [userQueue, setUserQueue] = useState(null);
  const [myQueues, setMyQueues] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef(null);

  useEffect(() => {
    fetchServicePoints();
    fetchUserQueue();
    fetchNotifications();
    fetchMyQueues();
  }, []);

  useEffect(() => {
    if (userQueue && userQueue.service_point?.id) {
      const ws = new WebSocket(`${WS_BASE_URL}/ws/queues/${userQueue.service_point.id}/`);
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.position !== undefined) {
          setUserQueue(prev => ({ ...prev, position: data.position }));
        }
      };
      wsRef.current = ws;

      return () => {
        if (wsRef.current) {
          wsRef.current.close();
        }
      };
    }
  }, [userQueue]);

  const fetchServicePoints = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/queues/service-points/`);
      setServicePoints(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserQueue = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/queues/my-position/`);
      setUserQueue(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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

  const fetchMyQueues = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/queues/my-queues/`);
      setMyQueues(response.data);
    } catch (err) {
      console.error(err);
    }
  };



  const leaveQueue = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/queues/leave/`);
      setUserQueue(null);
      fetchNotifications();
      fetchMyQueues();
    } catch (err) {
      console.error(err);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await axios.post(`${API_BASE_URL}/api/queues/notifications/${notificationId}/mark-read/`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (notificationId) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      // Optimistically remove from state
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      try {
        await axios.delete(`${API_BASE_URL}/api/queues/notifications/${notificationId}/delete/`);
      } catch (err) {
        console.error(err);
        alert('Failed to delete notification. Please try again.');
        // If delete fails, refetch to restore
        fetchNotifications();
      }
    }
  };

  const joinQueue = async (servicePointId) => {
    if (!servicePointId) return;
    const id = parseInt(servicePointId, 10);
    if (isNaN(id)) return;

    try {
      await axios.post(`${API_BASE_URL}/api/queues/join/`, { service_point_id: id });
      fetchUserQueue();
      fetchNotifications();
      fetchServicePoints(); // Refresh queue lengths
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 400 && err.response.data.error === 'You are already in a queue.') {
        // User is already in a queue, refresh the queue status
        fetchUserQueue();
      }
    }
  };

  const leaveQueueForEntry = async (queueEntryId) => {
    try {
      await axios.post(`${API_BASE_URL}/api/queues/leave/`, { queue_entry_id: queueEntryId });
      fetchUserQueue();
      fetchNotifications();
      fetchMyQueues();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard user-dashboard">
      <h2>{t("app.welcome", { username: user.username })}</h2>



      {userQueue && (
        <div className="queue-status">
          <h3>{t("your Queue")}</h3>
          <div className="queue-info">
            <p><strong>Service Point:</strong> {userQueue.service_point?.name || "N/A"}</p>
            <p><strong>Ticket Number:</strong> {userQueue.ticket_number || "N/A"}</p>
            <p><strong>Position:</strong> {userQueue.position}</p>
            <p><strong>Status:</strong> {userQueue.status}</p>
            <p><strong>Estimated Wait Time:</strong> {userQueue.estimated_wait_time ? `${Math.floor(userQueue.estimated_wait_time / 60)} minutes` : "Calculating..."}</p>
            <p><strong>Joined At:</strong> {new Date(userQueue.joined_at).toLocaleString()}</p>
            {userQueue.service_type && <p><strong>Service Type:</strong> {userQueue.service_type.name}</p>}
            {userQueue.service_point?.latitude && userQueue.service_point?.longitude && (
              <p>
                <strong>Pinned Location:</strong> {userQueue.service_point.latitude}, {userQueue.service_point.longitude}
                <button
                  onClick={() => window.open(`https://www.google.com/maps?q=${userQueue.service_point.latitude},${userQueue.service_point.longitude}`, '_blank')}
                  style={{ marginLeft: '10px', padding: '5px 10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                >
                  View on Maps
                </button>
              </p>
            )}
            <button className="btn-leave" onClick={leaveQueue}>
              {t("leave Queue")}
            </button>
          </div>
        </div>
      )}

      <div className="my-queues">
        <h3>My Queues</h3>
        {myQueues.length === 0 ? (
          <p>You haven't joined any queues yet.</p>
        ) : (
          myQueues.map((queueEntry) => (
            <div key={queueEntry.id} className="queue-entry">
              <p><strong>Service Point:</strong> {queueEntry.service_point?.name || "N/A"}</p>
              <p><strong>Status:</strong> {queueEntry.status}</p>
              <p><strong>Position:</strong> {queueEntry.position}</p>
              <p><strong>Joined At:</strong> {new Date(queueEntry.joined_at).toLocaleString()}</p>
              {queueEntry.status === 'served' && queueEntry.served_at && (
                <p><strong>Served At:</strong> {new Date(queueEntry.served_at).toLocaleString()}</p>
              )}
              {queueEntry.status === 'abandoned' && (
                <p><strong>Abandoned At:</strong> {new Date(queueEntry.abandoned_at).toLocaleString()}</p>
              )}
              {(queueEntry.status === 'joined' || queueEntry.status === 'waiting' || queueEntry.status === 'called') && (
                <button className="btn-leave" onClick={() => leaveQueueForEntry(queueEntry.id)}>
                  Leave Queue
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <div className="notifications">
        <h3>{t("Notifications")}</h3>
        {notifications.length === 0 ? (
          <p>{t("No Notifications")}</p>
        ) : (
          notifications.map((notif) => (
            <div key={notif.id} className={`notification ${notif.is_read ? 'read' : 'unread'}`}>
              <p>{notif.message}</p>
              <small>{new Date(notif.created_at).toLocaleString()}</small>
              <div className="notification-actions">
                {!notif.is_read && (
                  <button onClick={() => markNotificationAsRead(notif.id)}>
                    {t("markAsRead")}
                  </button>
                )}
                <button onClick={() => deleteNotification(notif.id)} className="delete-btn">
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ServicePointMap
        servicePoints={servicePoints}
        onJoinQueue={joinQueue}
        userQueue={userQueue}
      />

    </div>
  );
};

export default UserDashboard;
