# backend/erp_api/crm_views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Sum, Count, Q, Avg
from decimal import Decimal

from . import models
from .crm_serializers import (
    LeadSerializer,
    LeadCreateSerializer,
    LeadUpdateSerializer,
    LeadConvertSerializer,
    ActivitySerializer,
    ActivityCreateSerializer,
    ActivityCompleteSerializer,
)


def model_by_table(table: str):
    """Helper to get model by table name"""
    for name in dir(models):
        cls = getattr(models, name)
        if hasattr(cls, "_meta") and getattr(cls._meta, "db_table", None) == table:
            return cls
    raise LookupError(f"Model for table '{table}' not found")


# Get models
CrmLead = model_by_table("crm_lead")
CrmActivity = model_by_table("crm_activity")
Party = model_by_table("party")


# ==================== LEAD VIEWSET ====================

class LeadViewSet(viewsets.ViewSet):
    """CRM Lead Management"""
    
    def list(self, request):
        """List leads"""
        status_filter = request.query_params.get('status')
        source = request.query_params.get('source')
        
        queryset = CrmLead.objects.select_related('customer_party_key').all()
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if source:
            queryset = queryset.filter(source=source)
        
        queryset = queryset.order_by('-created_at')
        serializer = LeadSerializer(queryset, many=True)
        return Response(serializer.data)
    
    def retrieve(self, request, pk=None):
        """Get single lead"""
        try:
            lead = CrmLead.objects.select_related('customer_party_key').get(lead_id=pk)
            serializer = LeadSerializer(lead)
            return Response(serializer.data)
        except CrmLead.DoesNotExist:
            return Response(
                {'error': 'Lead not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def create(self, request):
        """Create lead"""
        serializer = LeadCreateSerializer(data=request.data)
        if serializer.is_valid():
            lead = serializer.save()
            return Response(
                LeadSerializer(lead).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def partial_update(self, request, pk=None):
        """Update lead"""
        try:
            lead = CrmLead.objects.get(lead_id=pk)
            serializer = LeadUpdateSerializer(lead, data=request.data, partial=True)
            if serializer.is_valid():
                lead = serializer.save()
                return Response(LeadSerializer(lead).data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except CrmLead.DoesNotExist:
            return Response(
                {'error': 'Lead not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def convert(self, request, pk=None):
        """Convert lead to customer"""
        serializer = LeadConvertSerializer(data={'lead_id': pk, **request.data})
        if serializer.is_valid():
            result = serializer.save()
            return Response({
                'message': 'Lead converted successfully',
                'lead': LeadSerializer(result['lead']).data,
                'customer': {
                    'party_key': result['customer'].party_key if result['customer'] else None,
                    'party_code': result['customer'].party_code if result['customer'] else None,
                    'name': result['customer'].name if result['customer'] else None
                } if result['customer'] else None
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def activities(self, request, pk=None):
        """Get activities for a lead"""
        try:
            lead = CrmLead.objects.get(lead_id=pk)
            activities = CrmActivity.objects.filter(lead=lead).order_by('-created_at')
            serializer = ActivitySerializer(activities, many=True)
            return Response(serializer.data)
        except CrmLead.DoesNotExist:
            return Response(
                {'error': 'Lead not found'},
                status=status.HTTP_404_NOT_FOUND
            )


# ==================== ACTIVITY VIEWSET ====================

class ActivityViewSet(viewsets.ViewSet):
    """CRM Activity Management"""
    
    def list(self, request):
        """List activities"""
        lead_id = request.query_params.get('lead_id')
        party_key = request.query_params.get('party_key')
        activity_type = request.query_params.get('activity_type')
        completed = request.query_params.get('completed')
        
        queryset = CrmActivity.objects.select_related('lead', 'party_key').all()
        
        if lead_id:
            queryset = queryset.filter(lead_id=lead_id)
        if party_key:
            queryset = queryset.filter(party_key=party_key)
        if activity_type:
            queryset = queryset.filter(activity_type=activity_type)
        if completed is not None:
            if completed.lower() == 'true':
                queryset = queryset.filter(completed_at__isnull=False)
            else:
                queryset = queryset.filter(completed_at__isnull=True)
        
        queryset = queryset.order_by('-created_at')
        serializer = ActivitySerializer(queryset, many=True)
        return Response(serializer.data)
    
    def retrieve(self, request, pk=None):
        """Get single activity"""
        try:
            activity = CrmActivity.objects.select_related('lead', 'party_key').get(activity_id=pk)
            serializer = ActivitySerializer(activity)
            return Response(serializer.data)
        except CrmActivity.DoesNotExist:
            return Response(
                {'error': 'Activity not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def create(self, request):
        """Create activity"""
        serializer = ActivityCreateSerializer(data=request.data)
        if serializer.is_valid():
            activity = serializer.save()
            return Response(
                ActivitySerializer(activity).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark activity as complete"""
        serializer = ActivityCompleteSerializer(data={'activity_id': pk, **request.data})
        if serializer.is_valid():
            activity = serializer.save()
            return Response({
                'message': 'Activity completed',
                'activity': ActivitySerializer(activity).data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==================== CRM DASHBOARD ====================

class CrmDashboardView(APIView):
    """CRM module dashboard"""
    
    def get(self, request):
        """Get CRM overview"""
        
        # Lead stats - avoid status enum issues
        all_leads = CrmLead.objects.all()
        
        lead_stats = {
            'total': all_leads.count(),
            'total_value': all_leads.aggregate(total=Sum('estimated_value'))['total'] or 0,
            'avg_value': all_leads.aggregate(avg=Avg('estimated_value'))['avg'] or 0
        }
        
        # Get status breakdown dynamically
        status_counts = {}
        for lead in all_leads:
            status = lead.status or 'UNKNOWN'
            status_counts[status] = status_counts.get(status, 0) + 1
        
        # Activity stats
        activity_stats = CrmActivity.objects.aggregate(
            total=Count('activity_id'),
            completed=Count('activity_id', filter=Q(completed_at__isnull=False)),
            pending=Count('activity_id', filter=Q(completed_at__isnull=True))
        )
        
        # Activity breakdown by type
        activity_by_type = {}
        for activity_type in ['CALL', 'EMAIL', 'MEETING', 'TASK', 'NOTE']:
            count = CrmActivity.objects.filter(activity_type=activity_type).count()
            activity_by_type[activity_type] = count
        
        # Recent leads
        recent_leads = CrmLead.objects.select_related('customer_party_key').order_by('-created_at')[:10]
        
        recent_leads_data = [{
            'lead_id': lead.lead_id,
            'lead_code': lead.lead_code,
            'lead_name': lead.lead_name,
            'contact_person': lead.contact_person,
            'email': lead.email,
            'phone': lead.phone,
            'status': lead.status,
            'estimated_value': float(lead.estimated_value) if lead.estimated_value else None,
            'created_at': lead.created_at
        } for lead in recent_leads]
        
        # Conversion rate - count leads with customer_party_key
        converted_leads = all_leads.filter(customer_party_key__isnull=False).count()
        total_leads = lead_stats['total'] or 1
        conversion_rate = (converted_leads / total_leads) * 100 if total_leads > 0 else 0
        
        return Response({
            'leads': {
                'total': lead_stats['total'],
                'by_status': status_counts,
                'total_value': float(lead_stats['total_value']),
                'avg_value': float(lead_stats['avg_value']),
                'conversion_rate': round(conversion_rate, 2),
                'converted_count': converted_leads
            },
            'activities': {
                'total': activity_stats['total'],
                'completed': activity_stats['completed'],
                'pending': activity_stats['pending'],
                'by_type': activity_by_type
            },
            'recent_leads': recent_leads_data
        })


# ==================== LEAD PIPELINE VIEW ====================

class LeadPipelineView(APIView):
    """Sales pipeline visualization"""
    
    def get(self, request):
        """Get pipeline data"""
        
        # Get all unique status values from actual data
        all_leads = CrmLead.objects.all()
        unique_statuses = set(lead.status for lead in all_leads if lead.status)
        
        pipeline = []
        
        for status in sorted(unique_statuses):
            leads = CrmLead.objects.filter(status=status)
            total_value = leads.aggregate(total=Sum('estimated_value'))['total'] or 0
            
            leads_data = [{
                'lead_id': lead.lead_id,
                'lead_code': lead.lead_code,
                'lead_name': lead.lead_name,
                'estimated_value': float(lead.estimated_value) if lead.estimated_value else 0
            } for lead in leads]
            
            pipeline.append({
                'stage': status,
                'count': leads.count(),
                'total_value': float(total_value),
                'leads': leads_data
            })
        
        return Response({
            'pipeline': pipeline
        })