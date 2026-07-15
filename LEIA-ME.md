# 🚀 AutoPost WebApp — Guia de Instalação

## Novidades desta versão (v2)

- ✅ **3 opções de legenda por foto** — a IA gera três estilos (Criativa,
  Curta e direta, Storytelling); você clica na que preferir e ainda pode
  editar à vontade
- ✅ **Hashtags inteligentes** — baseadas no conteúdo da foto, na legenda
  E no local do GPS (ex: #budapest #hungria quando a foto é de lá)
- ✅ **Botão "✨ Gerar da legenda"** — editou a legenda ou o local? Gere
  hashtags novas na hora, sem reanalisar a foto
- ✅ **Banco de dados de verdade (SQLite)** — substitui o queue.json;
  a migração dos posts antigos é automática na primeira execução
- ✅ **Senha de acesso opcional** — defina `APP_PASSWORD` no `.env` e o
  app passa a exigir login (essencial para publicar na internet)
- ✅ **Pronto para produção** — Dockerfile + gunicorn; veja o `DEPLOY.md`
  para colocar na internet em ~15 minutos
- ✅ **Erros visíveis** — se a análise com IA falhar (ex: chave da API
  inválida), o app agora avisa em vez de falhar em silêncio

## O que já existia

- ✅ Upload de fotos (arrasta ou clica pra escolher)
- ✅ Análise com Claude Vision (legendas automáticas)
- ✅ **EXIF real** — câmera, data, GPS lidos direto da foto no servidor
- ✅ **Localização automática** — pega o GPS da foto e descobre o nome do
  lugar mais próximo (usando OpenStreetMap, gratuito)
- ✅ Tela de revisão com edição de legenda, hashtags, local, pessoas marcadas
- ✅ **Dashboard** — vê todos os posts (pendentes/postados), edita ou
  cancela qualquer um

---

## 📁 Estrutura

```
autopost-webapp/
  Dockerfile            → para publicar na internet (ver DEPLOY.md)
  DEPLOY.md             → guia passo a passo de publicação
  backend/
    app.py              → servidor (Flask)
    db.py               → banco de dados (SQLite)
    requirements.txt
    .env                → suas credenciais (NUNCA suba para o GitHub)
    .env.example        → modelo para preencher
    static/
      index.html        → a página
      style.css         → visual
      app.js            → toda a lógica
    data/
      autopost.db       → banco de posts (criado automaticamente)
      photos/           → fotos salvas (criado automaticamente)
```

---

## 🔧 Instalação (uma vez só)

**1. Apague a pasta antiga do backend Swift/Xcode.** Não precisa mais dela.

**2. Coloque a pasta `autopost-webapp` em Documents**, do lado de onde
   estava o projeto antigo.

**3. Abra o Terminal e rode:**

```bash
cd ~/Documents/autopost-webapp/backend
pip3 install -r requirements.txt --break-system-packages
```

Isso instala Flask, Pillow, o SDK do Claude, e o **pillow-heif** — este
último é essencial porque fotos do iPhone costumam ser `.heic`, e sem
essa biblioteca o servidor não consegue nem abrir esse tipo de arquivo.

---

## ▶️ Rodar o app

**Opção mais fácil — script pronto:**

```bash
cd ~/Documents/autopost-webapp/backend
./start.sh
```

Esse script instala dependências que faltarem, mostra o IP do seu Mac
(útil para acessar do celular) e já inicia o servidor.

**Ou manualmente:**

```bash
cd ~/Documents/autopost-webapp/backend
python3 app.py
```

Ao iniciar, o terminal mostra um resumo do estado do sistema:

```
============================================================
AutoPost WebApp rodando em http://localhost:1234
Claude API configurada
Suporte a HEIC/HEIF (fotos iPhone) ativo
============================================================
```

Se aparecer um aviso sobre HEIC ou sobre a chave da API, siga a
instrução que aparece na própria mensagem.

**Deixe esse terminal aberto.** Ele é o "servidor" — se fechar, o app para.

---

## 🌐 Acessar o app

**No computador:** abra o navegador e vá em

```
http://localhost:1234
```

**No celular (mesma rede Wi-Fi do Mac):**

1. Descubra o IP do Mac:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
2. No navegador do celular, acesse:
   ```
   http://SEU_IP_AQUI:1234
   ```
   Exemplo: `http://192.168.0.236:1234`

---

## ✨ Como usar

**1. Aba "Novo Post"**
   - Clique na caixa de upload e escolha as fotos (pode escolher várias)
   - Clique nas fotos para marcar/desmarcar quais usar
   - Deixe marcado "Gerar legendas com IA" se quiser que o Claude analise
     e escreva a legenda + hashtags automaticamente
   - Clique em "Continuar"

**2. Configurar agendamento**
   - Escolha quantas vezes por dia postar (1x a 4x)
   - Escolha data/hora de início
   - Clique em "Revisar e Confirmar"

**3. Tela de Revisão**
   - Passe por cada foto (Anterior/Próxima)
   - Veja os dados EXIF (câmera, GPS, data)
   - **Local já vem preenchido automaticamente** se a foto tiver GPS
   - **Escolha uma das 3 legendas da IA** (Criativa / Curta e direta /
     Storytelling) clicando nela — ou escreva a sua no campo de texto
   - Adicione/remova hashtags; o botão **"✨ Gerar da legenda"** cria
     hashtags novas a partir da legenda e do local atuais
   - Marque pessoas (@usuario)
   - Quando terminar todas, clique em "Confirmar e Agendar Todos"

**4. Dashboard**
   - Veja todos os posts: pendentes e já postados
   - Filtre por status
   - Clique no lápis ✏️ para editar legenda/local/hashtags
   - Clique na lixeira 🗑️ para cancelar um post específico

---

## 🧠 Sobre a localização automática

Quando a foto tem dados de GPS (a maioria das fotos tiradas com iPhone
tem, se a permissão de localização estava ativa), o backend:

1. Lê a latitude/longitude da foto
2. Consulta o OpenStreetMap (gratuito, sem necessidade de chave de API)
3. Descobre o nome do lugar mais próximo (ex: "Parque Ibirapuera, São Paulo")
4. Preenche automaticamente o campo "Local" na tela de revisão

Você pode sempre editar manualmente se quiser outro nome.

**Fotos sem GPS** (ex: baixadas da internet, capturas de tela, ou com
localização desativada) vão aparecer com "Sem dados de localização" —
você digita manualmente.

O serviço de geolocalização (Nominatim/OpenStreetMap) limita a 1
consulta por segundo — o backend já respeita esse limite automaticamente
enfileirando as consultas, então se você selecionar 10 fotos de uma vez
com GPS, pode levar alguns segundos a mais — é esperado.

---

## 📸 Sobre fotos HEIC (formato padrão do iPhone)

Fotos tiradas com iPhone geralmente são salvas em `.heic`, um formato
que a maioria dos navegadores não consegue exibir diretamente. O
backend resolve isso automaticamente: assim que você seleciona uma
foto, ela é enviada para o servidor, que:

1. Corrige a rotação (fotos verticais às vezes vêm "deitadas" nos metadados)
2. Converte para JPEG (compatível com qualquer navegador)
3. Extrai os dados EXIF **antes** de converter (senão a informação se perde)
4. Redimensiona se for muito grande (economiza banda e custo de IA)

Você vai ver um pequeno ícone de carregamento na miniatura enquanto isso
acontece — é rápido, geralmente menos de 1 segundo por foto.

**Se aparecer um ⚠️ na miniatura**, a foto não pôde ser processada
(arquivo corrompido, ou o `pillow-heif` não está instalado). Passe o
mouse sobre o ícone para ver a mensagem de erro.

---

## ⚠️ Problemas comuns

**"Backend Desconectado" no navegador**
- Verifique se o terminal com `python3 app.py` ainda está rodando
- Confirme que está acessando a porta certa (1234)

**Fotos não mostram localização**
- A foto pode não ter GPS embutido (comum em fotos editadas ou baixadas)
- Adicione manualmente no campo "Local"

**Erro ao instalar dependências**
```bash
pip3 install -r requirements.txt --break-system-packages
```

**Análise com IA demora muito**
- Normal para várias fotos — cada uma leva alguns segundos
- Se travar, recarregue a página e tente com menos fotos por vez

---

## 💰 Custo estimado

A análise usa o modelo **Claude Opus 4.8** (o melhor para legendas
criativas). Custo real por foto analisada: **~US$ 0,02 (~R$ 0,10)**.
Postando 4x por dia, dá menos de US$ 3/mês.

Quer economizar? Troque o modelo no `.env`:
```
CLAUDE_MODEL=claude-haiku-4-5
```
(~US$ 0,004 por foto, qualidade um pouco menor)

**Importante:** a chave da API precisa estar válida e com créditos.
Crie/renove em https://platform.claude.com/settings/keys e cole no
`backend/.env` na linha `CLAUDE_API_KEY=`.

---

## 🌐 Publicar na internet

O projeto está pronto para virar um site de verdade (acessível de
qualquer lugar, com senha). Siga o **[DEPLOY.md](DEPLOY.md)** — leva
uns 15 minutos usando o Railway (~US$ 5/mês).

---

## 🚀 Próximos passos possíveis

- Integração real com Instagram (postar de verdade, automaticamente)
- Notificações quando um post é publicado
- Estatísticas de engajamento

---

Qualquer erro, tira print da tela e do terminal que a gente resolve! 🚀
