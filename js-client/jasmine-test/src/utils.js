import * as ed from "@noble/ed25519";
import { binary_to_base58 } from "base58-js";

const KEYPAIR_LENGTH = 64;
const PRIVATE_KEY_LENGTH = 32;

export const generate_user_key = async () => {
  const privKey = ed.utils.randomPrivateKey();
  const pubKey = await ed.getPublicKeyAsync(privKey);
  const keypair = new Uint8Array(KEYPAIR_LENGTH);
  keypair.set(privKey);
  keypair.set(pubKey, PRIVATE_KEY_LENGTH);
  return binary_to_base58(keypair);
};
export const strFromByteArray = (str) => {
  return new TextDecoder("utf-8").decode(str);
};

export const strToByteArray = (str) => {
  const encoder = new TextEncoder();
  const byteArray = encoder.encode(str);
  return byteArray;
};

export const bigIntFromByteArray = (byteArray) => {
  let hexString = "0x";
  for (let i = byteArray.length - 1; i >= 0; i--) {
    hexString += byteArray[i].toString(16).padStart(2, "0");
  }
  return BigInt(hexString);
};
