# External Verification System - Implementation Guide

## 🚀 Quick Start

This guide will help you implement the external verification system with environment-based role management.

## 📋 Prerequisites

1. **Supabase Project**: Ensure you have a Supabase project set up
2. **Environment Variables**: Configure role-based access in your `.env.local`
3. **Database Access**: Ability to run SQL migrations

## 🔧 Step 1: Environment Configuration

Add the following to your `.env.local` file:

```bash
# Role-Based System Configuration
ADMIN_USER_EMAIL=fmuhirwa@gmail.com
SUPPORT_USER_EMAILS=support1@company.com,support2@company.com
EDITOR_USER_EMAILS=editor@company.com,content@company.com
TECHNICAL_USER_EMAILS=tech@company.com,dev@company.com
```

## 🗄️ Step 2: Database Setup

### 2.1 Run the Schema Migration

Execute the SQL commands from `database/external_verification_schema.sql` in your Supabase SQL editor:

```sql
-- Add verification fields to business_entities
ALTER TABLE business_entities 
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS flagged_for_review BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Create entity_flags table
CREATE TABLE IF NOT EXISTS entity_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_entity_id UUID REFERENCES business_entities(id) ON DELETE CASCADE,
    flag_type VARCHAR(50) NOT NULL CHECK (flag_type IN ('suspicious', 'duplicate', 'missing_data', 'format_issue')),
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT
);

-- Create system_audit_log table
CREATE TABLE IF NOT EXISTS system_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    user_role VARCHAR(50) NOT NULL CHECK (user_role IN ('admin', 'support', 'editor', 'technical')),
    action_type VARCHAR(50) NOT NULL,
    target_entity_id UUID REFERENCES business_entities(id),
    action_details JSONB,
    performed_at TIMESTAMPTZ DEFAULT now()
);
```

### 2.2 Run the Functions Migration

Execute the SQL commands from `database/external_verification_functions.sql` in your Supabase SQL editor.

## 🎯 Step 3: Test the Implementation

### 3.1 Test Role Detection

1. **Login as Admin**: Use the email specified in `ADMIN_USER_EMAIL`
2. **Navigate to Admin Dashboard**: Go to `/dashboard/admin`
3. **Verify Access**: You should see the admin dashboard with entity review interface

### 3.2 Test Entity Flagging

1. **Import Test Data**: Use the CSV import feature with test data
2. **Check Flagging**: Entities with suspicious patterns should be automatically flagged
3. **Review Flags**: Check the admin dashboard for flagged entities

### 3.3 Test Admin Actions

1. **Approve Entity**: Click "Approve" on a flagged entity
2. **Reject Entity**: Click "Reject" and provide a reason
3. **Check Audit Log**: Verify actions are logged in the system

## 🔍 Step 4: Verify Implementation

### 4.1 Check Database Tables

Verify the following tables exist and have data:

```sql
-- Check business_entities verification fields
SELECT id, name, verification_status, flagged_for_review 
FROM business_entities 
LIMIT 5;

-- Check entity_flags
SELECT * FROM entity_flags LIMIT 5;

-- Check system_audit_log
SELECT * FROM system_audit_log LIMIT 5;
```

### 4.2 Test Role-Based Access

1. **Admin Access**: 
   - `/dashboard/admin` - Primary admin dashboard
   - `/dashboard/support` - Admin can access support features
   - `/dashboard/editor` - Admin can access editor features
   - `/dashboard/technical` - Admin can access technical features
2. **Support Access**: `/dashboard/support` - Should work for support emails
3. **Editor Access**: `/dashboard/editor` - Should work for editor emails
4. **Technical Access**: `/dashboard/technical` - Should work for technical emails
5. **Unauthorized Access**: Should redirect to main dashboard

## 🛠️ Step 5: Customization

### 5.1 Modify Flagging Rules

Edit `lib/entity-flagging.ts` to customize flagging logic:

```typescript
// Add custom suspicious patterns
function isGenericName(name: string): boolean {
  const genericNames = [
    'test', 'example', 'demo', 'sample', 'company', 'corp', 'inc', 'llc',
    'abc', 'xyz', 'temp', 'dummy', 'fake', 'placeholder',
    // Add your custom patterns here
    'your-custom-pattern'
  ]
  
  const lowerName = name.toLowerCase()
  return genericNames.some(generic => lowerName.includes(generic))
}
```

### 5.2 Add New Roles

1. **Update Environment Variables**: Add new role emails
2. **Update Role Detection**: Modify `lib/role-detection.ts`
3. **Create Dashboard**: Add new dashboard component and page
4. **Update Database Functions**: Add role-specific functions

### 5.3 Customize Admin Interface

Modify `components/dashboard/admin-dashboard.tsx` to add:

- Merge functionality
- Bulk actions
- Advanced filtering
- Export capabilities

## 🔒 Step 6: Security Considerations

### 6.1 Environment Security

- Keep `.env.local` secure and never commit to version control
- Use different emails for different environments
- Regularly rotate role assignments

### 6.2 Database Security

- All functions use `SECURITY DEFINER` for proper access control
- RLS policies ensure data isolation
- Audit logging tracks all admin actions

### 6.3 Application Security

- Role detection happens on both client and server
- API routes verify roles before allowing actions
- Dashboard pages redirect unauthorized users

## 📊 Step 7: Monitoring and Maintenance

### 7.1 Monitor Flagged Entities

```sql
-- Check flagged entities count
SELECT COUNT(*) as flagged_count 
FROM business_entities 
WHERE flagged_for_review = true;

-- Check flag types distribution
SELECT flag_type, COUNT(*) 
FROM entity_flags 
WHERE resolved = false 
GROUP BY flag_type;
```

### 7.2 Monitor Admin Activity

```sql
-- Check recent admin actions
SELECT user_role, action_type, COUNT(*) 
FROM system_audit_log 
WHERE performed_at > now() - interval '7 days'
GROUP BY user_role, action_type;
```

### 7.3 Cleanup Old Data

```sql
-- Cleanup old audit logs (run periodically)
DELETE FROM system_audit_log 
WHERE performed_at < now() - interval '90 days';
```

## 🚨 Troubleshooting

### Common Issues

1. **Role Not Detected**: Check environment variables and email spelling
2. **Database Functions Fail**: Ensure all migrations are applied
3. **Flags Not Created**: Check entity flagging logic and database permissions
4. **Admin Dashboard Empty**: Verify entities are being flagged during import

### Debug Steps

1. **Check Environment Variables**: Verify `.env.local` configuration
2. **Check Database Tables**: Ensure all tables exist and have proper structure
3. **Check Function Permissions**: Verify RLS policies are working
4. **Check API Responses**: Monitor network requests for errors

## 📚 Additional Resources

- **Database Schema**: `database/external_verification_schema.sql`
- **Database Functions**: `database/external_verification_functions.sql`
- **Role Detection**: `lib/role-detection.ts`
- **Entity Flagging**: `lib/entity-flagging.ts`
- **Admin Dashboard**: `components/dashboard/admin-dashboard.tsx`
- **API Routes**: `app/api/admin/`

## 🎉 Success Criteria

Your implementation is successful when:

✅ Admin users can access `/dashboard/admin`  
✅ Admin users have access to ALL role dashboards (support, editor, technical)  
✅ Entities are automatically flagged during import  
✅ Admin can approve/reject flagged entities  
✅ All actions are logged in audit trail  
✅ Role-based access control works correctly  
✅ Support, Editor, and Technical dashboards are accessible  

## 🔄 Next Steps

1. **Enhance Flagging**: Add more sophisticated duplicate detection
2. **Add Notifications**: Email admins when entities are flagged
3. **Improve UI**: Add more advanced admin interface features
4. **Add Reporting**: Create detailed reports for admin actions
5. **Performance Optimization**: Add indexes and optimize queries

---

**Need Help?** Check the troubleshooting section or review the database functions for detailed error messages.
