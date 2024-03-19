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
