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
    <div>
      <h2>User Dashboard</h2>
      <h3>Service Points</h3>
      <ul>
        {servicePoints.map((sp) => (
          <li key={sp.id}>
            {sp.name} <button onClick={() => joinQueue(sp.id)}>Join Queue</button>
          </li>
        ))}
      </ul>
      {myQueue && (
        <div>
          <h3>My Queue Position</h3>
          <p>Position: {myQueue.position}</p>
          <p>Estimated Wait: {myQueue.estimated_wait_time} minutes</p>
          <button onClick={leaveQueue}>Leave Queue</button>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
