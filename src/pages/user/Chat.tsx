import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, where, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Send, Loader2 } from 'lucide-react';
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  console.log('Chat component rendered, user:', user);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    console.log('Chat useEffect triggered, user:', user);
    
    if (!user) {
      console.log('No user, returning');
      return;
    }

    console.log('Setting up Firestore query for chatId:', user.uid);
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('chatId', '==', user.uid)
    );

    try {
      console.log('Attempting to set up onSnapshot listener');
      const unsubscribe = onSnapshot(q, (snapshot) => {
        console.log('Received snapshot with', snapshot.docs.length, 'messages');
        const messagesList = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Message data:', data);
          return {
            id: doc.id,
            ...data
          };
        }) as Message[];
        
        const sortedMessages = messagesList.sort((a, b) => 
          (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0)
        );
        
        console.log('Setting messages:', sortedMessages);
        setMessages(sortedMessages);
        setLoading(false);
        scrollToBottom();
      }, (error) => {
        console.error('Error in onSnapshot:', error);
        setLoading(false);
      });

      return () => {
        console.log('Cleaning up listener');
        unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up listener:', error);
      setLoading(false);
    }
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
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-lighter">
        <h2 className="font-medium">Chat com Administrador</h2>
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
                    : 'bg-primary text-white'
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
  );
}
