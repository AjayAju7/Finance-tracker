from rest_framework import serializers
from django.db.models import Sum
from .models import Budget
from transactions.models import Transaction

class BudgetSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')
    spent = serializers.SerializerMethodField()

    class Meta:
        model = Budget
        fields = ('id', 'user', 'category', 'monthly_limit', 'month', 'year', 'spent')

    def get_spent(self, obj):
        # Dynamically calculate the sum of expenses for this user, category, month, and year
        # Case insensitive comparison for category to make it robust
        total = Transaction.objects.filter(
            user=obj.user,
            category__iexact=obj.category,
            transaction_type='Expense',
            date__month=obj.month,
            date__year=obj.year
        ).aggregate(Sum('amount'))['amount__sum']
        
        return float(total) if total is not None else 0.0
