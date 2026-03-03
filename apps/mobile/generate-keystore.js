/**
 * Generates a PKCS12 keystore for Android signing using node-forge.
 * Outputs: starlight-keystore.p12 + keystore.properties
 */
const forge = require('node-forge');
const fs = require('fs');
const path = require('path');

console.log('Generating Android signing keystore...');

// Generate RSA key pair
const keys = forge.pki.rsa.generateKeyPair(2048);
const cert = forge.pki.createCertificate();

cert.publicKey = keys.publicKey;
cert.serialNumber = '01';
cert.validity.notBefore = new Date();
cert.validity.notAfter = new Date();
cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 25);

const attrs = [
  { name: 'commonName', value: 'Starlight ITD Inventory' },
  { name: 'organizationName', value: 'Starlight Business Consulting Services Inc' },
  { name: 'countryName', value: 'PH' },
];
cert.setSubject(attrs);
cert.setIssuer(attrs);
cert.sign(keys.privateKey, forge.md.sha256.create());

// Create PKCS12
const p12 = forge.pkcs12.toPkcs12Asn1(
  keys.privateKey,
  [cert],
  'starlight@2026',
  { algorithm: '3des', friendlyName: 'starlight' }
);

const p12Buffer = Buffer.from(forge.asn1.toDer(p12).getBytes(), 'binary');
const keystorePath = path.join(__dirname, 'starlight-keystore.p12');
fs.writeFileSync(keystorePath, p12Buffer);

console.log('✓ Keystore created:', keystorePath);
console.log('  Key alias    : starlight');
console.log('  Password     : starlight@2026');
console.log('  Valid until  :', cert.validity.notAfter.toDateString());
