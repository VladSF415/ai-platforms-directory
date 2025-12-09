# Analytics Authentication Setup

The analytics dashboard is protected with **password + SMS verification** for security.

## 🔐 Authentication Flow

1. User enters password + phone number
2. Server validates credentials
3. SMS code sent via Twilio (6-digit code, valid 10 minutes)
4. User enters code
5. Server issues JWT token (valid 24 hours)
6. User accesses analytics dashboard

## ⚙️ Environment Variables

Add these to your Railway environment variables:

```env
# Password for analytics access
ANALYTICS_PASSWORD=your-secure-password-here

# Your authorized phone number (include country code)
ANALYTICS_PHONE=+1234567890

# JWT secret (generate a random string)
JWT_SECRET=randomly-generated-secret-key-min-32-chars

# Twilio credentials (get from https://www.twilio.com/console)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

## 📱 Twilio Setup

1. **Create Twilio Account**: https://www.twilio.com/try-twilio
2. **Get free phone number**: Console → Phone Numbers → Buy a Number
3. **Get credentials**:
   - Account SID: Found on Console Dashboard
   - Auth Token: Found on Console Dashboard
   - Phone Number: Your Twilio number (format: +1234567890)

**Note**: Twilio gives $15 free trial credit. SMS costs ~$0.0075 per message.

## 🚀 Usage

1. Visit: `https://aiplatformslist.com/analytics-login.html`
2. Enter your password and phone number
3. Click "SEND SMS CODE"
4. Check your phone for 6-digit code
5. Enter code and click "VERIFY & LOGIN"
6. You'll be redirected to analytics dashboard
7. Token valid for 24 hours

## 🔒 Security Features

- ✅ Password required
- ✅ Phone number must match authorized number
- ✅ SMS code expires in 10 minutes
- ✅ Code is single-use (deleted after verification)
- ✅ JWT token expires in 24 hours
- ✅ Analytics API endpoint requires valid token
- ✅ Auto-redirect to login if not authenticated

## 🛠️ Development Mode

If Twilio credentials are not set, the SMS code will be **logged to console** instead of sent via SMS. Check Railway logs to see the code.

## 🔑 Default Values (Change in Production!)

```env
ANALYTICS_PASSWORD=admin123
ANALYTICS_PHONE=+1234567890
JWT_SECRET=change-this-secret-key-in-production
```

**⚠️ WARNING**: Change these default values in production for security!

## 📊 Access URLs

- **Login**: https://aiplatformslist.com/analytics-login.html
- **Dashboard**: https://aiplatformslist.com/analytics.html (requires auth)
- **API**: https://aiplatformslist.com/api/chat/analytics (requires auth)
