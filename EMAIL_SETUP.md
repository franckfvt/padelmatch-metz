# 📧 Configuration des Emails - PadelMatch

## 1. Créer un compte Resend (gratuit)

1. Aller sur https://resend.com
2. Créer un compte gratuit (3000 emails/mois)
3. Récupérer l'API Key depuis le dashboard

## 2. Configurer les variables d'environnement

Dans `.env.local` (local) ou dans Vercel (production) :

```env
# Email avec Resend
RESEND_API_KEY=re_xxxxxxxxxx

# URL du site (pour les liens dans les emails)
NEXT_PUBLIC_SITE_URL=https://padelmatch.fr
```

## 3. Installer Resend

```bash
npm install resend
```

## 4. Configurer le domaine (optionnel mais recommandé)

Pour envoyer des emails depuis `noreply@padelmatch.fr` :

1. Dans Resend, aller dans "Domains"
2. Ajouter `padelmatch.fr`
3. Configurer les DNS (TXT, DKIM)
4. Valider le domaine

## Types d'emails envoyés

| Type | Quand | À qui |
|------|-------|-------|
| `join_request` | Joueur demande à rejoindre | Organisateur |
| `join_accepted` | Organisateur accepte | Joueur |
| `join_rejected` | Organisateur refuse | Joueur |
| `match_complete` | Partie complète (4/4) | Tous les joueurs |
| `duo_invite` | Invitation coéquipier | Coéquipier |
| `generic_invite` | Invitation à une partie | Invité |

## Mode développement

Sans Resend configuré, les emails sont simulés (log dans la console).
L'application fonctionne normalement, seuls les emails ne partent pas.

## Ajouter un champ email aux profiles (Supabase)

Pour que les notifications fonctionnent, la table `profiles` doit avoir un champ `email` :

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Mettre à jour avec l'email depuis auth.users
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id;

-- Trigger pour garder email synchronisé
CREATE OR REPLACE FUNCTION sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET email = NEW.email WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_email_update
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_email();
```

## Test rapide

```bash
curl -X POST http://localhost:3000/api/emails \
  -H "Content-Type: application/json" \
  -d '{
    "type": "join_request",
    "data": {
      "organizerEmail": "test@example.com",
      "playerName": "Test Player",
      "playerLevel": 5,
      "matchId": 1,
      "matchDate": "samedi 21 décembre",
      "matchTime": "18:00",
      "clubName": "Padel Club Metz"
    }
  }'
```