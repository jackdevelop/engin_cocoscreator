
export class NetEncrypt {
  private static sendByteMap = [
    0x30,
    0x37,
    0x20,
    0x56,
    0x11,
    0x39,
    0x6c,
    0xc3,
    0x1b,
    0x68,
    0x33,
    0xae,
    0xda,
    0xf4,
    0x79,
    0x5e,
    0x83,
    0x07,
    0x4e,
    0xf2,
    0xd0,
    0x4c,
    0x45,
    0xff,
    0x0a,
    0x28,
    0x7c,
    0x67,
    0x62,
    0xea,
    0xdb,
    0x97,
    0x27,
    0xdd,
    0x9a,
    0xcc,
    0x25,
    0x38,
    0xd4,
    0xf3,
    0x6d,
    0x6a,
    0x63,
    0x16,
    0xd9,
    0xb0,
    0xc7,
    0x3b,
    0xa5,
    0x44,
    0x3c,
    0x89,
    0xf7,
    0xde,
    0x8f,
    0xd3,
    0xc2,
    0x31,
    0xe1,
    0xca,
    0x53,
    0x59,
    0x14,
    0x70,
    0xe4,
    0x5b,
    0x2d,
    0x03,
    0x5a,
    0xb8,
    0x15,
    0xe0,
    0xcd,
    0x46,
    0x8d,
    0x55,
    0x12,
    0xcf,
    0x2b,
    0x0f,
    0x2f,
    0xdc,
    0xb5,
    0xbc,
    0x8c,
    0x04,
    0x98,
    0xed,
    0x6b,
    0x2a,
    0x1f,
    0x21,
    0x81,
    0xf9,
    0x78,
    0xe2,
    0x00,
    0x17,
    0x22,
    0xbf,
    0x24,
    0xfd,
    0xfb,
    0xb3,
    0x69,
    0xa4,
    0x8b,
    0xbb,
    0xaa,
    0x65,
    0x88,
    0x4a,
    0x4d,
    0x36,
    0xc4,
    0xd7,
    0xe7,
    0x3a,
    0x2e,
    0x0d,
    0x3d,
    0x13,
    0x9d,
    0x23,
    0x29,
    0xba,
    0xb2,
    0x91,
    0xdf,
    0x09,
    0xc1,
    0x7d,
    0x7f,
    0xa0,
    0x3f,
    0x58,
    0xc8,
    0x3e,
    0xbe,
    0x08,
    0x0e,
    0x2c,
    0x01,
    0xaf,
    0xd1,
    0x85,
    0x9f,
    0xf0,
    0x74,
    0x77,
    0xe5,
    0xce,
    0xa8,
    0xab,
    0x5f,
    0x48,
    0xc9,
    0x43,
    0xef,
    0x93,
    0xb6,
    0x71,
    0x84,
    0x7b,
    0x94,
    0xf6,
    0x1a,
    0x7a,
    0xcb,
    0x61,
    0x6e,
    0x41,
    0xd8,
    0xee,
    0x60,
    0x8a,
    0xeb,
    0x49,
    0x18,
    0x34,
    0xfc,
    0xe9,
    0x26,
    0xa2,
    0xec,
    0x35,
    0x4f,
    0x86,
    0x0c,
    0x96,
    0x73,
    0xd2,
    0x47,
    0x0b,
    0x8e,
    0x32,
    0xa1,
    0x76,
    0xe6,
    0x9b,
    0x10,
    0x40,
    0x57,
    0x19,
    0xa7,
    0x72,
    0x9c,
    0x50,
    0x90,
    0x51,
    0x54,
    0xf1,
    0x1d,
    0x92,
    0xc5,
    0xa9,
    0xc0,
    0x7e,
    0xa6,
    0xb9,
    0xd5,
    0x52,
    0xb7,
    0xfa,
    0x4b,
    0x80,
    0xf5,
    0x82,
    0xa3,
    0x64,
    0x05,
    0xac,
    0x9e,
    0x6f,
    0x1e,
    0xc6,
    0x02,
    0x95,
    0x75,
    0xe3,
    0xad,
    0xd6,
    0xb4,
    0x1c,
    0x5d,
    0xf8,
    0xb1,
    0x66,
    0x99,
    0xe8,
    0x06,
    0xfe,
    0x87,
    0x42,
    0x5c,
    0xbd,
  ];

  private static recvByteMap = [
    0x60,
    0x8e,
    0xec,
    0x43,
    0x55,
    0xe6,
    0xfa,
    0x11,
    0x8b,
    0x81,
    0x18,
    0xc1,
    0xbc,
    0x77,
    0x8c,
    0x4f,
    0xc8,
    0x04,
    0x4c,
    0x79,
    0x3e,
    0x46,
    0x2b,
    0x61,
    0xb2,
    0xcb,
    0xa6,
    0x08,
    0xf3,
    0xd4,
    0xea,
    0x5a,
    0x02,
    0x5b,
    0x62,
    0x7b,
    0x64,
    0x24,
    0xb6,
    0x20,
    0x19,
    0x7c,
    0x59,
    0x4e,
    0x8d,
    0x42,
    0x76,
    0x50,
    0x00,
    0x39,
    0xc3,
    0x0a,
    0xb3,
    0xb9,
    0x71,
    0x01,
    0x25,
    0x05,
    0x75,
    0x2f,
    0x32,
    0x78,
    0x89,
    0x86,
    0xc9,
    0xab,
    0xfd,
    0x9d,
    0x31,
    0x16,
    0x49,
    0xc0,
    0x9b,
    0xb1,
    0x6f,
    0xe0,
    0x15,
    0x70,
    0x12,
    0xba,
    0xcf,
    0xd1,
    0xdd,
    0x3c,
    0xd2,
    0x4b,
    0x03,
    0xca,
    0x87,
    0x3d,
    0x44,
    0x41,
    0xfe,
    0xf4,
    0x0f,
    0x9a,
    0xae,
    0xa9,
    0x1c,
    0x2a,
    0xe5,
    0x6d,
    0xf7,
    0x1b,
    0x09,
    0x68,
    0x29,
    0x58,
    0x06,
    0x28,
    0xaa,
    0xe9,
    0x3f,
    0xa1,
    0xcd,
    0xbe,
    0x94,
    0xee,
    0xc5,
    0x95,
    0x5e,
    0x0e,
    0xa7,
    0xa3,
    0x1a,
    0x83,
    0xd9,
    0x84,
    0xe1,
    0x5c,
    0xe3,
    0x10,
    0xa2,
    0x91,
    0xbb,
    0xfc,
    0x6e,
    0x33,
    0xaf,
    0x6a,
    0x54,
    0x4a,
    0xc2,
    0x36,
    0xd0,
    0x7f,
    0xd5,
    0x9f,
    0xa4,
    0xed,
    0xbd,
    0x1f,
    0x56,
    0xf8,
    0x22,
    0xc7,
    0xce,
    0x7a,
    0xe8,
    0x92,
    0x85,
    0xc4,
    0xb7,
    0xe4,
    0x69,
    0x30,
    0xda,
    0xcc,
    0x98,
    0xd7,
    0x6c,
    0x99,
    0xe7,
    0xf0,
    0x0b,
    0x8f,
    0x2d,
    0xf6,
    0x7e,
    0x67,
    0xf2,
    0x52,
    0xa0,
    0xde,
    0x45,
    0xdb,
    0x7d,
    0x6b,
    0x53,
    0xff,
    0x8a,
    0x63,
    0xd8,
    0x82,
    0x38,
    0x07,
    0x72,
    0xd6,
    0xeb,
    0x2e,
    0x88,
    0x9c,
    0x3b,
    0xa8,
    0x23,
    0x48,
    0x97,
    0x4d,
    0x14,
    0x90,
    0xbf,
    0x37,
    0x26,
    0xdc,
    0xf1,
    0x73,
    0xac,
    0x2c,
    0x0c,
    0x1e,
    0x51,
    0x21,
    0x35,
    0x80,
    0x47,
    0x3a,
    0x5f,
    0xef,
    0x40,
    0x96,
    0xc6,
    0x74,
    0xf9,
    0xb5,
    0x1d,
    0xb0,
    0xb8,
    0x57,
    0xad,
    0x9e,
    0x93,
    0xd3,
    0x13,
    0x27,
    0x0d,
    0xe2,
    0xa5,
    0x34,
    0xf5,
    0x5d,
    0xdf,
    0x66,
    0xb4,
    0x65,
    0xfb,
    0x17,
  ];

  
  private static encryptBuffer = function (packet) {
    let sLen = packet.length;
    let pcbDataBuffer = new Uint8Array(sLen);
    let code = 0;
    for (let i = 0; i < sLen; i++) {
      code += packet[i];
      pcbDataBuffer[i] = this.sendByteMap[packet[i]];
    }
    code = (256 - (code % 256)) % 256;
    return {
      code: code,
      bytes: pcbDataBuffer,
    };
  };

  
  private static decryptBuffer = function (packet, code) {
    let sLen = packet.byteLength;
    let pcbDataBuffer = new Uint8Array(sLen);
    let dv = new DataView(packet);
    for (let i = 0; i < sLen; i++) {
      let byteVal = dv.getUint8(i);
      let decodeData = this.recvByteMap[byteVal];
      pcbDataBuffer[i] = decodeData;
      code += decodeData;
    }
    if (code % 256 !== 0) {
      return {
        ret: false,
        bytes: packet,
      };
    }
    return {
      ret: true,
      bytes: pcbDataBuffer,
    };
  };
}