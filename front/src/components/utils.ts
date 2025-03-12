function getUnsignedValuesUnPlus(data: number[]): [number, number] {
  if (data.length !== 3) {
    throw new Error("Invalid data length");
  }

  return [
    data[0] | ((data[1] & 0xF0) << 4),
    data[2] | ((data[1] & 0x0F) << 8)
  ];
}

export function processPacketUnPlus(data0: Uint8Array): [number[], number[], number] | null {
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
      const [a, b] = getUnsignedValuesUnPlus(data.slice(2 + i * 3, 2 + i * 3 + 3));
      signed.push(signs[i * 2] === 0 ? a : -a);
      signed.push(signs[i * 2 + 1] === 0 ? b : -b);
    }

    return [signed, [], (data[0] & 0x70) >> 4];
  }
}

function getUnsignedValuesSTD(data: number[]): number {
  if (data.length !== 2) {
    throw new Error("Invalid data length");
  }

  return (data[1] << 8) | data[0];
}


export function processPacketSTD(data0: Uint8Array): [number[], number[], number] | null {
  if (data0.length !== 20) {
    throw new Error("Invalid packet length");
  }

  const data: number[] = Array.from(data0, byte => byte & 0xFF);
  const signed = []
  for (let i = 0; i < data.length; i += 2) {
    const a = getUnsignedValuesSTD(data.slice(i, i + 2));
    signed.push(a);
  }

  return [signed, [], 0];
}

export function saveBinaryFile(data: Uint8Array, filename: string) {
  // Create a Blob from the binary data
  const blob = new Blob([data], { type: "application/octet-stream" });

  // Create a URL for the Blob
  const url = URL.createObjectURL(blob);

  // Create a hidden anchor element and trigger the download
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  // Cleanup
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
