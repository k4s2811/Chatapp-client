import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";

// Configuration
const SERVER_URL = "http://localhost:3002"; // Replace with your ENV port
const API_BASE = `${SERVER_URL}/brr`;

const ChatApp = ({ currentUserId, conversationId, token }) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);

  // 1. Initialize Socket Connection
  useEffect(() => {
    if (!token) return;

    // Matches the socketHandler.js auth extraction
    const newSocket = io(SERVER_URL, {
      auth: { token: token }, 
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to socket server:", newSocket.id);
      // Join the conversation room (matches socket.on("join_conversation"))
      newSocket.emit("join_conversation", conversationId);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    return () => {
      newSocket.emit("leave_conversation", conversationId);
      newSocket.disconnect();
    };
  }, [token, conversationId]);

  // 2. Fetch Initial Message History (REST)
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/conversations/${conversationId}/messages`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // Assuming your REST controller returns an array of messages
        setMessages(response.data); 
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    };

    if (conversationId && token) {
      fetchHistory();
    }
  }, [conversationId, token]);

  // 3. Listen for Real-Time Events
  useEffect(() => {
    if (!socket) return;

    // Listen for incoming messages (matches io.to().emit("new_message"))
    const handleNewMessage = (message) => {
      setMessages((prev) => [...prev, message]);
      
      // Mark as read immediately if the window is open
      if (message.senderId !== currentUserId) {
         socket.emit("mark_read", { 
           conversationId: message.conversationId, 
           messageId: message._id 
         });
      }
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [socket, currentUserId]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 4. Send Message Handler
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !socket) return;

    const payload = {
      conversationId,
      text: inputText,
      attachments: [], 
      replyToMessageId: null
    };

    // Emit via socket (matches socket.on("send_message"))
    socket.emit("send_message", payload, (ack) => {
      if (!ack.success) {
        console.error("Failed to send message:", ack.error);
        // Handle failure (e.g., show a toast notification)
      }
    });

    setInputText(""); // Clear input immediately for UX
  };

  // 5. Typing Indicator Handler
  const handleTyping = (e) => {
    setInputText(e.target.value);
    if (socket) {
      socket.emit("typing", { conversationId, isTyping: e.target.value.length > 0 });
    }
  };

  return (
    <div style={{ maxWidth: "500px", margin: "0 auto", border: "1px solid #ccc", height: "600px", display: "flex", flexDirection: "column" }}>
      
      {/* Message Feed */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
        {messages.map((msg, index) => {
          const isMe = msg.senderId === currentUserId;
          return (
            <div key={msg._id || index} style={{ textAlign: isMe ? "right" : "left", margin: "10px 0" }}>
              <span style={{ 
                background: isMe ? "#007bff" : "#e9ecef", 
                color: isMe ? "#fff" : "#000", 
                padding: "8px 12px", 
                borderRadius: "15px",
                display: "inline-block"
              }}>
                {msg.content?.text || msg.text}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} style={{ display: "flex", padding: "10px", borderTop: "1px solid #ccc" }}>
        <input
          type="text"
          value={inputText}
          onChange={handleTyping}
          placeholder="Type a message..."
          style={{ flex: 1, padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
        />
        <button type="submit" style={{ marginLeft: "10px", padding: "10px 20px" }}>
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatApp;