import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageCircle, Send, ArrowLeft, User, Clock, CheckCheck, Check } from 'lucide-react';
import { getMessages, sendMessage, markAsRead } from '../services/message.service';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';

export default function ChatWindow() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const response = await getMessages(userId);
      console.log('Raw response from service:', response);
      // The response IS the array directly
      const fetchedMessages = Array.isArray(response) ? response : (response.data || []);
      console.log('Fetched messages:', fetchedMessages);
      setMessages(fetchedMessages);
      if (!otherUser && fetchedMessages.length > 0) {
        const firstMessage = fetchedMessages[0];
        const other = firstMessage.sender?._id === user._id ? firstMessage.receiver : firstMessage.sender;
        setOtherUser(other);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchOtherUser = async () => {
    try {
      const response = await api.get(`/guides/${userId}`);
      setOtherUser(response.data?.data || response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await fetchMessages();
      await fetchOtherUser();
      await markAsRead(userId);
      setLoading(false);
    };

    loadInitialData();

    // Poll for new messages every 3 seconds
    pollIntervalRef.current = setInterval(() => {
      fetchMessages();
    }, 3000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    setSending(true);
    setNewMessage(''); // Clear input immediately
    
    try {
      const result = await sendMessage(userId, messageText);
      console.log('Full API result:', result);
      
      // The result IS the message object directly
      const newMsg = result._id ? result : result.data;
      console.log('New message to add:', newMsg);
      
      if (newMsg && newMsg._id) {
        // Add to messages array
        const updatedMessages = [...messages, newMsg];
        console.log('Updated messages:', updatedMessages);
        setMessages(updatedMessages);
        setTimeout(scrollToBottom, 100);
      } else {
        console.error('Invalid message format:', newMsg);
        setNewMessage(messageText); // Restore message
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageText); // Restore message on error
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diff = now - messageDate;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return messageDate.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white rounded-t-2xl shadow-lg p-4 flex items-center gap-4 border-b">
        <button
          onClick={() => navigate('/messages')}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        {otherUser && (
          <>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
              {otherUser.profile?.avatar ? (
                <img
                  src={otherUser.profile.avatar}
                  alt={otherUser.profile.firstName}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <User className="w-6 h-6" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-lg">
                {otherUser.profile?.firstName} {otherUser.profile?.lastName}
              </h2>
              <p className="text-sm text-gray-500">
                {otherUser.role === 'guide' ? 'Tour Guide' : 'Tourist'}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 bg-gray-50 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageCircle className="w-16 h-16 mb-4" />
            <p className="text-lg">No messages yet</p>
            <p className="text-sm">Start a conversation!</p>
          </div>
        ) : (
          messages
            .filter((msg) => {
              const isValid = msg && msg._id && msg.sender && msg.sender._id && msg.message;
              if (!isValid) console.log('Invalid message filtered out:', msg);
              return isValid;
            })
            .map((message) => {
              // Get IDs - try multiple possible locations
              const senderId = message.sender?._id || message.sender?.id || message.sender;
              const currentUserId = user?._id || user?.id;
              
              // Convert to strings and compare
              const senderIdStr = String(senderId);
              const currentUserIdStr = String(currentUserId);
              const isMe = senderIdStr === currentUserIdStr;
              
              return (
                <div
                  key={message._id}
                  className={`flex w-full mb-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-md ${
                      isMe
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-none ml-auto'
                        : 'bg-white text-gray-800 rounded-bl-none border border-gray-200 mr-auto'
                    }`}
                  >
                    <p className="break-words">{message.message}</p>
                    <div className={`flex items-center gap-1 mt-1 text-xs ${isMe ? 'text-blue-100' : 'text-gray-500'}`}>
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(message.createdAt)}</span>
                      {isMe && (
                        message.isRead ? (
                          <CheckCheck className="w-4 h-4 ml-1" />
                        ) : (
                          <Check className="w-4 h-4 ml-1" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="bg-white rounded-b-2xl shadow-lg p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-5 h-5" />
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
