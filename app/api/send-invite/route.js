/**
 * ============================================
 * API ENVOI D'INVITATION PAR EMAIL
 * ============================================
 * 
 * Configuration requise:
 * 1. npm install resend
 * 2. Ajouter RESEND_API_KEY dans .env.local
 * 3. Créer un compte sur resend.com (gratuit 100 emails/jour)
 * 
 * ============================================
 */

import { NextResponse } from 'next/server'
import { Resend } from 'resend'

// Initialiser Resend seulement si la clé est présente
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null

export async function POST(request) {
  try {
    const body = await request.json()
    const { 
      inviteToken,
      inviteeName, 
      inviteeContact, 
      inviterName, 
      matchDate, 
      matchTime,
      clubName 
    } = body

    // Vérifier que c'est un email
    const isEmail = inviteeContact?.includes('@')
    
    if (!isEmail) {
      return NextResponse.json({ 
        success: false, 
        error: 'Contact invalide (email requis)' 
      }, { status: 400 })
    }

    // URL d'invitation
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'https://padelmatch.fr'
    const inviteUrl = `${baseUrl}/join-invite/${inviteToken}`

    // Formater la date
    let dateFormatted = 'Date flexible'
    if (matchDate) {
      dateFormatted = new Date(matchDate).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      })
    }

    // Si Resend n'est pas configuré
    if (!resend) {
      console.log('⚠️ RESEND_API_KEY non configuré')
      console.log('📧 Email invitation:')
      console.log(`   To: ${inviteeContact}`)
      console.log(`   URL: ${inviteUrl}`)
      
      return NextResponse.json({ 
        success: true, 
        inviteUrl,
        warning: 'Service email non configuré. Ajoutez RESEND_API_KEY dans les variables d\'environnement.'
      })
    }

    // Envoyer l'email avec Resend
    const { data, error } = await resend.emails.send({
      from: 'PadelMatch <onboarding@resend.dev>', // Utiliser ce domaine en dev
      to: inviteeContact,
      subject: `🎾 ${inviterName} t'invite à jouer au padel !`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5;">
          <div style="max-width: 500px; margin: 0 auto; padding: 20px;">
            
            <!-- Header -->
            <div style="text-align: center; padding: 30px 20px; background: linear-gradient(135deg, #22c55e, #16a34a); border-radius: 16px 16px 0 0;">
              <div style="font-size: 40px; margin-bottom: 10px;">🎾</div>
              <h1 style="color: #fff; margin: 0; font-size: 24px;">PadelMatch</h1>
            </div>
            
            <!-- Content -->
            <div style="background: #fff; padding: 30px; border-radius: 0 0 16px 16px;">
              
              <h2 style="color: #1a1a2e; margin: 0 0 20px; font-size: 22px;">
                Salut ${inviteeName || 'toi'} ! 👋
              </h2>
              
              <p style="font-size: 16px; color: #333; line-height: 1.6; margin: 0 0 20px;">
                <strong>${inviterName}</strong> t'invite à jouer au padel en duo !
              </p>
              
              <!-- Détails de la partie -->
              <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;">📅 Date</td>
                    <td style="padding: 8px 0; color: #1a1a2e; font-weight: 600; text-align: right;">${dateFormatted}</td>
                  </tr>
                  ${matchTime ? `
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;">🕐 Heure</td>
                    <td style="padding: 8px 0; color: #1a1a2e; font-weight: 600; text-align: right;">${matchTime}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;">📍 Lieu</td>
                    <td style="padding: 8px 0; color: #1a1a2e; font-weight: 600; text-align: right;">${clubName || 'À définir'}</td>
                  </tr>
                </table>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteUrl}" style="
                  display: inline-block;
                  background: linear-gradient(135deg, #22c55e, #16a34a);
                  color: #fff;
                  padding: 16px 40px;
                  border-radius: 12px;
                  text-decoration: none;
                  font-weight: 700;
                  font-size: 16px;
                ">
                  Accepter l'invitation →
                </a>
              </div>
              
              <p style="font-size: 13px; color: #64748b; text-align: center; margin: 20px 0 0;">
                Tu n'as pas encore de compte ? Pas de souci, tu pourras en créer un en acceptant !
              </p>
              
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
              <p style="margin: 0;">Envoyé par PadelMatch</p>
              <p style="margin: 5px 0 0;">
                <a href="${baseUrl}" style="color: #22c55e; text-decoration: none;">padelmatch.fr</a>
              </p>
            </div>
            
          </div>
        </body>
        </html>
      `
    })

    if (error) {
      console.error('Erreur Resend:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 })
    }

    console.log('✅ Email envoyé:', data)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Invitation envoyée par email',
      inviteUrl,
      emailId: data?.id
    })

  } catch (error) {
    console.error('Erreur send-invite:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}