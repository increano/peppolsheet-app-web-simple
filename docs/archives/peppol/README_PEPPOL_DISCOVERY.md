# PEPPOL Discovery Implementation

This document describes the implementation of PEPPOL company discovery functionality for the invoice creation form.

## Overview

The PEPPOL discovery feature allows users to validate whether a company can receive electronic invoices via the PEPPOL network in real-time. This helps determine the optimal delivery method (PEPPOL network vs email) before creating and sending invoices.

## Features

- **Real-time Company Discovery**: Instant validation of PEPPOL capabilities
- **Multi-country Support**: Handles different identifier schemes per country
- **VAT Number Normalization**: Automatically formats VAT numbers for different countries
- **Visual Feedback**: Clear indicators for PEPPOL status and delivery method
- **Automatic Scheme Detection**: Maps countries to appropriate PEPPOL schemes
- **Error Handling**: Comprehensive error handling with user-friendly messages

## VAT Number Normalization

The system automatically normalizes VAT numbers to the correct format for each country:

### Belgian VAT Numbers
- **Input**: `be0400378485` or `BE0400378485`
- **Normalized**: `0400378485`
- **Scheme**: `BE:EN`
- **Format**: 10 digits starting with 0 or 1

### Dutch VAT Numbers
- **Input**: `123456789` or `NL123456789B01`
- **Normalized**: `NL123456789B01`
- **Scheme**: `NL:VAT`
- **Format**: NL + 9 digits + B + 2 digits

### German VAT Numbers
- **Input**: `DE123456789` or `123456789`
- **Normalized**: `123456789`
- **Scheme**: `DE:VAT`
- **Format**: 9 digits (without DE prefix)

### Other Countries
Similar normalization applies for France, Italy, Spain, Austria, Denmark, Sweden, Norway, and Finland.

## API Endpoints

### 1. PEPPOL Discovery API
```
POST /api/peppol/discover
```

**Request Body:**
```json
{
  "identifier": "be0400378485",
  "country": "BE",
  "scheme": "BE:EN" // Optional, auto-detected from country
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "identifier": "0400378485",
    "originalIdentifier": "be0400378485",
    "scheme": "BE:EN",
    "canReceiveInvoices": true,
    "isEmailDelivery": false,
    "discoveryCode": "OK",
    "message": "✅ Company can receive e-invoices via PEPPOL",
    "recommendation": "This company is PEPPOL-enabled and can receive electronic invoices.",
    "deliveryMethod": "peppol"
  }
}
```

### 2. Test Endpoint
```
GET /api/peppol/discover/test
```

Returns test results for multiple country scenarios.

## Supported Countries and Schemes

| Country | Scheme | Input Format | Normalized Format | Example |
|---------|---------|--------------|------------------|---------|
| Belgium | BE:EN | BE + 10 digits | 10 digits starting with 0 or 1 | be0400378485 → 0400378485 |
| Germany | DE:VAT | DE + 9 digits | 9 digits | DE123456789 → 123456789 |
| Netherlands | NL:VAT | NL + 9 digits + B + 2 digits | Full format | 123456789 → NL123456789B01 |
| France | FR:SIRENE | FR + 11 digits | 11 digits | FR12345678901 → 12345678901 |
| Italy | IT:VAT | IT + 11 digits | 11 digits | IT12345678901 → 12345678901 |
| Spain | ES:VAT | ES + 9 characters | 9 characters | ES12345678A → 12345678A |
| Austria | AT:VAT | AT + 9 digits | 9 digits | AT123456789 → 123456789 |
| Denmark | DK:CVR | DK + 8 digits | 8 digits | DK12345678 → 12345678 |
| Sweden | SE:ORGNR | SE + 10 digits | 10 digits | SE1234567890 → 1234567890 |
| Norway | NO:ORGNR | NO + 9 digits | 9 digits | NO123456789 → 123456789 |
| Finland | FI:OVT | FI + 8 digits | 8 digits | FI12345678 → 12345678 |

## Components

### 1. PeppolDiscovery Component
```typescript
<PeppolDiscovery
  onCompanyDiscovered={handlePeppolDiscovery}
  initialIdentifier={formData.customer.vatNumber}
  initialCountry={formData.customer.country}
/>
```

**Features:**
- Real-time input validation
- Visual status indicators
- Automatic discovery triggers
- Clear/reset functionality
- Loading states
- Shows original and normalized identifiers

### 2. usePeppolDiscovery Hook
```typescript
const { 
  isLoading, 
  result, 
  error, 
  discoverCompany, 
  clearResult 
} = usePeppolDiscovery()
```

**Methods:**
- `discoverCompany(identifier, country, scheme)` - Discover company capabilities
- `clearResult()` - Clear current discovery results

## Integration with Invoice Form

The PEPPOL discovery is integrated into the manual invoice creation form:

1. **VAT Number Input**: Enhanced with discovery capabilities
2. **Real-time Validation**: Triggered when VAT number and country are provided
3. **Status Display**: Shows PEPPOL capability and delivery method
4. **Form State**: Updates form data with discovery results
5. **Normalization Display**: Shows both original and normalized identifiers

## Discovery Status Indicators

- **✅ PEPPOL Ready**: Company can receive e-invoices via PEPPOL
- **❌ Email Fallback**: Company not PEPPOL-enabled, will use email
- **🔄 Searching**: Discovery in progress
- **⚠️ Error**: Discovery failed

## Error Handling

The system handles various error scenarios:

1. **Invalid Identifier Format**: Validates against country-specific regex patterns
2. **API Errors**: Graceful handling of Storecove API failures
3. **Network Issues**: Timeout and connection error handling
4. **Authentication**: Proper error messaging for API key issues
5. **VAT Format Errors**: Automatic normalization handles common formatting issues

## Testing

### Manual Testing
1. Navigate to dashboard invoice form
2. Enter VAT number and select country
3. Watch real-time discovery results
4. Verify status indicators and recommendations

### Common Test Cases
```bash
# Belgian VAT (with prefix)
curl -X POST "http://localhost:3000/api/peppol/discover" \
  -H "Content-Type: application/json" \
  -d '{"identifier": "be0400378485", "country": "BE"}'

# Dutch VAT (without prefix/suffix)
curl -X POST "http://localhost:3000/api/peppol/discover" \
  -H "Content-Type: application/json" \
  -d '{"identifier": "123456789", "country": "NL"}'

# German VAT (with prefix)
curl -X POST "http://localhost:3000/api/peppol/discover" \
  -H "Content-Type: application/json" \
  -d '{"identifier": "DE123456789", "country": "DE"}'
```

### Automated Testing
```bash
curl -X GET "http://localhost:3000/api/peppol/discover/test"
```

### Test Results
- ✅ German VAT: DE123456789 → PEPPOL-enabled
- ✅ Dutch VAT: NL123456789B01 → PEPPOL-enabled
- ✅ Belgian VAT: 1025035226 → Email fallback (valid format)

## Performance

- **Response Time**: < 1 second for discovery requests
- **Caching**: Results cached during form session
- **Debouncing**: Input changes debounced to prevent excessive API calls
- **Normalization**: Client-side normalization reduces API errors

## Security

- **API Key Protection**: Storecove API key secured in environment variables
- **Rate Limiting**: Implemented to prevent abuse
- **Input Validation**: All inputs validated and normalized before processing
- **Data Sanitization**: VAT numbers sanitized to prevent injection attacks

## Recent Fixes

### Issue: Belgian VAT Number Format Error
- **Problem**: `be0400378485` was failing with "invalid identifier" error
- **Cause**: Belgian BE:EN scheme expects 10 digits starting with 0 or 1, without BE prefix
- **Solution**: Added comprehensive VAT number normalization
- **Result**: All common VAT formats now work correctly

### VAT Number Normalization
- Removes country prefixes automatically
- Handles spaces, hyphens, and dots
- Adds missing suffixes (e.g., B01 for Dutch VAT)
- Maintains original input for user reference

## Future Enhancements

1. **Caching**: Implement Redis caching for frequent lookups
2. **Batch Discovery**: Support for multiple company discovery
3. **Historical Data**: Track discovery results for analytics
4. **Extended Schemes**: Support for additional PEPPOL schemes
5. **Company Details**: Fetch additional company information
6. **Smart Suggestions**: Suggest corrections for invalid formats

## Configuration

Add to `.env.local`:
```
STORECOVE_API_KEY=your_storecove_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Dependencies

- `@supabase/supabase-js` - Database and authentication
- `lucide-react` - Icons for UI components
- `next` - API routes and server-side functionality

## Support

For issues or questions about the PEPPOL discovery implementation:
1. Check the test endpoint results
2. Verify API key configuration
3. Review Storecove API documentation
4. Check console logs for detailed error messages
5. Test with normalized VAT format if issues persist 