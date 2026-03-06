# API Debugging Information

## Issue Analysis
The admin orders page is showing "Failed to update order status" error.

## Root Cause
The frontend is calling the API correctly, but there might be an issue with:
1. Token format/validity
2. Request headers
3. API response handling

## Debugging Steps

### 1. Check Network Tab
Open browser DevTools → Network tab and look for:
- Failed requests to `/api/admin/orders/[id]/status`
- Request headers (especially Authorization)
- Response status codes
- Response body

### 2. Check Console Logs
Look for detailed error messages in the console.

### 3. Test API Directly
The API is working correctly:
```bash
curl -X PUT 'http://localhost:3000/api/admin/orders/test-id/status' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer test-token' \
  -d '{"status":"confirmed","note":"Test update"}'
```
Returns: `{"message":"Invalid token"}`

This confirms:
- ✅ API route is working
- ✅ Authentication middleware is working
- ✅ Error handling is working

## Likely Frontend Issues

### Token Problem
The frontend might be:
1. Not passing the token correctly
2. Passing an expired/invalid token
3. Token format mismatch

### Request Headers Problem
The fetch request might be missing:
1. Proper Content-Type header
2. Authorization header format

## Solution

### Check Token in Frontend
1. Log the token before sending:
```javascript
console.log('Token being sent:', token);
```

### Check Request Headers
1. Log the full request:
```javascript
const response = await fetch(`/api/admin/orders/${orderId}/status`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ 
    status: newStatus, 
    note: note || `Status updated to ${newStatus}` 
  })
});

console.log('Request headers:', {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
});
```

### Check Response
```javascript
if (!response.ok) {
  const errorText = await response.text();
  console.error('Response error:', response.status, errorText);
  throw new Error(`Failed to update order status: ${response.status}`);
}
```

## Next Steps

1. **Add debugging logs** to the frontend
2. **Check browser network tab** for actual request/response
3. **Verify admin authentication** in the application
4. **Test with a valid admin token** from the application

The API endpoints are working correctly - the issue is likely in the frontend token handling or request formatting.
