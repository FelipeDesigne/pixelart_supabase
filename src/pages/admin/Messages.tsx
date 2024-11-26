import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, where, doc, updateDoc, Timestamp, addDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Send, Loader2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  createdAt: Timestamp;
  read: boolean;
  isAdmin: boolean;
  chatId: string;
}

interface Chat {
  id: string;
  userId: string;
  userName: string;
  lastMessage?: string;
  lastMessageTimestamp?: Timestamp;
  unreadCount?: number;
}

export default function Messages() {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load chats
  useEffect(() => {
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('isAdmin', '==', false),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Group messages by chatId to create chat list
      const chatMap = new Map<string, {
        lastMessage: string;
        lastMessageTimestamp: Timestamp;
        unreadCount: number;
        userName: string;
        userId: string;
      }>();

      snapshot.docs.forEach(doc => {
        const message = doc.data();
        const chatId = message.chatId;
        
        if (!chatMap.has(chatId)) {
          chatMap.set(chatId, {
            lastMessage: message.text,
            lastMessageTimestamp: message.createdAt,
            unreadCount: !message.read ? 1 : 0,
            userName: message.senderName,
            userId: message.senderId
          });
        } else {
          const chat = chatMap.get(chatId)!;
          if (message.createdAt > chat.lastMessageTimestamp) {
            chat.lastMessage = message.text;
            chat.lastMessageTimestamp = message.createdAt;
          }
          if (!message.read) {
            chat.unreadCount++;
          }
        }
      });

      const chatsList = Array.from(chatMap.entries()).map(([id, data]) => ({
        id,
        ...data
      }));

      setChats(chatsList);
      setLoading(false);

      // Auto-select chat from URL parameter
      const chatId = searchParams.get('chat');
      if (chatId && !selectedChat) {
        const chat = chatsList.find(c => c.id === chatId);
        if (chat) {
          setSelectedChat(chat);
        }
      }
    });

    return () => unsubscribe();
  }, [searchParams]);

  // Load messages for selected chat
  useEffect(() => {
    if (!selectedChat) return;

    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('chatId', '==', selectedChat.id),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const messagesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      
      setMessages(messagesList);

      // Mark messages as read in batch
      const batch = writeBatch(db);
      let hasUnread = false;

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!data.read && !data.isAdmin) {
          hasUnread = true;
          batch.update(doc.ref, { read: true });
        }
      });

      if (hasUnread) {
        try {
          await batch.commit();
        } catch (error) {
          console.error('Error marking messages as read:', error);
        }
      }

      scrollToBottom();
    });

    return () => unsubscribe();
  }, [selectedChat]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || !currentUser) return;

    try {
      await addDoc(collection(db, 'messages'), {
        chatId: selectedChat.id,
        text: newMessage.trim(),
        senderId: currentUser.uid,
        senderName: 'Admin',
        isAdmin: true,
        createdAt: serverTimestamp(),
        read: false
      });

      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Chat list */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-lighter overflow-y-auto">
        {chats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => setSelectedChat(chat)}
            className={`w-full p-4 text-left border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-dark transition-colors
              ${selectedChat?.id === chat.id ? 'bg-gray-50 dark:bg-dark' : ''}
              ${chat.unreadCount ? 'bg-primary/10 dark:bg-primary/20' : ''}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{chat.userName}</span>
              {chat.unreadCount ? (
                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-white text-xs">
                  {chat.unreadCount}
                </span>
              ) : null}
            </div>
            {chat.lastMessage && (
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                {chat.lastMessage}
              </p>
            )}
          </button>
        ))}
      </div>

      {/* Chat messages */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-dark">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-lighter">
            <h2 className="font-medium">{selectedChat.userName}</h2>
          </div>

          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isAdmin ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    message.isAdmin
                      ? 'bg-primary text-white'
                      : 'bg-white dark:bg-dark-lighter'
                  }`}
                >
                  <p>{message.text}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {message.createdAt?.toDate().toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="p-4 bg-white dark:bg-dark-lighter border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="flex-1 bg-gray-50 dark:bg-dark border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-primary text-white rounded-lg px-4 py-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-dark">
          <p className="text-gray-500 dark:text-gray-400">
            Selecione um chat para começar a conversar
          </p>
        </div>
      )}
    </div>
  );
}
