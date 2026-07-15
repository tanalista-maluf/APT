# 🌐 Publicar o AutoPost na internet

Este guia transforma o app local em um site acessível de qualquer lugar
(celular na rua, outro computador, etc). O projeto já está preparado:
tem `Dockerfile`, banco SQLite, senha de acesso e servidor de produção
(gunicorn) configurados.

---

## Antes de começar (obrigatório)

1. **Chave da API do Claude válida** — a análise das fotos precisa dela.
   - Crie em: https://platform.claude.com/settings/keys
   - Guarde a chave (começa com `sk-ant-api03-...`)

2. **Defina uma senha de acesso** — o app na internet fica aberto para o
   mundo; a senha impede estranhos de usarem sua chave da API.
   Você vai configurá-la como variável `APP_PASSWORD` na plataforma.

3. **Suba o projeto para o GitHub** (repositório **privado**):
   ```bash
   cd ~/Documents/autopost-webapp
   git init          # se ainda não for um repositório
   git add .
   git commit -m "AutoPost webapp"
   # crie um repositório PRIVADO em github.com/new e depois:
   git remote add origin https://github.com/SEU_USUARIO/autopost-webapp.git
   git push -u origin main
   ```
   O arquivo `.gitignore` já impede que o `.env` (com suas chaves) e a
   pasta `data/` (fotos e banco) sejam enviados.

---

## Opção recomendada: Railway (~US$ 5/mês)

O Railway é o caminho mais simples para quem não é dev: conecta no
GitHub, detecta o `Dockerfile` sozinho e dá um domínio HTTPS pronto.

1. Crie a conta em https://railway.com (login com GitHub, plano Hobby).

2. **New Project → Deploy from GitHub repo** → escolha `autopost-webapp`.
   Ele encontra o `Dockerfile` e faz o build sozinho.

3. **Volume (essencial!)** — sem isso as fotos e o banco somem a cada
   atualização:
   - Clique no serviço → aba **Settings** → **Volumes** → **Add Volume**
   - Mount path: `/data`

4. **Variáveis** — aba **Variables**, adicione:
   | Nome | Valor |
   |---|---|
   | `CLAUDE_API_KEY` | sua chave `sk-ant-api03-...` |
   | `APP_PASSWORD` | a senha que você quer usar para entrar no app |
   | `COOKIE_SECURE` | `1` |

5. **Domínio** — aba **Settings** → **Networking** → **Generate Domain**.
   Pronto: o app fica em `https://autopost-webapp-xxxx.up.railway.app`.

Para atualizar o app depois: `git push` — o Railway refaz o deploy sozinho.

---

## Alternativa: Render (~US$ 7/mês)

1. Conta em https://render.com → **New → Web Service** → conecte o repo.
2. Runtime: **Docker** (detectado automaticamente).
3. Plano **Starter** (o plano Free não tem disco persistente — as fotos
   sumiriam a cada deploy).
4. **Disks → Add Disk**: mount path `/data`, 1 GB.
5. **Environment**: mesmas variáveis da tabela acima.

---

## Alternativa grátis: continuar local + acesso remoto

Se não quiser pagar mensalidade: o app continua rodando no seu Mac
(`./start.sh`) e você instala o [Tailscale](https://tailscale.com)
(grátis) no Mac e no celular. Ele cria uma rede privada — você acessa
`http://SEU-MAC:1234` do celular em qualquer lugar, sem expor nada à
internet. Limitação: o Mac precisa estar ligado.

---

## Testar o Docker localmente (opcional)

```bash
cd ~/Documents/autopost-webapp
docker build -t autopost .
docker run -p 8080:8080 --env-file backend/.env -v autopost_data:/data autopost
# abra http://localhost:8080
```

---

## Resumo das variáveis de ambiente

| Variável | Para que serve | Obrigatória? |
|---|---|---|
| `CLAUDE_API_KEY` | Chave da API (legendas com IA) | Sim |
| `APP_PASSWORD` | Senha de acesso ao app | Sim na internet |
| `PUBLIC_BASE_URL` | Endereço público HTTPS do app (o Instagram busca a foto aí) | Sim p/ publicar no IG |
| `COOKIE_SECURE` | `1` quando o site roda em HTTPS | Recomendado |
| `CLAUDE_MODEL` | Modelo de IA (padrão `claude-opus-4-8`) | Não |
| `META_APP_ID` / `META_APP_SECRET` | App da Meta (troca token curto por longo) | Não |
| `ENABLE_SCHEDULER` | Liga o agendador que publica sozinho (padrão `1`) | Não |
| `SECRET_KEY` | Assinatura do cookie de login (gerada sozinha se faltar) | Não |
| `PORT` | Porta do servidor (a plataforma define sozinha) | Não |

---

## 📸 Publicação automática no Instagram (depois do deploy)

A publicação real só funciona **com o app já publicado na internet** (o
Instagram precisa alcançar a foto num link público). Ordem:

1. **Deploy primeiro** (passos acima). Anote o domínio gerado, ex:
   `https://autopost-tabajara.up.railway.app`.

2. **Defina `PUBLIC_BASE_URL`** nas variáveis do Railway com esse domínio
   exato (com `https://`, sem barra no final). Sem isso, o app conecta a
   conta mas não consegue publicar.

3. **Requisitos da conta** (exigência do Instagram, não do app):
   - Conta **Profissional** (Comercial ou Criador) — você já tem ✅
   - Vinculada a uma **Página do Facebook** — você já tem ✅

4. **Gere o token de acesso** no painel da Meta
   (https://developers.facebook.com):
   - No seu app da Meta, adicione o produto **Instagram** / **Graph API**.
   - Use o **Graph API Explorer** para gerar um token com as permissões
     `instagram_basic`, `instagram_content_publish`, `pages_show_list` e
     `business_management`.
   - Pegue também o **ID da sua conta Instagram** (o Explorer mostra, ou
     via `GET /me/accounts` → `instagram_business_account`).

5. **Conecte no app**: abra **Configurações → Conta do Instagram**, cole o
   **ID da conta** e o **token**, clique em **Conectar e validar**. O app
   confere com o Instagram e, se estiver tudo certo, mostra seu @usuário.
   (Se você preencheu `META_APP_ID`/`SECRET`, o app já troca o token curto
   por um de ~60 dias automaticamente.)

6. **Pronto.** A partir daí, na hora agendada o "carteiro" (agendador)
   publica sozinho. Você também pode testar na hora: **Histórico → 📤** num
   post pendente → confirma → publica na hora.

> ⚠️ Sobre publicar para **outras** contas além da sua: aí o app precisaria
> passar pela **App Review** da Meta (processo à parte, com verificação de
> negócio). Para publicar na **sua própria** conta, o token que você gera
> já basta.

> **Legenda + hashtags** vão juntas para o Instagram. **Localização** e
> **marcação de pessoas** ficam guardadas no app mas não sobem
> automaticamente — a API de publicação do Instagram não suporta isso de
> forma simples (limitação do Instagram, não do app).
