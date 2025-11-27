import React, { useState, useEffect } from "react";
import axios from "axios";
import API_BASE_URL from "../config";
import Logo from "./Logo";

function LandingPage({ onSwitchToLogin, onSwitchToRegister }) {
  const [servicePoints, setServicePoints] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchServicePoints();
  }, []);

  const fetchServicePoints = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/queues/public-service-points/`);
      setServicePoints(response.data);
    } catch (err) {
      console.error("Error fetching service points:", err);
      setError("Unable to load service points at this time.");
    }
  };

  return (
    <div className="landing-page">
      {/* Background Logo */}
      <div className="background-logo" aria-hidden="true">
        <Logo />
      </div>

      {/* Hero Section */}
      <section className="hero">
        <h1>Welcome to LineHub</h1>
        <p>
          The Hub of Effortless Service - Streamline your queues and enhance
          customer experience
        </p>
        <div className="hero-buttons">
          <button className="btn-primary" onClick={onSwitchToRegister}>
            Get Started
          </button>
          <button className="btn-secondary" onClick={onSwitchToLogin}>
            Sign In
          </button>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="stats">
        <h2>Trusted by Organizations Worldwide</h2>
        <div className="stats-grid">
          <div className="stat-item">
            <h3>10,000+</h3>
            <p>Active Organizations</p>
          </div>
          <div className="stat-item">
            <h3>500,000+</h3>
            <p>Customers Served Daily</p>
          </div>
          <div className="stat-item">
            <h3>99.9%</h3>
            <p>Uptime Guarantee</p>
          </div>
          <div className="stat-item">
            <h3>24/7</h3>
            <p>Support Available</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <h2>How LineHub Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h4>Sign Up & Set Up</h4>
            <p>
              Create your account and configure your service points in minutes.
            </p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h4>Manage Queues</h4>
            <p>
              Use our intuitive dashboard to monitor and control your queues in
              real-time.
            </p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h4>Engage Customers</h4>
            <p>
              Send notifications and gather feedback to improve service quality.
            </p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h4>Analyze & Optimize</h4>
            <p>
              Review analytics to optimize operations and enhance customer
              satisfaction.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2>Why Choose LineHub?</h2>

        {/* Bank Features */}
        <div className="bank-features">
          <h3>🏦 Banking Solutions</h3>
          <div className="feature-card">
            <h4>Real-time Queue Management</h4>
            <p>
              Monitor and manage customer queues in real-time with our advanced
              dashboard.
            </p>
          </div>
          <div className="feature-card">
            <h4>Automated Notifications</h4>
            <p>
              Keep customers informed with SMS and email notifications about
              their queue status.
            </p>
          </div>
          <div className="feature-card">
            <h4>Analytics & Reporting</h4>
            <p>
              Gain insights into queue performance with detailed analytics and
              reports.
            </p>
          </div>
        </div>

        {/* Government Features */}
        <div className="government-features">
          <h3>🏛️ Government Services</h3>
          <div className="feature-card">
            <h4>Efficient Public Service</h4>
            <p>
              Streamline government offices with organized queue systems for
              better citizen service.
            </p>
          </div>
          <div className="feature-card">
            <h4>Appointment Scheduling</h4>
            <p>
              Allow citizens to book appointments online, reducing wait times
              and improving satisfaction.
            </p>
          </div>
          <div className="feature-card">
            <h4>Compliance & Security</h4>
            <p>
              Ensure data security and compliance with government standards.
            </p>
          </div>
        </div>

        {/* Hospital Features */}
        <div className="hospital-features">
          <h3>🏥 Healthcare Solutions</h3>
          <div className="feature-card">
            <h4>Patient Queue Management</h4>
            <p>
              Manage patient queues efficiently to reduce waiting times in
              hospitals and clinics.
            </p>
          </div>
          <div className="feature-card">
            <h4>Emergency Prioritization</h4>
            <p>
              Prioritize emergency cases while maintaining fair queue management
              for all patients.
            </p>
          </div>
          <div className="feature-card">
            <h4>Staff Coordination</h4>
            <p>
              Coordinate staff assignments and resources based on real-time
              queue data.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials">
        <h2>What Our Customers Say</h2>
        <div className="testimonials-grid">
          <div className="testimonial">
            <p>
              "LineHub transformed our bank operations. Wait times dropped by
              40% and customer satisfaction soared!"
            </p>
            <cite>- Sarah Johnson, Bank Manager</cite>
          </div>
          <div className="testimonial">
            <p>
              "The government services module made our office more efficient.
              Citizens love the appointment system."
            </p>
            <cite>- Michael Chen, Government Official</cite>
          </div>
          <div className="testimonial">
            <p>
              "In healthcare, every minute counts. LineHub helps prioritize
              emergencies while managing regular patients."
            </p>
            <cite>- Dr. Emily Rodriguez, Hospital Director</cite>
          </div>
        </div>
      </section>

      {/* Service Points Section */}
      <section className="service-points">
        <h2>Available Service Points</h2>
        {error && <p className="error-message">{error}</p>}
        {servicePoints.length === 0 ? (
          <p>No service points available at the moment.</p>
        ) : (
          <div className="service-points-grid">
            {servicePoints.map((sp) => (
              <div key={sp.id} className="service-point-card">
                <h3>{sp.name}</h3>
                <p>{sp.description || "No description available"}</p>
                <p>
                  <strong>Location:</strong> {sp.location || "N/A"}
                </p>
                <p>
                  <strong>Current Queue:</strong> {sp.queue_length || 0} people
                </p>
                <button className="btn-secondary" onClick={onSwitchToLogin}>
                  Join Queue
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Call to Action */}
      <section className="cta">
        <h2>Ready to Transform Your Service Experience?</h2>
        <p>
          Join thousands of organizations already using LineHub to improve their
          operations.
        </p>
        <button className="btn-primary" onClick={onSwitchToRegister}>
          Start Your Free Trial
        </button>
      </section>
    </div>
  );
}

export default LandingPage;
