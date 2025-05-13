# Agendamento de Festas Juninas

Este projeto é um sistema Node.js + Express com SQLite3 e EJS que permite que usuários agendem festas juninas para escolas selecionadas e que administradores façam login e visualizem os agendamentos através de um painel administrativo.

## Estrutura do Projeto

- **app.js**: Configuração do servidor Express, view engine e rotas principais.
- **package.json**: Dependências do projeto e configuração de script de inicialização.
- **public/**: Arquivos estáticos (imagens, CSS).
  - **img/**: Logos das escolas (arquivos `.png`) e `default_school.png` para fallback.
  - **css/**: Arquivos de estilo (contém `styles.css`).
  - **js/**: (reservado para scripts JavaScript públicos, se necessário).
- **views/**: Templates EJS.
  - `index.ejs`: Página inicial com listagem de escolas para agendamento.
  - `agendar.ejs`: Formulário para agendar festa junina.
  - `login.ejs`: Formulário de login do administrador.
  - `admin.ejs`: Painel administrativo exibindo agendamentos.
- **routes/**: Definições das rotas da aplicação.
  - `escolas.js`: Rota para página inicial (listagem de escolas).
  - `agendamentos.js`: Rotas para agendamento (formulário e submissão).
  - `admin.js`: Rotas para login e painel administrativo (protegidas por sessão).
- **models/**: Módulos de acesso ao banco de dados SQLite.
  - `db.js`: Configuração da conexão SQLite e criação de tabelas com dados iniciais.
  - `escola.js`: Funções relacionadas às escolas (listar todas, buscar por ID).
  - `agendamento.js`: Funções relacionadas aos agendamentos (criar, listar com detalhes).
  - `usuario.js`: Funções relacionadas aos usuários administradores (buscar por username).
- **database.db**: Arquivo do banco de dados SQLite3 (gerado automaticamente na primeira execução).

## Instalação e Execução

1. Certifique-se de ter o Node.js instalado em sua máquina.
2. Navegue até o diretório do projeto e execute o comando abaixo para instalar as dependências:
   npm install
   css
   Copiar
   Editar
3. Após a instalação, inicie o servidor com o comando:
   node app.js
   markdown
   Copiar
   Editar
4. O servidor iniciará na porta 3000. Abra seu navegador e acesse `http://localhost:3000`.

## Uso

- **Agendar uma Festa Junina**: Na página inicial, selecione a escola desejada e clique em "Agendar Festa". Preencha o formulário com seu nome, email e data da festa junina e envie. Você verá uma mensagem de sucesso após agendar.
- **Painel Administrativo**: Acesse `http://localhost:3000/admin` e faça login com as credenciais de administrador para visualizar os agendamentos realizados.

## Credenciais de Administrador

Por padrão, um usuário administrador é criado automaticamente no primeiro uso do sistema:

- **Usuário:** `admin`
- **Senha:** `admin`

Após fazer login, o administrador pode visualizar todos os agendamentos no painel.
