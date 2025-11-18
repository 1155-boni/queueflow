import React from 'react';

function LandingPage({ onSwitchToLogin, onSwitchToRegister }) {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <h1>Welcome to LineHub</h1>
        <p>The Hub of Effortless Service - Streamline your queues and enhance customer experience</p>
        <div className="hero-buttons">
          <button className="btn-primary" onClick={onSwitchToRegister}>Get Started</button>
          <button className="btn-secondary" onClick={onSwitchToLogin}>Sign In</button>
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
            <p>Monitor and manage customer queues in real-time with our advanced dashboard.</p>
          </div>
          <div className="feature-card">
            <h4>Automated Notifications</h4>
            <p>Keep customers informed with SMS and email notifications about their queue status.</p>
          </div>
          <div className="feature-card">
            <h4>Analytics & Reporting</h4>
            <p>Gain insights into queue performance with detailed analytics and reports.</p>
          </div>
        </div>

        {/* Government Features */}
        <div className="government-features">
          <h3>🏛️ Government Services</h3>
          <div className="feature-card">
            <h4>Efficient Public Service</h4>
            <p>Streamline government offices with organized queue systems for better citizen service.</p>
          </div>
          <div className="feature-card">
            <h4>Appointment Scheduling</h4>
            <p>Allow citizens to book appointments online, reducing wait times and improving satisfaction.</p>
          </div>
          <div className="feature-card">
            <h4>Compliance & Security</h4>
            <p>Ensure data security and compliance with government standards.</p>
          </div>
        </div>

        {/* Hospital Features */}
        <div className="hospital-features">
          <h3>🏥 Healthcare Solutions</h3>
          <div className="feature-card">
            <h4>Patient Queue Management</h4>
            <p>Manage patient queues efficiently to reduce waiting times in hospitals and clinics.</p>
          </div>
          <div className="feature-card">
            <h4>Emergency Prioritization</h4>
            <p>Prioritize emergency cases while maintaining fair queue management for all patients.</p>
          </div>
          <div className="feature-card">
            <h4>Staff Coordination</h4>
            <p>Coordinate staff assignments and resources based on real-time queue data.</p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta">
        <h2>Ready to Transform Your Service Experience?</h2>
        <p>Join thousands of organizations already using LineHub to improve their operations.</p>
        <button className="btn-primary" onClick={onSwitchToRegister}>Start Your Free Trial</button>
      </section>
    </div>
  );
}

export default LandingPage;
