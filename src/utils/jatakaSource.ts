import { findNipataForNumber, getJatakaNumberByTaleId } from '../data/nipataCatalog';
import { JatakaSourceReference, JatakaTale } from '../types/jataka';

export const CURATED_SOURCE_REFERENCES: Record<string, JatakaSourceReference> = {
  temiya: {
    pitakaText:
      'พระสุตตันตปิฎก ขุททกนิกาย ชาดก เล่มที่ ๒๘ (ฉบับหลวง / มจร.)',
    nipataAndOrder: 'มหานิบาต · ทศชาติชาดก พระชาติที่ ๑ · ลำดับที่ ๕๓๘',
    commentaryText:
      'อรรถกถาขุททกนิกาย มหานิบาต มูคปักขชาดก (ชาตกัฏฐกถา ภาค ๖)',
    presentContext:
      'พระพุทธเจ้าทรงปรารภการเสด็จออกมหาภิเนษกรมณ์ ณ พระเชตวันมหาวิหาร',
    shortCitation: 'ขุ. ชา. มหานิบาต (๒๘) ลำดับที่ ๕๓๘ · อรรถกถา มูคปักขชาดก',
  },
  mahajanaka: {
    pitakaText:
      'พระสุตตันตปิฎก ขุททกนิกาย ชาดก เล่มที่ ๒๘ (ฉบับหลวง / มจร.)',
    nipataAndOrder: 'มหานิบาต · ทศชาติชาดก พระชาติที่ ๒ · ลำดับที่ ๕๓๙',
    commentaryText:
      'อรรถกถาขุททกนิกาย มหานิบาต มหาชนกชาดก (ชาตกัฏฐกถา ภาค ๖)',
    presentContext:
      'พระพุทธเจ้าทรงปรารภมหาภิเนษกรมณ์และความเพียรอันไม่ย่อท้อ ณ พระเชตวันมหาวิหาร',
    shortCitation: 'ขุ. ชา. มหานิบาต (๒๘) ลำดับที่ ๕๓๙ · อรรถกถา มหาชนกชาดก',
  },
  suvannasama: {
    pitakaText:
      'พระสุตตันตปิฎก ขุททกนิกาย ชาดก เล่มที่ ๒๘ (ฉบับหลวง / มจร.)',
    nipataAndOrder: 'มหานิบาต · ทศชาติชาดก พระชาติที่ ๓ · ลำดับที่ ๕๔๐',
    commentaryText:
      'อรรถกถาขุททกนิกาย มหานิบาต สุวรรณสามชาดก (ชาตกัฏฐกถา ภาค ๖)',
    presentContext:
      'พระพุทธเจ้าทรงปรารภภิกษุผู้เลี้ยงดูมารดาบิดาด้วยความกตัญญู ณ พระเชตวันมหาวิหาร',
    shortCitation: 'ขุ. ชา. มหานิบาต (๒๘) ลำดับที่ ๕๔๐ · อรรถกถา สามชาดก',
  },
  nemiraja: {
    pitakaText:
      'พระสุตตันตปิฎก ขุททกนิกาย ชาดก เล่มที่ ๒๘ (ฉบับหลวง / มจร.)',
    nipataAndOrder: 'มหานิบาต · ทศชาติชาดก พระชาติที่ ๔ · ลำดับที่ ๕๔๑',
    commentaryText:
      'อรรถกถาขุททกนิกาย มหานิบาต นิมิชาดก (ชาตกัฏฐกถา ภาค ๖)',
    presentContext:
      'พระพุทธเจ้าทรงปรารภความสืบเนื่องแห่งขัตติยราชประเพณีการออกผนวช ณ อัมพวันวิหาร กรุงมิถิลา',
    shortCitation: 'ขุ. ชา. มหานิบาต (๒๘) ลำดับที่ ๕๔๑ · อรรถกถา นิมิชาดก',
  },
  candakumara: {
    pitakaText:
      'พระสุตตันตปิฎก ขุททกนิกาย ชาดก เล่มที่ ๒๘ (ฉบับหลวง / มจร.)',
    nipataAndOrder: 'มหานิบาต · ทศชาติชาดก พระชาติที่ ๗ · ลำดับที่ ๕๔๒',
    commentaryText:
      'อรรถกถาขุททกนิกาย มหานิบาต ขัณฑหาลชาดก (ชาตกัฏฐกถา ภาค ๖)',
    presentContext:
      'พระพุทธเจ้าทรงปรารภความปองร้ายของพระเทวทัต ณ พระเวฬุวันมหาวิหาร',
    shortCitation: 'ขุ. ชา. มหานิบาต (๒๘) ลำดับที่ ๕๔๒ · อรรถกถา ขัณฑหาลชาดก',
  },
  bhuridatta: {
    pitakaText:
      'พระสุตตันตปิฎก ขุททกนิกาย ชาดก เล่มที่ ๒๘ (ฉบับหลวง / มจร.)',
    nipataAndOrder: 'มหานิบาต · ทศชาติชาดก พระชาติที่ ๖ · ลำดับที่ ๕๔๓',
    commentaryText:
      'อรรถกถาขุททกนิกาย มหานิบาต ภูริทัตตชาดก (ชาตกัฏฐกถา ภาค ๖)',
    presentContext:
      'พระพุทธเจ้าทรงปรารภการรักษาอุโบสถศีลของอุบาสกอุบาสิกา ณ พระเชตวันมหาวิหาร',
    shortCitation: 'ขุ. ชา. มหานิบาต (๒๘) ลำดับที่ ๕๔๓ · อรรถกถา ภูริทัตตชาดก',
  },
  narada: {
    pitakaText:
      'พระสุตตันตปิฎก ขุททกนิกาย ชาดก เล่มที่ ๒๘ (ฉบับหลวง / มจร.)',
    nipataAndOrder: 'มหานิบาต · ทศชาติชาดก พระชาติที่ ๘ · ลำดับที่ ๕๔๔',
    commentaryText:
      'อรรถกถาขุททกนิกาย มหานิบาต มหานารทกัสสปชาดก (ชาตกัฏฐกถา ภาค ๖)',
    presentContext:
      'พระพุทธเจ้าทรงปรารภพระชฎิลอุรุเวลกัสสปะผู้ละมิจฉาทิฏฐิ ณ พระเวฬุวันมหาวิหาร',
    shortCitation:
      'ขุ. ชา. มหานิบาต (๒๘) ลำดับที่ ๕๔๔ · อรรถกถา มหานารทกัสสปชาดก',
  },
  vidhura: {
    pitakaText:
      'พระสุตตันตปิฎก ขุททกนิกาย ชาดก เล่มที่ ๒๘ (ฉบับหลวง / มจร.)',
    nipataAndOrder: 'มหานิบาต · ทศชาติชาดก พระชาติที่ ๙ · ลำดับที่ ๕๔๕',
    commentaryText:
      'อรรถกถาขุททกนิกาย มหานิบาต วิธุรปัณฑิตชาดก (ชาตกัฏฐกถา ภาค ๖)',
    presentContext:
      'พระพุทธเจ้าทรงปรารภปัญญาบารมีอันเลิศของพระองค์ ณ พระเชตวันมหาวิหาร',
    shortCitation: 'ขุ. ชา. มหานิบาต (๒๘) ลำดับที่ ๕๔๕ · อรรถกถา วิธุรชาดก',
  },
  mahosadha: {
    pitakaText:
      'พระสุตตันตปิฎก ขุททกนิกาย ชาดก เล่มที่ ๒๘ (ฉบับหลวง / มจร.)',
    nipataAndOrder: 'มหานิบาต · ทศชาติชาดก พระชาติที่ ๕ · ลำดับที่ ๕๔๖',
    commentaryText:
      'อรรถกถาขุททกนิกาย มหานิบาต มหาอุมมัคคชาดก (ชาตกัฏฐกถา ภาค ๖)',
    presentContext:
      'พระพุทธเจ้าทรงปรารภปัญญาบารมีอันเฉียบแหลม ณ พระเชตวันมหาวิหาร',
    shortCitation:
      'ขุ. ชา. มหานิบาต (๒๘) ลำดับที่ ๕๔๖ · อรรถกถา มหาอุมมัคคชาดก',
  },
  vessantara: {
    pitakaText:
      'พระสุตตันตปิฎก ขุททกนิกาย ชาดก เล่มที่ ๒๘ (ฉบับหลวง / มจร.)',
    nipataAndOrder: 'มหานิบาต · ทศชาติชาดก พระชาติที่ ๑๐ · ลำดับที่ ๕๔๗',
    commentaryText:
      'อรรถกถาขุททกนิกาย มหานิบาต เวสสันตรชาดก (ชาตกัฏฐกถา ภาค ๖)',
    presentContext:
      'พระพุทธเจ้าทรงปรารภเหตุฝนโบกขรพรรษตก ณ นิโครธาราม กรุงกบิลพัสดุ์',
    shortCitation: 'ขุ. ชา. มหานิบาต (๒๘) ลำดับที่ ๕๔๗ · อรรถกถา เวสสันตรชาดก',
  },
  vannupatha: {
    pitakaText:
      'พระสุตตันตปิฎก ขุททกนิกาย ชาดก เล่มที่ ๒๗ (ฉบับหลวง / มจร.)',
    nipataAndOrder: 'เอกกนิบาต · อปัณณกวรรค · ชาดกลำดับที่ ๒',
    commentaryText:
      'อรรถกถาขุททกนิกาย เอกกนิบาต วัณณุปถชาดก (ชาตกัฏฐกถา ภาค ๑)',
    presentContext:
      'พระพุทธเจ้าทรงปรารภภิกษุผู้คลายความเพียร ณ พระเชตวันมหาวิหาร',
    shortCitation: 'ขุ. ชา. เอกกนิบาต (๒๗) ลำดับที่ ๒ · อรรถกถา วัณณุปถชาดก',
  },
  vanarinda: {
    pitakaText:
      'พระสุตตันตปิฎก ขุททกนิกาย ชาดก เล่มที่ ๒๗ (ฉบับหลวง / มจร.)',
    nipataAndOrder: 'เอกกนิบาต · อิตถีวรรค / อาสีสวรรค · ชาดกลำดับที่ ๕๗',
    commentaryText:
      'อรรถกถาขุททกนิกาย เอกกนิบาต วานรินทชาดก (ชาตกัฏฐกถา ภาค ๑)',
    presentContext:
      'พระพุทธเจ้าทรงปรารภความเพียรพยายามมุ่งร้ายของพระเทวทัต ณ พระเวฬุวันมหาวิหาร',
    shortCitation: 'ขุ. ชา. เอกกนิบาต (๒๗) ลำดับที่ ๕๗ · อรรถกถา วานรินทชาดก',
  },
  kacchapa: {
    pitakaText:
      'พระสุตตันตปิฎก ขุททกนิกาย ชาดก เล่มที่ ๒๗ (ฉบับหลวง / มจร.)',
    nipataAndOrder: 'ทุกนิบาต · รุหกวรรค · ชาดกลำดับที่ ๒๑๕',
    commentaryText:
      'อรรถกถาขุททกนิกาย ทุกนิบาต กัจฉปชาดก (ชาตกัฏฐกถา ภาค ๒)',
    presentContext:
      'พระพุทธเจ้าทรงปรารภกิริยาที่พระเจ้าโกกาลิกะตรัสมากเกินควร ณ พระเชตวันมหาวิหาร',
    shortCitation: 'ขุ. ชา. ทุกนิบาต (๒๗) ลำดับที่ ๒๑๕ · อรรถกถา กัจฉปชาดก',
  },
};

export function buildCanonSourceReference(
  jatakaNumber: number,
  thaiTitle?: string
): JatakaSourceReference {
  const nipata = findNipataForNumber(jatakaNumber);
  const volumeLabel = jatakaNumber >= 526 ? 'เล่มที่ ๒๘' : 'เล่มที่ ๒๗';
  const cleanTitle = thaiTitle || `ชาดกลำดับที่ ${jatakaNumber}`;

  return {
    pitakaText: `พระสุตตันตปิฎก ขุททกนิกาย ชาดก ${volumeLabel} (ฉบับหลวง / มจร.)`,
    nipataAndOrder: `นิบาตที่ ${nipata.nipataNumber} ${nipata.thaiName} (${nipata.paliName}) · ลำดับที่ ${jatakaNumber} / 547`,
    commentaryText: `อรรถกถาขุททกนิกาย ${nipata.thaiName} ${cleanTitle} (ชาตกัฏฐกถา)`,
    shortCitation: `ขุ. ชา. ${nipata.thaiName} (${volumeLabel === 'เล่มที่ ๒๘' ? '๒๘' : '๒๗'}) ลำดับที่ ${jatakaNumber}`,
  };
}

export function getJatakaSourceInfo(tale: JatakaTale): JatakaSourceReference {
  if (tale.sourceReference) {
    return tale.sourceReference;
  }
  if (CURATED_SOURCE_REFERENCES[tale.id]) {
    return CURATED_SOURCE_REFERENCES[tale.id];
  }
  const num = getJatakaNumberByTaleId(tale.id);
  if (num !== null) {
    return buildCanonSourceReference(num, tale.title);
  }
  return {
    pitakaText: 'พระสุตตันตปิฎก ขุททกนิกาย ชาดก (ฉบับหลวง / มจร.)',
    nipataAndOrder: tale.collection,
    commentaryText: `อรรถกถาขุททกนิกาย ${tale.title} (ชาตกัฏฐกถา)`,
    shortCitation: `${tale.collection} · พระไตรปิฎก ขุททกนิกาย ชาดก`,
  };
}

export function getSourceByTaleId(
  taleId: string,
  tales: JatakaTale[]
): JatakaSourceReference {
  const found = tales.find((t) => t.id === taleId);
  if (found) return getJatakaSourceInfo(found);
  if (CURATED_SOURCE_REFERENCES[taleId]) {
    return CURATED_SOURCE_REFERENCES[taleId];
  }
  const num = getJatakaNumberByTaleId(taleId);
  if (num !== null) {
    return buildCanonSourceReference(num);
  }
  return {
    pitakaText: 'พระสุตตันตปิฎก ขุททกนิกาย ชาดก',
    nipataAndOrder: 'ขุททกนิกาย ชาดก',
    commentaryText: 'อรรถกถาขุททกนิกาย ชาดก (ชาตกัฏฐกถา)',
    shortCitation: 'พระไตรปิฎก ขุททกนิกาย ชาดก และอรรถกถา',
  };
}
