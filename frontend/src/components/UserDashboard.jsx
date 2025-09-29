import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const UserDashboard = ({ user }) => {
  const { t } = useTranslation();
  const [servicePoints, setServicePoints] = useState([]);
  const [myQueue, setMyQueue] = useState(null);
  const wsRefs = useRef({});

  useEffect(() => {
    fetchServicePoints();
    fetchMyQueue();
  }, []);

  useEffect(() => {
    servicePoints.forEach(sp => {
      if (!wsRefs.current[sp.id]) {
        const ws = new WebSocket(`ws://localhost:8000/ws/queues/${sp.id}/`);
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.queue_length !== undefined) {
            setServicePoints(prev => prev.map(s => s.id === sp.id ? { ...s, queue_length: data.queue_length } : s));
          }
        };
        wsRefs.current[sp.id] = ws;
      }
    });

    return () => {
      Object.values(wsRefs.current).forEach(ws => ws.close());
      wsRefs.current = {};
    };
  }, [servicePoints]);

  const fetchServicePoints = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/queues/service-points/', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setServicePoints(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyQueue = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/queues/my-position/', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setMyQueue(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const joinQueue = async (servicePointId) => {
    try {
      await axios.post('http://localhost:8000/api/queues/join/', { service_point_id: servicePointId }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      fetchMyQueue();
    } catch (err) {
      console.error(err);
    }
  };

  const leaveQueue = async () => {
    if (myQueue) {
      try {
        await axios.post('http://localhost:8000/api/queues/leave/', { service_point_id: myQueue.service_point }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setMyQueue(null);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="dashboard">
      <h2>{t('app.welcome', { username: user.username })}</h2>
      <div className="service-points">
        <h3>{t('dashboard.servicePoints')} <span className="realtime">{t('common.realtime')}</span></h3>
        {servicePoints.map((sp) => (
          <div key={sp.id} className="service-point">
            <h3>{sp.name}</h3>
            <p>{sp.description || 'No description available'}</p>
            <p>Location: {sp.location || 'N/A'}</p>
            <p>Queue Length: {sp.queue_length || 0}</p>
            <button className="btn-join" onClick={() => joinQueue(sp.id)}>{t('dashboard.joinQueue')}</button>
          </div>
        ))}
      </div>
      {myQueue && (
        <div className="queue-status">
          <h3>{t('dashboard.queueStatus')} <span className="realtime">{t('common.realtime')}</span></h3>
          <strong>{t('dashboard.position', { position: myQueue.position })}</strong>
          <p>Status: {myQueue.status}</p>
          <p>Estimated Wait Time: {myQueue.estimated_wait_time}</p>
          <button className="btn-leave" onClick={leaveQueue}>{t('dashboard.leaveQueue')}</button>
        </div>
      )}
      {!myQueue && (
        <p className="queue-status">No active queue. Join a service point above to start.</p>
      )}
    </div>
  );
};

export default UserDashboard;
