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

  return (
    <div>
      <h2>Staff Dashboard</h2>
      <div>
        <input
          type="text"
          placeholder="New Service Point Name"
          value={newSPName}
          onChange={(e) => setNewSPName(e.target.value)}
        />
        <button onClick={createServicePoint}>Create Service Point</button>
      </div>
      <h3>Service Points</h3>
      <ul>
        {servicePoints.map((sp) => (
          <li key={sp.id}>
            {sp.name} - Queue Length: {sp.queue_length} <button onClick={() => callNext(sp.id)}>Call Next</button>
          </li>
        ))}
      </ul>
      <h3>Analytics</h3>
      <p>Average Wait Time: {analytics.average_wait_time} minutes</p>
      <p>Busiest Hour: {analytics.busiest_hour}</p>
      <p>Abandoned Queues: {analytics.abandoned_queues}</p>
    </div>
  );
};

export default StaffDashboard;
