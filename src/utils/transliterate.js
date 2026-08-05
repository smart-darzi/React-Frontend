// Roman Urdu -> Urdu script transliteration for freely-typed names (customer,
// worker, admin). Unlike the app's t()/td() helpers — which pick one half of
// a string that ALREADY carries both languages ("Cutter / کٹر") — names are
// typed once, in Roman script only, at signup. There's no pre-written Urdu
// half to pick from, so this file guesses one.
//
// This is a best-effort phonetic guess, not a dictionary lookup service:
// 1. A ~150-entry table of common Pakistani first/last names, checked first
//    (word-by-word, case-insensitive) since these are the names most likely
//    to appear and phonetic rules alone often get them wrong.
// 2. A longest-match-first digraph/trigraph table for anything not in the
//    name list, so uncommon names still get a reasonable rendering instead
//    of being left in Roman script.
// Multi-word names ("Ahmed Raza") are transliterated word by word; anything
// that isn't a letter (spaces, numbers, punctuation) passes through as-is.

const NAME_DICTIONARY = {
  ahmed: 'احمد', ahmad: 'احمد', muhammad: 'محمد', mohammad: 'محمد', mohammed: 'محمد',
  ali: 'علی', hassan: 'حسن', hasan: 'حسن', hussain: 'حسین', husain: 'حسین', hussein: 'حسین',
  bilal: 'بلال', usman: 'عثمان', umar: 'عمر', omar: 'عمر', umer: 'عمر',
  imran: 'عمران', irfan: 'عرفان', kashif: 'کاشف', kamran: 'کامران', asad: 'اسد',
  awais: 'اویس', owais: 'اویس', faisal: 'فیصل', faizan: 'فیضان', zeeshan: 'ذیشان',
  shahzad: 'شہزاد', shahbaz: 'شہباز', shoaib: 'شعیب', shaib: 'شعیب', tariq: 'طارق',
  tayyab: 'طیب', taimoor: 'تیمور', talha: 'طلحہ', sohail: 'سہیل', suhail: 'سہیل',
  saad: 'سعد', sajjad: 'سجاد', sarmad: 'سرمد', salman: 'سلمان', saleem: 'سلیم',
  salim: 'سلیم', rizwan: 'رضوان', rehan: 'ریحان', raheel: 'رحیل', rashid: 'راشد',
  qasim: 'قاسم', qadir: 'قادر', naveed: 'نوید', nasir: 'ناصر', nadeem: 'ندیم',
  mustafa: 'مصطفی', murtaza: 'مرتضی', mubashir: 'مبشر', moeen: 'معین', moin: 'معین',
  luqman: 'لقمان', junaid: 'جنید', javed: 'جاوید', jawad: 'جواد', hamza: 'حمزہ',
  haris: 'حارث', hamid: 'حامد', haseeb: 'حسیب', huzaifa: 'حذیفہ', ibrahim: 'ابراہیم',
  idrees: 'ادریس', ismail: 'اسماعیل', yasir: 'یاسر', yousaf: 'یوسف', yousuf: 'یوسف',
  zain: 'زین', zaid: 'زید', zubair: 'زبیر', danish: 'دانش', daniyal: 'دانیال',
  farhan: 'فرحان', fahad: 'فہد', fawad: 'فواد', gulzar: 'گلزار', ghulam: 'غلام',
  waqar: 'وقار', waqas: 'وقاص', waseem: 'وسیم', wasi: 'واصی', arslan: 'ارسلان',
  arsalan: 'ارسلان', adnan: 'عدنان', adeel: 'عدیل', abid: 'عابد', abdullah: 'عبداللہ',
  abdul: 'عبد', aftab: 'آفتاب', akhtar: 'اختر', amir: 'عامر', ameer: 'امیر',
  anwar: 'انور', asif: 'آصف', ather: 'اطہر', azhar: 'اظہر', aziz: 'عزیز',
  babar: 'بابر', bashir: 'بشیر', ehsan: 'احسان', ejaz: 'اعجاز', farooq: 'فاروق',
  fazal: 'فضل', hafeez: 'حفیظ', hanif: 'حنیف', ijaz: 'اعجاز', iqbal: 'اقبال',
  ishtiaq: 'اشتیاق', kamal: 'کمال', khalid: 'خالد', khurram: 'خرم', liaquat: 'لیاقت',
  majid: 'مجید', mansoor: 'منصور', naeem: 'نعیم', nawaz: 'نواز', noman: 'نعمان',
  numan: 'نعمان', pervez: 'پرویز', raza: 'رضا', saeed: 'سعید', shakeel: 'شکیل',
  sharjeel: 'شرجیل', siraj: 'سراج', sultan: 'سلطان', taha: 'طٰہ', touqeer: 'توقیر',
  yasin: 'یٰسین', zafar: 'ظفر', zahid: 'زاہد', khan: 'خان', malik: 'ملک',
  sheikh: 'شیخ', shaikh: 'شیخ', chaudhry: 'چوہدری', chaudhary: 'چوہدری', qureshi: 'قریشی',
  siddiqui: 'صدیقی', ansari: 'انصاری', hashmi: 'ہاشمی', abbasi: 'عباسی', rajput: 'راجپوت',
  butt: 'بٹ', mirza: 'مرزا', baig: 'بیگ', awan: 'اعوان', gill: 'گل',
  ayesha: 'عائشہ', aisha: 'عائشہ', fatima: 'فاطمہ', fatimah: 'فاطمہ', zainab: 'زینب',
  zoya: 'زویا', zara: 'زارا', sana: 'ثنا', sania: 'ثانیہ', sara: 'سارہ',
  sarah: 'سارہ', hina: 'حنا', huma: 'ہما', iqra: 'اقرا', javeria: 'جویریہ',
  kiran: 'کرن', laiba: 'لائبہ', mahnoor: 'مہ نور', maryam: 'مریم', mariam: 'مریم',
  mehak: 'مہک', mehwish: 'مہوش', nadia: 'نادیہ', naila: 'نائلہ', noor: 'نور',
  rabia: 'رابعہ', rida: 'ردا', rimsha: 'رمشا', rukhsar: 'رخسار', sadia: 'سعدیہ',
  saima: 'سائمہ', samina: 'ثمینہ', shazia: 'شازیہ', sidra: 'سدرہ', sobia: 'ثوبیہ',
  tahira: 'طاہرہ', tayyaba: 'طیبہ', ujala: 'اجالا', uzma: 'عظمی', wafa: 'وفا',
  zeba: 'زیبا', zunaira: 'زنیرہ', khadija: 'خدیجہ', amina: 'آمنہ', ameena: 'آمنہ',
  bushra: 'بشری', farah: 'فرح', ghazala: 'غزالہ', gulnaz: 'گلناز', humaira: 'حمیرا',
  kinza: 'کنزہ', misbah: 'مصباح', nazia: 'نازیہ', rabail: 'رباب', saba: 'صبا',
  sumaira: 'سمیرا', tehmina: 'تہمینہ', yumna: 'یمنہ', begum: 'بیگم', bibi: 'بی بی',
};

// Longest-match-first cluster -> Urdu letter(s) table for the phonetic
// fallback. Ordered longest-cluster-first so e.g. "kh" is tried before "k".
const CLUSTER_MAP = [
  ['gh', 'غ'], ['kh', 'خ'], ['sh', 'ش'], ['ch', 'چ'], ['dh', 'دھ'], ['th', 'تھ'],
  ['ph', 'پھ'], ['bh', 'بھ'], ['jh', 'جھ'], ['rh', 'رھ'], ['ng', 'نگ'], ['ny', 'نی'],
  ['aa', 'ا'], ['ee', 'ی'], ['oo', 'او'], ['ii', 'ی'], ['ai', 'ے'], ['au', 'او'],
  ['a', 'ا'], ['b', 'ب'], ['c', 'ک'], ['d', 'د'], ['e', 'ے'], ['f', 'ف'],
  ['g', 'گ'], ['h', 'ہ'], ['i', 'ی'], ['j', 'ج'], ['k', 'ک'], ['l', 'ل'],
  ['m', 'م'], ['n', 'ن'], ['o', 'او'], ['p', 'پ'], ['q', 'ق'], ['r', 'ر'],
  ['s', 'س'], ['t', 'ت'], ['u', 'او'], ['v', 'و'], ['w', 'و'], ['x', 'کس'],
  ['y', 'ی'], ['z', 'ز'],
];

const transliterateWord = (word) => {
  const lower = word.toLowerCase();
  if (NAME_DICTIONARY[lower]) return NAME_DICTIONARY[lower];

  let result = '';
  let i = 0;
  while (i < lower.length) {
    const ch = lower[i];
    if (!/[a-z]/.test(ch)) { result += ch; i += 1; continue; }
    const match = CLUSTER_MAP.find(([cluster]) =>
      lower.slice(i, i + cluster.length) === cluster
    );
    if (match) { result += match[1]; i += match[0].length; }
    else { i += 1; } // unrecognised character (rare) — skip rather than guess wrong
  }
  return result;
};

// transliterateRomanUrdu(name) — best-effort Roman Urdu -> Urdu script guess
// for a freely-typed name. Safe to call on anything: non-strings and empty
// strings pass through unchanged.
export const transliterateRomanUrdu = (name) => {
  if (typeof name !== 'string' || !name.trim()) return name;
  return name
    .split(' ')
    .map(word => (word ? transliterateWord(word) : word))
    .join(' ');
};
