# KarigarHai Backend - Complete API Documentation

**Base URL**: `http://localhost:3000/api/v1`
**Version**: v1

---

## Authentication API

### POST /auth/send-otp
Send OTP via WhatsApp to user's phone number.

**Request**:
```json
{
  "phone": "9876543210"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": { "message": "OTP sent successfully" }
}
```

**Errors**:
- 422: Invalid phone number
- 429: Rate limit exceeded (max 3 per 15 minutes)

---

### POST /auth/verify-otp
Verify OTP and login user.

**Request**:
```json
{
  "phone": "9876543210",
  "otp": "123456",
  "deviceId": "device-uuid",
  "deviceType": "ANDROID",
  "role": "KARIGAR"
}
```

**Response (201)**:
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": {
      "userId": "user-id",
      "phone": "9876543210",
      "role": "KARIGAR"
    }
  }
}
```

**Errors**:
- 401: Invalid or expired OTP
- 429: Too many failed attempts

---

### POST /auth/refresh
Refresh access token using refresh token.

**Request**:
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGc..."
  }
}
```

---

### POST /auth/logout
Logout user and revoke session.

**Headers**: `Authorization: Bearer {accessToken}`

**Response (200)**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### POST /auth/admin/login
Login as Admin using phone, password, deviceId and deviceType.

**Request**:
```json
{
  "phone": "9876543210",
  "password": "adminPassword",
  "deviceId": "device-uuid",
  "deviceType": "WEB"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Admin logged in successfully",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": {
      "userId": "admin-user-id",
      "phone": "9876543210",
      "role": "ADMIN"
    }
  }
}
```

**Errors**:
- 422: Validation failed
- 401: Invalid phone or password

---

### PATCH /auth/change-password
Change password for authenticated user.

**Headers**: `Authorization: Bearer {accessToken}`

**Request**:
```json
{
  "currentPassword": "oldPassword",
  "newPassword": "newPassword"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Errors**:
- 401: Unauthorized / Incorrect password
- 422: Validation failed

---

## User API

### GET /users/profile
Get authenticated user's profile.

**Headers**: `Authorization: Bearer {accessToken}`

**Response (200)**:
```json
{
  "success": true,
  "message": "Profile fetched",
  "data": {
    "id": "user-id",
    "phone": "9876543210",
    "role": "KARIGAR",
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001"
    },
    "karigarProfile": {
      "bio": "Experienced plumber",
      "trades": ["Plumbing"],
      "averageRating": 4.5,
      "totalReviews": 42
    }
  }
}
```

---

### PATCH /users/profile
Update user profile.

**Headers**: `Authorization: Bearer {accessToken}`

**Request**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "latitude": 19.0760,
  "longitude": 72.8777
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Profile updated",
  "data": { ... }
}
```

---

### GET /users/:userId/public
Get public profile of any user.

**Response (200)**:
```json
{
  "success": true,
  "message": "Profile fetched",
  "data": {
    "id": "user-id",
    "phone": "9876543210",
    "role": "KARIGAR",
    "profile": { ... },
    "karigarProfile": { ... },
    "reviews": [ ... ]
  }
}
```

---

### PATCH /users/karigar-profile
Update Karigar-specific profile.

**Headers**: `Authorization: Bearer {accessToken}`

**Request**:
```json
{
  "bio": "Experienced plumber with 10 years",
  "trades": ["Plumbing", "Electrical"],
  "hourlyRate": 500,
  "dailyRate": 3000,
  "bankAccountNumber": "1234567890",
  "ifscCode": "HDFC0000001",
  "bankName": "HDFC Bank",
  "accountHolderName": "John Doe"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Karigar profile updated",
  "data": { ... }
}
```

---

### PATCH /users/malik-profile
Update Malik-specific profile.

**Headers**: `Authorization: Bearer {accessToken}`

**Request**:
```json
{
  "businessName": "ABC Construction",
  "businessCategory": "Construction",
  "businessDescription": "Residential construction company",
  "companyRegistration": "REG123456",
  "gstNumber": "27AABCC1234F2Z0"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Malik profile updated",
  "data": { ... }
}
```

---

### POST /users/fcm-token
Update FCM token for push notifications.

**Headers**: `Authorization: Bearer {accessToken}`

**Request**:
```json
{
  "fcmToken": "firebase_token_here"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "FCM token updated",
  "data": { "fcmToken": "firebase_token_here" }
}
```

---

### GET /users/stats/mine
Get user statistics (earnings, hires, reviews).

**Headers**: `Authorization: Bearer {accessToken}`

**Response (200)**:
```json
{
  "success": true,
  "message": "Stats fetched",
  "data": {
    "userId": "user-id",
    "role": "KARIGAR",
    "totalJobs": 50,
    "totalHires": 48,
    "totalEarnings": 125000,
    "averageRating": 4.6,
    "totalReviews": 48
  }
}
```

---

## Jobs API

### POST /jobs
Create a new job (Malik only).

**Headers**: `Authorization: Bearer {accessToken}`

**Request**:
```json
{
  "title": "Plumbing Repair",
  "description": "Fix leaking kitchen tap and install new faucet",
  "category": "Plumbing",
  "trades": ["Plumbing"],
  "priceType": "FIXED",
  "fixedPrice": 2000,
  "latitude": 19.0760,
  "longitude": 72.8777,
  "locality": "Bandra",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400050",
  "requiredSkills": ["Repair", "Installation"],
  "imageUrls": ["https://..."],
  "workRadius": "5"
}
```

**Response (201)**:
```json
{
  "success": true,
  "message": "Job created",
  "data": {
    "id": "job-id",
    "title": "Plumbing Repair",
    "status": "OPEN",
    "createdAt": "2024-01-01T12:00:00Z"
  }
}
```

---

### GET /jobs/my-jobs
Get Malik's own jobs.

**Headers**: `Authorization: Bearer {accessToken}`

**Query**: `?page=1&limit=20&status=OPEN`

**Response (200)**:
```json
{
  "success": true,
  "message": "Jobs fetched",
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1
  }
}
```

---

### GET /jobs/:jobId
Get job details.

**Response (200)**:
```json
{
  "success": true,
  "message": "Job fetched",
  "data": {
    "id": "job-id",
    "title": "Plumbing Repair",
    "description": "...",
    "category": "Plumbing",
    "trades": ["Plumbing"],
    "fixedPrice": 2000,
    "status": "OPEN",
    "totalApplications": 5,
    "applications": [ ... ]
  }
}
```

---

### PATCH /jobs/:jobId
Update job (Malik only).

**Headers**: `Authorization: Bearer {accessToken}`

**Request**: Same as POST /jobs (partial)

**Response (200)**:
```json
{
  "success": true,
  "message": "Job updated",
  "data": { ... }
}
```

---

### DELETE /jobs/:jobId
Delete job (Malik only).

**Headers**: `Authorization: Bearer {accessToken}`

**Response (204)**: No content

---

### GET /jobs/feed
Get job feed with geolocation (Karigar only).

**Headers**: `Authorization: Bearer {accessToken}`

**Query**: `?lat=19.0760&lng=72.8777&trades=Plumbing,Electrical&radius=5&page=1&limit=20`

**Response (200)**:
```json
{
  "success": true,
  "message": "Job feed fetched",
  "data": [
    {
      "id": "job-id",
      "title": "Plumbing Repair",
      "fixedPrice": 2000,
      "distance": 2.5,
      "locality": "Bandra",
      "city": "Mumbai"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

### POST /jobs/:jobId/apply
Apply for a job (Karigar only).

**Headers**: `Authorization: Bearer {accessToken}`

**Request**:
```json
{
  "coverLetter": "I have 5 years of plumbing experience..."
}
```

**Response (201)**:
```json
{
  "success": true,
  "message": "Application submitted",
  "data": {
    "id": "application-id",
    "status": "APPLIED",
    "appliedAt": "2024-01-01T12:00:00Z"
  }
}
```

---

### GET /jobs/applications/my
Get Karigar's applications.

**Headers**: `Authorization: Bearer {accessToken}`

**Query**: `?page=1&limit=20`

**Response (200)**:
```json
{
  "success": true,
  "message": "Applications fetched",
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "totalPages": 1
  }
}
```

---

### POST /jobs/:jobId/:applicationId/shortlist
Shortlist application (Malik only).

**Headers**: `Authorization: Bearer {accessToken}`

**Response (200)**:
```json
{
  "success": true,
  "message": "Application shortlisted",
  "data": { ... }
}
```

---

### POST /jobs/:jobId/:applicationId/reject
Reject application (Malik only).

**Headers**: `Authorization: Bearer {accessToken}`

**Response (200)**:
```json
{
  "success": true,
  "message": "Application rejected",
  "data": { ... }
}
```

---

## Hires API

### POST /hires
Create hire (Malik hires Karigar from shortlisted application).

**Headers**: `Authorization: Bearer {accessToken}`

**Request**:
```json
{
  "jobId": "job-id",
  "applicationId": "application-id",
  "karigarId": "karigar-user-id",
  "agreedPrice": 2000
}
```

**Response (201)**:
```json
{
  "success": true,
  "message": "Hire created",
  "data": {
    "id": "hire-id",
    "jobId": "job-id",
    "malikId": "malik-id",
    "karigarId": "karigar-id",
    "hireStatus": "CONFIRMED",
    "agreedPrice": 2000,
    "createdAt": "2024-01-01T12:00:00Z"
  }
}
```

---

### GET /hires
Get hires list (paginated).

**Headers**: `Authorization: Bearer {accessToken}`

**Query**: `?page=1&limit=20&status=IN_PROGRESS`

**Response (200)**:
```json
{
  "success": true,
  "message": "Hires fetched",
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

---

### GET /hires/:hireId
Get hire details.

**Headers**: `Authorization: Bearer {accessToken}`

**Response (200)**:
```json
{
  "success": true,
  "message": "Hire fetched",
  "data": { ... }
}
```

---

### PATCH /hires/:hireId/status
Update hire status.

**Headers**: `Authorization: Bearer {accessToken}`

**Request**:
```json
{
  "status": "IN_PROGRESS"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Hire status updated",
  "data": { ... }
}
```

---

### POST /hires/:hireId/complete
Mark hire as completed.

**Headers**: `Authorization: Bearer {accessToken}`

**Request**:
```json
{
  "completionPhotoUrls": ["https://...", "https://..."]
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Hire marked completed",
  "data": { ... }
}
```

---

### POST /hires/:hireId/cancel
Cancel hire.

**Headers**: `Authorization: Bearer {accessToken}`

**Request**:
```json
{
  "reason": "Work not suitable"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Hire cancelled",
  "data": { ... }
}
```

---

### POST /hires/:hireId/location/update
Update live location during hire (also via Socket.io).

**Headers**: `Authorization: Bearer {accessToken}`

**Request**:
```json
{
  "lat": 19.0760,
  "lng": 72.8777
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Location updated",
  "data": {
    "lat": 19.0760,
    "lng": 72.8777,
    "updatedAt": "2024-01-01T12:00:00Z"
  }
}
```

---

## Payments API

### POST /payments/initiate
Initiate payment (Razorpay order creation).

**Headers**: `Authorization: Bearer {accessToken}`

**Request**:
```json
{
  "hireId": "hire-id"
}
```

**Response (201)**:
```json
{
  "success": true,
  "message": "Payment initiated",
  "data": {
    "razorpayOrderId": "order_123456",
    "amount": 2000,
    "currency": "INR"
  }
}
```

---

### POST /payments/webhook
Razorpay webhook handler (called by Razorpay, not by client).

**Headers**: `X-Razorpay-Signature: {signature}`

**Request Body**: Razorpay event data

---

### GET /payments/:hireId
Get payment status.

**Headers**: `Authorization: Bearer {accessToken}`

**Response (200)**:
```json
{
  "success": true,
  "message": "Payment status fetched",
  "data": {
    "id": "payment-id",
    "hireId": "hire-id",
    "grossAmount": 2000,
    "platformFee": 180,
    "karigarAmount": 1820,
    "paymentStatus": "ESCROW_DEPOSITED",
    "createdAt": "2024-01-01T12:00:00Z"
  }
}
```

---

### POST /payments/:hireId/release
Release payment from escrow to the Karigar after work completion.

**Headers**: `Authorization: Bearer {accessToken}`

**Response (200)**:
```json
{
  "success": true,
  "message": "Payment released from escrow successfully",
  "data": {
    "id": "payment-id",
    "hireId": "hire-id",
    "payerId": "payer-user-id",
    "payeeId": "payee-user-id",
    "amount": 24000,
    "paymentStatus": "RELEASED_TO_KARIGAR",
    "createdAt": "2024-01-01T12:00:00Z"
  }
}
```

**Errors**:
- 401: Unauthorized (Only payer/Malik can release)
- 404: Payment not found

---

### POST /payments/:hireId/dispute
Raise payment dispute (Malik).

**Headers**: `Authorization: Bearer {accessToken}`

**Request**:
```json
{
  "reason": "Work not completed as agreed"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Dispute raised",
  "data": { ... }
}
```

---

## KYC API

### POST /kyc/submit
Submit KYC documents and details.

**Headers**: `Authorization: Bearer {accessToken}`, `Content-Type: multipart/form-data`

**Request** (multipart):
```
Files:
- aadhaarFront: (file)
- aadhaarBack: (file)
- profilePhoto: (file)

Fields:
- aadhaarNumber: "123456789012"
- panNumber: "ABCDE1234F"
- bankName: "HDFC Bank"
- accountNumber: "1234567890"
- ifscCode: "HDFC0000001"
```

**Response (201)**:
```json
{
  "success": true,
  "message": "KYC submitted",
  "data": {
    "submissionId": "kyc-id",
    "status": "PENDING",
    "submittedAt": "2024-01-01T12:00:00Z"
  }
}
```

---

### GET /kyc/status
Get KYC submission status.

**Headers**: `Authorization: Bearer {accessToken}`

**Response (200)**:
```json
{
  "success": true,
  "message": "KYC status fetched",
  "data": {
    "status": "PENDING",
    "submittedAt": "2024-01-01T12:00:00Z",
    "approvedAt": null,
    "rejectedAt": null,
    "rejectionReason": null
  }
}
```

---

### GET /admin/kyc
List all KYC submissions (Admin only).

**Headers**: `Authorization: Bearer {accessToken}`

**Query**: `?page=1&limit=20&status=PENDING`

**Response (200)**:
```json
{
  "success": true,
  "message": "KYC submissions fetched",
  "data": [ ... ],
  "meta": { ... }
}
```

---

### PATCH /admin/kyc/:userId/approve
Approve KYC (Admin only).

**Headers**: `Authorization: Bearer {accessToken}`

**Response (200)**:
```json
{
  "success": true,
  "message": "KYC approved",
  "data": { ... }
}
```

---

### PATCH /admin/kyc/:userId/reject
Reject KYC (Admin only).

**Headers**: `Authorization: Bearer {accessToken}`

**Request**:
```json
{
  "reason": "Documents not clear"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "KYC rejected",
  "data": { ... }
}
```

---

## Chat API

### GET /chats
Get chat list.

**Headers**: `Authorization: Bearer {accessToken}`

**Query**: `?page=1&limit=20`

**Response (200)**:
```json
{
  "success": true,
  "message": "Chats fetched",
  "data": [
    {
      "id": "chat-id",
      "otherUserId": "user-id",
      "otherUserName": "John Doe",
      "lastMessage": "See you tomorrow",
      "lastMessageAt": "2024-01-01T18:00:00Z",
      "unreadCount": 2
    }
  ],
  "meta": { ... }
}
```

---

### POST /chats
Create or get existing chat.

**Headers**: `Authorization: Bearer {accessToken}`

**Request**:
```json
{
  "hireId": "hire-id",
  "otherUserId": "user-id"
}
```

**Response (201)**:
```json
{
  "success": true,
  "message": "Chat created",
  "data": {
    "id": "chat-id",
    "hireId": "hire-id",
    "user1Id": "user-id-1",
    "user2Id": "user-id-2",
    "createdAt": "2024-01-01T12:00:00Z"
  }
}
```

---

### GET /chats/:chatId/messages
Get chat messages.

**Headers**: `Authorization: Bearer {accessToken}`

**Query**: `?page=1&limit=50`

**Response (200)**:
```json
{
  "success": true,
  "message": "Messages fetched",
  "data": [
    {
      "id": "message-id",
      "senderId": "user-id",
      "type": "TEXT",
      "text": "Hello, can you help with plumbing?",
      "isRead": true,
      "readAt": "2024-01-01T12:30:00Z",
      "createdAt": "2024-01-01T12:00:00Z"
    }
  ],
  "meta": { ... }
}
```

---

### POST /chats/:chatId/messages
Send message (backup for Socket.io).

**Headers**: `Authorization: Bearer {accessToken}`

**Request**:
```json
{
  "type": "TEXT",
  "text": "Hello!"
}
```

**Response (201)**:
```json
{
  "success": true,
  "message": "Message sent",
  "data": { ... }
}
```

---

## Reviews API

### POST /reviews
Create review after hire completion.

**Headers**: `Authorization: Bearer {accessToken}`

**Request**:
```json
{
  "hireId": "hire-id",
  "toUserId": "recipient-user-id",
  "rating": 4.5,
  "comment": "Great work! Very professional.",
  "categories": ["PROFESSIONALISM", "QUALITY", "PUNCTUALITY"]
}
```

**Response (201)**:
```json
{
  "success": true,
  "message": "Review created",
  "data": {
    "id": "review-id",
    "rating": 4.5,
    "createdAt": "2024-01-06T12:00:00Z"
  }
}
```

---

### GET /reviews/:userId
Get reviews for user.

**Query**: `?page=1&limit=10`

**Response (200)**:
```json
{
  "success": true,
  "message": "Reviews fetched",
  "data": [
    {
      "id": "review-id",
      "fromUserName": "Alice Smith",
      "rating": 4.5,
      "comment": "Great work!",
      "categories": ["PROFESSIONALISM", "QUALITY"],
      "createdAt": "2024-01-06T12:00:00Z"
    }
  ],
  "meta": { ... }
}
```

---

### GET /reviews/:userId/average
Get average rating.

**Response (200)**:
```json
{
  "success": true,
  "message": "Average rating fetched",
  "data": {
    "userId": "user-id",
    "averageRating": 4.3,
    "totalReviews": 25
  }
}
```

---

## Notifications API

### GET /notifications
Get user notifications.

**Headers**: `Authorization: Bearer {accessToken}`

**Query**: `?page=1&limit=20`

**Response (200)**:
```json
{
  "success": true,
  "message": "Notifications fetched",
  "data": [
    {
      "id": "notif-id",
      "type": "APPLICATION_SHORTLISTED",
      "title": "You've been shortlisted!",
      "body": "You've been shortlisted for Plumbing Repair job",
      "isRead": false,
      "sentAt": "2024-01-05T15:00:00Z"
    }
  ],
  "meta": { ... }
}
```

---

### PATCH /notifications/:id/read
Mark notification as read.

**Headers**: `Authorization: Bearer {accessToken}`

**Response (200)**:
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": { ... }
}
```

---

### POST /notifications/read-all
Mark all notifications as read.

**Headers**: `Authorization: Bearer {accessToken}`

**Response (200)**:
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

## Admin API

### GET /admin/dashboard
Get dashboard metrics.

**Headers**: `Authorization: Bearer {accessToken}`

**Response (200)**:
```json
{
  "success": true,
  "message": "Dashboard metrics fetched",
  "data": {
    "totalUsers": 5432,
    "totalKarigar": 3200,
    "totalMalik": 2232,
    "activeHires": 145,
    "completedHires": 2340,
    "totalPayments": 12500000,
    "totalPlatformRevenue": 1125000,
    "pendingKYC": 23,
    "activeDisputes": 5,
    "averageRating": 4.3
  }
}
```

---

### GET /admin/users
List all users.

**Headers**: `Authorization: Bearer {accessToken}`

**Query**: `?page=1&limit=50&role=KARIGAR&verified=true`

**Response (200)**:
```json
{
  "success": true,
  "message": "Users fetched",
  "data": [ ... ],
  "meta": { ... }
}
```

---

### GET /admin/jobs
List all jobs.

**Headers**: `Authorization: Bearer {accessToken}`

**Query**: `?page=1&limit=50&status=OPEN`

**Response (200)**:
```json
{
  "success": true,
  "message": "Jobs fetched",
  "data": [ ... ],
  "meta": { ... }
}
```

---

### GET /admin/hires
List all hires.

**Headers**: `Authorization: Bearer {accessToken}`

**Query**: `?page=1&limit=50&status=IN_PROGRESS`

**Response (200)**:
```json
{
  "success": true,
  "message": "Hires fetched",
  "data": [ ... ],
  "meta": { ... }
}
```

---

### GET /admin/payments
List all payments.

**Headers**: `Authorization: Bearer {accessToken}`

**Query**: `?page=1&limit=50&status=ESCROW_DEPOSITED`

**Response (200)**:
```json
{
  "success": true,
  "message": "Payments fetched",
  "data": [ ... ],
  "meta": { ... }
}
```

---

### GET /admin/disputes
List payment disputes.

**Headers**: `Authorization: Bearer {accessToken}`

**Query**: `?page=1&limit=50&status=PENDING`

**Response (200)**:
```json
{
  "success": true,
  "message": "Disputes fetched",
  "data": [ ... ],
  "meta": { ... }
}
```

---

### PATCH /admin/disputes/:id/resolve
Resolve payment dispute.

**Headers**: `Authorization: Bearer {accessToken}`

**Request**:
```json
{
  "resolution": "RELEASE_FULL",
  "notes": "Dispute resolved in favor of Karigar"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Dispute resolved",
  "data": { ... }
}
```

---

## WhatsApp API

### GET /whatsapp/webhook
Verification endpoint for Meta WhatsApp webhook challenge setup.

**Query**: `?hub.mode=subscribe&hub.verify_token=karigarhai_verify_token&hub.challenge=1158201444`

**Response (200)**:
```
1158201444
```

---

### POST /whatsapp/webhook
Receive incoming messages webhook event payload from Meta Cloud API.

**Request**:
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "123456789",
      "changes": [
        {
          "field": "messages",
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "16505551111",
              "phone_number_id": "123456123"
            },
            "contacts": [
              {
                "profile": {
                  "name": "John Doe"
                },
                "wa_id": "919876543210"
              }
            ],
            "messages": [
              {
                "from": "919876543210",
                "id": "ABGGFlKwvjpaAgl2C3E5A2b15",
                "timestamp": "1609459200",
                "text": {
                  "body": "Hello! I need a plumber in Satellite locality."
                },
                "type": "text"
              }
            ]
          }
        }
      ]
    }
  ]
}
```

**Response (200)**:
```json
{
  "success": true
}
```

---

### GET /whatsapp/conversations
Get list of all active WhatsApp conversations (Admin only).

**Headers**: `Authorization: Bearer {accessToken}`

**Response (200)**:
```json
{
  "success": true,
  "message": "Conversations fetched successfully",
  "data": [
    {
      "phoneNumber": "+916359557449",
      "lastMessage": "Hello from KarigarHai Admin!",
      "messageType": "TEXT",
      "direction": "OUTGOING",
      "timestamp": "2026-06-12T10:35:19.000Z",
      "waMessageId": "wamid.HBgLMTYzMTU1NTExODEVAgASGBQ...",
      "unreadCount": 0,
      "user": {
        "userId": "eb57f3b8-69ff-4aab-b2eb-3df67bf172fd",
        "name": "Maganbhai Patel",
        "role": "KARIGAR",
        "isVerified": true,
        "kycStatus": "APPROVED",
        "rating": 4.5,
        "city": "Ahmedabad"
      }
    }
  ]
}
```

---

### GET /whatsapp/conversations/:phoneNumber
Get conversation message history log (Admin only).

**Headers**: `Authorization: Bearer {accessToken}`

**Query**: `?limit=50&offset=0`

**Response (200)**:
```json
{
  "success": true,
  "message": "Conversation history fetched successfully",
  "data": [
    {
      "id": "8c37ef26-b745-4269-997b-544174a18d6b",
      "waMessageId": "wamid.HBgLMTYzMTU1NTExODEVAgASGBQ...",
      "phoneNumber": "+916359557449",
      "content": "Hello! I need a plumber in Satellite locality.",
      "messageType": "TEXT",
      "direction": "INCOMING",
      "isRead": true,
      "conversationId": "1072186955987324",
      "timestamp": "2026-06-12T10:30:00.000Z",
      "createdAt": "2026-06-12T10:30:01.000Z",
      "updatedAt": "2026-06-12T10:35:19.000Z"
    }
  ]
}
```

---

### GET /whatsapp/conversations/:phoneNumber/user-info
Get registered user details and metrics by phone number (Admin only).

**Headers**: `Authorization: Bearer {accessToken}`

**Response (200)**:
```json
{
  "success": true,
  "message": "User details fetched successfully",
  "data": {
    "userId": "eb57f3b8-69ff-4aab-b2eb-3df67bf172fd",
    "name": "Maganbhai Patel",
    "role": "KARIGAR",
    "isVerified": true,
    "kycStatus": "APPROVED",
    "rating": 4.5,
    "city": "Ahmedabad",
    "state": "Gujarat",
    "email": "magan@example.com",
    "createdAt": "2026-01-01T12:00:00.000Z",
    "experience": 5,
    "totalJobs": 12,
    "totalHires": 12,
    "totalEarnings": 25000,
    "hourlyRate": 150,
    "dailyRate": 1200,
    "trades": ["PLUMBER"]
  }
}
```

---

### PATCH /whatsapp/conversations/:phoneNumber/read
Mark all incoming messages in a conversation as read (Admin only).

**Headers**: `Authorization: Bearer {accessToken}`

**Response (200)**:
```json
{
  "success": true,
  "message": "Conversation marked as read successfully",
  "data": {
    "count": 2
  }
}
```

---

### POST /whatsapp/send
Send free-form WhatsApp message using Meta Cloud API and record in DB (Admin only).

**Headers**: `Authorization: Bearer {accessToken}`

**Request**:
```json
{
  "phoneNumber": "+916359557449",
  "text": "Hello from KarigarHai Admin! We have noted your request and a plumber has been assigned."
}
```

**Response (201)**:
```json
{
  "success": true,
  "message": "Message sent and stored successfully",
  "data": {
    "id": "1bf98d4b-741d-496f-9a9f-fd55650a99b3",
    "waMessageId": "wamid.HBgLMTYzMTU1NTExODEVAgASGBQ...",
    "phoneNumber": "+916359557449",
    "content": "Hello from KarigarHai Admin! We have noted your request and a plumber has been assigned.",
    "messageType": "TEXT",
    "direction": "OUTGOING",
    "conversationId": "1072186955987324",
    "timestamp": "2026-06-12T10:35:19.000Z",
    "createdAt": "2026-06-12T10:35:19.000Z",
    "updatedAt": "2026-06-12T10:35:19.000Z"
  }
}
```

---

## Socket.io Events

**Connection**:
```javascript
socket.auth = { token: 'access-token' };
socket.connect();
```

**Chat Events**:
- `chat:join` - Join chat room
- `chat:leave` - Leave chat room
- `chat:message` - Send message
- `chat:typing` - Typing indicator
- `chat:stopTyping` - Stop typing
- `chat:markRead` - Mark messages as read

**Location Events**:
- `location:update` - Update live location
- `hire:watchTracking` - Start watching location
- `hire:stopTracking` - Stop watching location

**Notification Events**:
- `notification:new` - New notification received

**Online Status**:
- `user:ping` - Update online status
- `user:onlineStatus` - Receive online status

**WhatsApp Admin Panel Events**:
- `join_admin_whatsapp` (Client event): Join the `admin_whatsapp` room to receive real-time updates.
- `whatsapp:message` (Server event): Broadcasted when a new message is received or sent. Contains `WhatsAppMessage` object.
- `whatsapp:conversation` (Server event): Broadcasted when a conversation details update. Contains `WhatsAppConversation` object (includes unreadCount, lastMessage, user metrics).
- `whatsapp:read` (Server event): Broadcasted when a conversation is marked as read. Payload format: `{ phoneNumber: string }`.

---

## Error Responses

### Validation Error (422)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "phone",
      "message": "Invalid Indian phone number"
    }
  ]
}
```

### Authentication Error (401)
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

### Authorization Error (403)
```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### Conflict (409)
```json
{
  "success": false,
  "message": "Resource already exists"
}
```

### Rate Limit (429)
```json
{
  "success": false,
  "message": "Too many requests, please try again later"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| /auth/* | 5 | 15 minutes per IP |
| Other endpoints | 100 | 1 minute per user |
| Admin endpoints | 200 | 1 minute per admin |

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success (GET, PATCH) |
| 201 | Created (POST) |
| 204 | No Content (DELETE) |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 429 | Rate Limited |
| 500 | Internal Server Error |

---

## Authentication

All protected endpoints require:
```
Authorization: Bearer {accessToken}
```

---

## Pagination

All list endpoints support:
```
?page=1&limit=20
```

Response includes:
```json
"meta": {
  "page": 1,
  "limit": 20,
  "total": 150,
  "totalPages": 8
}
```

---

**API Version**: v1  
**Last Updated**: June 11, 2026  
**Environment**: Production Ready
