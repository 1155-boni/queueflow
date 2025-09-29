import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StaffDashboard = ({ user }) => {
  const [servicePoints, setServicePoints] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [newSPName, setNewSPName] = useState('');

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
      await axios.post('http://localhost:8000/api/queues/create-service-point/', { name: newSPName }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setNewSPName('');
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
    if (window.confirm('Are you sure you want to delete this service point?')) {
      try {
        await axios.delete(`http://localhost:8000/api/queues/delete-service-point/${servicePointId}/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        fetchServicePoints();
      } catch (err) {
        console.error(err);
        alert('Failed to delete service point.');
      }
    }
  };

  return (
    <div className="dashboard">
      <h2>Staff Dashboard</h2>
      <div className="form-group">
        <label htmlFor="newSPName">Create New Service Point</label>
        <input
          id="newSPName"
          type="text"
          placeholder="Enter service point name"
          value={newSPName}
          onChange={(e) => setNewSPName(e.target.value)}
        />
        <button className="btn-primary" onClick={createServicePoint}>Create Service Point</button>
      </div>
      <div className="service-points">
        <h3>Service Points <span className="realtime"></span></h3>
        {servicePoints.map((sp) => (
          <div key={sp.id} className="service-point">
            <h3>{sp.name}</h3>
            <p>{sp.description || 'No description available'}</p>
            <p>Location: {sp.location || 'N/A'}</p>
            <p>Active: {sp.is_active ? 'Yes' : 'No'}</p>
            <p>Current Queue Length: {sp.queue_length || 0}</p>
            <button className="btn-call" onClick={() => callNext(sp.id)}>Call Next</button>
            <button className="btn-delete" onClick={() => deleteServicePoint(sp.id)}>Delete</button>
          </div>
        ))}
      </div>
      <div className="analytics">
        <h3>Analytics <span className="realtime"></span></h3>
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
