export interface NipataInfo {
  nipataNumber: number;
  thaiName: string;
  paliName: string;
  verseCountLabel: string;
  startNumber: number;
  endNumber: number;
  summary: string;
}

export interface NipataIndexEntry {
  number: number;
  thaiTitle: string;
  paliTitle: string;
  theme: string;
  baramiHint: string;
}

export const TIPITAKA_22_NIPATAS: NipataInfo[] = [
  {
    nipataNumber: 1,
    thaiName: 'เอกกนิบาต',
    paliName: 'Ekaka Nipata',
    verseCountLabel: '๑ คาถา',
    startNumber: 1,
    endNumber: 150,
    summary: 'นิทานสั้นสอนคติธรรมพื้นฐาน ความไม่ประมาท ความเพียร และมิตรภาพ',
  },
  {
    nipataNumber: 2,
    thaiName: 'ทุกนิบาต',
    paliName: 'Duka Nipata',
    verseCountLabel: '๒ คาถา',
    startNumber: 151,
    endNumber: 250,
    summary: 'ชาดกสองคาถาว่าด้วยสติปัญญา การประมาณตน และการรู้เท่าทันกิเลส',
  },
  {
    nipataNumber: 3,
    thaiName: 'ติกนิบาต',
    paliName: 'Tika Nipata',
    verseCountLabel: '๓ คาถา',
    startNumber: 251,
    endNumber: 300,
    summary: 'ชาดกสามคาถาเน้นความสามัคคี ศีลธรรมของผู้ครองเรือน และความกตัญญู',
  },
  {
    nipataNumber: 4,
    thaiName: 'จตุกกนิบาต',
    paliName: 'Catukka Nipata',
    verseCountLabel: '๔ คาถา',
    startNumber: 301,
    endNumber: 350,
    summary: 'ชาดกสี่คาถาว่าด้วยหลักราชธรรม ปฏิภาณ และผลของกรรมดีกรรมชั่ว',
  },
  {
    nipataNumber: 5,
    thaiName: 'ปัญจกนิบาต',
    paliName: 'Pancaka Nipata',
    verseCountLabel: '๕ คาถา',
    startNumber: 351,
    endNumber: 375,
    summary: 'ชาดกห้าคาถาสอนเรื่องการคบมิตร การสำรวมอินทรีย์ และความสงบใจ',
  },
  {
    nipataNumber: 6,
    thaiName: 'ฉักกนิบาต',
    paliName: 'Chatthaka Nipata',
    verseCountLabel: '๖ คาถา',
    startNumber: 376,
    endNumber: 395,
    summary: 'ชาดกหกคาถาว่าด้วยอุบายอันแยบคายในการแก้ปัญหาและคุณค่าของปัญญา',
  },
  {
    nipataNumber: 7,
    thaiName: 'สัตตกนิบาต',
    paliName: 'Sattaka Nipata',
    verseCountLabel: '๗ คาถา',
    startNumber: 396,
    endNumber: 416,
    summary: 'ชาดกเจ็ดคาถาสอนเรื่องความซื่อสัตย์สุจริตและอานุภาพแห่งศีล',
  },
  {
    nipataNumber: 8,
    thaiName: 'อัฏฐกนิบาต',
    paliName: 'Atthaka Nipata',
    verseCountLabel: '๘ คาถา',
    startNumber: 417,
    endNumber: 426,
    summary: 'ชาดกแปดคาถาว่าด้วยการละความโลภ ความโกรธ และความถือตัว',
  },
  {
    nipataNumber: 9,
    thaiName: 'นวกนิบาต',
    paliName: 'Navaka Nipata',
    verseCountLabel: '๙ คาถา',
    startNumber: 427,
    endNumber: 438,
    summary: 'ชาดกเก้าคาถาสะท้อนบทบาทของบัณฑิตในการแนะแนวทางสันติสุข',
  },
  {
    nipataNumber: 10,
    thaiName: 'ทสกนิบาต',
    paliName: 'Dasaka Nipata',
    verseCountLabel: '๑๐ คาถา',
    startNumber: 439,
    endNumber: 454,
    summary: 'ชาดกสิบคาถาว่าด้วยทาน ศีล และความเมตตากรุณาต่อสรรพสัตว์',
  },
  {
    nipataNumber: 11,
    thaiName: 'เอกาทสกนิบาต',
    paliName: 'Ekadasaka Nipata',
    verseCountLabel: '๑๑ คาถา',
    startNumber: 455,
    endNumber: 463,
    summary: 'ชาดกสิบเอ็ดคาถาเน้นความอดทนอดกลั้นและความมั่นคงในธรรม',
  },
  {
    nipataNumber: 12,
    thaiName: 'ทวาทสกนิบาต',
    paliName: 'Dvadasaka Nipata',
    verseCountLabel: '๑๒ คาถา',
    startNumber: 464,
    endNumber: 473,
    summary: 'ชาดกสิบสองคาถาว่าด้วยวิบากกรรมและการไม่ดูหมิ่นชาติกำเนิด',
  },
  {
    nipataNumber: 13,
    thaiName: 'เตรสกนิบาต',
    paliName: 'Terasaka Nipata',
    verseCountLabel: '๑๓ คาถา',
    startNumber: 474,
    endNumber: 483,
    summary: 'ชาดกสิบสามคาถาว่าด้วยความเสื่อมของความประมาทและความเจริญของสติ',
  },
  {
    nipataNumber: 14,
    thaiName: 'ปกิณณกนิบาต',
    paliName: 'Pakinnaka Nipata',
    verseCountLabel: '๑๔+ คาถา',
    startNumber: 484,
    endNumber: 496,
    summary: 'ชาดกเบ็ดเตล็ดรวมเรื่องราวคติธรรมหลากแง่มุม',
  },
  {
    nipataNumber: 15,
    thaiName: 'วีสตินิบาต',
    paliName: 'Visati Nipata',
    verseCountLabel: '๒๐ คาถา',
    startNumber: 497,
    endNumber: 510,
    summary: 'ชาดกยี่สิบคาถาที่มีโครงเรื่องซับซ้อนและข้อคิดลุ่มลึก',
  },
  {
    nipataNumber: 16,
    thaiName: 'ติงสตินิบาต',
    paliName: 'Timsati Nipata',
    verseCountLabel: '๓๐ คาถา',
    startNumber: 511,
    endNumber: 520,
    summary: 'ชาดกสามสิบคาถาว่าด้วยความกตัญญู การครองราชย์โดยธรรม และการเสียสละ',
  },
  {
    nipataNumber: 17,
    thaiName: 'จัตตาฬีสนิบาต',
    paliName: 'Cattalisa Nipata',
    verseCountLabel: '๔๐ คาถา',
    startNumber: 521,
    endNumber: 525,
    summary: 'ชาดกสี่สิบคาถาเรื่องยาวที่แสดงการบำเพ็ญบารมีอย่างเข้มข้น',
  },
  {
    nipataNumber: 18,
    thaiName: 'ปัณณาสกนิบาต',
    paliName: 'Pannasaka Nipata',
    verseCountLabel: '๕๐ คาถา',
    startNumber: 526,
    endNumber: 528,
    summary: 'ชาดกห้าสิบคาถาว่าด้วยสัจจะและความกล้าหาญทางจริยธรรม',
  },
  {
    nipataNumber: 19,
    thaiName: 'สัฏฐินิบาต',
    paliName: 'Satthi Nipata',
    verseCountLabel: '๖๐ คาถา',
    startNumber: 529,
    endNumber: 530,
    summary: 'ชาดกหกสิบคาถาแสดงบททดสอบจิตใจอันลึกซึ้งของพระโพธิสัตว์',
  },
  {
    nipataNumber: 20,
    thaiName: 'สัตตตินิบาต',
    paliName: 'Sattati Nipata',
    verseCountLabel: '๗๐ คาถา',
    startNumber: 531,
    endNumber: 532,
    summary: 'ชาดกเจ็ดสิบคาถาเรื่องราวการครองธรรมและการสละราชสมบัติ',
  },
  {
    nipataNumber: 21,
    thaiName: 'อสีตินิบาต',
    paliName: 'Asiti Nipata',
    verseCountLabel: '๘๐ คาถา',
    startNumber: 533,
    endNumber: 537,
    summary: 'ชาดกแปดสิบคาถาเรื่องยาวสำคัญก่อนเข้าสู่ทศชาติชาดก (เช่น มหาสุตโสม หังสชาดก)',
  },
  {
    nipataNumber: 22,
    thaiName: 'มหานิบาต (ทศชาติชาดก)',
    paliName: 'Mahanipata',
    verseCountLabel: 'คัมภีร์ใหญ่ ๑๐ พระชาติ',
    startNumber: 538,
    endNumber: 547,
    summary: '๑๐ พระชาติสุดท้ายแห่งการบำเพ็ญทศบารมีครบถ้วนก่อนตรัสรู้',
  },
];

// Maps Tipitaka Jataka numbers (1..547) to our curated prebuilt tales so they open instantly with bespoke artwork
export const PREBUILT_BY_NUMBER: Record<number, string> = {
  2: 'vannupatha',
  57: 'vanarinda',
  215: 'kacchapa',
  538: 'temiya',
  539: 'mahajanaka',
  540: 'suvannasama',
  541: 'nemiraja',
  542: 'candakumara',
  543: 'bhuridatta',
  544: 'narada',
  545: 'vidhura',
  546: 'mahosadha',
  547: 'vessantara',
};

export const NUMBER_BY_PREBUILT_ID: Record<string, number> = Object.fromEntries(
  Object.entries(PREBUILT_BY_NUMBER).map(([num, id]) => [id, Number(num)])
);

export function getJatakaNumberByTaleId(taleId: string): number | null {
  if (NUMBER_BY_PREBUILT_ID[taleId]) {
    return NUMBER_BY_PREBUILT_ID[taleId];
  }
  if (taleId.startsWith('canon-')) {
    const parsed = Number(taleId.slice(6));
    if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 547) {
      return parsed;
    }
  }
  return null;
}

export function findNipataForNumber(num: number): NipataInfo {
  return (
    TIPITAKA_22_NIPATAS.find((n) => num >= n.startNumber && num <= n.endNumber) ||
    TIPITAKA_22_NIPATAS[0]
  );
}
