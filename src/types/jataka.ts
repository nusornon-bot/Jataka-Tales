export type AppMode = 'home' | 'library' | 'interactive' | 'quiz';

export type CollectionFilter = 'all' | 'tosachat' | 'nipata' | 'favorites';

export type ThemePreference = 'light' | 'dark';
export type FontSizePreference = 'sm' | 'md' | 'lg';

export type VirtueCategory =
  | 'ทั้งหมด'
  | 'ทานและเมตตา'
  | 'ศีลและเนกขัมมะ'
  | 'ความเพียรและอธิษฐาน'
  | 'ปัญญาและสติ'
  | 'ขันติ สัจจะ อุเบกขา';

export interface JatakaSourceReference {
  pitakaText: string;
  nipataAndOrder: string;
  commentaryText: string;
  presentContext?: string;
  shortCitation: string;
}

export interface SamodhanaMapping {
  pastCharacter: string;
  presentIdentity: string;
}

export interface GlossaryTerm {
  term: string;
  meaning: string;
}

export type SceneFocalElement =
  | 'bodhi'
  | 'ship'
  | 'deer'
  | 'monkey'
  | 'lotus'
  | 'palace'
  | 'naga'
  | 'elephant'
  | 'sage'
  | 'scale';

export interface SceneVisualSpec {
  motif: 'bodhi' | 'ocean' | 'desert' | 'river' | 'sky' | 'forest' | 'celestial' | 'rain';
  settingLabel: string;
  focalElement: SceneFocalElement;
  skyTop: string;
  skyBottom: string;
  accentColor: string;
}

export interface JatakaTale {
  id: string;
  indexLabel: string;
  title: string;
  paliTitle: string;
  collection: string;
  collectionGroup: 'tosachat' | 'nipata';
  tosachatOrder?: number;
  virtue: Exclude<VirtueCategory, 'ทั้งหมด'>;
  barami: string;
  readTimeMinutes: number;
  image: string;
  imageCaption: string;
  summary: string;
  paragraphs: string[];
  paliVerse: string;
  thaiVerseMeaning: string;
  moralPoints: string[];
  dailyApplication: string;
  interactiveStoryId?: string;
  sourceReference?: JatakaSourceReference;
  samodhana?: SamodhanaMapping[];
  glossary?: GlossaryTerm[];
  sceneVisual?: SceneVisualSpec;
}

export interface InteractiveChoice {
  id: string;
  label: string;
  description: string;
  outcomeText: string;
  dhammaReflection: string;
  isBodhisattaWay: boolean;
  virtueDelta: {
    mindfulness: number;
    perseverance: number;
    wisdom: number;
  };
  nextSceneId: string | null;
}

export interface InteractiveScene {
  id: string;
  chapterLabel: string;
  title: string;
  narrative: string;
  choices: InteractiveChoice[];
}

export interface InteractiveStory {
  id: string;
  taleId: string;
  title: string;
  shortLabel: string;
  subtitle: string;
  virtueFocus: string;
  image: string;
  scenes: InteractiveScene[];
  endingSummary: string;
}

export type QuizCategory =
  | 'ทั้งหมด'
  | 'ทายข้อคิดจากเรื่อง'
  | 'ทายชื่อชาดก'
  | 'บารมีและหลักธรรม';

export interface QuizQuestion {
  id: string;
  category: Exclude<QuizCategory, 'ทั้งหมด'>;
  taleTitle: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface BookmarkRecord {
  taleId: string;
  jatakaNumber: number;
  title: string;
  barami: string;
  createdAtMs: number;
}

export interface ReflectionNoteRecord {
  taleId: string;
  jatakaNumber: number;
  title: string;
  content: string;
  updatedAtMs: number;
}
