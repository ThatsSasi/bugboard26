# BugBoard26 🐛

Piattaforma full-stack per la gestione collaborativa di issue in progetti software. Sviluppato come progetto d'esame per il corso di **Ingegneria del Software (A.A. 2025/2026)** presso l'Università degli Studi di Napoli Federico II (DIETI).

Il sistema adotta un'architettura Client-Server distribuita, esponendo API RESTful sicure e offrendo un'interfaccia utente nativa e reattiva.

## ✨ Funzionalità Principali
* **Autenticazione e RBAC:** Accesso sicuro basato su JSON Web Token (JWT) con controllo degli accessi granulare basato sui ruoli (Admin vs Member).
* **Gestione del Ciclo di Vita delle Issue:** Creazione, assegnazione, transizione di stato (TODO, IN PROGRESS, RESOLVED, ARCHIVED) e tracciamento.
* **Audit Trail (Cronologia Immutabile):** Registrazione automatica di ogni operazione critica (cambio stato, riassegnazione) per garantire la tracciabilità delle azioni.
* **Notifiche Real-time:** Avvisi automatici generati dal sistema per assegnazioni di nuovi task e risoluzione dei bug.
* **Dashboard e Reportistica:** Interfaccia dedicata agli amministratori per il monitoraggio delle metriche di progetto e del carico di lavoro del team.

## 🛠️ Stack Tecnologico

### Front-end (Client SPA)
* **Framework:** React con TypeScript (Vite)
* **Styling:** CSS Nativo (Custom Properties, Design System \textit{Jira-style})
* **Networking:** Axios con Request Interceptors per iniezione JWT
* **Gestione Stato & Dati:** Custom Hooks

### Back-end (Server API REST)
* **Ambiente:** Node.js, Express, TypeScript
* **Validazione:** Zod
* **Gestione Asset:** Multer
* **Design Pattern:** Layered Architecture (Controller-Service-Repository)

### Persistenza & DevOps
* **Database:** PostgreSQL
* **ORM:** Prisma
* **Testing:** Jest + `@swc/jest`
* **Containerizzazione:** Docker
