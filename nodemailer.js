const nodemailer = require("nodemailer");
const googleApis = require("googleapis");
const REDIRECT_URI = `https://developers.google.com/oauthplayground`;
const CLIENT_ID = `724018725887-5vl15ha4g5h8ekfq88gqdprl0bug87cj.apps.googleusercontent.com`;
const CLIENT_SECRET = `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`;
const REFRESH_TOKEN = `1//04bCoXea_Ep4-CgYIARAAGAQSNwF-L9IrAO6Y6vS0GXO8dbZwYFIlsmDgEe0ss-WipuOChOJo3wMbzc0TIxP1I4oLIR5lv8eSwbc`;
const authClient = new googleApis.google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET,
    REDIRECT_URI);


authClient.setCredentials({ refresh_token: REFRESH_TOKEN });
async function mailer(email, otp, userid) {
    try {
        const ACCESS_TOKEN = await authClient.getAccessToken();
        const transport = nodemailer.createTransport({
            service: "gmail",
            auth: {
                type: "OAuth2",
                user: "nitishjsr7209@gmail.com",
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: ACCESS_TOKEN
            }
        })

        
        const details = {
            from: "BrainBoost❤️ <nitishjsr7209@gmail.com>",
            to: email,
            subject: "Reset password",
            text: "hello",
            html: `<h5 style="font-family: gilroy; font-weight: 400; line-height: 20px;">Hello, <br> Please click on the link to reset your password: <br> <br> <a href="http://localhost:3000/forgot/${userid}/otp/${otp}">Reset Password</a>
            <br> <br> If you did not request this, please ignore this email and your password <br> will remain unchanged <br> The link will expire in 15 Minutes <br> Thanks, <br> BrainBoost</h5>`
        }
        const result = await transport.sendMail(details);
        return result;
    }
    catch (err) {
        return err;
    }
}

module.exports = mailer;

