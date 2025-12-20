/**
 * ============================================
 * API EMAILS - SERVICE CENTRALISÉ RESEND
 * ============================================
 * 
 * Types d'emails supportés:
 * 1. join_request - Notification à l'organisateur
 * 2. join_accepted - Confirmation au joueur accepté
 * 3. join_rejected - Notification de refus
 * 4. match_complete - Partie complète, tous notifiés
 * 5. match_reminder - Rappel 24h avant
 * 6. duo_invite - Invitation coéquipier duo
 * 7. generic_invite - Invitation générique
 * 
 * Configuration requise:
 * - RESEND_API_KEY dans .env.local
 * - NEXT_PUBLIC_SITE_URL dans .env.local
 * 
 * ============================================
 */

import { NextResponse } from 'next/server'

// Vérifier si Resend est disponible
let Resend = null
try {
  Resend = require('resend').Resend
} catch (e) {
  console.warn('⚠️ Resend non installé. Exécuter: npm install resend')
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { type, data } = body

    // Vérifier la configuration
    const apiKey = process.env.RESEND_API_KEY
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://padelmatch.fr'
    
    if (!apiKey || !Resend) {
      console.log('📧 [MODE DEV] Email simulé:', type, data)
      return NextResponse.json({
        success: true,
        simulated: true,
        message: 'Email simulé (Resend non configuré)',
        type,
        data
      })
    }

    const resend = new Resend(apiKey)
    
    // Générer l'email selon le type
    const emailContent = generateEmail(type, data, siteUrl)
    
    if (!emailContent) {
      return NextResponse.json({
        success: false,
        error: `Type d'email inconnu: ${type}`
      }, { status: 400 })
    }

    // Envoyer l'email
    const { data: result, error } = await resend.emails.send({
      from: 'PadelMatch <noreply@padelmatch.fr>',
      to: emailContent.to,
      subject: emailContent.subject,
      html: emailContent.html
    })

    if (error) {
      console.error('Erreur Resend:', error)
      throw error
    }

    return NextResponse.json({
      success: true,
      messageId: result?.id,
      type
    })

  } catch (error) {
    console.error('Erreur API emails:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

/**
 * Génère le contenu de l'email selon le type
 */
function generateEmail(type, data, siteUrl) {
  const baseStyle = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background: #ffffff;
  `
  
  const buttonStyle = `
    display: inline-block;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: white;
    padding: 16px 32px;
    border-radius: 12px;
    text-decoration: none;
    font-weight: 600;
    font-size: 16px;
  `
  
  const cardStyle = `
    background: #f8fafc;
    border-radius: 12px;
    padding: 20px;
    margin: 20px 0;
    border: 1px solid #e2e8f0;
  `

  const header = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="font-size: 32px; margin-bottom: 8px;">🎾</div>
      <h1 style="color: #1a1a2e; margin: 0; font-size: 24px;">PadelMatch</h1>
    </div>
  `

  const footer = `
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
    <p style="font-size: 12px; color: #94a3b8; text-align: center;">
      Cet email a été envoyé par PadelMatch.<br>
      <a href="${siteUrl}" style="color: #3b82f6;">padelmatch.fr</a>
    </p>
  `

  switch (type) {
    // =============================================
    // 1. DEMANDE DE REJOINDRE - Notif à l'organisateur
    // =============================================
    case 'join_request':
      return {
        to: data.organizerEmail,
        subject: `🎾 ${data.playerName} veut rejoindre ta partie !`,
        html: `
          <div style="${baseStyle}">
            ${header}
            
            <h2 style="color: #1a1a2e; margin-bottom: 16px;">
              Nouvelle demande pour ta partie !
            </h2>
            
            <p style="font-size: 16px; color: #475569; line-height: 1.6;">
              <strong>${data.playerName}</strong> (Niveau ${data.playerLevel}) souhaite rejoindre ta partie de padel.
            </p>
            
            <div style="${cardStyle}">
              <p style="margin: 0 0 8px 0; color: #64748b;"><strong>📅 Date :</strong> ${data.matchDate}</p>
              <p style="margin: 0 0 8px 0; color: #64748b;"><strong>🕐 Heure :</strong> ${data.matchTime}</p>
              <p style="margin: 0; color: #64748b;"><strong>📍 Lieu :</strong> ${data.clubName}</p>
            </div>
            
            <div style="${cardStyle}">
              <p style="margin: 0 0 8px 0;"><strong>👤 Joueur :</strong> ${data.playerName}</p>
              <p style="margin: 0 0 8px 0;"><strong>⭐ Niveau :</strong> ${data.playerLevel}</p>
              <p style="margin: 0;"><strong>🎯 Position :</strong> ${data.playerPosition || 'Non spécifiée'}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${siteUrl}/dashboard/match/${data.matchId}" style="${buttonStyle}">
                Voir la demande →
              </a>
            </div>
            
            <p style="font-size: 14px; color: #64748b; text-align: center;">
              Tu peux accepter ou refuser cette demande depuis la page de ta partie.
            </p>
            
            ${footer}
          </div>
        `
      }

    // =============================================
    // 2. DEMANDE ACCEPTÉE - Notif au joueur
    // =============================================
    case 'join_accepted':
      return {
        to: data.playerEmail,
        subject: `✅ Tu as été accepté(e) pour la partie de padel !`,
        html: `
          <div style="${baseStyle}">
            ${header}
            
            <h2 style="color: #22c55e; margin-bottom: 16px;">
              🎉 Bonne nouvelle !
            </h2>
            
            <p style="font-size: 16px; color: #475569; line-height: 1.6;">
              <strong>${data.organizerName}</strong> t'a accepté(e) pour sa partie de padel !
            </p>
            
            <div style="${cardStyle}">
              <p style="margin: 0 0 8px 0; color: #64748b;"><strong>📅 Date :</strong> ${data.matchDate}</p>
              <p style="margin: 0 0 8px 0; color: #64748b;"><strong>🕐 Heure :</strong> ${data.matchTime}</p>
              <p style="margin: 0 0 8px 0; color: #64748b;"><strong>📍 Lieu :</strong> ${data.clubName}</p>
              <p style="margin: 0; color: #64748b;"><strong>👥 Équipe :</strong> ${data.team}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${siteUrl}/dashboard/match/${data.matchId}" style="${buttonStyle}">
                Voir la partie →
              </a>
            </div>
            
            <p style="font-size: 14px; color: #64748b; text-align: center;">
              À bientôt sur le terrain ! 🎾
            </p>
            
            ${footer}
          </div>
        `
      }

    // =============================================
    // 3. DEMANDE REFUSÉE - Notif au joueur
    // =============================================
    case 'join_rejected':
      return {
        to: data.playerEmail,
        subject: `😕 Ta demande n'a pas été acceptée`,
        html: `
          <div style="${baseStyle}">
            ${header}
            
            <h2 style="color: #64748b; margin-bottom: 16px;">
              Demande non acceptée
            </h2>
            
            <p style="font-size: 16px; color: #475569; line-height: 1.6;">
              Malheureusement, ta demande pour rejoindre la partie de <strong>${data.organizerName}</strong> n'a pas été acceptée.
            </p>
            
            <p style="font-size: 15px; color: #64748b; line-height: 1.6;">
              ${data.reason || 'L\'organisateur a peut-être déjà trouvé d\'autres joueurs ou cherche un niveau différent.'}
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${siteUrl}/dashboard/explore" style="${buttonStyle}">
                Trouver d'autres parties →
              </a>
            </div>
            
            <p style="font-size: 14px; color: #64748b; text-align: center;">
              Ne te décourage pas, plein d'autres parties t'attendent ! 💪
            </p>
            
            ${footer}
          </div>
        `
      }

    // =============================================
    // 4. PARTIE COMPLÈTE - Notif à tous
    // =============================================
    case 'match_complete':
      return {
        to: data.playerEmail,
        subject: `🎉 Ta partie de padel est complète !`,
        html: `
          <div style="${baseStyle}">
            ${header}
            
            <h2 style="color: #22c55e; margin-bottom: 16px;">
              🎾 Partie complète !
            </h2>
            
            <p style="font-size: 16px; color: #475569; line-height: 1.6;">
              Super ! Les 4 joueurs sont confirmés pour ta partie de padel.
            </p>
            
            <div style="${cardStyle}">
              <p style="margin: 0 0 8px 0; color: #64748b;"><strong>📅 Date :</strong> ${data.matchDate}</p>
              <p style="margin: 0 0 8px 0; color: #64748b;"><strong>🕐 Heure :</strong> ${data.matchTime}</p>
              <p style="margin: 0; color: #64748b;"><strong>📍 Lieu :</strong> ${data.clubName}</p>
            </div>
            
            <div style="${cardStyle}">
              <p style="margin: 0 0 12px 0; font-weight: 600; color: #1a1a2e;">👥 Les joueurs :</p>
              <p style="margin: 0; color: #64748b;">
                <strong>Équipe A :</strong> ${data.teamA.join(', ')}<br>
                <strong>Équipe B :</strong> ${data.teamB.join(', ')}
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${siteUrl}/dashboard/match/${data.matchId}" style="${buttonStyle}">
                Voir les détails →
              </a>
            </div>
            
            <p style="font-size: 14px; color: #64748b; text-align: center;">
              Bonne partie à tous ! 🏆
            </p>
            
            ${footer}
          </div>
        `
      }

    // =============================================
    // 5. INVITATION DUO - Email au coéquipier
    // =============================================
    case 'duo_invite':
      return {
        to: data.partnerEmail,
        subject: `🎾 ${data.inviterName} t'invite à jouer en duo !`,
        html: `
          <div style="${baseStyle}">
            ${header}
            
            <h2 style="color: #1a1a2e; margin-bottom: 16px;">
              Tu es invité(e) à jouer en duo !
            </h2>
            
            <p style="font-size: 16px; color: #475569; line-height: 1.6;">
              <strong>${data.inviterName}</strong> t'invite à faire équipe avec lui/elle pour une partie de padel !
            </p>
            
            <div style="${cardStyle}">
              <p style="margin: 0 0 8px 0; color: #64748b;"><strong>📅 Date :</strong> ${data.matchDate}</p>
              <p style="margin: 0 0 8px 0; color: #64748b;"><strong>🕐 Heure :</strong> ${data.matchTime}</p>
              <p style="margin: 0 0 8px 0; color: #64748b;"><strong>📍 Lieu :</strong> ${data.clubName}</p>
              <p style="margin: 0; color: #64748b;"><strong>👥 Équipe :</strong> ${data.team}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${siteUrl}/join/${data.matchId}?duo=${data.inviterId}&team=${data.team}" style="${buttonStyle}">
                Accepter l'invitation →
              </a>
            </div>
            
            <p style="font-size: 14px; color: #64748b; text-align: center;">
              Tu n'as pas encore de compte ? Tu pourras en créer un en acceptant !
            </p>
            
            ${footer}
          </div>
        `
      }

    // =============================================
    // 6. INVITATION GÉNÉRIQUE
    // =============================================
    case 'generic_invite':
      return {
        to: data.inviteeEmail,
        subject: `🎾 ${data.inviterName} t'invite à jouer au padel !`,
        html: `
          <div style="${baseStyle}">
            ${header}
            
            <h2 style="color: #1a1a2e; margin-bottom: 16px;">
              Invitation à jouer au padel !
            </h2>
            
            <p style="font-size: 16px; color: #475569; line-height: 1.6;">
              <strong>${data.inviterName}</strong> t'invite à rejoindre une partie de padel !
            </p>
            
            <div style="${cardStyle}">
              <p style="margin: 0 0 8px 0; color: #64748b;"><strong>📅 Date :</strong> ${data.matchDate}</p>
              <p style="margin: 0 0 8px 0; color: #64748b;"><strong>🕐 Heure :</strong> ${data.matchTime}</p>
              <p style="margin: 0; color: #64748b;"><strong>📍 Lieu :</strong> ${data.clubName}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${siteUrl}/join/${data.matchId}" style="${buttonStyle}">
                Voir la partie →
              </a>
            </div>
            
            <p style="font-size: 14px; color: #64748b; text-align: center;">
              Tu n'as pas encore de compte ? Tu pourras en créer un en rejoignant !
            </p>
            
            ${footer}
          </div>
        `
      }

    default:
      return null
  }
}