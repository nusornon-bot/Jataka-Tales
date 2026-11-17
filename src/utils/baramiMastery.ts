import { JatakaTale } from '../types/jataka';

export interface BaramiDefinition {
  id: string;
  order: number;
  name: string;
  paliName: string;
  shortDesc: string;
  tosachatTaleId: string;
  tosachatNumber: number;
  tosachatTitle: string;
  keywords: string[];
}

export const TEN_BARAMI_DEFINITIONS: BaramiDefinition[] = [
  {
    id: 'dana',
    order: 1,
    name: 'ทานบารมี',
    paliName: 'Dāna Pāramī',
    shortDesc: 'การให้ การเสียสละความตระหนี่ เพื่อประโยชน์สุขของผู้อื่น',
    tosachatTaleId: 'vessantara',
    tosachatNumber: 547,
    tosachatTitle: 'พระเวสสันดรชาดก',
    keywords: ['ทาน', 'สละ', 'แบ่งปัน', 'เอื้อเฟื้อ'],
  },
  {
    id: 'sila',
    order: 2,
    name: 'ศีลบารมี',
    paliName: 'Sīla Pāramī',
    shortDesc: 'ความประพฤติกาย วาจาให้บริสุทธิ์งดงาม ไม่เบียดเบียนตนเองและผู้อื่น',
    tosachatTaleId: 'bhuridatta',
    tosachatNumber: 543,
    tosachatTitle: 'ภูริทัตตชาดก',
    keywords: ['ศีล', 'อุโบสถ', 'สำรวม', 'ไม่เบียดเบียน'],
  },
  {
    id: 'nekkhamma',
    order: 3,
    name: 'เนกขัมมบารมี',
    paliName: 'Nekkhamma Pāramī',
    shortDesc: 'การปลีกวิเวก สละความยึดติดในอำนาจ กามคุณ และความสุขทางโลก',
    tosachatTaleId: 'temiya',
    tosachatNumber: 538,
    tosachatTitle: 'พระเตมีย์ชาดก',
    keywords: ['เนกขัม', 'บวช', 'สละราช', 'ปล่อยวาง'],
  },
  {
    id: 'panna',
    order: 4,
    name: 'ปัญญาบารมี',
    paliName: 'Paññā Pāramī',
    shortDesc: 'ความรู้แจ้งเหตุและผล แก้ปัญหาด้วยปฏิภาณอันสุขุมปราศจากโทสะ',
    tosachatTaleId: 'mahosadha',
    tosachatNumber: 546,
    tosachatTitle: 'มโหสถชาดก',
    keywords: ['ปัญญา', 'สติ', 'ไหวพริบ', 'พิจารณา', 'วาจา'],
  },
  {
    id: 'viriya',
    order: 5,
    name: 'วิริยบารมี',
    paliName: 'Viriya Pāramī',
    shortDesc: 'ความพากเพียรบากบั่นอย่างไม่ย่อท้อ แม้ยังไม่เห็นฝั่งแห่งความสำเร็จ',
    tosachatTaleId: 'mahajanaka',
    tosachatNumber: 539,
    tosachatTitle: 'พระมหาชนกชาดก',
    keywords: ['วิริยะ', 'เพียร', 'บากบั่น', 'พากเพียร'],
  },
  {
    id: 'khanti',
    order: 6,
    name: 'ขันติบารมี',
    paliName: 'Khanti Pāramī',
    shortDesc: 'ความอดทนอดกลั้นต่อความยากลำบากและการถูกเบียดเบียนด้วยจิตสงบ',
    tosachatTaleId: 'candakumara',
    tosachatNumber: 542,
    tosachatTitle: 'จันทกุมารชาดก',
    keywords: ['ขันติ', 'อดทน', 'อดกลั้น'],
  },
  {
    id: 'sacca',
    order: 7,
    name: 'สัจจบารมี',
    paliName: 'Sacca Pāramī',
    shortDesc: 'การรักษาคำพูด ความจริงใจ และความซื่อตรงในธรรมยิ่งกว่าชีวิต',
    tosachatTaleId: 'vidhura',
    tosachatNumber: 545,
    tosachatTitle: 'วิธุรชาดก',
    keywords: ['สัจ', 'ซื่อสัตย์', 'รักษาคำพูด'],
  },
  {
    id: 'adhitthana',
    order: 8,
    name: 'อธิษฐานบารมี',
    paliName: 'Adhiṭṭhāna Pāramī',
    shortDesc: 'ความตั้งใจมั่นแน่วแน่ในความดีงาม ไม่หวั่นไหวต่อสิ่งยั่วยุหรืออุปสรรค',
    tosachatTaleId: 'nemiraja',
    tosachatNumber: 541,
    tosachatTitle: 'พระเนมิราชชาดก',
    keywords: ['อธิษฐาน', 'ตั้งใจมั่น', 'ปณิธาน'],
  },
  {
    id: 'metta',
    order: 9,
    name: 'เมตตาบารมี',
    paliName: 'Mettā Pāramī',
    shortDesc: 'ความรักความปรารถนาดีอย่างไม่มีประมาณต่อสรรพสัตว์ทั้งปวง',
    tosachatTaleId: 'suvannasama',
    tosachatNumber: 540,
    tosachatTitle: 'สุวรรณสามชาดก',
    keywords: ['เมตตา', 'กตัญญู', 'กรุณา', 'ปรารถนาดี'],
  },
  {
    id: 'upekkha',
    order: 10,
    name: 'อุเบกขาบารมี',
    paliName: 'Upekkhā Pāramī',
    shortDesc: 'ความวางใจเป็นกลางด้วยปัญญา ไม่หวั่นไหวต่อโลกธรรมหรืออคติ',
    tosachatTaleId: 'narada',
    tosachatNumber: 544,
    tosachatTitle: 'พระนารทชาดก',
    keywords: ['อุเบกขา', 'เป็นกลาง', 'ปล่อยวาง', 'สงบ'],
  },
];

export interface BaramiMasteryItem extends BaramiDefinition {
  percent: number;
  readCount: number;
  interactiveCompleted: boolean;
  isMastered: boolean;
}

export function computeBaramiMastery(params: {
  tales: JatakaTale[];
  readNumbers: number[];
  completedInteractiveIds: string[];
  bestQuizScore: number | null;
}): {
  items: BaramiMasteryItem[];
  overallPercent: number;
  masteredCount: number;
} {
  const { tales, readNumbers, completedInteractiveIds, bestQuizScore } = params;
  const readSet = new Set(readNumbers);
  const completedInteractiveSet = new Set(completedInteractiveIds);

  const items: BaramiMasteryItem[] = TEN_BARAMI_DEFINITIONS.map((def) => {
    // 1. Check signature Tosachat tale read (50 pts)
    const signatureRead = readSet.has(def.tosachatNumber);

    // 2. Check other tales matching this Barami keywords read (up to 20 pts)
    const relatedReadTales = tales.filter((t) => {
      const matchesKeyword = def.keywords.some(
        (kw) => t.barami.includes(kw) || t.virtue.includes(kw)
      );
      if (!matchesKeyword) return false;
      if (t.id === def.tosachatTaleId) return signatureRead;
      // Check canon or prebuilt number
      if (t.id.startsWith('canon-')) {
        const n = Number(t.id.slice(6));
        return readSet.has(n);
      }
      if (t.id === 'vannupatha') return readSet.has(2);
      if (t.id === 'vanarinda') return readSet.has(57);
      if (t.id === 'kacchapa') return readSet.has(215);
      return false;
    });

    // 3. Check interactive story completion (30 pts)
    const sigInteractiveId = `interactive-${def.tosachatTaleId}`;
    const interactiveCompleted = completedInteractiveSet.has(sigInteractiveId);

    // 4. Quiz knowledge contribution (up to 20 pts)
    const quizBonus =
      bestQuizScore !== null ? Math.round((bestQuizScore / 100) * 20) : 0;

    let rawScore = 0;
    if (signatureRead) rawScore += 50;
    if (relatedReadTales.length > (signatureRead ? 1 : 0)) rawScore += 15;
    if (interactiveCompleted) rawScore += 35;
    if (signatureRead || interactiveCompleted) {
      rawScore += quizBonus;
    } else if (quizBonus >= 12) {
      rawScore += 10;
    }

    const percent = Math.min(100, rawScore);

    return {
      ...def,
      percent,
      readCount: relatedReadTales.length,
      interactiveCompleted,
      isMastered: percent >= 75,
    };
  });

  const overallPercent = Math.round(
    items.reduce((acc, item) => acc + item.percent, 0) / items.length
  );
  const masteredCount = items.filter((item) => item.isMastered).length;

  return {
    items,
    overallPercent,
    masteredCount,
  };
}
