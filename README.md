# TD_EPSI# TD EPSI – Application conteneurisée (API + DB + Front)

## 1. Architecture

L’application est composée de trois services :

- **db** : base PostgreSQL (`postgres:15-alpine`)  
  - Initialise automatiquement le schéma à partir de `init.sql`.  
  - Persistance des données via le volume `postgres_data`.

- **api** : API Node.js / Express  
  - Route `GET /status` : renvoie `OK`.  
  - Route `GET /items` : retourne la liste des éléments stockés dans la table `items`.  
  - Connexion à PostgreSQL via les variables d’environnement (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).  
  - Expose le port 3000 dans le conteneur, mappé sur 3001 côté hôte.

- **frontend** : site web statique  
  - Servi par Nginx (`nginx:alpine`).  
  - Le JavaScript interroge l’API et affiche dynamiquement la liste des items.  
  - Expose le port 80 dans le conteneur, mappé sur 3000 côté hôte.

Les services communiquent sur le réseau Docker par défaut, piloté par `docker-compose.yml`.

## 2. Prérequis

- Docker et Docker Compose installés.  
- Accès à Internet pour télécharger les images de base.

## 3. Configuration

Les variables sensibles sont définies dans un fichier `.env` (à créer à la racine) :

DB_HOST=db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=appdb
PORT=3000


Ces valeurs sont injectées automatiquement dans les services via `docker-compose.yml`.

## 4. Construction et lancement

### Lancement rapide

docker compose up --build

Puis :

- Frontend : http://localhost:3000  
- API status : http://localhost:3001/status  
- API items : http://localhost:3001/items  

Pour lancer en arrière-plan :

docker compose up -d

### Arrêt

docker compose down # conserve les données
docker compose down -v # supprime aussi le volume Postgres


## 5. Détails des images et optimisations

### API

- Dockerfile multi‑étapes basé sur `node:25-alpine`.  
- Stage `builder` : installation des dépendances de production avec `npm install --only=production`.  
- Stage final : copie des `node_modules` et du code, exécution sous un utilisateur non‑root `appuser`.  
- `.dockerignore` pour exclure `node_modules`, `.git`, `.env`, etc.

**Taille estimée de l’image API** :  
- Sans optimisation (image Node complète + outils de build) : ~800–900 Mo.  
- Avec multi‑étapes et `alpine` : ~165 Mo.  
Ce qui représente un gain d’environ 70–80 % grâce au multi‑stage et à l’image de base légère.

### Frontend

- Dockerfile multi‑étapes minimal :  
  - Stage `builder` basé sur `alpine:3` qui contient les fichiers statiques.  
  - Stage final basé sur `nginx:alpine` qui ne contient que le `index.html`.  

**Taille estimée de l’image frontend** :

- Nginx `alpine` + fichiers statiques : ~53 Mo.  
- Un conteneur Node complet servant le front pourrait dépasser plusieurs centaines de Mo.  

## 6. Orchestration et healthchecks

Le fichier `docker-compose.yml` :

- Déclare les 3 services (`db`, `api`, `frontend`), le volume `postgres_data` et le réseau par défaut.  
- Gère les dépendances avec `depends_on` et des healthchecks :

  - **db** : `pg_isready -U postgres`  
  - **api** : commande simple (vérification du process Node ou ping HTTP)  

Les services frontend et API ne démarrent réellement qu’une fois la base déclarée saine.

## 7. Sécurité

- Exécution de l’API sous un utilisateur non‑root (`appuser`).  
- Utilisation d’images `alpine`, plus petites et avec une surface d’attaque réduite.  
- Pas de secrets en dur dans les images, tout passe par les variables d’environnement.  

Des commandes sont prévues dans `deploy.sh` pour :

- activer Docker Content Trust et signer les images,  
- lancer des scans de vulnérabilités sur les images.

## 8. Automatisation

Le script `deploy.sh` automatise :

1. La construction des images (`docker compose build` + `docker build ...`).  
2. La validation de la configuration (`docker compose config`).  
3. Le taggage, la signature et le push des images vers un registre (si configuré). https://hub.docker.com/repositories/sawayuuh 
4. Le déploiement de la stack : `docker compose up -d`.

Usage :

chmod +x deploy.sh
./deploy.sh


## 9. Difficultés rencontrées et améliorations possibles

- **CORS** :  
  - Problèmes initiaux entre le front (port 3000) et l’API (port 3001).  
  - Résolus par la configuration CORS côté API et l’ajustement des appels `fetch`.

- **Healthchecks** :  
  - Ajustement des commandes (pas de `wget` ou `nc` par défaut dans les images Alpine).  

- **Nginx en non‑root** :  
  - Erreurs liées aux permissions des dossiers de cache et du PID, résolues en revenant à la configuration standard de `nginx:alpine`.

**Améliorations futures** :

- Ajouter une vraie CI/CD (GitHub Actions, GitLab CI) pour automatiser tests, scan de sécurité et déploiement.  
- Gérer le scaling horizontal (plusieurs réplicas d’API) et la haute disponibilité.  
- Ajouter des métriques (Prometheus) et une stack de logs centralisée (ELK/EFK).  

---