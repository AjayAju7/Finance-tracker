from rest_framework import serializers
from .models import Transaction

class TransactionSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Transaction
        fields = ('id', 'user', 'amount', 'category', 'transaction_type', 'description', 'date', 'created_at')
