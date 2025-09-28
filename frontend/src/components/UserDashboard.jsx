import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserDashboard = ({ user }) => {
  const [servicePoints, setServicePoints] = useState([]);
  const [myQueue, setMyQueue] = useState(null);

  useEffect(() => {
    fetchServicePoints();
    fetchMyQueue();
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
      <h2>User Dashboard</h2>
      <div className="service-points">
        <h3>Available Service Points <span className="realtime"></span></h3>
        {servicePoints.map((sp) => (
          <div key={sp.id} className="service-point">
            <h3>{sp.name}</h3>
            <p>{sp.description || 'No description available'}</p>
            <p>Location: {sp.location || 'N/A'}</p>
            <button className="btn-join" onClick={() => joinQueue(sp.id)}>Join Queue</button>
          </div>
        ))}
      </div>
      {myQueue && (
        <div className="queue-status">
          <h3>Your Queue Status <span className="realtime"></span></h3>
          <strong>Position: {myQueue.position}</strong>
          <p>Status: {myQueue.status}</p>
          <p>Estimated Wait Time: {myQueue.estimated_wait_time}</p>
          <button className="btn-leave" onClick={leaveQueue}>Leave Queue</button>
        </div>
      )}
      {!myQueue && (
        <p className="queue-status">No active queue. Join a service point above to start.</p>
      )}
    </div>
  );
};

export default UserDashboard;
