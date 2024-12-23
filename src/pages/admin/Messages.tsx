import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, where, addDoc, serverTimestamp, Timestamp, getDocs, writeBatch, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Send, Loader2, MessageCircle, Trash2, Users, ArrowLeft, Search, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

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

interface User {
  id: string;
  name: string;
  email: string;
}

export default function Messages() {
  const { user } = useAuth();
  const { unreadByUser } = useNotification();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showUsersList, setShowUsersList] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchUsers = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('role', '!=', 'admin'));
        const querySnapshot = await getDocs(q);
        const usersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as User));
        setUsers(usersData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Erro ao carregar usuários');
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user, navigate]);

  useEffect(() => {
    if (!selectedUser) return;

    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('chatId', '==', selectedUser.id),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const messagesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Message));
      setMessages(messagesList);

      // Marcar mensagens não lidas como lidas
      const batch = writeBatch(db);
      const unreadMessages = snapshot.docs.filter(
        doc => !doc.data().read && !doc.data().isAdmin
      );

      unreadMessages.forEach(doc => {
        batch.update(doc.ref, { read: true });
      });

      if (unreadMessages.length > 0) {
        await batch.commit();
      }

      scrollToBottom();
    }, (error) => {
      console.error('Error in messages listener:', error);
      toast.error('Erro ao carregar mensagens');
    });

    return () => unsubscribe();
  }, [selectedUser]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !user) return;

    setSendingMessage(true);
    try {
      const messageData = {
        text: newMessage.trim(),
        senderId: user.uid,
        senderName: 'Admin',
        chatId: selectedUser.id,
        createdAt: serverTimestamp(),
        isAdmin: true,
        read: false
      };

      await addDoc(collection(db, 'messages'), messageData);
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setSendingMessage(false);
    }
  };

  const deleteChat = async () => {
    if (!selectedUser || !window.confirm(`Tem certeza que deseja excluir todas as mensagens com ${selectedUser.name}?`)) return;

    try {
      const messagesRef = collection(db, 'messages');
      const q = query(messagesRef, where('chatId', '==', selectedUser.id));
      const snapshot = await getDocs(q);

      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      toast.success('Chat excluído com sucesso!');
      setMessages([]);
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error('Erro ao excluir o chat. Tente novamente.');
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const unreadMessages = {};
  users.forEach(user => {
    const unreadCount = unreadByUser.find(u => u.chatId === user.id)?.count || 0;
    unreadMessages[user.id] = unreadCount;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Mensagens</h1>

      {/* Lista de Conversas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Usuários */}
        <div className="bg-[#16162a] rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-[#1a1a2e] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-[#2563eb] focus:border-[#2563eb]"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <div className="divide-y divide-gray-700">
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={`w-full p-4 flex items-center gap-3 hover:bg-[#1a1a2e] transition-colors ${
                  selectedUser?.id === user.id ? 'bg-[#1a1a2e]' : ''
                }`}
              >
                <div className="h-10 w-10 rounded-full bg-[#2563eb] flex items-center justify-center">
                  <span className="text-lg font-medium text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-medium text-white">{user.name}</h3>
                  <p className="text-sm text-gray-400">{user.email}</p>
                </div>
                {unreadMessages[user.id] > 0 && (
                  <span className="px-2 py-1 text-xs font-medium bg-[#2563eb] text-white rounded-full">
                    {unreadMessages[user.id]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Área de Chat */}
        <div className="lg:col-span-2">
          {selectedUser ? (
            <div className="bg-[#16162a] rounded-lg shadow-lg h-[calc(100vh-12rem)] flex flex-col">
              {/* Cabeçalho do Chat */}
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#2563eb] flex items-center justify-center">
                    <span className="text-lg font-medium text-white">
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{selectedUser.name}</h3>
                    <p className="text-sm text-gray-400">{selectedUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={deleteChat}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-lg"
                  title="Excluir conversa"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.isAdmin ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        message.isAdmin
                          ? 'bg-[#2563eb] text-white'
                          : 'bg-[#1a1a2e] text-gray-300'
                      }`}
                    >
                      <p>{message.text}</p>
                      <span className="text-xs opacity-70">
                        {message.createdAt?.toDate().toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input de Mensagem */}
              <div className="p-4 border-t border-gray-700">
                <form onSubmit={sendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 px-4 py-2 bg-[#1a1a2e] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-[#2563eb] focus:border-[#2563eb]"
                  />
                  <button
                    type="submit"
                    disabled={sendingMessage || !newMessage.trim()}
                    className="px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#3b82f6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingMessage ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="bg-[#16162a] rounded-lg shadow-lg h-[calc(100vh-12rem)] flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white">
                  Selecione um usuário para iniciar uma conversa
                </h3>
                <p className="text-gray-400">
                  Escolha um usuário da lista para ver ou enviar mensagens
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
