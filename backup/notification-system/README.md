# Sistema de Notificações de Mensagens Não Lidas

Este é um backup do sistema de notificações de mensagens não lidas implementado no projeto. O sistema funciona tanto para usuários quanto para administradores.

## Estrutura dos Arquivos

- `NotificationContext.tsx`: Contexto React que gerencia o estado das notificações
- `Chat.tsx`: Componente de chat que marca mensagens como lidas
- `firestore.rules`: Regras de segurança do Firestore para mensagens e notificações

## Como Funciona

### Para Usuários
- Recebem notificações quando há mensagens não lidas do administrador
- As mensagens são marcadas como lidas automaticamente ao visualizar o chat
- O contador de mensagens não lidas é atualizado em tempo real

### Para Administradores
- Recebem notificações quando há mensagens não lidas de qualquer usuário
- Podem ver quantas mensagens não lidas existem por usuário
- O contador é atualizado em tempo real usando Firestore listeners

## Estrutura do Banco de Dados

### Coleção messages
- `id`: ID único da mensagem
- `text`: Conteúdo da mensagem
- `createdAt`: Data de criação
- `userId`: ID do usuário que enviou
- `chatId`: ID do chat (mesmo que userId do usuário)
- `isAdmin`: Boolean indicando se é mensagem do admin
- `read`: Boolean indicando se foi lida
- `senderName`: Nome do remetente

## Regras de Segurança

- Usuários só podem ler/escrever mensagens em seus próprios chats
- Admins podem ler/escrever mensagens em qualquer chat
- Mensagens são marcadas como lidas automaticamente ao serem visualizadas

## Implementação

O sistema usa o hook `useNotification` que fornece:
- `unreadMessages`: Total de mensagens não lidas
- `unreadByUser`: Array com mensagens não lidas agrupadas por usuário
- `unreadAdminMessages`: Total de mensagens não lidas do admin (para usuários)

## Como Usar

1. Importe o NotificationProvider no seu app:
```tsx
import { NotificationProvider } from './contexts/NotificationContext';

function App() {
  return (
    <NotificationProvider>
      {/* seus componentes */}
    </NotificationProvider>
  );
}
```

2. Use o hook useNotification nos componentes:
```tsx
import { useNotification } from './contexts/NotificationContext';

function Component() {
  const { unreadMessages } = useNotification();
  return <div>Você tem {unreadMessages} mensagens não lidas</div>;
}
```
