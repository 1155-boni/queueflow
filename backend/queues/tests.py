from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from django.urls import reverse
from .models import ServicePoint, QueueEntry, Notification
from accounts.models import User

User = get_user_model()


class QueueAPITestCase(APITestCase):
    def setUp(self):
        """Set up test data"""
        # Create test users
        self.customer_user = User.objects.create_user(
            username='testcustomer',
            email='customer@test.com',
            password='testpass123',
            role='customer'
        )
        self.staff_user = User.objects.create_user(
            username='teststaff',
            email='staff@test.com',
            password='testpass123',
            role='staff'
        )

        # Create test service point
        self.service_point = ServicePoint.objects.create(
            name='Test Service Point',
            description='A test service point',
            creator=self.staff_user
        )

    def authenticate_customer(self):
        """Helper to authenticate as customer"""
        self.client.force_authenticate(user=self.customer_user)

    def authenticate_staff(self):
        """Helper to authenticate as staff"""
        self.client.force_authenticate(user=self.staff_user)


class ServicePointsTests(QueueAPITestCase):
    """Test service_points endpoint"""

    def test_get_service_points_authenticated_customer(self):
        """Test customer getting service points when authenticated"""
        self.authenticate_customer()
        response = self.client.get(reverse('service_points'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Test Service Point')

    def test_get_service_points_authenticated_staff(self):
        """Test staff getting only their own service points when authenticated"""
        # Create another service point for a different staff
        other_staff = User.objects.create_user(
            username='otherstaff',
            email='other@test.com',
            password='testpass123',
            role='staff'
        )
        other_service_point = ServicePoint.objects.create(
            name='Other Service Point',
            description='Another test service point',
            creator=other_staff
        )

        # Authenticate as original staff
        self.authenticate_staff()
        response = self.client.get(reverse('service_points'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # Should only see their own
        self.assertEqual(response.data[0]['name'], 'Test Service Point')
        # Should not see the other service point
        service_point_names = [sp['name'] for sp in response.data]
        self.assertNotIn('Other Service Point', service_point_names)

    def test_get_service_points_unauthenticated(self):
        """Test getting service points when not authenticated"""
        response = self.client.get(reverse('service_points'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class CreateServicePointTests(QueueAPITestCase):
    """Test create_service_point endpoint"""

    def test_create_service_point_staff(self):
        """Test staff can create service point"""
        self.authenticate_staff()
        data = {
            'name': 'New Service Point',
            'description': 'A new test service point'
        }
        response = self.client.post(reverse('create_service_point'), data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'New Service Point')
        self.assertEqual(ServicePoint.objects.count(), 2)

    def test_create_service_point_customer_forbidden(self):
        """Test customer cannot create service point"""
        self.authenticate_customer()
        data = {
            'name': 'New Service Point',
            'description': 'A new test service point'
        }
        response = self.client.post(reverse('create_service_point'), data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_service_point_unauthenticated(self):
        """Test unauthenticated user cannot create service point"""
        data = {
            'name': 'New Service Point',
            'description': 'A new test service point'
        }
        response = self.client.post(reverse('create_service_point'), data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class DeleteServicePointTests(QueueAPITestCase):
    """Test delete_service_point endpoint"""

    def test_delete_own_service_point_staff(self):
        """Test staff can deactivate their own service point"""
        self.authenticate_staff()
        response = self.client.delete(reverse('delete_service_point', args=[self.service_point.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.service_point.refresh_from_db()
        self.assertFalse(self.service_point.is_active)

    def test_delete_service_point_with_active_entries_allowed(self):
        """Test can deactivate service point with active queue entries"""
        # Create a queue entry
        QueueEntry.objects.create(
            service_point=self.service_point,
            user=self.customer_user,
            position=1
        )
        self.authenticate_staff()
        response = self.client.delete(reverse('delete_service_point', args=[self.service_point.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.service_point.refresh_from_db()
        self.assertFalse(self.service_point.is_active)
        # Verify queue entries are still there (not deleted)
        self.assertEqual(QueueEntry.objects.count(), 1)

    def test_delete_service_point_customer_forbidden(self):
        """Test customer cannot delete service point"""
        self.authenticate_customer()
        response = self.client.delete(reverse('delete_service_point', args=[self.service_point.id]))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class DeleteAllServicePointsTests(QueueAPITestCase):
    """Test delete_all_service_points endpoint"""

    def test_delete_all_service_points_staff(self):
        """Test staff can delete all their service points"""
        # Create another service point for the staff
        ServicePoint.objects.create(
            name='Second Service Point',
            description='Another test service point',
            creator=self.staff_user
        )
        self.authenticate_staff()
        response = self.client.delete(reverse('delete_all_service_points'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(ServicePoint.objects.filter(creator=self.staff_user).count(), 0)
        self.assertIn('Successfully deleted 2 service points', response.data['message'])

    def test_delete_all_service_points_customer_forbidden(self):
        """Test customer cannot delete all service points"""
        self.authenticate_customer()
        response = self.client.delete(reverse('delete_all_service_points'))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class JoinQueueTests(QueueAPITestCase):
    """Test join_queue endpoint"""

    def test_join_queue_success(self):
        """Test successful queue join"""
        self.authenticate_customer()
        data = {'service_point_id': self.service_point.id}
        response = self.client.post(reverse('join_queue'), data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['position'], 1)
        self.assertEqual(QueueEntry.objects.count(), 1)

    def test_join_queue_already_in_queue(self):
        """Test joining queue when already in one"""
        # First join
        self.authenticate_customer()
        data = {'service_point_id': self.service_point.id}
        self.client.post(reverse('join_queue'), data)

        # Try to join again
        response = self.client.post(reverse('join_queue'), data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_join_queue_invalid_service_point(self):
        """Test joining queue with invalid service point"""
        self.authenticate_customer()
        data = {'service_point_id': 999}
        response = self.client.post(reverse('join_queue'), data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_join_queue_unauthenticated(self):
        """Test joining queue when not authenticated"""
        data = {'service_point_id': self.service_point.id}
        response = self.client.post(reverse('join_queue'), data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class LeaveQueueTests(QueueAPITestCase):
    """Test leave_queue endpoint"""

    def test_leave_queue_success(self):
        """Test successful queue leave"""
        # First join queue
        self.authenticate_customer()
        data = {'service_point_id': self.service_point.id}
        self.client.post(reverse('join_queue'), data)

        # Now leave
        response = self.client.post(reverse('leave_queue'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(QueueEntry.objects.filter(status='abandoned').count(), 1)

    def test_leave_queue_not_in_queue(self):
        """Test leaving queue when not in one"""
        self.authenticate_customer()
        response = self.client.post(reverse('leave_queue'))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_leave_queue_unauthenticated(self):
        """Test leaving queue when not authenticated"""
        response = self.client.post(reverse('leave_queue'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class MyQueuePositionTests(QueueAPITestCase):
    """Test my_queue_position endpoint"""

    def test_get_queue_position_success(self):
        """Test getting queue position when in queue"""
        # Join queue first
        self.authenticate_customer()
        data = {'service_point_id': self.service_point.id}
        self.client.post(reverse('join_queue'), data)

        # Get position
        response = self.client.get(reverse('my_queue_position'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['position'], 1)

    def test_get_queue_position_not_in_queue(self):
        """Test getting queue position when not in queue"""
        self.authenticate_customer()
        response = self.client.get(reverse('my_queue_position'))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_queue_position_unauthenticated(self):
        """Test getting queue position when not authenticated"""
        response = self.client.get(reverse('my_queue_position'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class CallNextTests(QueueAPITestCase):
    """Test call_next endpoint"""

    def test_call_next_staff_success(self):
        """Test staff calling next customer"""
        # Customer joins queue
        self.authenticate_customer()
        data = {'service_point_id': self.service_point.id}
        self.client.post(reverse('join_queue'), data)

        # Staff calls next
        self.authenticate_staff()
        response = self.client.post(reverse('call_next'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'called')

    def test_call_next_staff_no_waiting_customers(self):
        """Test staff calling next when no customers waiting"""
        self.authenticate_staff()
        response = self.client.post(reverse('call_next'))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_call_next_customer_forbidden(self):
        """Test customer cannot call next"""
        self.authenticate_customer()
        response = self.client.post(reverse('call_next'))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class DismissCustomerTests(QueueAPITestCase):
    """Test dismiss_customer endpoint"""

    def test_dismiss_customer_staff_success(self):
        """Test staff dismissing called customer"""
        # Customer joins and gets called
        self.authenticate_customer()
        data = {'service_point_id': self.service_point.id}
        self.client.post(reverse('join_queue'), data)

        self.authenticate_staff()
        self.client.post(reverse('call_next'))

        # Dismiss the customer
        queue_entry = QueueEntry.objects.get(user=self.customer_user, status='called')
        response = self.client.post(reverse('dismiss_customer'), {'queue_entry_id': queue_entry.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(QueueEntry.objects.get(id=queue_entry.id).status, 'served')

    def test_dismiss_customer_not_called(self):
        """Test dismissing customer who is not called"""
        # Customer joins but not called
        self.authenticate_customer()
        data = {'service_point_id': self.service_point.id}
        self.client.post(reverse('join_queue'), data)

        self.authenticate_staff()
        queue_entry = QueueEntry.objects.get(user=self.customer_user)
        response = self.client.post(reverse('dismiss_customer'), {'queue_entry_id': queue_entry.id})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_dismiss_customer_wrong_staff(self):
        """Test staff cannot dismiss customer from other staff's service point"""
        # Create another staff and service point
        other_staff = User.objects.create_user(
            username='otherstaff',
            email='other@test.com',
            password='testpass123',
            role='staff'
        )
        other_service_point = ServicePoint.objects.create(
            name='Other Service Point',
            creator=other_staff
        )

        # Customer joins other service point
        self.authenticate_customer()
        data = {'service_point_id': other_service_point.id}
        self.client.post(reverse('join_queue'), data)

        # Other staff calls the customer
        self.client.force_authenticate(user=other_staff)
        self.client.post(reverse('call_next'))

        # Original staff tries to dismiss
        self.authenticate_staff()
        queue_entry = QueueEntry.objects.get(user=self.customer_user, status='called')
        response = self.client.post(reverse('dismiss_customer'), {'queue_entry_id': queue_entry.id})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class AnalyticsTests(QueueAPITestCase):
    """Test analytics endpoint"""

    def test_get_analytics_staff(self):
        """Test staff getting analytics"""
        self.authenticate_staff()
        response = self.client.get(reverse('analytics'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_served', response.data)

    def test_get_analytics_customer_forbidden(self):
        """Test customer cannot get analytics"""
        self.authenticate_customer()
        response = self.client.get(reverse('analytics'))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class NotificationsTests(QueueAPITestCase):
    """Test notifications endpoints"""

    def test_get_notifications_authenticated(self):
        """Test getting notifications when authenticated"""
        self.authenticate_customer()
        response = self.client.get(reverse('notifications'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_notifications_unauthenticated(self):
        """Test getting notifications when not authenticated"""
        response = self.client.get(reverse('notifications'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_mark_notification_read_success(self):
        """Test marking notification as read"""
        # Create a notification
        notification = Notification.objects.create(
            user=self.customer_user,
            message='Test notification'
        )

        self.authenticate_customer()
        response = self.client.post(reverse('mark_notification_read', args=[notification.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        notification.refresh_from_db()
        self.assertTrue(notification.is_read)

    def test_mark_notification_read_not_owner(self):
        """Test cannot mark other user's notification as read"""
        # Create notification for staff
        notification = Notification.objects.create(
            user=self.staff_user,
            message='Test notification'
        )

        self.authenticate_customer()
        response = self.client.post(reverse('mark_notification_read', args=[notification.id]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class QueuePositionUpdateTests(QueueAPITestCase):
    """Test queue position updates when customers leave"""

    def test_positions_update_on_leave(self):
        """Test that positions are updated correctly when a customer leaves"""
        # Create multiple customers and join queue
        customer2 = User.objects.create_user(
            username='customer2',
            email='customer2@test.com',
            password='testpass123',
            role='customer'
        )
        customer3 = User.objects.create_user(
            username='customer3',
            email='customer3@test.com',
            password='testpass123',
            role='customer'
        )

        # Customer 1 joins (position 1)
        self.authenticate_customer()
        data = {'service_point_id': self.service_point.id}
        self.client.post(reverse('join_queue'), data)

        # Customer 2 joins (position 2)
        self.client.force_authenticate(user=customer2)
        self.client.post(reverse('join_queue'), data)

        # Customer 3 joins (position 3)
        self.client.force_authenticate(user=customer3)
        self.client.post(reverse('join_queue'), data)

        # Customer 1 leaves
        self.client.force_authenticate(user=self.customer_user)
        self.client.post(reverse('leave_queue'))

        # Check positions updated
        customer2_entry = QueueEntry.objects.get(user=customer2)
        customer3_entry = QueueEntry.objects.get(user=customer3)

        self.assertEqual(customer2_entry.position, 1)  # Was 2, now 1
        self.assertEqual(customer3_entry.position, 2)  # Was 3, now 2
