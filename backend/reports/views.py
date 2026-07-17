import io
from datetime import datetime
from django.db.models import Sum
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import pandas as pd

from transactions.models import Transaction
from budgets.models import Budget

# ReportLab imports for PDF generation
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

class ReportSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        month = request.query_params.get('month')
        year = request.query_params.get('year')

        if not month or not year:
            return Response(
                {"detail": "Both 'month' and 'year' parameters are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            month = int(month)
            year = int(year)
        except ValueError:
            return Response(
                {"detail": "Month and Year must be integers."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Filters
        tx_queryset = Transaction.objects.filter(user=user, date__month=month, date__year=year)
        
        # Aggregations
        total_income = tx_queryset.filter(transaction_type='Income').aggregate(Sum('amount'))['amount__sum'] or 0.0
        total_expense = tx_queryset.filter(transaction_type='Expense').aggregate(Sum('amount'))['amount__sum'] or 0.0
        net_savings = float(total_income) - float(total_expense)

        # Category breakdown
        category_spending = (
            tx_queryset.filter(transaction_type='Expense')
            .values('category')
            .annotate(spent=Sum('amount'))
            .order_by('-spent')
        )
        category_breakdown = [
            {"category": item['category'], "spent": float(item['spent'])}
            for item in category_spending
        ]

        # Budget tracking for the month
        budgets = Budget.objects.filter(user=user, month=month, year=year)
        budget_summary = []
        for b in budgets:
            # Spent is calculated dynamically
            spent = tx_queryset.filter(category__iexact=b.category, transaction_type='Expense').aggregate(Sum('amount'))['amount__sum'] or 0.0
            percent = (float(spent) / float(b.monthly_limit)) * 100 if b.monthly_limit > 0 else 0
            
            status_str = "Safe"
            if percent >= 100:
                status_str = "Exceeded"
            elif percent >= 80:
                status_str = "Warning"

            budget_summary.append({
                "category": b.category,
                "limit": float(b.monthly_limit),
                "spent": float(spent),
                "percent": round(percent, 2),
                "status": status_str
            })

        return Response({
            "month": month,
            "year": year,
            "total_income": float(total_income),
            "total_expense": float(total_expense),
            "net_savings": net_savings,
            "category_breakdown": category_breakdown,
            "budgets": budget_summary
        }, status=status.HTTP_200_OK)


class ReportExportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        export_format = request.query_params.get('format', 'pdf').lower()
        month = request.query_params.get('month')
        year = request.query_params.get('year')

        if not month or not year:
            return HttpResponse("Month and Year are required.", status=400)

        try:
            month = int(month)
            year = int(year)
        except ValueError:
            return HttpResponse("Month and Year must be integers.", status=400)

        # Retrieve transactions
        tx_queryset = Transaction.objects.filter(user=user, date__month=month, date__year=year).order_by('date')
        
        # Prepare list for reports
        data = []
        for tx in tx_queryset:
            data.append({
                "Date": tx.date.strftime("%Y-%m-%d"),
                "Type": tx.transaction_type,
                "Category": tx.category,
                "Description": tx.description,
                "Amount (INR)": float(tx.amount)
            })

        if not data:
            # Return empty file with headers or simple message if no data exists
            if export_format != 'pdf':
                df = pd.DataFrame(columns=["Date", "Type", "Category", "Description", "Amount (INR)"])
            else:
                df = None
        else:
            df = pd.DataFrame(data)

        # Export logic
        if export_format == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="Finance_Report_{year}_{month}.csv"'
            df.to_csv(path_or_buf=response, index=False)
            return response

        elif export_format == 'excel':
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                # Sheet 1: Transactions
                df.to_excel(writer, sheet_name='Transactions', index=False)
                
                # Sheet 2: Category Summary
                if not df.empty:
                    summary_df = df[df['Type'] == 'Expense'].groupby('Category')['Amount (INR)'].sum().reset_index()
                    summary_df.columns = ['Category', 'Total Spent (INR)']
                    summary_df = summary_df.sort_values(by='Total Spent (INR)', ascending=False)
                    summary_df.to_excel(writer, sheet_name='Expense Summary', index=False)
            
            response = HttpResponse(output.getvalue(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            response['Content-Disposition'] = f'attachment; filename="Finance_Report_{year}_{month}.xlsx"'
            return response

        elif export_format == 'pdf':
            # Create PDF Response
            response = HttpResponse(content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="Finance_Report_{year}_{month}.pdf"'
            
            # Setup PDF document
            doc = SimpleDocTemplate(response, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
            story = []
            
            # Styles
            styles = getSampleStyleSheet()
            title_style = ParagraphStyle(
                'TitleStyle',
                parent=styles['Heading1'],
                fontSize=20,
                textColor=colors.HexColor('#1e293b'), # Dark slate
                spaceAfter=15,
                alignment=1 # Center
            )
            subtitle_style = ParagraphStyle(
                'SubtitleStyle',
                parent=styles['Normal'],
                fontSize=11,
                textColor=colors.HexColor('#64748b'), # Slate grey
                spaceAfter=25,
                alignment=1 # Center
            )
            heading_style = ParagraphStyle(
                'HeadingStyle',
                parent=styles['Heading2'],
                fontSize=14,
                textColor=colors.HexColor('#4f46e5'), # Indigo primary
                spaceBefore=15,
                spaceAfter=10
            )
            cell_style = ParagraphStyle('CellStyle', parent=styles['Normal'], fontSize=9, leading=11)
            cell_header_style = ParagraphStyle('CellHeaderStyle', parent=styles['Normal'], fontSize=9, leading=11, textColor=colors.white)

            # Title
            story.append(Paragraph(f"Personal Finance Tracker Report", title_style))
            story.append(Paragraph(f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | Period: {month}/{year}", subtitle_style))
            
            # Financial Overview Aggregations
            total_inc = tx_queryset.filter(transaction_type='Income').aggregate(Sum('amount'))['amount__sum'] or 0.0
            total_exp = tx_queryset.filter(transaction_type='Expense').aggregate(Sum('amount'))['amount__sum'] or 0.0
            net_sav = float(total_inc) - float(total_exp)
            
            overview_data = [
                [Paragraph("<b>Metric</b>", cell_header_style), Paragraph("<b>Amount (INR)</b>", cell_header_style)],
                [Paragraph("Total Income", cell_style), Paragraph(f"INR {total_inc:,.2f}", cell_style)],
                [Paragraph("Total Expense", cell_style), Paragraph(f"INR {total_exp:,.2f}", cell_style)],
                [Paragraph("Net Savings", cell_style), Paragraph(f"INR {net_sav:,.2f}", cell_style)]
            ]
            overview_table = Table(overview_data, colWidths=[150, 150])
            overview_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#4f46e5')),
                ('TEXTCOLOR', (0,0), (-1,0), colors.white),
                ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                ('BOTTOMPADDING', (0,0), (-1,-1), 6),
                ('TOPPADDING', (0,0), (-1,-1), 6),
                ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#f8fafc')),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ]))
            
            story.append(Paragraph("Financial Summary", heading_style))
            story.append(overview_table)
            story.append(Spacer(1, 15))
            
            # Detailed Transactions
            story.append(Paragraph("Transaction History", heading_style))
            if not data:
                story.append(Paragraph("No transactions recorded for this period.", cell_style))
            else:
                table_data = [[
                    Paragraph("<b>Date</b>", cell_header_style),
                    Paragraph("<b>Type</b>", cell_header_style),
                    Paragraph("<b>Category</b>", cell_header_style),
                    Paragraph("<b>Description</b>", cell_header_style),
                    Paragraph("<b>Amount</b>", cell_header_style)
                ]]
                
                for row in data:
                    table_data.append([
                        Paragraph(row["Date"], cell_style),
                        Paragraph(row["Type"], cell_style),
                        Paragraph(row["Category"], cell_style),
                        Paragraph(row["Description"], cell_style),
                        Paragraph(f"INR {row['Amount (INR)']:,.2f}", cell_style)
                    ])
                
                # Width definitions (Sum must fit standard page width ~ 540 pt)
                tx_table = Table(table_data, colWidths=[70, 60, 90, 200, 100])
                tx_table.setStyle(TableStyle([
                    ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e293b')),
                    ('TEXTCOLOR', (0,0), (-1,0), colors.white),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 5),
                    ('TOPPADDING', (0,0), (-1,-1), 5),
                    ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')]),
                    ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
                    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ]))
                story.append(tx_table)

            doc.build(story)
            return response

        return HttpResponse("Unsupported format", status=400)
