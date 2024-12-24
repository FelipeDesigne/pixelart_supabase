# Pixel Art - Sistema de Solicitações

Sistema de gerenciamento de solicitações de pixel art, desenvolvido com React, TypeScript e Supabase.

## Tecnologias Utilizadas

- React
- TypeScript
- Tailwind CSS
- Supabase (Banco de dados e Autenticação)
- React Router DOM
- React Hot Toast
- Recharts (Gráficos)
- Date-fns
- Lucide React (Ícones)

## Funcionalidades

- Autenticação de usuários
- Dashboard administrativo
- Sistema de solicitações
- Exportação de relatórios
- Gráficos e estatísticas
- Interface responsiva e moderna

## Configuração do Ambiente

1. Clone o repositório
```bash
git clone https://github.com/FelipeDesigne/pixelart_supabase.git
cd pixelart_supabase
```

2. Instale as dependências
```bash
npm install
```

3. Configure as variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

4. Inicie o servidor de desenvolvimento
```bash
npm run dev
```

## Estrutura do Projeto

- `/src/components` - Componentes reutilizáveis
- `/src/pages` - Páginas da aplicação
- `/src/contexts` - Contextos do React (Auth, etc)
- `/src/lib` - Configurações de bibliotecas
- `/src/utils` - Funções utilitárias

## Licença

MIT
