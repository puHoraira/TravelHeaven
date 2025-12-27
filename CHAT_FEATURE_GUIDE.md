# Chat Feature Implementation Guide

## Overview
A complete real-time chat system has been implemented between tourists and guides. Tourists can initiate conversations from guide profile pages, and both parties can communicate seamlessly.

## Features Implemented

### 1. Backend Architecture

#### Message Model (`backend/src/models/Message.js`)
- Stores all messages between users
- Fields:
  - `conversationId`: Unique identifier for each conversation pair
  - `sender`: User sending the message
  - `receiver`: User receiving the message
  - `message`: The message content
  - `isRead`: Read status
  - `readAt`: Timestamp when read
- Indexes for optimized queries

#### Message Controller (`backend/src/controllers/message.controller.js`)
Endpoints:
- `GET /api/messages/conversations` - Get all conversations for current user
- `GET /api/messages/:userId` - Get messages with a specific user
- `POST /api/messages` - Send a message
- `PUT /api/messages/:userId/read` - Mark messages as read
- `GET /api/messages/unread/count` - Get unread message count

Features:
- Automatic conversation grouping
- Unread message tracking
- Auto-marking messages as read when viewed
- Pagination support

#### Routes (`backend/src/routes/message.routes.js`)
- All routes require authentication
- Integrated into server at `/api/messages`

### 2. Frontend Components

#### Messages Page (`frontend/src/pages/Messages.jsx`)
- Lists all conversations
- Shows:
  - Other user's avatar and name
  - Last message preview
  - Unread count badge
  - Timestamp
  - User role (Guide/Tourist badge)
- Search functionality to filter conversations
- Auto-refresh every 5 seconds
- Click to open chat window

#### Chat Window (`frontend/src/pages/ChatWindow.jsx`)
- Full chat interface with:
  - Header showing other user's info
  - Message list (scrollable)
  - Input field with send button
  - Real-time updates (polls every 3 seconds)
- Message features:
  - Bubble design (different colors for sender/receiver)
  - Timestamp with smart formatting (Just now, 5m ago, 2h ago, etc.)
  - Read receipts (single check = sent, double check = read)
  - Auto-scroll to bottom
- Gradient UI matching the app design

#### Message Icon (`frontend/src/components/MessageIcon.jsx`)
- Added to main navigation header
- Shows unread message count badge
- Auto-updates every 10 seconds
- Clickable to navigate to messages page

#### Message Service (`frontend/src/services/message.service.js`)
- API wrapper functions for all message operations
- Clean interface for components to use

### 3. Integration Points

#### Guide Profile Page
- "Chat with [Guide Name]" button added below guide's bio
- Only visible to logged-in users (not to the guide viewing their own profile)
- Navigates directly to chat window with that guide

#### Navigation
- Message icon with unread count in header
- Always accessible from any page

#### Routes
- `/messages` - Conversations list
- `/chat/:userId` - Chat window with specific user

## How It Works

### Starting a Conversation (Tourist View)
1. Tourist browses guides at `/guides`
2. Clicks on a guide profile
3. Sees "Chat with [Guide]" button
4. Clicks button → Opens chat window
5. Types and sends message
6. Message appears in chat

### Receiving Messages (Guide View)
1. Guide sees message icon in header with red badge
2. Clicks message icon → Goes to conversations list
3. Sees tourist's conversation with unread count
4. Clicks conversation → Opens chat window
5. Messages automatically marked as read
6. Can reply to tourist

### Real-time Updates
- Chat window polls for new messages every 3 seconds
- Conversations list refreshes every 5 seconds
- Message icon badge updates every 10 seconds
- Provides near-real-time experience without WebSocket complexity

## UI/UX Features

### Design Elements
- Gradient backgrounds (blue → purple → pink)
- Bubble-style messages
- Different colors for sent/received
- Smooth animations and transitions
- Responsive layout
- Avatar displays
- Read receipts
- Smart timestamps

### User Experience
- Auto-scroll to latest message
- Auto-mark as read when viewing
- Search conversations
- Unread badges everywhere
- Loading states
- Empty states with helpful messages
- Error handling

## Testing the Feature

### As a Tourist:
1. Navigate to `/guides`
2. Click any guide profile
3. Click "Chat with [Guide]" button
4. Send a test message
5. Check message appears in chat
6. Navigate to `/messages` to see conversation list

### As a Guide:
1. Receive message from tourist (check message icon badge)
2. Click message icon
3. See conversation in list
4. Click conversation
5. Reply to tourist
6. Verify read receipts

## Database Collections

### Messages Collection
```javascript
{
  conversationId: "userId1_userId2",
  sender: ObjectId("user1"),
  receiver: ObjectId("user2"),
  message: "Hello!",
  isRead: false,
  createdAt: ISODate("2025-12-27T..."),
  updatedAt: ISODate("2025-12-27T...")
}
```

## Performance Considerations

1. **Indexes**: Added for fast queries
   - `conversationId` + `createdAt`
   - `receiver` + `isRead`

2. **Pagination**: Messages support pagination (50 per page)

3. **Polling Intervals**: 
   - Chat: 3s (active conversation)
   - List: 5s (overview)
   - Badge: 10s (passive indicator)

4. **Auto-cleanup**: Intervals cleared on component unmount

## Future Enhancements (Optional)

1. **WebSocket/Socket.io**: For true real-time messaging
2. **Typing indicators**: Show when other user is typing
3. **Message reactions**: Like, heart, etc.
4. **File attachments**: Send images/documents
5. **Message search**: Search within conversations
6. **Delete messages**: Allow users to delete sent messages
7. **Block users**: Prevent unwanted conversations
8. **Push notifications**: Alert users of new messages
9. **Online status**: Show who's online
10. **Group chats**: Multiple participants

## Files Modified/Created

### Backend:
- ✅ `backend/src/models/Message.js` - NEW
- ✅ `backend/src/controllers/message.controller.js` - NEW
- ✅ `backend/src/routes/message.routes.js` - NEW
- ✅ `backend/src/server.js` - Modified (added message routes)

### Frontend:
- ✅ `frontend/src/pages/Messages.jsx` - NEW
- ✅ `frontend/src/pages/ChatWindow.jsx` - NEW
- ✅ `frontend/src/components/MessageIcon.jsx` - NEW
- ✅ `frontend/src/services/message.service.js` - NEW
- ✅ `frontend/src/pages/GuideProfile.jsx` - Modified (added chat button)
- ✅ `frontend/src/components/Layout.jsx` - Modified (added message icon)
- ✅ `frontend/src/App.jsx` - Modified (added routes)

## Security

- All endpoints require authentication
- Users can only see their own conversations
- Messages are private between sender and receiver
- Conversation IDs generated consistently (sorted user IDs)

## Ready to Use!

The chat feature is fully implemented and ready for testing. Start the backend server and frontend development server to test the functionality.
