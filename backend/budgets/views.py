from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import Budget
from .serializers import BudgetSerializer

class BudgetViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only return budgets belonging to the logged-in user
        queryset = Budget.objects.filter(user=self.request.user)
        
        # Support optional filtering by month and year
        month = self.request.query_params.get('month')
        year = self.request.query_params.get('year')
        
        if month:
            queryset = queryset.filter(month=month)
        if year:
            queryset = queryset.filter(year=year)
            
        return queryset

    def perform_create(self, serializer):
        # Set user
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        # Check if a budget already exists for this category, month, and year
        category = request.data.get('category')
        month = request.data.get('month')
        year = request.data.get('year')
        
        if category and month and year:
            exists = Budget.objects.filter(
                user=request.user,
                category__iexact=category,
                month=month,
                year=year
            ).exists()
            if exists:
                return Response(
                    {"detail": f"A budget for category '{category}' in {month}/{year} already exists."},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        return super().create(request, *args, **kwargs)
