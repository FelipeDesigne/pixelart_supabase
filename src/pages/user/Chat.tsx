import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, where, addDoc, serverTimestamp, Timestamp, getDocs, writeBatch, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Send, Loader2, Trash2 } from 'lucide-react';
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

export default function Chat() {
  const { user } = useAuth();
  const { unreadAdminMessages } = useNotification();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  console.log('Chat component rendered, user:', user);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Marcar mensagens como lidas
  useEffect(() => {
    if (!user) return;

    const markMessagesAsRead = async () => {
      try {
        console.log('Marking messages as read for user:', user.uid);
        const messagesRef = collection(db, 'messages');
        const q = query(
          messagesRef,
          where('chatId', '==', user.uid),
          where('isAdmin', '==', true),
          where('read', '==', false)
        );

        const snapshot = await getDocs(q);
        console.log('Found', snapshot.size, 'unread messages to mark as read');

        if (snapshot.size > 0) {
          const batch = writeBatch(db);
          snapshot.docs.forEach((doc) => {
            batch.update(doc.ref, { read: true });
          });
          await batch.commit();
          console.log('Messages marked as read');
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    };

    markMessagesAsRead();
  }, [user, messages]);

  // Carregar mensagens
  useEffect(() => {
    if (!user) return;

    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('chatId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];

      setMessages(messagesData.reverse());
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    });

    return () => unsubscribe();
  }, [user]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    setSendingMessage(true);
    try {
      console.log('Attempting to send message');
      const messageData = {
        chatId: user.uid,
        text: newMessage.trim(),
        senderId: user.uid,
        senderName: user.displayName || user.email,
        isAdmin: false,
        createdAt: serverTimestamp(),
        read: false
      };
      console.log('Message data to send:', messageData);

      await addDoc(collection(db, 'messages'), messageData);
      console.log('Message sent successfully');

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
    if (!user || !window.confirm('Tem certeza que deseja excluir todas as mensagens?')) return;

    try {
      const messagesRef = collection(db, 'messages');
      const q = query(messagesRef, where('chatId', '==', user.uid));
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

  console.log('Current loading state:', loading);
  console.log('Current messages:', messages);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-lighter flex justify-between items-center">
        <h2 className="font-medium">Chat com Administrador</h2>
        <div className="flex items-center gap-4">
          {unreadAdminMessages > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadAdminMessages} {unreadAdminMessages === 1 ? 'nova mensagem' : 'novas mensagens'}
            </span>
          )}
          <button
            onClick={deleteChat}
            className="text-gray-500 hover:text-red-500 focus:outline-none"
            title="Excluir chat"
          >
            <Trash2 size={20} />
          </button>
        </div>
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
              className={`flex ${message.isAdmin ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  message.isAdmin
                    ? 'bg-white dark:bg-dark-lighter'
                    : 'bg-primary text-dark'
                }`}
              >
                <p>{message.text}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {message.createdAt?.toDate().toLocaleTimeString()}
                </span>
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
    </div>
  );
}
