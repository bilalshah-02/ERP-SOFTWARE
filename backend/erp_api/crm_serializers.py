# backend/erp_api/crm_serializers.py
from rest_framework import serializers
from django.db import transaction
from decimal import Decimal
from . import models


def model_by_table(table: str):
    """Helper to get model by table name"""
    for name in dir(models):
        cls = getattr(models, name)
        if hasattr(cls, "_meta") and getattr(cls._meta, "db_table", None) == table:
            return cls
    raise LookupError(f"Model for table '{table}' not found in erp_api.models")


# Get models
CrmLead = model_by_table("crm_lead")
CrmActivity = model_by_table("crm_activity")
Party = model_by_table("party")


# ==================== LEAD SERIALIZERS ====================

class LeadSerializer(serializers.ModelSerializer):
    """CRM Lead"""
    customer_name = serializers.CharField(source='customer_party_key.name', read_only=True, allow_null=True)
    
    class Meta:
        model = CrmLead
        fields = (
            'lead_id', 'lead_code', 'lead_name', 'company_key',
            'contact_person', 'email', 'phone', 'source', 'status',
            'estimated_value', 'currency_code', 'customer_party_key',
            'customer_name', 'created_at', 'created_by'
        )
        read_only_fields = ('lead_id', 'lead_code', 'created_at')


class LeadCreateSerializer(serializers.Serializer):
    """Create CRM Lead"""
    company_key = serializers.IntegerField()
    lead_name = serializers.CharField(max_length=255)
    contact_person = serializers.CharField(max_length=255, required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    phone = serializers.CharField(max_length=50, required=False, allow_blank=True)
    source = serializers.CharField(max_length=100, required=False, allow_blank=True)
    estimated_value = serializers.DecimalField(max_digits=18, decimal_places=2, required=False, allow_null=True)
    created_by = serializers.IntegerField(required=False, allow_null=True)
    
    def validate_email(self, value):
        """Validate email format"""
        if value and '@' not in value:
            raise serializers.ValidationError("Invalid email format")
        return value
    
    @transaction.atomic
    def create(self, validated_data):
        import datetime
        
        # Generate lead code
        company_key = validated_data.get('company_key')
        today = datetime.date.today()
        
        # Create lead
        lead = CrmLead.objects.create(
            lead_code=f"LEAD-TEMP",
            lead_name=validated_data['lead_name'],
            company_key_id=company_key,
            contact_person=validated_data.get('contact_person'),
            email=validated_data.get('email'),
            phone=validated_data.get('phone'),
            source=validated_data.get('source'),
            status='NEW',
            estimated_value=validated_data.get('estimated_value'),
            created_by_id=validated_data.get('created_by')
        )
        
        # Update lead code
        lead.lead_code = f"LEAD-{today.strftime('%Y%m%d')}-{lead.lead_id}"
        lead.save(update_fields=['lead_code'])
        
        return lead


class LeadUpdateSerializer(serializers.Serializer):
    """Update Lead"""
    lead_name = serializers.CharField(max_length=255, required=False)
    contact_person = serializers.CharField(max_length=255, required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    phone = serializers.CharField(max_length=50, required=False, allow_blank=True)
    source = serializers.CharField(max_length=100, required=False, allow_blank=True)
    status = serializers.CharField(max_length=50, required=False)  # Allow any status value
    estimated_value = serializers.DecimalField(max_digits=18, decimal_places=2, required=False, allow_null=True)
    
    def update(self, instance, validated_data):
        """Update lead fields"""
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        return instance


class LeadConvertSerializer(serializers.Serializer):
    """Convert Lead to Customer"""
    lead_id = serializers.IntegerField()
    create_customer = serializers.BooleanField(default=True)
    
    def validate_lead_id(self, value):
        """Ensure lead exists and can be converted"""
        lead = CrmLead.objects.filter(lead_id=value).first()
        if not lead:
            raise serializers.ValidationError("Lead not found")
        
        if lead.customer_party_key:
            raise serializers.ValidationError("Lead already linked to customer")
        
        return value
    
    @transaction.atomic
    def create(self, validated_data):
        lead_id = validated_data['lead_id']
        create_customer = validated_data.get('create_customer', True)
        
        lead = CrmLead.objects.get(lead_id=lead_id)
        
        customer = None
        if create_customer:
            # Create customer party
            customer = Party.objects.create(
                party_code=f"CUST-{lead.lead_code}",
                name=lead.lead_name,
                party_type='CUSTOMER',
                phone=lead.phone,
                email=lead.email
            )
            
            # Link lead to customer
            lead.customer_party_key = customer
        
        # Update lead - don't force status change, keep existing or let database handle it
        lead.save(update_fields=['customer_party_key'])
        
        return {
            'lead': lead,
            'customer': customer
        }


# ==================== ACTIVITY SERIALIZERS ====================

class ActivitySerializer(serializers.ModelSerializer):
    """CRM Activity"""
    lead_code = serializers.CharField(source='lead.lead_code', read_only=True, allow_null=True)
    lead_name = serializers.CharField(source='lead.lead_name', read_only=True, allow_null=True)
    party_name = serializers.CharField(source='party_key.name', read_only=True, allow_null=True)
    
    class Meta:
        model = CrmActivity
        fields = (
            'activity_id', 'lead', 'lead_code', 'lead_name',
            'party_key', 'party_name', 'activity_type',
            'subject', 'notes', 'due_at', 'completed_at',
            'created_at', 'created_by'
        )
        read_only_fields = ('activity_id', 'created_at')


class ActivityCreateSerializer(serializers.Serializer):
    """Create Activity"""
    lead_id = serializers.IntegerField(required=False, allow_null=True)
    party_key = serializers.IntegerField(required=False, allow_null=True)
    activity_type = serializers.ChoiceField(
        choices=['CALL', 'EMAIL', 'MEETING', 'TASK', 'NOTE']
    )
    subject = serializers.CharField(max_length=255)
    notes = serializers.CharField(required=False, allow_blank=True)
    due_at = serializers.DateTimeField(required=False, allow_null=True)
    created_by = serializers.IntegerField(required=False, allow_null=True)
    
    def validate(self, data):
        """At least one of lead_id or party_key must be provided"""
        if not data.get('lead_id') and not data.get('party_key'):
            raise serializers.ValidationError("Either lead_id or party_key must be provided")
        
        # Validate lead exists
        if data.get('lead_id'):
            lead = CrmLead.objects.filter(lead_id=data['lead_id']).first()
            if not lead:
                raise serializers.ValidationError("Lead not found")
        
        # Validate party exists
        if data.get('party_key'):
            party = Party.objects.filter(party_key=data['party_key']).first()
            if not party:
                raise serializers.ValidationError("Party not found")
        
        return data
    
    def create(self, validated_data):
        """Create activity"""
        activity = CrmActivity.objects.create(
            lead_id=validated_data.get('lead_id'),
            party_key_id=validated_data.get('party_key'),
            activity_type=validated_data['activity_type'],
            subject=validated_data['subject'],
            notes=validated_data.get('notes'),
            due_at=validated_data.get('due_at'),
            created_by_id=validated_data.get('created_by')
        )
        
        return activity


class ActivityCompleteSerializer(serializers.Serializer):
    """Mark activity as complete"""
    activity_id = serializers.IntegerField()
    completion_notes = serializers.CharField(required=False, allow_blank=True)
    
    def validate_activity_id(self, value):
        """Ensure activity exists"""
        activity = CrmActivity.objects.filter(activity_id=value).first()
        if not activity:
            raise serializers.ValidationError("Activity not found")
        
        if activity.completed_at:
            raise serializers.ValidationError("Activity already completed")
        
        return value
    
    @transaction.atomic
    def create(self, validated_data):
        import datetime
        
        activity_id = validated_data['activity_id']
        completion_notes = validated_data.get('completion_notes', '')
        
        activity = CrmActivity.objects.get(activity_id=activity_id)
        
        # Update activity
        activity.completed_at = datetime.datetime.now()
        if completion_notes:
            activity.notes = (activity.notes or '') + f"\n\nCompleted: {completion_notes}"
        activity.save(update_fields=['completed_at', 'notes'])
        
        return activity