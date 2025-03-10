function getUnsignedValues(data: number[]): [number, number] {
  if (data.length !== 3) {
    throw new Error("Invalid data length");
  }

  return [
    data[0] | ((data[1] & 0xF0) << 4),
    data[2] | ((data[1] & 0x0F) << 8)
  ];
}

export function processPacket(data0: Uint8Array): [number[], number[], number] | null {
  if (data0.length !== 20) {
    throw new Error("Invalid packet length");
  }

  const data: number[] = Array.from(data0, byte => byte & 0xFF);

  if ((data[0] & 0x80) > 0) {
    console.log("Battery packet! Charge is", data[0] & 0x7F);
    return null;
  } else {
    const signs: number[] = [];
    for (let i = 4; i < 16; i++) {
      signs.push((data[Math.floor(i / 8)] >> (7 - (i % 8))) & 0x01);
    }

    const signed: number[] = [];
    for (let i = 0; i < 6; i++) {
      const [a, b] = getUnsignedValues(data.slice(2 + i * 3, 2 + i * 3 + 3));
      signed.push(signs[i * 2] === 0 ? a : -a);
      signed.push(signs[i * 2 + 1] === 0 ? b : -b);
    }

    return [signed, [], (data[0] & 0x70) >> 4];
  }
}
