from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from .models import Transaction

class TransactionAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='testpassword')
        # Obtain JWT Token
        response = self.client.post('/api/login', {'username': 'testuser', 'password': 'testpassword'}, format='json')
        self.access_token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')

    def test_create_transaction(self):
        data = {
            'amount': '1500.50',
            'category': 'Salary',
            'transaction_type': 'Income',
            'description': 'Monthly payroll',
            'date': '2026-07-15'
        }
        response = self.client.post('/api/transactions', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Transaction.objects.count(), 1)
        self.assertEqual(Transaction.objects.first().category, 'Salary')

    def test_get_transactions_filtered_by_user(self):
        # Create transaction for current user
        Transaction.objects.create(
            user=self.user,
            amount=500.00,
            category='Food',
            transaction_type='Expense',
            date='2026-07-16'
        )
        
        # Create transaction for another user
        other_user = User.objects.create_user(username='otheruser', email='other@example.com', password='otherpassword')
        Transaction.objects.create(
            user=other_user,
            amount=200.00,
            category='Travel',
            transaction_type='Expense',
            date='2026-07-16'
        )
        
        response = self.client.get('/api/transactions')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only return testuser's transaction
        self.assertEqual(len(response.data), 1)
        self.assertEqual(float(response.data[0]['amount']), 500.00)
