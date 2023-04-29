import crypto from "crypto";

// Define the elliptic curve parameters
const a = 0n; // Coefficient 'a' in the equation y^2 = x^3 + ax + b
const b = 7n; // Coefficient 'b' in the equation y^2 = x^3 + ax + b
const p = 2n ** 256n - 2n ** 32n - 977n; // Prime number specifying the field size
const Gx = 55066263022277343669578718895168534326250603453777594175500187360389116729240n; // X coordinate of the base point
const Gy = 32670510020758816978083085130507043184471273380659243275938904335757337482424n; // Y coordinate of the base point

// Define the Point class to represent points on the elliptic curve
class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  // Define the point addition operation
  add(other) {
    if (this.x === other.x && this.y === other.y) {
      return this.double();
    }

    const slope = (other.y - this.y) * modInverse(other.x - this.x, p);
    const x3 = (slope ** 2n - this.x - other.x) % p;
    const y3 = (slope * (this.x - x3) - this.y) % p;
    return new Point(x3, y3);
  }

  // Define the point doubling operation
  double() {
    const slope = (3n * this.x ** 2n + a) * modInverse(2n * this.y, p);
    const x3 = (slope ** 2n - 2n * this.x) % p;
    const y3 = (slope * (this.x - x3) - this.y) % p;
    return new Point(x3, y3);
  }

  // Define the point multiplication operation
  multiply(scalar) {
    let [u, v] = [this, new Point(0n, 1n)];
    let k = scalar;
    if (k === 0){
      return 0
    } else if (k === 1) {
      return 
    } else if (k % 2n === 1) {
      return v.add(u)
    } else {
      return u.double()
    }
  }
}

// Define the modular inverse function
function modInverse(a, m) {
  let [x, y, u, v] = [0n, 1n, 1n, 0n];
  while (a !== 0n) {
    const q = m / a;
    const r = m % a;
    const newx = u - q * x;
    const newy = v - q * y;
    [x, y, u, v] = [newx, newy, x, y];
    [a, m] = [r, a];
  }
  const inv = x < 0n ? x + m : x;
  return inv;
}

function generateRandomBigInt() {
  let hexString = '';
  for (let i = 0; i < 64; i++) {
    hexString += Math.floor(Math.random() * 16).toString(16);
  }
  return BigInt('0x' + hexString);
}

// Define the key generation function
function generateKeyPair() {
    const privateKey = BigInt('0x' + crypto.getRandomValues(new Uint8Array(32)).reduce((s, b) => s + b.toString(16).padStart(2, '0'), ''));
    // Use the private key to compute the corresponding public key
    const publicKey = new Point(Gx, Gy).multiply(privateKey);

    // Return the key pair as an object
    return {
        privateKey: privateKey,
        publicKey: publicKey
    };
}


// Define the encryption function
function encrypt(publicKey, message) {
    // Choose a random number k between 1 and the prime number p
    const k = generateRandomBigInt();
    console.log(k)
    if (k >= p) {
        throw new Error('Random number k is out of range');
    }

    // Use the random number k to generate the ciphertext
    const C1 = new Point(Gx, Gy).multiply(k);
    const C2 = message ^ publicKey.multiply(k).x;
    return {
        C1: C1,
        C2: C2
    };
}

// Define the decryption function
function decrypt(privateKey, ciphertext) {
    // Use the private key to recover the plaintext message
    const C1 = ciphertext.C1;
    const C2 = ciphertext.C2;
    const S = C1.multiply(privateKey);
    const message = C2 ^ S.x;
    return message;
}

// Example usage:
const keyPair = generateKeyPair();
console.log('Private key:', keyPair.privateKey.toString(16));
console.log('Public key x:', keyPair.publicKey.x.toString(16));
console.log('Public key y:', keyPair.publicKey.y.toString(16));

const message = BigInt(123456789);
console.log('Original message:', message.toString());

const ciphertext = encrypt(keyPair.publicKey, message);
console.log('Ciphertext C1 x:', ciphertext.C1.x.toString(16));
console.log('Ciphertext C1 y:', ciphertext.C1.y.toString(16));
console.log('Ciphertext C2:', ciphertext.C2.toString(16));

const decryptedMessage = decrypt(keyPair.privateKey, ciphertext);
console.log('Decrypted message:', decryptedMessage.toString());