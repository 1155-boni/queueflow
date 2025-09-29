import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const StaffDashboard = ({ user }) => {
  const { t } = useTranslation();
  const [servicePoints, setServicePoints] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [newServicePoint, setNewServicePoint] = useState({
    name: '',
    description: '',
    location: '',
    is_active: true,
  });

  useEffect(() => {
    fetchServicePoints();
    fetchAnalytics();
  }, []);

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

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/queues/analytics/', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setAnalytics(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const createServicePoint = async () => {
    try {
      await axios.post('http://localhost:8000/api/queues/create-service-point/', newServicePoint, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setNewServicePoint({
        name: '',
        description: '',
        location: '',
        is_active: true,
      });
      fetchServicePoints();
    } catch (err) {
      console.error(err);
    }
  };

  const callNext = async (servicePointId) => {
    try {
      await axios.post('http://localhost:8000/api/queues/call-next/', { service_point_id: servicePointId }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      fetchServicePoints();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteServicePoint = async (servicePointId) => {
    if (window.confirm(t('queue.deleteConfirm'))) {
      try {
        await axios.delete(`http://localhost:8000/api/queues/delete-service-point/${servicePointId}/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        fetchServicePoints();
      } catch (err) {
        console.error(err);
        alert(t('common.error'));
      }
    }
  };

  return (
    <div className="dashboard">
      <h2>{t('app.welcome', { username: user.username })}</h2>
      <div className="form-group">
        <h3>{t('staff.createServicePoint')}</h3>
        <label htmlFor="name">{t('common.name')}</label>
        <input
          id="name"
          type="text"
          placeholder={t('common.name')}
          value={newServicePoint.name}
          onChange={(e) => setNewServicePoint({ ...newServicePoint, name: e.target.value })}
        />
        <label htmlFor="description">{t('common.description')}</label>
        <textarea
          id="description"
          placeholder={t('common.description')}
          value={newServicePoint.description}
          onChange={(e) => setNewServicePoint({ ...newServicePoint, description: e.target.value })}
        />
        <label htmlFor="location">{t('common.location')}</label>
        <input
          id="location"
          type="text"
          placeholder={t('common.location')}
          value={newServicePoint.location}
          onChange={(e) => setNewServicePoint({ ...newServicePoint, location: e.target.value })}
        />
        <label htmlFor="is_active">
          <input
            id="is_active"
            type="checkbox"
            checked={newServicePoint.is_active}
            onChange={(e) => setNewServicePoint({ ...newServicePoint, is_active: e.target.checked })}
          />
          {t('common.active')}
        </label>
        <button className="btn-primary" onClick={createServicePoint}>{t('staff.createServicePoint')}</button>
      </div>
      <div className="service-points">
        <h3>{t('dashboard.servicePoints')} <span className="realtime">{t('common.realtime')}</span></h3>
        {servicePoints.map((sp) => (
          <div key={sp.id} className="service-point">
            <h3>{sp.name}</h3>
            <p>{sp.description || 'No description available'}</p>
            <p>Location: {sp.location || 'N/A'}</p>
            <p>Active: {sp.is_active ? 'Yes' : 'No'}</p>
            <p>{t('staff.queueLength', { length: sp.queue_length || 0 })}</p>
            <button className="btn-call" onClick={() => callNext(sp.id)}>{t('dashboard.callNext')}</button>
            <button className="btn-delete" onClick={() => deleteServicePoint(sp.id)}>{t('dashboard.delete')}</button>
          </div>
        ))}
      </div>
      <div className="analytics">
        <h3>{t('dashboard.analytics')} <span className="realtime">{t('common.realtime')}</span></h3>
        <div className="metric-card">
          <h3>Average Wait Time</h3>
          <p>{analytics.average_wait_time || '0 minutes'}</p>
        </div>
        <div className="metric-card">
          <h3>Busiest Hour</h3>
          <p>{analytics.busiest_hour || 'N/A'}</p>
        </div>
        <div className="metric-card">
          <h3>Abandoned Queues</h3>
          <p>{analytics.abandoned_queues || 0}</p>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
