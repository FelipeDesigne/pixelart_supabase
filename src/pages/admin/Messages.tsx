import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, where, doc, updateDoc, Timestamp, addDoc, writeBatch, serverTimestamp, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Send, Loader2, Trash2 } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

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
  const { user, isAdmin } = useAuth();
  console.log('Messages Component - User:', user?.email);
  console.log('Messages Component - Is Admin:', isAdmin);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Verificação de autenticação
  useEffect(() => {
    if (!user || !isAdmin) {
      console.log('Not authenticated or not admin, redirecting to login');
      console.log('User:', user?.email);
      console.log('Is Admin:', isAdmin);
      navigate('/login');
      return;
    }
  }, [user, isAdmin, navigate]);

  // Se não estiver autenticado, não renderiza nada
  if (!user || !isAdmin) {
    return null;
  }

  useEffect(() => {
    console.log('=== Debug Authentication ===');
    console.log('User:', user);
    console.log('Email:', user?.email);
    console.log('UID:', user?.uid);
  }, [user]);

  console.log('Debug - User:', user?.email);
  console.log('Debug - User ID:', user?.uid);

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
    
    console.log('Debug - Sending message...');
    console.log('Debug - Message:', newMessage);
    console.log('Debug - Selected Chat:', selectedChat);
    console.log('Debug - User:', user);
    
    // Validações mais detalhadas
    if (!newMessage.trim()) {
      toast.error('Digite uma mensagem');
      return;
    }
    
    if (!selectedChat) {
      toast.error('Selecione um chat para enviar a mensagem');
      return;
    }
    
    if (!user) {
      toast.error('Você precisa estar autenticado');
      return;
    }

    setSendingMessage(true);
    try {
      console.log('=== Debug Send Message ===');
      console.log('Message Data:', {
        chatId: selectedChat.id,
        text: newMessage.trim(),
        senderId: user.uid,
        senderName: 'Admin',
        isAdmin: true,
        createdAt: serverTimestamp(),
        read: false
      });
      
      // Criando a referência da coleção messages
      const messagesRef = collection(db, 'messages');
      
      const messageData = {
        chatId: selectedChat.id,
        text: newMessage.trim(),
        senderId: user.uid,
        senderName: 'Admin',
        isAdmin: true,
        createdAt: serverTimestamp(),
        read: false
      };

      // Adicionando a mensagem ao Firestore
      const docRef = await addDoc(messagesRef, messageData);
      console.log('Message added with ID:', docRef.id);
      
      // Limpa o campo de mensagem e rola para o final
      setNewMessage('');
      scrollToBottom();
      
      toast.success('Mensagem enviada com sucesso');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleDeleteChat = async () => {
    if (!selectedChat) return;

    if (window.confirm('Tem certeza que deseja excluir todo o histórico de mensagens com este usuário?')) {
      try {
        const messagesRef = collection(db, 'messages');
        const q = query(messagesRef, where('chatId', '==', selectedChat.id));
        const querySnapshot = await getDocs(q);
        
        const batch = writeBatch(db);
        querySnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        
        await batch.commit();
        setSelectedChat(null);
        toast.success('Chat excluído com sucesso');
      } catch (error) {
        console.error('Error deleting chat:', error);
        toast.error('Erro ao excluir chat');
      }
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
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-lighter flex justify-between items-center">
            <h2 className="font-medium">{selectedChat.userName}</h2>
            <button
              onClick={handleDeleteChat}
              className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Excluir chat"
            >
              <Trash2 className="w-5 h-5" />
            </button>
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
                disabled={!newMessage.trim() || sendingMessage}
                className="bg-primary text-white rounded-lg px-4 py-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingMessage ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
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
