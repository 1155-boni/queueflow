from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class AuthTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='customer'
        )

    def test_login_success(self):
        """Test successful login returns tokens in cookies"""
        url = reverse('login')
        data = {'username': 'testuser', 'password': 'testpass123'}
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('user', response.data)
        self.assertTrue(response.cookies.get('access_token'))
        self.assertTrue(response.cookies.get('refresh_token'))

    def test_refresh_token_success(self):
        """Test refresh token endpoint works correctly"""
        # First login to get tokens
        login_url = reverse('login')
        data = {'username': 'testuser', 'password': 'testpass123'}
        login_response = self.client.post(login_url, data, format='json')

        refresh_token = login_response.cookies.get('refresh_token').value

        # Now test refresh
        refresh_url = reverse('refresh_token')
        self.client.cookies['refresh_token'] = refresh_token
        response = self.client.post(refresh_url, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        self.assertTrue(response.cookies.get('access_token'))

    def test_refresh_token_missing(self):
        """Test refresh token endpoint fails without refresh token"""
        refresh_url = reverse('refresh_token')
        response = self.client.post(refresh_url, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('error', response.data)

    def test_refresh_token_invalid(self):
        """Test refresh token endpoint fails with invalid refresh token"""
        refresh_url = reverse('refresh_token')
        self.client.cookies['refresh_token'] = 'invalid_token'
        response = self.client.post(refresh_url, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('error', response.data)
        # Check that cookies are cleared
        self.assertFalse(response.cookies.get('access_token'))
        self.assertFalse(response.cookies.get('refresh_token'))

    def test_logout_clears_cookies(self):
        """Test logout clears cookies"""
        # Login first
        login_url = reverse('login')
        data = {'username': 'testuser', 'password': 'testpass123'}
        self.client.post(login_url, data, format='json')

        # Logout
        logout_url = reverse('logout')
        response = self.client.post(logout_url, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.cookies.get('access_token'))
        self.assertFalse(response.cookies.get('refresh_token'))
