export const mockUsers = [
  {
    id: 1,
    name: "Sarah Chen",
    avatar: "https://images.unsplash.com/photo-1758600434324-41712d1f530e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAxODF8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMGZhY2UlMjBjbGVhbiUyMG5ldXRyYWwlMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3NTU4NTMwN3ww&ixlib=rb-4.1.0&q=85",
    online: true,
    typing: false,
    lastSeen: null
  },
  {
    id: 2,
    name: "Marcus Webb",
    avatar: "https://images.unsplash.com/photo-1758598497190-f609ecba227b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAxODF8MHwxfHNlYXJjaHwyfHxwb3J0cmFpdCUyMGZhY2UlMjBjbGVhbiUyMG5ldXRyYWwlMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3NTU4NTMwN3ww&ixlib=rb-4.1.0&q=85",
    online: false,
    typing: false,
    lastSeen: "2 hours ago"
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    avatar: "https://images.unsplash.com/photo-1618593167496-24fed8abacd3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAxODF8MHwxfHNlYXJjaHw0fHxwb3J0cmFpdCUyMGZhY2UlMjBjbGVhbiUyMG5ldXRyYWwlMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3NTU4NTMwN3ww&ixlib=rb-4.1.0&q=85",
    online: true,
    typing: false,
    lastSeen: null
  },
  {
    id: 4,
    name: "David Kim",
    avatar: "https://images.unsplash.com/photo-1637722883499-7782c2a64f07?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAxODF8MHwxfHNlYXJjaHwzfHxwb3J0cmFpdCUyMGZhY2UlMjBjbGVhbiUyMG5ldXRyYWwlMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3NTU4NTMwN3ww&ixlib=rb-4.1.0&q=85",
    online: false,
    typing: false,
    lastSeen: "1 day ago"
  },
  {
    id: 5,
    name: "Sarah Chen",
    avatar: "https://images.unsplash.com/photo-1758600434324-41712d1f530e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAxODF8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMGZhY2UlMjBjbGVhbiUyMG5ldXRyYWwlMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3NTU4NTMwN3ww&ixlib=rb-4.1.0&q=85",
    online: true,
    typing: false,
    lastSeen: null
  },
  {
    id: 6,
    name: "Marcus Webb",
    avatar: "https://images.unsplash.com/photo-1758598497190-f609ecba227b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAxODF8MHwxfHNlYXJjaHwyfHxwb3J0cmFpdCUyMGZhY2UlMjBjbGVhbiUyMG5ldXRyYWwlMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3NTU4NTMwN3ww&ixlib=rb-4.1.0&q=85",
    online: false,
    typing: false,
    lastSeen: "2 hours ago"
  },
  {
    id: 7,
    name: "Emily Rodriguez",
    avatar: "https://images.unsplash.com/photo-1618593167496-24fed8abacd3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAxODF8MHwxfHNlYXJjaHw0fHxwb3J0cmFpdCUyMGZhY2UlMjBjbGVhbiUyMG5ldXRyYWwlMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3NTU4NTMwN3ww&ixlib=rb-4.1.0&q=85",
    online: true,
    typing: false,
    lastSeen: null
  },
  {
    id: 8,
    name: "David Kim",
    avatar: "https://images.unsplash.com/photo-1637722883499-7782c2a64f07?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAxODF8MHwxfHNlYXJjaHwzfHxwb3J0cmFpdCUyMGZhY2UlMjBjbGVhbiUyMG5ldXRyYWwlMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3NTU4NTMwN3ww&ixlib=rb-4.1.0&q=85",
    online: false,
    typing: false,
    lastSeen: "1 day ago"
  }
];

export const mockConversations = [
  {
    id: 1,
    userId: 1,
    lastMessage: "Sounds great! See you at 3pm.",
    timestamp: new Date(Date.now() - 5 * 60000),
    unreadCount: 2
  },
  {
    id: 2,
    userId: 2,
    lastMessage: "Thanks for your help with the project!",
    timestamp: new Date(Date.now() - 2 * 60 * 60000),
    unreadCount: 0
  },
  {
    id: 3,
    userId: 3,
    lastMessage: "Did you check the latest updates?",
    timestamp: new Date(Date.now() - 24 * 60 * 60000),
    unreadCount: 5
  },
  {
    id: 4,
    userId: 4,
    lastMessage: "Let's catch up soon!",
    timestamp: new Date(Date.now() - 48 * 60 * 60000),
    unreadCount: 0
  },
  {
    id: 5,
    userId: 5,
    lastMessage: "Sounds great! See you at 3pm.",
    timestamp: new Date(Date.now() - 5 * 60000),
    unreadCount: 2
  },
  {
    id: 6,
    userId: 6,
    lastMessage: "Thanks for your help with the project!",
    timestamp: new Date(Date.now() - 2 * 60 * 60000),
    unreadCount: 0
  },
  {
    id: 7,
    userId: 7,
    lastMessage: "Did you check the latest updates?",
    timestamp: new Date(Date.now() - 24 * 60 * 60000),
    unreadCount: 5
  },
  {
    id: 8,
    userId: 8,
    lastMessage: "Let's catch up soon!",
    timestamp: new Date(Date.now() - 48 * 60 * 60000),
    unreadCount: 0
  }
];

export const mockMessages = {
  1: [
    {
      id: 1,
      text: "Hey! How are you doing?",
      senderId: 1,
      timestamp: new Date(Date.now() - 60 * 60000),
      delivered: true,
      read: true
    },
    {
      id: 2,
      text: "I'm doing great! Just finished the new design mockups.",
      senderId: "me",
      timestamp: new Date(Date.now() - 55 * 60000),
      delivered: true,
      read: true
    },
    {
      id: 3,
      text: "That's awesome! Can I take a look at them?",
      senderId: 1,
      timestamp: new Date(Date.now() - 50 * 60000),
      delivered: true,
      read: true
    },
    {
      id: 4,
      text: "Sure! I'll send them over in a bit. Want to meet up later to discuss?",
      senderId: "me",
      timestamp: new Date(Date.now() - 45 * 60000),
      delivered: true,
      read: true
    },
    {
      id: 5,
      text: "Sounds great! See you at 3pm.",
      senderId: 1,
      timestamp: new Date(Date.now() - 5 * 60000),
      delivered: true,
      read: false
    }
  ],
  2: [
    {
      id: 1,
      text: "Marcus! Did you finish the API integration?",
      senderId: "me",
      timestamp: new Date(Date.now() - 5 * 60 * 60000),
      delivered: true,
      read: true
    },
    {
      id: 2,
      text: "Yes! Just pushed it to the repo. Everything is working smoothly now.",
      senderId: 2,
      timestamp: new Date(Date.now() - 4 * 60 * 60000),
      delivered: true,
      read: true
    },
    {
      id: 3,
      text: "Thanks for your help with the project!",
      senderId: 2,
      timestamp: new Date(Date.now() - 2 * 60 * 60000),
      delivered: true,
      read: true
    }
  ],
  3: [
    {
      id: 1,
      text: "Emily, I saw the presentation draft you shared.",
      senderId: "me",
      timestamp: new Date(Date.now() - 48 * 60 * 60000),
      delivered: true,
      read: true
    },
    {
      id: 2,
      text: "What did you think? I'm still working on the final slides.",
      senderId: 3,
      timestamp: new Date(Date.now() - 47 * 60 * 60000),
      delivered: true,
      read: true
    },
    {
      id: 3,
      text: "It looks really professional! Just a few minor tweaks needed.",
      senderId: "me",
      timestamp: new Date(Date.now() - 46 * 60 * 60000),
      delivered: true,
      read: true
    },
    {
      id: 4,
      text: "Did you check the latest updates?",
      senderId: 3,
      timestamp: new Date(Date.now() - 24 * 60 * 60000),
      delivered: true,
      read: false
    }
  ],
  4: [
    {
      id: 1,
      text: "David! Long time no see!",
      senderId: "me",
      timestamp: new Date(Date.now() - 72 * 60 * 60000),
      delivered: true,
      read: true
    },
    {
      id: 2,
      text: "I know! Been super busy with the new startup. How have you been?",
      senderId: 4,
      timestamp: new Date(Date.now() - 70 * 60 * 60000),
      delivered: true,
      read: true
    },
    {
      id: 3,
      text: "That's exciting! Would love to hear more about it.",
      senderId: "me",
      timestamp: new Date(Date.now() - 69 * 60 * 60000),
      delivered: true,
      read: true
    },
    {
      id: 4,
      text: "Let's catch up soon!",
      senderId: 4,
      timestamp: new Date(Date.now() - 48 * 60 * 60000),
      delivered: true,
      read: true
    }
  ]
};
