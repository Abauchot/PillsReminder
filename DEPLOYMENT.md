# Déploiement sur Railway.app (Gratuit)

## Pourquoi Railway?

Railway offre **500 heures gratuites par mois** (environ $5 de crédit), ce qui est largement suffisant pour faire tourner un bot Discord 24/7.

## Étape 1 : Préparer le code

Votre code est déjà prêt! Vous devez juste créer un repository Git.

```bash
cd /Users/abauchot/Desktop/PillsReminder
git init
git add .
git commit -m "Initial commit - Discord Medication Reminder Bot"
```

## Étape 2 : Créer un compte GitHub et pousser le code

1. Allez sur [GitHub.com](https://github.com) et créez un compte (gratuit)
2. Créez un nouveau repository (cliquez sur le + en haut à droite)
   - Nom: `PillsReminder` ou autre nom de votre choix
   - Laissez-le **Public** ou **Private** (les deux fonctionnent)
   - NE COCHEZ PAS "Add a README file"
3. Suivez les instructions pour pousser votre code:

```bash
git remote add origin https://github.com/VOTRE_USERNAME/PillsReminder.git
git branch -M main
git push -u origin main
```

## Étape 3 : Déployer sur Railway.app

1. Allez sur [Railway.app](https://railway.app)
2. Cliquez sur **"Start a New Project"**
3. Connectez-vous avec votre compte GitHub
4. Cliquez sur **"Deploy from GitHub repo"**
5. Sélectionnez votre repository `PillsReminder`
6. Railway détectera automatiquement que c'est un projet Node.js

## Étape 4 : Ajouter les variables d'environnement

1. Une fois le projet créé, cliquez sur votre service
2. Allez dans l'onglet **"Variables"**
3. Cliquez sur **"New Variable"** et ajoutez:
   - Key: `DISCORD_TOKEN`
     Value: `votre_token_discord`

   - Key: `CHANNEL_ID`
     Value: `1462115507166646335`

**IMPORTANT**: Régénérez votre token Discord dans le Developer Portal avant de le mettre ici, car l'ancien a été exposé dans notre conversation.

## Étape 5 : Déployer

Railway va automatiquement:
- Installer les dépendances (`npm install`)
- Démarrer le bot (`npm start`)

Le bot sera actif 24/7!

## Vérification

1. Allez dans l'onglet **"Deployments"**
2. Cliquez sur le dernier déploiement
3. Allez dans **"View Logs"**
4. Vous devriez voir:
   ```
   Logged in as Meds#9530
   Bot is ready!
   Cron jobs scheduled successfully
   Bot is now running - Daily reminder at 9:00 AM, hourly re-pings
   ```

## Mise à jour du bot

Quand vous voulez modifier le code:

```bash
# Faites vos modifications dans les fichiers
git add .
git commit -m "Description des changements"
git push
```

Railway détectera automatiquement les changements et redéploiera le bot!

## Gestion du crédit gratuit

- Railway vous donne **$5 de crédit gratuit par mois** (environ 500 heures)
- Un bot Discord utilise très peu de ressources
- Vous pouvez voir votre utilisation dans le dashboard Railway
- Si vous dépassez, ils vous demanderont de payer, mais un simple bot Discord ne dépassera jamais

## Notes importantes

- Le bot redémarre automatiquement en cas d'erreur
- Les logs sont disponibles dans le dashboard Railway
- Vous pouvez mettre le bot en pause si nécessaire (pour économiser du crédit)
- Railway garde votre projet même si vous ne l'utilisez pas

## Alternative: Hébergement local avec PM2

Si vous préférez héberger le bot sur votre propre ordinateur (gratuit, mais il doit rester allumé):

```bash
npm install -g pm2
pm2 start bot.js --name "meds-reminder"
pm2 save
pm2 startup
```
