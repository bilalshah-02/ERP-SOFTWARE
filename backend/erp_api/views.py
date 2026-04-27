# backend/erp_api/views.py - COMPLETE WITH ItemWithRecipeView
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import Http404
from django.db.models import Sum, Q
from decimal import Decimal
from django.db import connection
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .serializers import (
    CompanySerializer, DimCompany,
    ProductCostingSerializer, ProductCosting,
    
    VendorSerializer, Party,
    ItemSerializer, DimItem,
    CustomerSerializer,
    BankSerializer,
    
    JournalEntryCreateSerializer,
    GlJournalDetailSerializer,
    
    LookupAccountSerializer, LookupCostCenterSerializer, LookupProjectSerializer,
    model_by_table,
)

ChartOfAccounts = model_by_table("chart_of_accounts")
DimCostCenter = model_by_table("dim_cost_center")
ProjectJob = model_by_table("project_job")
GlJournal = model_by_table("gl_journal")


# ==================== EXISTING VIEWSETS ====================

class CompanyViewSet(viewsets.ModelViewSet):
    queryset = DimCompany.objects.all()
    serializer_class = CompanySerializer


class ProductCostingViewSet(viewsets.ModelViewSet):
    queryset = ProductCosting.objects.all().order_by("-effective_date", "-product_costing_id")
    serializer_class = ProductCostingSerializer


# ==================== VENDOR VIEWSET ====================

class VendorViewSet(viewsets.ModelViewSet):
    """CRUD for Vendors (Party with type=SUPPLIER)"""
    queryset = Party.objects.filter(party_type='SUPPLIER').order_by('-created_at')
    serializer_class = VendorSerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(name__icontains=search) | qs.filter(party_code__icontains=search)
        return qs


# ==================== ITEM VIEWSET (WITH DEBUG) ====================

class ItemViewSet(viewsets.ModelViewSet):
    """CRUD for Items (Products/Raw Materials)"""
    queryset = DimItem.objects.all().order_by('-created_at')
    serializer_class = ItemSerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        item_class = self.request.query_params.get('item_class')
        
        if search:
            qs = qs.filter(name__icontains=search) | qs.filter(item_code__icontains=search)
        if item_class:
            qs = qs.filter(item_class=item_class)
        
        return qs
    
    def create(self, request, *args, **kwargs):
        print("========== ITEM CREATE DEBUG ==========")
        print("REQUEST DATA:", request.data)
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("VALIDATION ERRORS:", serializer.errors)
        print("=======================================")
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


# ==================== ✨ NEW: ITEM WITH RECIPE VIEW ====================

# backend/erp_api/views.py
# REPLACE ItemWithRecipeView WITH THIS DEBUG VERSION

import logging
logger = logging.getLogger(__name__)

class ItemWithRecipeView(APIView):
    """Create item and recipe in ONE API call - HANDLES STRINGS"""
    
    http_method_names = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head']
    authentication_classes = []
    permission_classes = []
    throttle_classes = []
    
    def dispatch(self, request, *args, **kwargs):
        print("=" * 80)
        print("🔍 DISPATCH METHOD CALLED")
        print(f"Request Method: {request.method}")
        print(f"Request Path: {request.path}")
        print("=" * 80)
        
        try:
            response = super().dispatch(request, *args, **kwargs)
            print(f"✅ Response Status: {response.status_code}")
            return response
        except Exception as e:
            print(f"❌ Exception in dispatch: {e}")
            import traceback
            traceback.print_exc()
            raise
    
    def options(self, request, *args, **kwargs):
        print("🔍 OPTIONS method called")
        response = Response(status=status.HTTP_200_OK)
        response['Allow'] = 'GET, POST, OPTIONS'
        return response
    
    def get(self, request, *args, **kwargs):
        print("🔍 GET method called")
        return Response({
            'message': 'ItemWithRecipeView is working!',
            'methods_allowed': ['GET', 'POST', 'OPTIONS'],
            'test': 'Use POST to create items with recipes'
        }, status=status.HTTP_200_OK)
    
    def post(self, request, *args, **kwargs):
        """Handle POST requests - Create item with recipe"""
        print("=" * 80)
        print("🔍 POST METHOD CALLED!")
        print(f"Request Data: {request.data}")
        print("=" * 80)
        
        try:
            from . import models
            
            # Get models
            Bom = model_by_table("bom")
            BomComponent = model_by_table("bom_component")
            
            item_data = request.data.get('item')
            recipe_data = request.data.get('recipe', [])
            
            print(f"📦 Item Data: {item_data}")
            print(f"📋 Recipe Data: {recipe_data}")
            
            if not item_data:
                print("❌ No item data provided")
                return Response(
                    {'error': 'item data is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            print(f"✅ Creating item: {item_data.get('item_code')} - {item_data.get('name')}")
            
            # Create the item
            item = DimItem.objects.create(
                item_code=item_data['item_code'],
                name=item_data['name'],
                description=item_data.get('description', ''),
                item_class=item_data['item_class'],
                uom=item_data['uom'],
                costing_method=item_data.get('costing_method', 'FIFO'),
                is_batch_tracked=item_data.get('is_batch_tracked', False),
                is_active=item_data.get('is_active', True)
            )
            
            print(f"✅ Item created: {item.item_key} - {item.name}")
            
            # If MANUFACTURED and has recipe, create BOM
            if item_data['item_class'] == 'MANUFACTURED' and recipe_data and len(recipe_data) > 0:
                bom_code = f"{item.item_code}-RECIPE"
                
                print(f"📋 Creating BOM: {bom_code}")
                
                # ✅ FIX: Only use fields that exist in BOM model
                bom = Bom.objects.create(
                    bom_code=bom_code,
                    parent_item_key=item,
                    description=f"Recipe for {item.name}",
                    is_active=True
                )
                
                print(f"✅ BOM created: {bom.bom_key}")
                
                # Create components
                component_count = 0
                for comp_data in recipe_data:
                    # ✅ FIX: Convert strings to numbers
                    component_item_key = int(comp_data.get('component_item_key', 0))
                    quantity_per = float(comp_data.get('quantity_per', 0))
                    
                    if component_item_key > 0 and quantity_per > 0:
                        component_item = DimItem.objects.get(item_key=component_item_key)
                        
                        # ✅ FIX: Only use fields that exist in BomComponent model
                        BomComponent.objects.create(
                            bom_key=bom,
                            component_item_key=component_item,
                            quantity_per=quantity_per,
                            scrap_percent=0
                        )
                        component_count += 1
                        print(f"  ✅ Component: {component_item.name} - {quantity_per}")
                
                print(f"✅ Success! {component_count} components added")
                
                return Response({
                    'message': 'Product and recipe created successfully',
                    'item_key': item.item_key,
                    'item_code': item.item_code,
                    'item_name': item.name,
                    'bom_id': bom.bom_key,
                    'bom_code': bom.bom_code,
                    'components_count': component_count
                }, status=status.HTTP_201_CREATED)
            else:
                print(f"✅ Regular item created (no recipe)")
                return Response({
                    'message': 'Item created successfully',
                    'item_key': item.item_key,
                    'item_code': item.item_code,
                    'item_name': item.name
                }, status=status.HTTP_201_CREATED)
            
        except DimItem.DoesNotExist:
            print("❌ Component item not found")
            return Response(
                {'error': 'Component item not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            import traceback
            print("❌ EXCEPTION OCCURRED:")
            print(traceback.format_exc())
            return Response(
                {'error': str(e), 'detail': traceback.format_exc()},
                status=status.HTTP_400_BAD_REQUEST
            )

# ==================== CUSTOMER VIEWSET (WITH DEBUG) ====================

class CustomerViewSet(viewsets.ModelViewSet):
    """CRUD for Customers (Party with type=CUSTOMER)"""
    queryset = Party.objects.filter(party_type='CUSTOMER').order_by('-created_at')
    serializer_class = CustomerSerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(name__icontains=search) | qs.filter(party_code__icontains=search)
        return qs
    
    def create(self, request, *args, **kwargs):
        print("========== CUSTOMER CREATE DEBUG ==========")
        print("REQUEST DATA:", request.data)
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("VALIDATION ERRORS:", serializer.errors)
        print("==========================================")
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


# ==================== BANK VIEWSET ====================

class BankViewSet(viewsets.ModelViewSet):
    """CRUD for Banks (Party with type=BANK)"""
    queryset = Party.objects.filter(party_type='BANK').order_by('-created_at')
    serializer_class = BankSerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(name__icontains=search) | qs.filter(party_code__icontains=search)
        return qs


# ==================== LOOKUPS ====================

class AccountsLookupView(APIView):
    """Lookup accounts with filters"""
    def get(self, request):
        company_key = request.query_params.get("company_key")
        account_type = request.query_params.get("account_type")
        is_posting = request.query_params.get("is_posting")

        qs = ChartOfAccounts.objects.all()

        if company_key:
            qs = qs.filter(company_key_id=company_key)

        qs = qs.filter(is_active=True)

        if account_type:
            types = [t.strip().upper() for t in account_type.split(",") if t.strip()]
            qs = qs.filter(account_type__in=types)

        if is_posting is not None:
            if str(is_posting).lower() in ("true", "1", "yes"):
                qs = qs.filter(is_posting=True)

        qs = qs.order_by("account_code")
        return Response(LookupAccountSerializer(qs, many=True).data)


class CostCentersLookupView(APIView):
    def get(self, request):
        company_key = request.query_params.get("company_key")
        qs = DimCostCenter.objects.all()
        if company_key:
            qs = qs.filter(company_key_id=company_key)
        qs = qs.filter(is_active=True).order_by("code")
        return Response(LookupCostCenterSerializer(qs, many=True).data)


class ProjectsLookupView(APIView):
    def get(self, request):
        company_key = request.query_params.get("company_key")
        qs = ProjectJob.objects.all()
        if company_key:
            qs = qs.filter(company_key_id=company_key)
        qs = qs.order_by("-project_job_id")
        return Response(LookupProjectSerializer(qs, many=True).data)


# ==================== JOURNAL ENTRY ====================

class JournalEntryView(APIView):
    """
    POST: create journal entry (gl_journal + gl_line)
    GET: list journal entries
    """
    def get(self, request):
        company_key = request.query_params.get("company_key")
        qs = GlJournal.objects.all().order_by("-gl_id")

        if company_key:
            qs = qs.filter(company_key_id=company_key)

        qs = qs.filter(journal_number__startswith="JV-")

        return Response(GlJournalDetailSerializer(qs[:200], many=True).data)

    def post(self, request):
        ser = JournalEntryCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        j = ser.save()
        return Response(GlJournalDetailSerializer(j).data, status=status.HTTP_201_CREATED)


class JournalEntryDetailView(APIView):
    def get(self, request, gl_id: int):
        try:
            j = GlJournal.objects.get(gl_id=gl_id, journal_number__startswith="JV-")
        except GlJournal.DoesNotExist:
            raise Http404("Journal entry not found")
        return Response(GlJournalDetailSerializer(j).data)


# ==================== FINANCIAL REPORTS ====================

class TrialBalanceView(APIView):
    """Trial Balance Report"""
    def get(self, request):
        company_key = request.query_params.get("company_key")
        date_from = request.query_params.get("from")
        date_to = request.query_params.get("to")
        
        sql = """
        SELECT 
            ca.account_key,
            ca.account_code,
            ca.account_name,
            ca.account_type,
            COALESCE(SUM(gl.debit), 0) as total_debit,
            COALESCE(SUM(gl.credit), 0) as total_credit,
            COALESCE(SUM(gl.debit - gl.credit), 0) as balance
        FROM erp.chart_of_accounts ca
        LEFT JOIN erp.gl_line gl ON ca.account_key = gl.account_key
        LEFT JOIN erp.gl_journal gj ON gl.gl_id = gj.gl_id
        WHERE ca.is_active = TRUE
        """
        
        params = []
        if company_key:
            sql += " AND ca.company_key = %s"
            params.append(company_key)
        if date_from:
            sql += " AND gj.journal_date >= %s"
            params.append(date_from)
        if date_to:
            sql += " AND gj.journal_date <= %s"
            params.append(date_to)
            
        sql += """
        GROUP BY ca.account_key, ca.account_code, ca.account_name, ca.account_type
        HAVING COALESCE(SUM(gl.debit), 0) != 0 OR COALESCE(SUM(gl.credit), 0) != 0
        ORDER BY ca.account_code
        """
        
        with connection.cursor() as cursor:
            cursor.execute(sql, params)
            columns = [col[0] for col in cursor.description]
            results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        return Response(results)


class ProfitLossView(APIView):
    """Profit & Loss Statement"""
    def get(self, request):
        date_from = request.query_params.get("from")
        date_to = request.query_params.get("to")
        
        sql = """
        SELECT 
            ca.account_code,
            ca.account_name,
            ca.account_type,
            COALESCE(SUM(CASE WHEN ca.account_type = 'REVENUE' THEN gl.credit - gl.debit ELSE 0 END), 0) as amount
        FROM erp.gl_line gl
        JOIN erp.chart_of_accounts ca ON gl.account_key = ca.account_key
        JOIN erp.gl_journal gj ON gl.gl_id = gj.gl_id
        WHERE ca.account_type IN ('REVENUE', 'EXPENSE', 'COGS')
        """
        
        params = []
        if date_from:
            sql += " AND gj.journal_date >= %s"
            params.append(date_from)
        if date_to:
            sql += " AND gj.journal_date <= %s"
            params.append(date_to)
            
        sql += """
        GROUP BY ca.account_code, ca.account_name, ca.account_type
        HAVING COALESCE(SUM(CASE WHEN ca.account_type = 'REVENUE' THEN gl.credit - gl.debit 
                                 WHEN ca.account_type IN ('EXPENSE', 'COGS') THEN gl.debit - gl.credit 
                                 ELSE 0 END), 0) != 0
        ORDER BY ca.account_type, ca.account_code
        """
        
        with connection.cursor() as cursor:
            cursor.execute(sql, params)
            columns = [col[0] for col in cursor.description]
            results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        # Calculate totals
        revenue = sum(r['amount'] for r in results if r['account_type'] == 'REVENUE')
        cogs = sum(abs(r['amount']) for r in results if r['account_type'] == 'COGS')
        expenses = sum(abs(r['amount']) for r in results if r['account_type'] == 'EXPENSE')
        
        gross_profit = revenue - cogs
        net_profit = gross_profit - expenses
        
        return Response({
            "accounts": results,
            "summary": {
                "revenue": float(revenue),
                "cogs": float(cogs),
                "gross_profit": float(gross_profit),
                "expenses": float(expenses),
                "net_profit": float(net_profit),
                "profit_margin": float((net_profit / revenue * 100) if revenue > 0 else 0)
            }
        })


class BalanceSheetView(APIView):
    """Balance Sheet Report"""
    def get(self, request):
        date_to = request.query_params.get("to")
        
        sql = """
        SELECT 
            ca.account_code,
            ca.account_name,
            ca.account_type,
            COALESCE(SUM(gl.debit - gl.credit), 0) as balance
        FROM erp.chart_of_accounts ca
        LEFT JOIN erp.gl_line gl ON ca.account_key = gl.account_key
        LEFT JOIN erp.gl_journal gj ON gl.gl_id = gj.gl_id
        WHERE ca.account_type IN ('ASSET', 'LIABILITY', 'EQUITY')
        """
        
        params = []
        if date_to:
            sql += " AND gj.journal_date <= %s"
            params.append(date_to)
            
        sql += """
        GROUP BY ca.account_code, ca.account_name, ca.account_type
        HAVING COALESCE(SUM(gl.debit - gl.credit), 0) != 0
        ORDER BY ca.account_type, ca.account_code
        """
        
        with connection.cursor() as cursor:
            cursor.execute(sql, params)
            columns = [col[0] for col in cursor.description]
            results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        # Calculate totals
        assets = sum(r['balance'] for r in results if r['account_type'] == 'ASSET')
        liabilities = sum(abs(r['balance']) for r in results if r['account_type'] == 'LIABILITY')
        equity = sum(abs(r['balance']) for r in results if r['account_type'] == 'EQUITY')
        
        return Response({
            "accounts": results,
            "summary": {
                "total_assets": float(assets),
                "total_liabilities": float(liabilities),
                "total_equity": float(equity),
                "total_liabilities_equity": float(liabilities + equity),
                "balanced": abs(assets - (liabilities + equity)) < 0.01
            }
        })


class CashFlowView(APIView):
    """Cash Flow Statement (Simplified)"""
    def get(self, request):
        date_from = request.query_params.get("from")
        date_to = request.query_params.get("to")
        
        # This is a simplified cash flow - tracks cash/bank account movements
        sql = """
        SELECT 
            ca.account_name,
            COALESCE(SUM(gl.debit), 0) as cash_in,
            COALESCE(SUM(gl.credit), 0) as cash_out,
            COALESCE(SUM(gl.debit - gl.credit), 0) as net_cash_flow
        FROM erp.gl_line gl
        JOIN erp.chart_of_accounts ca ON gl.account_key = ca.account_key
        JOIN erp.gl_journal gj ON gl.gl_id = gj.gl_id
        WHERE ca.account_type = 'ASSET' 
        AND (LOWER(ca.account_name) LIKE '%cash%' OR LOWER(ca.account_name) LIKE '%bank%')
        """
        
        params = []
        if date_from:
            sql += " AND gj.journal_date >= %s"
            params.append(date_from)
        if date_to:
            sql += " AND gj.journal_date <= %s"
            params.append(date_to)
            
        sql += " GROUP BY ca.account_name ORDER BY ca.account_name"
        
        with connection.cursor() as cursor:
            cursor.execute(sql, params)
            columns = [col[0] for col in cursor.description]
            results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        total_in = sum(r['cash_in'] for r in results)
        total_out = sum(r['cash_out'] for r in results)
        net_flow = total_in - total_out
        
        return Response({
            "accounts": results,
            "summary": {
                "total_cash_in": float(total_in),
                "total_cash_out": float(total_out),
                "net_cash_flow": float(net_flow)
            }
        })


class AgingReportView(APIView):
    """AR/AP Aging Report"""
    def get(self, request):
        report_type = request.query_params.get("type", "AR")  # AR or AP
        
        from datetime import date, timedelta
        today = date.today()
        
        sql = """
        SELECT 
            p.party_code,
            p.name,
            i.invoice_number,
            i.invoice_date,
            i.due_date,
            (i.invoice_id) as invoice_id,
            COALESCE(SUM(il.line_amount), 0) as invoice_amount,
            COALESCE(SUM(pa.allocated_amount), 0) as paid_amount,
            COALESCE(SUM(il.line_amount), 0) - COALESCE(SUM(pa.allocated_amount), 0) as balance,
            CURRENT_DATE - i.due_date as days_overdue
        FROM erp.invoice i
        JOIN erp.party p ON i.party_key = p.party_key
        LEFT JOIN erp.invoice_line il ON i.invoice_id = il.invoice_id
        LEFT JOIN erp.payment_allocation pa ON i.invoice_id = pa.invoice_id
        WHERE i.invoice_type = %s
        GROUP BY p.party_code, p.name, i.invoice_number, i.invoice_date, i.due_date, i.invoice_id
        HAVING COALESCE(SUM(il.line_amount), 0) - COALESCE(SUM(pa.allocated_amount), 0) > 0
        ORDER BY days_overdue DESC
        """
        
        with connection.cursor() as cursor:
            cursor.execute(sql, [report_type])
            columns = [col[0] for col in cursor.description]
            results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        # Categorize by aging buckets
        current = sum(r['balance'] for r in results if r['days_overdue'] <= 0)
        days_1_30 = sum(r['balance'] for r in results if 0 < r['days_overdue'] <= 30)
        days_31_60 = sum(r['balance'] for r in results if 30 < r['days_overdue'] <= 60)
        days_61_90 = sum(r['balance'] for r in results if 60 < r['days_overdue'] <= 90)
        over_90 = sum(r['balance'] for r in results if r['days_overdue'] > 90)
        
        return Response({
            "invoices": results,
            "aging_summary": {
                "current": float(current),
                "days_1_30": float(days_1_30),
                "days_31_60": float(days_31_60),
                "days_61_90": float(days_61_90),
                "over_90": float(over_90),
                "total_outstanding": float(current + days_1_30 + days_31_60 + days_61_90 + over_90)
            }
        })