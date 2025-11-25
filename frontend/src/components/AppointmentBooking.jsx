import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AppointmentBooking.css";

const AppointmentBooking = () => {
  const [servicePoints, setServicePoints] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [selectedServicePoint, setSelectedServicePoint] = useState("");
  const [selectedServiceType, setSelectedServiceType] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  useEffect(() => {
    fetchServicePoints();
    fetchServiceTypes();
  }, []);

  const fetchServicePoints = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/queues/public-service-points/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const governmentPoints = response.data.filter(
        (point) =>
          point.organization_type === "government" &&
          point.supports_appointments
      );
      setServicePoints(governmentPoints);
    } catch (error) {
      console.error("Error fetching service points:", error);
    }
  };

  const fetchServiceTypes = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/queues/service-types/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setServiceTypes(response.data);
    } catch (error) {
      console.error("Error fetching service types:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "/api/queues/appointments/create/",
        {
          service_point_id: selectedServicePoint,
          service_type_id: selectedServiceType,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          notes: notes,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessage(
        "Appointment booked successfully! Your QR code has been generated."
      );
      setMessageType("success");

      // Reset form
      setSelectedServicePoint("");
      setSelectedServiceType("");
      setAppointmentDate("");
      setAppointmentTime("");
      setNotes("");
    } catch (error) {
      setMessage(
        error.response?.data?.error ||
          "Failed to book appointment. Please try again."
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  return (
    <div className="appointment-booking">
      <h2>Book Government Service Appointment</h2>

      {message && <div className={`message ${messageType}`}>{message}</div>}

      <form className="appointment-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="servicePoint">Service Point *</label>
          <select
            id="servicePoint"
            value={selectedServicePoint}
            onChange={(e) => setSelectedServicePoint(e.target.value)}
            required
          >
            <option value="">Select a service point</option>
            {servicePoints.map((point) => (
              <option key={point.id} value={point.id}>
                {point.name} - {point.location}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="serviceType">Service Type *</label>
          <select
            id="serviceType"
            value={selectedServiceType}
            onChange={(e) => setSelectedServiceType(e.target.value)}
            required
          >
            <option value="">Select a service type</option>
            {serviceTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name} - Est. {type.estimated_duration}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="appointmentDate">Appointment Date *</label>
          <input
            type="date"
            id="appointmentDate"
            value={appointmentDate}
            onChange={(e) => setAppointmentDate(e.target.value)}
            min={getTomorrowDate()}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="appointmentTime">Appointment Time *</label>
          <input
            type="time"
            id="appointmentTime"
            value={appointmentTime}
            onChange={(e) => setAppointmentTime(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="notes">Additional Notes</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special requirements or notes..."
            rows="3"
          />
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Booking..." : "Book Appointment"}
        </button>
      </form>
    </div>
  );
};

export default AppointmentBooking;
