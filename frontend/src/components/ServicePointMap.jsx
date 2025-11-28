import React, { useState } from 'react';

const ServicePointMap = ({ servicePoints, onLocationPin, pinnedLocation, onJoinQueue, userQueue }) => {
  const [selectedServicePoint, setSelectedServicePoint] = useState(null);



  return (
    <div className="service-point-map">
      <h3>Service Points</h3>

      {selectedServicePoint && (
        <div className="selected-service-point" style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
          <h4>Selected Service Point: {selectedServicePoint.name}</h4>
          {selectedServicePoint.description && <p><strong>Description:</strong> {selectedServicePoint.description}</p>}
          {selectedServicePoint.bank_name && <p><strong>Bank:</strong> {selectedServicePoint.bank_name}</p>}
          {selectedServicePoint.branch && <p><strong>Branch:</strong> {selectedServicePoint.branch}</p>}
          <p><strong>Location:</strong> {selectedServicePoint.location || 'Not specified'}</p>
          {selectedServicePoint.directions && <p><strong>Directions:</strong> {selectedServicePoint.directions}</p>}
          {selectedServicePoint.teller_no && <p><strong>Teller No:</strong> {selectedServicePoint.teller_no}</p>}
          <p><strong>Organization Type:</strong> {selectedServicePoint.organization_type}</p>
          <p><strong>Queue Length:</strong> {selectedServicePoint.queue_length}</p>
          <p><strong>Max Queue Length:</strong> {selectedServicePoint.max_queue_length}</p>
          <p><strong>Supports Appointments:</strong> {selectedServicePoint.supports_appointments ? 'Yes' : 'No'}</p>
          <p><strong>Supports Priority:</strong> {selectedServicePoint.supports_priority ? 'Yes' : 'No'}</p>
          {selectedServicePoint.is_paused && <p style={{ color: 'red' }}><strong>Status:</strong> Paused</p>}
          {selectedServicePoint.service_types && selectedServicePoint.service_types.length > 0 && (
            <p><strong>Services:</strong> {selectedServicePoint.service_types.map(st => st.name).join(', ')}</p>
          )}
          {(selectedServicePoint.map_url || (selectedServicePoint.latitude && selectedServicePoint.longitude)) && (
            <button onClick={() => {
              const url = selectedServicePoint.map_url || `https://www.google.com/maps?q=${selectedServicePoint.latitude},${selectedServicePoint.longitude}`;
              window.open(url, '_blank');
            }}>View on Google Maps</button>
          )}
          {onJoinQueue && !selectedServicePoint.is_paused && (
            userQueue && userQueue.service_point?.id === selectedServicePoint.id ? (
              <button style={{ marginLeft: '10px', padding: '5px 10px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '3px', cursor: 'not-allowed' }}>
                Joined
              </button>
            ) : (
              <button onClick={() => onJoinQueue(selectedServicePoint.id)} style={{ marginLeft: '10px', padding: '5px 10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>
                Join Queue
              </button>
            )
          )}
          {selectedServicePoint.is_paused && (
            <p style={{ color: 'red', marginLeft: '10px' }}>Queue is currently paused</p>
          )}
          <button onClick={() => setSelectedServicePoint(null)} style={{ marginLeft: '10px' }}>Close</button>
        </div>
      )}

      {servicePoints.length > 0 ? (
        <div className="service-points-grid">
          {servicePoints.map((sp) => (
            <div key={sp.id} className="service-point-card" onClick={() => setSelectedServicePoint(sp)} style={{ cursor: 'pointer' }}>
              <h4>{sp.name}</h4>
              {sp.description && <p><strong>Description:</strong> {sp.description}</p>}
              {sp.bank_name && <p><strong>Bank:</strong> {sp.bank_name}</p>}
              {sp.branch && <p><strong>Branch:</strong> {sp.branch}</p>}
              <p><strong>Location:</strong> {sp.location || 'Not specified'}</p>
              <p><strong>Type:</strong> {sp.organization_type}</p>
              <p><strong>Current Queue:</strong> {sp.queue_length} / {sp.max_queue_length}</p>
              {sp.is_paused && <p style={{ color: 'red' }}><strong>Status:</strong> Paused</p>}
              {sp.service_types && sp.service_types.length > 0 && (
                <p><strong>Services:</strong> {sp.service_types.slice(0, 3).map(st => st.name).join(', ')}{sp.service_types.length > 3 ? '...' : ''}</p>
              )}
              {sp.latitude && sp.longitude && (
                <p><strong>Coordinates:</strong> {sp.latitude}, {sp.longitude}</p>
              )}
              <div className="service-point-actions">
                {sp.latitude && sp.longitude && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const url = sp.map_url || `https://www.google.com/maps?q=${sp.latitude},${sp.longitude}`;
                      window.open(url, '_blank');
                    }}
                    className="btn-secondary"
                  >
                    View on Map
                  </button>
                )}
                {onJoinQueue && !sp.is_paused && (
                  userQueue && userQueue.service_point?.id === sp.id ? (
                    <button
                      className="btn-secondary"
                      style={{ cursor: 'not-allowed' }}
                      disabled
                    >
                      Joined
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onJoinQueue(sp.id);
                      }}
                      className="btn-primary"
                    >
                      Join Queue
                    </button>
                  )
                )}
                {sp.is_paused && (
                  <p style={{ color: 'red' }}>Queue Paused</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No service points available</p>
      )}
    </div>
  );
};

export default ServicePointMap;
