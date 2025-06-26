// Importa el módulo 'crypto' de Node.js, que tiene las herramientas para criptografía.
const crypto = require('crypto');
// Importa el módulo 'fs' (File System) para poder escribir archivos en el disco.
const fs = require('fs');

// Genera un par de claves usando el algoritmo DSA.
// Esto crea dos piezas de información matemáticamente conectadas.
const { privateKey, publicKey } = crypto.generateKeyPairSync('dsa', {
  modulusLength: 2048, // Un tamaño de clave seguro y estándar.
  // Define el formato estándar para la clave pública.
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  // Define el formato estándar para la clave privada.
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

// Guarda la clave privada en un archivo llamado 'private_key.pem'. Esta es la clave SECRETA.
fs.writeFileSync('private_key.pem', privateKey);
// Guarda la clave pública en un archivo llamado 'public_key.pem'. Esta se puede compartir.
fs.writeFileSync('public_key.pem', publicKey);

console.log("Claves 'private_key.pem' y 'public_key.pem' generadas con éxito.");