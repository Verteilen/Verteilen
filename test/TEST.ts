import * as pem from 'pem'


pem.createCertificate({ days: 1, selfSigned: true }, (err, keys) => {
    console.log("clientKey: ", keys.clientKey)
    console.log("certificate: ", keys.certificate)
})