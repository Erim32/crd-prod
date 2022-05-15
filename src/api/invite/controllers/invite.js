'use strict';
/**
 *  Controller de gestion des inscriptions de la CRD
 */
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
const fs = require('fs');
const nodeMailer = require('nodemailer');

const SEND_REAL_EMAIL = true
const EMAIL_CONFIG = {
  date : "Vendredi 17 Juin 2022",
  heure : "19h00",
  lieu : "au batiment administratif de l'Université Paul Sabatier - Toulouse",
}

/**
 *  Configuration de l'API de Google
 */
const myOAuth2Client = new OAuth2(
  "929950622535-gaaa8u0a0klljvppftpb3iu1jgke5slc.apps.googleusercontent.com",
  "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",
)

myOAuth2Client.setCredentials({
  refresh_token: "1//04LY09hJhQcFbCgYIARAAGAQSNwF-L9IrX4sIW9nAvpHemKqhqHsxQ8cU8xvfQ7FAjKUoA--1gf41mP77jJ3iaat5Gw_aoFA6zTU"
});

const regexEmailValidation = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const CHECK_ONE_INSCRIPTION_PER_PERSON = false

/* ----------------------------------------------- *
 * Fonctions utilitaitres
 * ----------------------------------------------- */

function setError(message, response) {
  response.status = 'error';
  response.data.message = message;
  return response;
}

function setSuccess(message, response) {
  response.status = 'success';
  response.data.message = message;
  return response;
}

function firstLetterToUpperCase(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function sendMail(destinator='', subject='', messagehtml = "") {
  const GOOGLE_CLOUD_CONSOLE_EMAIL_ACCOUNT = "ceremonie-diplomes@miage.org"
  const accessToken = myOAuth2Client.getAccessToken();
  const transporter = nodeMailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: GOOGLE_CLOUD_CONSOLE_EMAIL_ACCOUNT, //your gmail account you used to set the project up in google cloud console"
      clientId: " 929950622535-gaaa8u0a0klljvppftpb3iu1jgke5slc.apps.googleusercontent.com",
      clientSecret: "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",
      refreshToken: "1//04LY09hJhQcFbCgYIARAAGAQSNwF-L9IrX4sIW9nAvpHemKqhqHsxQ8cU8xvfQ7FAjKUoA--1gf41mP77jJ3iaat5Gw_aoFA6zTU",
      accessToken: accessToken, //access token variable we defined earlier
      tls: {
        rejectUnauthorized: false
      },
      secure: false,
      debug: true
    }
  });

  let mailOptions = {
    from: 'MIAGE de Toulouse <ceremonie-diplomes@miage.org>',
    replyTo: 'MIAGE de Toulouse <ceremonie-diplomes@miage.org>',
    to: destinator,
    subject: subject,
    html: messagehtml
  };
  //Envoi de l'email de confirmation
  if(SEND_REAL_EMAIL){
    transporter.sendMail(mailOptions, function (error) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent to " + destinator);
      }
    });
  }else{
    console.log("[DEBUG] Email sent to " + destinator);
  }
  // Fermeture de la connexion
  transporter.close();
}


async function debugSendEmailTemplateTester(ctx, title='Save the Date !', file="public/emails/email-save-the-date.html"){
  const emailAdress = ctx.params.email
  // Envoi de l'email de confirmation
 let emailHTML = await fs.readFileSync(file, 'utf8')
 // Replace the placeholders with the data
 let nom = ""
 let prenom = ""
 emailHTML = emailHTML.replace('{{nom}}', nom)
 emailHTML = emailHTML.replace('{{prenom}}', prenom)
 emailHTML = emailHTML.replace('{{date}}', EMAIL_CONFIG.date)
 emailHTML = emailHTML.replace('{{heure}}', EMAIL_CONFIG.heure)
 emailHTML = emailHTML.replace('{{lieu}}', EMAIL_CONFIG.lieu)
 if(emailAdress){
   // check email format using regex
   if (regexEmailValidation.test(emailAdress)) {
     sendMail(emailAdress, "[DEBUG] "+title, emailHTML)
     return ctx.send("Email "+title+" envoyé a " + emailAdress + " avec succès.", 400)
   }else{
     return ctx.send("Email invalide", 400)
   }
 }
 return ctx.send(emailHTML, 200)
}

module.exports = {

  async create(ctx) {
    // Format de la réponse
    let response = {
      status: 'success',
      data: {
        message: 'Inscription effectuée avec succès'
      }
    };
    // Extraction des données du body
    let body = ctx.request.body
    //console.log("body", body)

    // Verification des données reçues
    if (!body) {
      response = setError('Données manquantes', response);
      return ctx.send(response, 418)
    }

    if (!body.CGU) {
      response = setError('L\'acceptation des CGU est requis', response);
      return ctx.send(response, 418)
    }

    if (!body.email) {
      response = setError('L\'Email est requis', response);
      return ctx.send(response, 418)
    }

    if (!body.nom) {
      response = setError('Le Nom est requis', response);
      return ctx.send(response, 418)
    }

    if (!body.prenom) {
      response = setError('Le Prenom est requis', response);
      return ctx.send(response, 418)
    }

    if (!body.type) {
      response = setError('Le Type est requis', response);
      return ctx.send(response, 418)
    }

    // Verification de cohérence sur les champs secondaires
    if (body.promotion && ! String(body?.promotion).match(/^[0-9]{4}$/)) {
      response = setError('La Promotion n\'est pas valide', response);
      return ctx.send(response, 418)
    }

    // Formatage du type d'apres l'enum attendu :  DIPLOME, ETUDIANT, UNIVERSITAIRE, ENTREPRISE, AUTRE
    if (body.type === 'etudiant') {
      body.type = 'ETUDIANT'
    }
    if (body.type === 'universitaire') {
      body.type = 'UNIVERSITAIRE'
    }
    if (body.type === 'entreprise') {
      body.type = 'ENTREPRISE'
    }
    if (body.type === 'DIPLOME') {
      body.type = 'DIPLOME'
    }
    if (body.type === 'autre') {
      body.type = 'AUTRE'
    }

    // Formatage des données pour avoir un jeu de données valide et homogène
    body.nom = body.nom.toUpperCase()
    body.prenom = firstLetterToUpperCase(body.prenom)
    body.email = body.email.toLowerCase()

    if (body.entreprise) {
      body.entreprise = body.entreprise.toUpperCase()
    }


    // Verification de l'unicité de l'email
    let isAlreadyExist = await (await strapi.entityService.findMany('api::invite.invite')).find(invite => invite.email === body.email)
    //console.log("isAlreadyExist", isAlreadyExist)
    if (CHECK_ONE_INSCRIPTION_PER_PERSON && isAlreadyExist) {
      response = setError('Cet email est deja enregistré', response);
      return ctx.send(response, 418)
    }

    // Création de l'invité dans le format attendu par le service
    let newObj = {
      nom: body.nom,
      prenom: body.prenom,
      email: body.email,
      type: body?.type,
      promotion: body?.promotion + "",
      entreprise: body?.entreprise,
      nbAccompagnant: body?.accompagnants?.length,
    }

    // Envoi de l'invité au service
    const newInscription = await strapi.entityService.create('api::invite.invite', { data: newObj })
    // Inscription des différents accompagnants
    if (body.accompagnants) {
      for (let accompagnant of body.accompagnants) {
        // Creation d'un nouvel accompagnant a inscrire
        if (accompagnant?.nom && accompagnant?.prenom) {
          let newObjAccompagnant = {
            nom: accompagnant?.nom.toLowerCase(),
            prenom: firstLetterToUpperCase(accompagnant?.prenom),
            invite: newInscription.id,
          }

          // Enregistrement
          const newAccompagnant = await strapi.entityService.create('api::accompagnant.accompagnant', { data: newObjAccompagnant })
        }
      }
    }

    // Envoi de l'email de confirmation
    let emailConfirmationHTML = await fs.readFileSync('public/emails/email-confirmation-inscription.html', 'utf8')
    // Replace the placeholders with the data
    emailConfirmationHTML = emailConfirmationHTML.replace('{{nom}}', body.nom)
    emailConfirmationHTML = emailConfirmationHTML.replace('{{prenom}}', body.prenom)
    emailConfirmationHTML = emailConfirmationHTML.replace('{{date}}', EMAIL_CONFIG.date)
    emailConfirmationHTML = emailConfirmationHTML.replace('{{heure}}', EMAIL_CONFIG.heure)
    emailConfirmationHTML = emailConfirmationHTML.replace('{{lieu}}', EMAIL_CONFIG.lieu)
    sendMail(body.email, "Confirmation d'inscription", emailConfirmationHTML)
    setSuccess('Inscription effectuée avec succès', response);
    return ctx.send(response, 200)
  },

  /**
   *  Get all invités.
   * @param {*} ctx
   */
  async get(ctx) {
    ctx.body = await strapi.entityService.findMany('api::invite.invite')
  },


  /**
   *  Get all stats
   * @param {*} ctx
   */
  async getStats(ctx) {
    const accompangants = await strapi.entityService.findMany('api::accompagnant.accompagnant')
    const invites = await strapi.entityService.findMany('api::invite.invite')
    return ctx.send(
      {
        date : new Date(),
        total : invites.length + accompangants.length,
        nbInvites: invites.length,
        nbAccompagnants: accompangants.length,
        nbInvitesParType: invites.reduce((acc, invite) => {
          if (acc[invite.type]) {
            acc[invite.type] += 1
          } else {
            acc[invite.type] = 1
          }
          return acc
        }
          , {})
        ,
        nbInvitesParPromotion: invites.reduce((acc, invite) => {
          if (invite.promotion) {
            if (acc[invite.promotion]) {
              acc[invite.promotion] += 1
            } else {
              acc[invite.promotion] = 1
            }
          }
          return acc
        }
        , {}),
        nbInvitesParEntreprise: invites.reduce((acc, invite) => {
          if (invite.entreprise) {
            if (acc[invite.entreprise]) {
              acc[invite.entreprise] += 1
            } else {
              acc[invite.entreprise] = 1
            }
          }
          return acc
        }
        , {})
      }, 200)
  },

  /**
   *  Get all accompagnants
   * @param {*} ctx
   */
  async getAccompagnants(ctx) {
    const accompangants = await strapi.entityService.findMany('api::accompagnant.accompagnant')
    return ctx.send(accompangants, 200)
  },


  /**
 *  Get all accompagnants au format CSV.
 * @param {*} ctx
 */
  async getAccompagnantsCSV(ctx) {
    let contentCSV = ""
    const accompangants = await strapi.entityService.findMany('api::accompagnant.accompagnant')
    // construction de l'entete du fichier dynamiquement a partir des attributs avec objectKey
    if (accompangants.length > 0) {
      let objectKeys = Object.keys(accompangants[0])
      let header = objectKeys.join(';')
      contentCSV += header + '\n'
      // construction du contenu du fichier dynamiquement
      for (let accompagnant of accompangants) {
        let line = ""
        for (let objectKey of objectKeys) {
          line += `${accompagnant[objectKey]};`
        }
        contentCSV += line.substring(0, line.length - 1) + '\n'
      }

    } else {
      contentCSV = "Aucun accompagnant dans la base de données"
    }

    return ctx.send(contentCSV, 200)
  },

    /**
   *  Get all accompagnants
   * @param {*} ctx
   */
     async testEmailSave(ctx) {
      return debugSendEmailTemplateTester(ctx, "Save the date !", 'public/emails/email-save-the-date.html')
    },

    async testEmailInscription(ctx) {
      return debugSendEmailTemplateTester(ctx, "Invitation cérémonie de remise de diplomes !", 'public/emails/email-ouverture-inscription.html')
   },

   async testEmailConfirmationInscription(ctx) {
   return debugSendEmailTemplateTester(ctx, "Invitation cérémonie de remise de diplomes !", 'public/emails/email-confirmation-inscription.html')
   },

}
