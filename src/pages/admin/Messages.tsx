import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, where, addDoc, serverTimestamp, Timestamp, getDocs, writeBatch, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Send, Loader2, MessageCircle, Trash2 } from 'lucide-react';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Users list */}
      <div className="w-1/4 bg-white dark:bg-dark-lighter border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
        <h2 className="font-medium mb-4">Usuários</h2>
        <div className="space-y-2">
          {users.map(user => {
            const unreadCount = unreadByUser.find(u => u.chatId === user.id)?.count || 0;
            
            return (
              <div
                key={user.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedUser?.id === user.id
                    ? 'bg-primary/20 text-primary'
                    : 'hover:bg-gray-50 dark:hover:bg-dark/50'
                }`}
                onClick={() => setSelectedUser(user)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                  </div>
                  {unreadCount > 0 && (
                    <div className="flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded-full text-xs">
                      <MessageCircle size={12} />
                      {unreadCount}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-lighter flex justify-between items-center">
              <div>
                <h3 className="font-medium">{selectedUser.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedUser.email}</p>
              </div>
              <button
                onClick={deleteChat}
                className="text-gray-500 hover:text-red-500 focus:outline-none"
                title="Excluir chat"
              >
                <Trash2 size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-dark">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400">
                  Nenhuma mensagem ainda. Comece uma conversa!
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isAdmin ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        message.isAdmin
                          ? 'bg-primary text-dark'
                          : 'bg-white dark:bg-dark-lighter'
                      }`}
                    >
                      <p>{message.text}</p>
                      <div className="flex items-center gap-2 text-xs opacity-70 mt-1">
                        <span>{message.createdAt?.toDate().toLocaleTimeString()}</span>
                        {!message.isAdmin && (
                          <span className={message.read ? 'text-green-500' : 'text-gray-400'}>
                            {message.read ? '• Lida' : '• Não lida'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
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
                  disabled={sendingMessage}
                  className="bg-primary text-dark px-4 py-2 rounded-lg hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary flex items-center gap-2"
                >
                  {sendingMessage ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
            Selecione um usuário para iniciar uma conversa
          </div>
        )}
      </div>
    </div>
  );
}
