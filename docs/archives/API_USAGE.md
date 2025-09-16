# PeppolSheet API Usage

## Company Search Endpoint

**Base URL**: `https://api.peppolsheet.com`  
**Endpoint**: `GET /api/v1/companies/search`

## Authentication

```bash
Authorization: Bearer CLIENT_ID:CLIENT_SECRET
```

✅ **Production Status**: API is fully operational and production-ready with comprehensive security implementation.

**🔒 Security Implementation (August 2025)**:
- ✅ **Row Level Security (RLS)**: Enabled on all company tables with read-only policies
- ✅ **Rate Limiting**: Implemented per-endpoint limits (100/min search, 200/min lookup, 60/min health)
- ✅ **Public Views**: Created `public.belgium_companies` and `public.peppol_companies` for secure REST API access
- ✅ **Authentication**: Enhanced API key validation with structured error handling
- ✅ **DoS Protection**: Rate limiting prevents abuse and ensures fair usage

**🚀 Performance & Reliability**: 
- ✅ **Serverless Compatible**: HTTP client with fresh connections per request (no event loop issues)
- ✅ **Lazy Initialization**: Database connections initialize on first request
- ✅ **Production Tested**: Successfully returning company data (e.g., "colruyt" → 18 matches)
- ✅ **Response Times**: ~4.6s first request (cold start), <1s subsequent requests
- ✅ **Intelligent Caching**: 300s TTL with cache hit/miss tracking

**🎯 Latest Fixes (August 15, 2025)**:
- ✅ **Event Loop Fix**: Resolved "Event loop is closed" error in Vercel serverless functions
- ✅ **HTTP Client**: Fresh `httpx.AsyncClient` created per request with proper async cleanup
- ✅ **Production Validation**: Search endpoint tested and confirmed working with real data
- ✅ **Environment Variables**: `SUPABASE_ANON_KEY` properly configured in production

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | ✅ | Search query (company name or activity) |
| `country` | string | ❌ | Country filter (`BE`, `PEPPOL`) |
| `limit` | integer | ❌ | Results limit (1-100, default: 20) |
| `offset` | integer | ❌ | Pagination offset (default: 0) |
| `city` | string | ❌ | City filter |
| `activity_code` | string | ❌ | NACE activity code filter |

## Example API Calls

### Basic Search
```bash
curl -X GET "https://api.peppolsheet.com/api/v1/companies/search?q=colruyt&country=BE&limit=10" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_CLIENT_ID:YOUR_CLIENT_SECRET"
```

### Python Example
```python
import requests

url = "https://api.peppolsheet.com/api/v1/companies/search"
headers = {
    "Accept": "application/json",
    "Authorization": "Bearer YOUR_CLIENT_ID:YOUR_CLIENT_SECRET"
}
params = {
    "q": "colruyt",
    "country": "BE",
    "limit": 10
}

response = requests.get(url, headers=headers, params=params)
print(response.json())
```

### JavaScript Example
```javascript
const response = await fetch('https://api.peppolsheet.com/api/v1/companies/search?q=colruyt&country=BE&limit=10', {
  headers: {
    'Accept': 'application/json',
    'Authorization': 'Bearer YOUR_CLIENT_ID:YOUR_CLIENT_SECRET'
  }
});
const data = await response.json();
console.log(data);
```

## Response Format

**Successful Search Response:**
```json
{
  "companies": [
    {
      "unified_id": "BE:KBO:0893.707.025",
      "company_name": "BTW-eenheid GROEP COLRUYT",
      "source_country": "BE",
      "source_system": "KBO",
      "source_id": "0893.707.025",
      "legal_form": "",
      "status": "ACTIVE",
      "address_line1": "Edingensesteenweg",
      "postal_code": "1500",
      "city": "Halle",
      "country": "Belgique",
      "country_code": "Belgique",
      "primary_activity_code": "47110",
      "activity_description": {
        "NL": "Niet-gespecialiseerde detailhandel waarbij voedings- en genotmiddelen overheersen",
        "FR": "Commerce de détail non spécialisé dans lequel les produits alimentaires et le tabac prédominent",
        "DE": null,
        "EN": null
      },
      "registration_date": null,
      "peppol_enabled": false,
      "processed_at": "2025-08-03T16:58:30.948+00:00"
    }
  ],
  "total_count": 18,
  "query_time_ms": 4677.0,
  "data_source": "http_api",
  "cache_hit": false,
  "page": 1,
  "per_page": 2
}
```

## Error Responses

| Status | Error | Description |
|--------|-------|-------------|
| 401 | `Missing Authorization header` | No auth header provided |
| 401 | `Invalid client credentials` | Wrong CLIENT_ID or CLIENT_SECRET |
| 400 | `Validation error` | Invalid parameters |
| 429 | `Rate limit exceeded` | Too many requests - see rate limits below |
| 500 | `Search failed` | Server error |

### Rate Limiting

| Endpoint | Rate Limit | Description |
|----------|------------|-------------|
| `/api/v1/companies/search` | 100/minute | Company search requests |
| `/api/v1/companies/{id}` | 200/minute | Individual company lookups |
| `/api/v1/health` | 60/minute | Health check requests |
| `/api/v1/stats` | 30/minute | System statistics |

**Rate Limit Headers**:
- `Retry-After: 60` - Seconds to wait before retrying
- HTTP 429 response includes structured error with retry information

## Security & Compliance

### Data Protection
- **Row Level Security (RLS)**: All company data protected with database-level access controls
- **Read-Only API**: Production API has read-only access to prevent data modification
- **Encrypted Transport**: All API communication over HTTPS/TLS
- **Access Logging**: Comprehensive logging of all API requests for audit trails

### Data Coverage
- **Belgium Companies**: 1,862,383 records from KBO (Belgian Business Registry)
- **PEPPOL Network**: 1,445,180 companies with electronic invoicing capabilities
- **Total Dataset**: 3.3M+ European companies with real-time updates

### API Limits
- **Query Results**: 1-100 companies per request (default: 20)
- **Response Time**: ~4.6s first request (serverless cold start), <1s subsequent requests
- **Data Source**: `http_api` (HTTP-based client) or `cache` (cached results)
- **Data Freshness**: Updated daily from official sources
- **Cache TTL**: 300 seconds (5 minutes) for optimal performance

## Production Verification

**✅ API Fully Tested & Working (August 15, 2025)**:

**Test Query**: `q=colruyt&country=BE&limit=2`  
**Results**: 2 companies returned from 18 total matches  
**Companies Found**:
- BTW-eenheid GROEP COLRUYT (BE:KBO:0893.707.025)
- COLRUYT CASH AND CARRY (BE:KBO:0716.663.318)

**Performance Metrics**:
- Query Time: 4.677 seconds (first request)
- Data Source: `http_api` (HTTP-based database client)
- Cache Status: `cache_hit: false` (fresh data)
- Total Dataset: 3.3M+ European companies accessible

## Other Endpoints

- `GET /api/v1/health` - Health check and system status
- `GET /api/v1/companies/{company_id}` - Get specific company details  
- `GET /api/v1/stats` - System performance statistics
- `GET /docs` - Interactive API documentation (Swagger/OpenAPI)
