# Business Entity Management Strategy

## Overview

This document outlines the application-level strategy for managing business entities (suppliers and customers) in a multi-tenant environment. The approach focuses on preventing duplicates through intelligent search, auto-complete functionality, and standardized data entry while maintaining data integrity and user experience.

## Architecture Principles

### 1. API-Driven Search
- **Primary**: Internal database search (existing business entities)
- **Secondary**: External APIs via `/api/v1/companies/search` (3.3M+ European companies)
  - Belgian companies: `country=BE` (1.8M+ companies from KBO registry)
  - PEPPOL companies: `country=PEPPOL` (1.4M+ companies with e-invoicing)
- **Fallback**: Manual entry with validation
- **Data Coverage**: 3.3M+ European companies with real-time updates

### 2. User-Centric Design
- Real-time auto-complete with debouncing
- Multi-select for bulk operations
- Standardized input formatting
- Similar entity detection and suggestions

### 3. Data Quality Assurance
- Pre-creation validation
- Standardized formats (phone, email, tax_id)
- Regular duplicate cleanup processes
- Bulk import validation

## Implementation Strategy

## 1. API Endpoints

### Internal Search API
```typescript
// Search internal business entities
GET /api/business-entities/search?q={query}&limit=10&country={country}&offset={offset}

// Get business entity details
GET /api/business-entities/{id}

// Create new business entity (manual entry)
POST /api/business-entities

// Bulk import business entities
POST /api/business-entities/bulk-import

// Check for similar entities
POST /api/business-entities/validate
```

### External Search API
```typescript
// Search external companies (Belgian registry, PEPPOL, etc.)
GET /api/v1/companies/search?q={query}&country={country}&limit={limit}&offset={offset}

// Parameters:
// - q: company name or activity (required)
// - country: BE (Belgium), PEPPOL, etc. (optional)
// - limit: 1-100 results (default: 20)
// - offset: pagination offset (default: 0)
```

### Authentication
```bash
Authorization: Bearer CLIENT_ID:CLIENT_SECRET
```

### Internal Search Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | ✅ | Search query (company name or activity) |
| `country` | string | ❌ | Country filter (`internal`) |
| `limit` | integer | ❌ | Results limit (1-100, default: 20) |
| `offset` | integer | ❌ | Pagination offset (default: 0) |

### External Search Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | ✅ | Search query (company name or activity) |
| `country` | string | ❌ | Country filter (`BE`, `PEPPOL`) |
| `limit` | integer | ❌ | Results limit (1-100, default: 20) |
| `offset` | integer | ❌ | Pagination offset (default: 0) |

### Response Format
```json
{
  "entities": [
    {
      "id": "uuid",
      "unified_id": "BE:KBO:0893.707.025",
      "name": "ACME Corporation",
      "company_name": "ACME Corp",
      "email": "contact@acme.com",
      "tax_id": "123.456.789",
      "phone": "(555) 123-4567",
      "industry": "Technology",
      "source_country": "BE",
      "source_system": "KBO",
      "source_id": "0893.707.025",
      "legal_form": "",
      "status": "ACTIVE",
      "address_line1": "123 Main St",
      "postal_code": "10001",
      "city": "New York",
      "country": "United States",
      "country_code": "US",
      "primary_activity_code": "47110",
      "activity_description": {
        "NL": "Niet-gespecialiseerde detailhandel",
        "FR": "Commerce de détail non spécialisé",
        "DE": null,
        "EN": "Non-specialized retail trade"
      },
      "registration_date": "2020-01-01",
      "peppol_enabled": true,
      "match_score": 0.95,
      "source": "internal|peppol|external",
      "processed_at": "2025-08-15T10:30:00.000Z"
    }
  ],
  "total_count": 10,
  "query_time_ms": 4677.0,
  "data_source": "http_api|cache",
  "cache_hit": false,
  "page": 1,
  "per_page": 20
}
```

### Error Responses
| Status | Error | Description |
|--------|-------|-------------|
| 401 | `Missing Authorization header` | No auth header provided |
| 401 | `Invalid client credentials` | Wrong CLIENT_ID or CLIENT_SECRET |
| 400 | `Validation error` | Invalid parameters |
| 429 | `Rate limit exceeded` | Too many requests |
| 500 | `Search failed` | Server error |

### Rate Limiting
| Endpoint | Rate Limit | Description |
|----------|------------|-------------|
| `/api/business-entities/search` | 100/minute | Internal business entity search |
| `/api/business-entities/{id}` | 200/minute | Individual entity lookups |
| `/api/business-entities/validate` | 60/minute | Similarity validation requests |
| `/api/v1/companies/search` | 100/minute | External companies search |
| `/api/v1/companies/{id}` | 200/minute | External company lookups |

## 2. Application Components

### A. Auto-Complete Search Component

```typescript
// Real-time search with debouncing
const BusinessEntitySearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchStep, setSearchStep] = useState<'internal' | 'external'>('internal');

  const searchEntities = useDebouncedCallback(async (searchTerm) => {
    if (searchTerm.length < 2) return;
    
    setLoading(true);
    
    try {
      // Step 1: Search internal database first
      const internalResponse = await fetch(`/api/business-entities/search?q=${searchTerm}&limit=20`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer YOUR_CLIENT_ID:YOUR_CLIENT_SECRET'
        }
      });
      
      if (internalResponse.ok) {
        const internalData = await internalResponse.json();
        setResults(internalData.entities);
        setSearchStep('internal');
      }
      
      // Step 2: If no results or user wants more, search external APIs
      if (internalData.entities.length === 0 || searchTerm.length > 3) {
        const externalResponse = await fetch(`/api/v1/companies/search?q=${searchTerm}&country=BE&limit=20`, {
          headers: {
            'Accept': 'application/json',
            'Authorization': 'Bearer YOUR_CLIENT_ID:YOUR_CLIENT_SECRET'
          }
        });
        
        if (externalResponse.ok) {
          const externalData = await externalResponse.json();
          setResults(prev => [...prev, ...externalData.companies]);
          setSearchStep('external');
        }
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }, 300);

  return (
    <Autocomplete
      options={results}
      getOptionLabel={(option) => option.name || option.company_name}
      renderOption={(option) => (
        <div>
          <strong>{option.name || option.company_name}</strong>
          <br />
          <small>
            {option.source_system || option.source_country} • {option.tax_id || option.source_id} • {option.city}
            {option.peppol_enabled && <span className="peppol-badge">PEPPOL</span>}
          </small>
        </div>
      )}
      onChange={(event, value) => handleSelection(value)}
    />
  );
};
```

### B. Multi-Select for Bulk Operations

```typescript
// Allow selecting multiple entities for bulk relationship creation
const BulkEntitySelector = () => {
  const [selectedEntities, setSelectedEntities] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCountry, setSearchCountry] = useState('BE');
  
  const handleBulkAdd = async (relationshipType: 'supplier' | 'customer') => {
    await Promise.all(
      selectedEntities.map(entity => 
        createRelationship(entity.id, relationshipType)
      )
    );
  };

  const loadExternalCompanies = async (query: string, page: number = 1) => {
    const response = await fetch(`/api/v1/companies/search?q=${query}&country=${searchCountry}&limit=20&offset=${(page - 1) * 20}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer YOUR_CLIENT_ID:YOUR_CLIENT_SECRET'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      setTotalPages(Math.ceil(data.total_count / 20));
      return data.companies;
    }
    return [];
  };

  return (
    <div>
      <EntitySearch onSelect={addToSelection} />
      <SelectedEntitiesList entities={selectedEntities} />
      
      {/* External Companies Data Table */}
      <DataTable
        data={externalCompanies}
        columns={[
          { key: 'company_name', label: 'Company Name' },
          { key: 'source_id', label: 'Tax ID' },
          { key: 'city', label: 'City' },
          { key: 'status', label: 'Status' },
          { key: 'actions', label: 'Actions' }
        ]}
        pagination={{
          currentPage,
          totalPages,
          onPageChange: setCurrentPage
        }}
      />
      
      <Button onClick={() => handleBulkAdd('supplier')}>
        Add as Suppliers
      </Button>
      <Button onClick={() => handleBulkAdd('customer')}>
        Add as Customers
      </Button>
    </div>
  );
};
```

## 3. Manual Entry with Validation

### A. Standardized Input Forms

```typescript
// Form with real-time validation and formatting
const ManualEntityForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    tax_id: '',
    business_name: '',
    industry: '',
    billing_address: {
      street: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'US'
    }
  });

  // Real-time formatting
  const formatPhone = (value: string) => {
    return value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  };

  const formatTaxId = (value: string) => {
    return value.replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3');
  };

  // Validation before submission
  const validateAndSubmit = async () => {
    // Check for similar entities
    const similar = await checkSimilarEntities(formData);
    
    if (similar.length > 0) {
      showSimilarEntitiesModal(similar);
      return;
    }

    await createBusinessEntity(formData);
  };
};
```

### B. Similar Entities Detection

```typescript
// Show similar entities before creation
const SimilarEntitiesModal = ({ entities, onSelect, onContinue }) => {
  return (
    <Modal>
      <h3>Similar entities found:</h3>
      {entities.map(entity => (
        <div key={entity.id}>
          <strong>{entity.name}</strong>
          <small>Similarity: {entity.similarity_score}</small>
          <Button onClick={() => onSelect(entity)}>
            Use Existing
          </Button>
        </div>
      ))}
      <Button onClick={onContinue}>
        Create New Anyway
      </Button>
    </Modal>
  );
};
```

## 4. CSV Bulk Import with Validation

### A. CSV Upload with Preview

```typescript
const BulkImportComponent = () => {
  const [csvData, setCsvData] = useState([]);
  const [validationResults, setValidationResults] = useState([]);

  const handleFileUpload = async (file) => {
    const data = await parseCSV(file);
    const validated = await validateBulkData(data);
    
    setCsvData(data);
    setValidationResults(validated);
  };

  const processBulkImport = async () => {
    const results = await Promise.allSettled(
      csvData.map(async (row) => {
        // Check for existing entities first
        const existing = await findSimilarEntity(row);
        if (existing) {
          return { status: 'existing', entity: existing, row };
        }
        
        // Create new entity
        const newEntity = await createBusinessEntity(row);
        return { status: 'created', entity: newEntity, row };
      })
    );

    showImportResults(results);
  };
};
```

### B. CSV Validation Rules

```typescript
const validateCSVRow = (row) => {
  const errors = [];

  // Required fields
  if (!row.name?.trim()) {
    errors.push('Name is required');
  }

  // Email format
  if (row.email && !isValidEmail(row.email)) {
    errors.push('Invalid email format');
  }

  // Phone format
  if (row.phone && !isValidPhone(row.phone)) {
    errors.push('Invalid phone format');
  }

  // Tax ID format (country-specific)
  if (row.tax_id && !isValidTaxId(row.tax_id, row.country)) {
    errors.push('Invalid tax ID format');
  }

  return errors;
};
```

## 5. Database-Level Optimizations (Read-Only)

### A. Search Function

```sql
-- Enhanced search function for API with external data integration
CREATE OR REPLACE FUNCTION search_business_entities_api(
    p_search_term VARCHAR,
    p_country VARCHAR DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
    id UUID,
    unified_id VARCHAR,
    name VARCHAR,
    company_name VARCHAR,
    email VARCHAR,
    tax_id VARCHAR,
    phone VARCHAR,
    industry VARCHAR,
    source_country VARCHAR,
    source_system VARCHAR,
    source_id VARCHAR,
    legal_form VARCHAR,
    status VARCHAR,
    address_line1 TEXT,
    postal_code VARCHAR,
    city VARCHAR,
    country VARCHAR,
    country_code VARCHAR,
    primary_activity_code VARCHAR,
    activity_description JSONB,
    registration_date DATE,
    peppol_enabled BOOLEAN,
    match_score REAL,
    source VARCHAR,
    processed_at TIMESTAMPTZ
) AS $$
BEGIN
    -- Search internal business entities
    RETURN QUERY
    SELECT 
        be.id,
        be.id::VARCHAR as unified_id,
        be.name,
        be.business_name as company_name,
        be.email,
        be.tax_id,
        be.phone,
        be.industry,
        'INTERNAL' as source_country,
        'INTERNAL' as source_system,
        be.id::VARCHAR as source_id,
        '' as legal_form,
        'ACTIVE' as status,
        be.billing_street_address as address_line1,
        be.billing_postal_code as postal_code,
        be.billing_city as city,
        be.billing_country as country,
        be.billing_country as country_code,
        '' as primary_activity_code,
        '{}'::jsonb as activity_description,
        NULL::DATE as registration_date,
        CASE WHEN be.peppol_scheme IS NOT NULL THEN true ELSE false END as peppol_enabled,
        GREATEST(
            similarity(LOWER(be.name), LOWER(p_search_term)),
            CASE 
                WHEN be.email IS NOT NULL 
                THEN similarity(LOWER(be.email), LOWER(p_search_term))
                ELSE 0.0
            END,
            CASE 
                WHEN be.tax_id IS NOT NULL 
                THEN similarity(LOWER(be.tax_id), LOWER(p_search_term))
                ELSE 0.0
            END
        ) as match_score,
        'internal' as source,
        be.updated_at as processed_at
    FROM business_entities be
    WHERE 
        (p_country IS NULL OR p_country = 'internal') AND
        (be.name ILIKE '%' || p_search_term || '%' OR
         be.email ILIKE '%' || p_search_term || '%' OR
         be.tax_id ILIKE '%' || p_search_term || '%' OR
         be.business_name ILIKE '%' || p_search_term || '%')
    ORDER BY match_score DESC, be.name
    LIMIT p_limit OFFSET p_offset;
    
    -- Note: External API calls (PEPPOL, Belgian registry) would be handled
    -- by the application layer, not in this database function
END;
$$ LANGUAGE plpgsql;
```

### B. Optimized Indexes

```sql
-- Full-text search indexes
CREATE INDEX idx_business_entities_search 
ON business_entities 
USING gin(to_tsvector('english', name || ' ' || COALESCE(business_name, '') || ' ' || COALESCE(email, '') || ' ' || COALESCE(tax_id, '')));

-- Trigram indexes for fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_business_entities_name_trgm 
ON business_entities USING gin(name gin_trgm_ops);
CREATE INDEX idx_business_entities_email_trgm 
ON business_entities USING gin(email gin_trgm_ops);
CREATE INDEX idx_business_entities_tax_id_trgm 
ON business_entities USING gin(tax_id gin_trgm_ops);
```

## 6. Application-Level Cleanup Processes

### A. Scheduled Duplicate Detection

```sql
-- Function to find potential duplicates
CREATE OR REPLACE FUNCTION find_potential_duplicates()
RETURNS TABLE (
    entity1_id UUID,
    entity1_name VARCHAR,
    entity2_id UUID,
    entity2_name VARCHAR,
    similarity_score REAL,
    reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        be1.id as entity1_id,
        be1.name as entity1_name,
        be2.id as entity2_id,
        be2.name as entity2_name,
        similarity(LOWER(be1.name), LOWER(be2.name)) as similarity_score,
        'Name similarity' as reason
    FROM business_entities be1
    JOIN business_entities be2 ON be1.id < be2.id
    WHERE similarity(LOWER(be1.name), LOWER(be2.name)) > 0.8
    UNION
    SELECT 
        be1.id,
        be1.name,
        be2.id,
        be2.name,
        1.0 as similarity_score,
        'Same email' as reason
    FROM business_entities be1
    JOIN business_entities be2 ON be1.id < be2.id
    WHERE be1.email IS NOT NULL 
    AND be1.email = be2.email
    AND be1.email != '';
END;
$$ LANGUAGE plpgsql;
```

### B. Application-Level Cleanup Dashboard

```typescript
// Admin dashboard for managing duplicates
const DuplicateManagementDashboard = () => {
  const [duplicates, setDuplicates] = useState([]);

  const loadDuplicates = async () => {
    const response = await fetch('/api/admin/duplicates');
    setDuplicates(await response.json());
  };

  const mergeDuplicates = async (primaryId, duplicateId) => {
    await fetch('/api/admin/merge-entities', {
      method: 'POST',
      body: JSON.stringify({ primaryId, duplicateId })
    });
    loadDuplicates();
  };

  return (
    <div>
      <h2>Potential Duplicates</h2>
      {duplicates.map(duplicate => (
        <DuplicateItem 
          key={duplicate.id}
          duplicate={duplicate}
          onMerge={mergeDuplicates}
        />
      ))}
    </div>
  );
};
```

## 7. Data Standardization

### A. Input Formatting

```typescript
// Standardized formatting functions
export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

export const formatTaxId = (taxId: string, country: string = 'US'): string => {
  const cleaned = taxId.replace(/\D/g, '');
  if (country === 'US' && cleaned.length === 9) {
    return `${cleaned.slice(0,3)}.${cleaned.slice(3,6)}.${cleaned.slice(6)}`;
  }
  return taxId;
};

export const formatEmail = (email: string): string => {
  return email.toLowerCase().trim();
};
```

### B. Validation Rules

```typescript
// Validation functions
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
};

export const isValidTaxId = (taxId: string, country: string = 'US'): boolean => {
  const cleaned = taxId.replace(/\D/g, '');
  if (country === 'US') {
    return cleaned.length === 9;
  }
  // Add other country validations as needed
  return true;
};
```

## 8. Implementation Phases

### Phase 1: Core Search & Auto-Complete
- [ ] Implement internal search API with authentication
- [ ] Create auto-complete component with rate limiting
- [ ] Add basic validation and error handling
- [ ] Set up database indexes and caching (300s TTL)
- [ ] Integrate with external API `/api/v1/companies/search`
- [ ] Implement two-step search (internal first, then external)
- [ ] Implement application-level business entity creation

### Phase 2: Manual Entry & Validation
- [ ] Create manual entry form with application-level validation
- [ ] Implement similar entity detection using database search functions
- [ ] Add real-time formatting
- [ ] Create application-level validation rules

### Phase 3: Bulk Operations
- [ ] Implement multi-select functionality
- [ ] Create bulk import component
- [ ] Add CSV validation
- [ ] Create import results dashboard
- [ ] Implement paginated data table for external companies
- [ ] Add country filter (BE, PEPPOL) for external search

### Phase 4: Cleanup & Maintenance
- [ ] Implement application-level duplicate detection
- [ ] Create admin cleanup dashboard
- [ ] Set up scheduled cleanup jobs
- [ ] Add application-level audit trails

### Phase 5: Optimization
- [ ] Performance optimization and caching strategies
- [ ] Advanced search features (fuzzy matching, filters)
- [ ] Enhanced external API integration
- [ ] User experience improvements and monitoring
- [ ] Rate limit optimization and usage analytics

## 9. Benefits

✅ **User-friendly**: Auto-complete and search
✅ **Data quality**: Standardized formats and validation
✅ **Efficiency**: Bulk operations and imports
✅ **Flexibility**: Manual entry when needed
✅ **Maintainability**: Centralized business logic
✅ **Performance**: Optimized search and indexing
✅ **Scalability**: API-driven architecture

## 10. Success Metrics

- **Duplicate Prevention**: < 1% duplicate creation rate
- **Search Performance**: < 5s response time (including external API calls)
- **User Satisfaction**: > 90% positive feedback
- **Data Quality**: > 95% standardized data
- **Import Success Rate**: > 98% successful imports
- **API Coverage**: 3.3M+ European companies accessible
- **Cache Hit Rate**: > 80% for repeated searches
- **Rate Limit Compliance**: < 1% rate limit violations

## 11. Risk Mitigation

- **Data Loss**: Regular backups and validation
- **Performance**: Monitoring and optimization with 300s cache TTL
- **User Errors**: Comprehensive validation and feedback
- **System Failures**: Graceful degradation and fallbacks
- **Security**: Proper authentication and authorization with rate limiting
- **API Dependencies**: Fallback to internal search when external APIs fail
- **Rate Limiting**: 100/min search, 200/min lookup, 60/min validation limits
- **Data Freshness**: Daily updates from official sources with cache invalidation

This strategy ensures a robust, user-friendly, and maintainable business entity management system that prevents duplicates while providing excellent user experience.
