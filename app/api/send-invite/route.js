// app/api/send-invite/route.js
// API pour envoyer les invitations par email
// Nécessite Resend (npm install resend) ou autre service email

import { NextResponse } from 'next/server'

// Option 1: Avec Resend (recommandé, gratuit jusqu'à 100 emails/jour)
// import { Resend } from 'resend'
// const resend = new Resend(process.env.RESEND_API_KEY)

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

    // Détecter si c'est un email ou un téléphone
    const isEmail = inviteeContact.includes('@')
    const isPhone = /^(\+33|0)[0-9]{9}$/.test(inviteeContact.replace(/\s/g, ''))

    // URL d'invitation
    const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://padelmatch-beige.vercel.app'}/join-invite/${inviteToken}`

    // Formater la date
    const dateFormatted = new Date(matchDate).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })

    if (isEmail) {
      // =============================================
      // OPTION 1: Avec Resend (décommenter si installé)
      // =============================================
      /*
      const { data, error } = await resend.emails.send({
        from: 'PadelMatch <noreply@padelmatch.fr>',
        to: inviteeContact,
        subject: `🎾 ${inviterName} t'invite à jouer au padel !`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2e7d32; margin: 0;">🎾 PadelMatch</h1>
            </div>
            
            <h2 style="color: #1a1a1a;">Salut ${inviteeName} !</h2>
            
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              <strong>${inviterName}</strong> t'invite à jouer au padel en duo avec lui/elle !
            </p>
            
            <div style="background: #f5f5f5; border-radius: 12px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>📅 Date :</strong> ${dateFormatted}</p>
              <p style="margin: 0 0 10px 0;"><strong>🕐 Heure :</strong> ${matchTime}</p>
              <p style="margin: 0;"><strong>📍 Lieu :</strong> ${clubName}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}" style="
                display: inline-block;
                background: #2e7d32;
                color: white;
                padding: 16px 32px;
                border-radius: 12px;
                text-decoration: none;
                font-weight: 600;
                font-size: 16px;
              ">
                Accepter l'invitation
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; text-align: center;">
              Tu n'as pas encore de compte ? Pas de souci, tu pourras en créer un en acceptant l'invitation !
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center;">
              Cet email a été envoyé par PadelMatch. Si tu n'as pas demandé cette invitation, tu peux ignorer cet email.
            </p>
          </div>
        `
      })

      if (error) throw error
      */

      // =============================================
      // OPTION 2: Sans service email (log seulement)
      // =============================================
      console.log('📧 Email invitation à envoyer:')
      console.log(`   To: ${inviteeContact}`)
      console.log(`   From: ${inviterName}`)
      console.log(`   Date: ${dateFormatted} à ${matchTime}`)
      console.log(`   Lieu: ${clubName}`)
      console.log(`   URL: ${inviteUrl}`)
      
      // Pour le moment, retourner succès même sans envoi réel
      // L'utilisateur verra le lien dans la modal de succès

      return NextResponse.json({ 
        success: true, 
        message: 'Invitation créée',
        inviteUrl,
        note: 'Email non envoyé - service email non configuré. Partagez le lien manuellement.'
      })
    }

    if (isPhone) {
      // =============================================
      // SMS avec Twilio (à implémenter si besoin)
      // =============================================
      console.log('📱 SMS invitation à envoyer:')
      console.log(`   To: ${inviteeContact}`)
      console.log(`   Message: ${inviterName} t'invite à jouer au padel le ${dateFormatted} ! ${inviteUrl}`)

      return NextResponse.json({ 
        success: true, 
        message: 'Invitation créée',
        inviteUrl,
        note: 'SMS non envoyé - service SMS non configuré. Partagez le lien manuellement.'
      })
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Contact invalide (ni email ni téléphone)' 
    }, { status: 400 })

  } catch (error) {
    console.error('Erreur send-invite:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}