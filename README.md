# LineHub - The Hub of Effortless Service

A modern queue management system built with Django REST Framework and React, designed for efficient service point management in African banking institutions.

## Features

### 🔐 Authentication & Authorization
- JWT-based authentication with HTTP-only cookies
- Role-based access control (Customer, Staff)
- Secure token refresh mechanism
- Automatic logout on token expiration

### 👥 User Management
- User registration and login
- Account deletion with cascade cleanup
- Role-based dashboards

### 🏢 Service Point Management
- Create and manage service points
- Real-time queue updates via WebSockets
- Staff privacy: Staff can only see their own service points
- Bulk operations for staff (delete all service points)

### 🌍 Internationalization
- Multi-language support (English, French, Spanish, Swahili)
- React i18next integration

### 📱 Real-time Features
- WebSocket integration with Django Channels
- Live queue updates
- Real-time notifications

## Tech Stack

### Backend
- **Django 5.2** - Web framework
- **Django REST Framework** - API framework
- **Django Channels** - WebSocket support
- **PostgreSQL** - Database
- **Redis** - Message broker (for Channels)
- **Celery** - Background task processing
- **JWT** - Authentication tokens

### Frontend
- **React 18** - UI framework
- **Axios** - HTTP client
- **React Router** - Navigation
- **i18next** - Internationalization
- **CSS3** - Styling

## Project Structure

```
queueflow/
├── backend/                 # Django backend
│   ├── accounts/           # User authentication & management
│   ├── queues/             # Queue and service point logic
│   ├── queueflow/          # Django project settings
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── translations/   # i18n files
│   │   └── App.jsx         # Main app component
│   └── package.json        # Node dependencies
└── README.md              # This file
```

## Installation

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL
- Redis (for production)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd queueflow/backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   Create a `.env` file in the backend directory:
   ```env
   SECRET_KEY=your-secret-key-here
   DEBUG=True
   DB_NAME=queueflow
   DB_USER=your-db-user
   DB_PASSWORD=your-db-password
   DB_HOST=localhost
   DB_PORT=5432
   MAILGUN_API_KEY=your-mailgun-api-key
   MAILGUN_DOMAIN=your-mailgun-domain
   DEFAULT_FROM_EMAIL=noreply@queueflow.com
   ```

5. Run migrations:
   ```bash
   python manage.py migrate
   ```

6. Create a superuser:
   ```bash
   python manage.py createsuperuser
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd queueflow/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

### Running the Application

1. Start the backend server:
   ```bash
   cd queueflow/backend
   python manage.py runserver
   ```

2. In a new terminal, start the frontend:
   ```bash
   cd queueflow/frontend
   npm start
   ```

3. For WebSocket support, start Redis and run:
   ```bash
   python manage.py runserver
   ```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `POST /api/auth/refresh/` - Refresh access token
- `DELETE /api/auth/delete-user/` - Delete user account

### Queue Endpoints
- `GET /api/queues/service-points/` - List service points
- `POST /api/queues/service-points/` - Create service point
- `DELETE /api/queues/service-points/{id}/` - Delete service point
- `DELETE /api/queues/service-points/delete-all/` - Delete all user's service points (staff only)

## Testing

Run backend tests:
```bash
cd queueflow/backend
python manage.py test
```

Run frontend tests:
```bash
cd queueflow/frontend
npm test
```

## Deployment

### Backend (Django)
- Use Gunicorn for production WSGI server
- Configure PostgreSQL for database
- Set up Redis for Channels
- Use nginx as reverse proxy
- Enable HTTPS with SSL certificates

### Frontend (React)
- Build production bundle: `npm run build`
- Serve static files with nginx or Apache
- Configure CORS for API communication

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue on GitHub or contact the development team.

---

**LineHub** - Empowering efficient service delivery across Africa 🇰🇪🇹🇿🇺🇬🇷🇼🇧🇮
