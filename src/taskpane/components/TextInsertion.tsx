import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Button, Checkbox, Spinner, makeStyles, tokens, Radio, RadioGroup, Label, Divider, Accordion, AccordionItem, AccordionHeader, AccordionPanel } from "@fluentui/react-components";
import { fetchNakdan } from "../dictaApi";

export interface NakdanOption {
  w: string;
  levelChoice: number;
  lex?: string;
}

export interface NakdanWord {
  str: string;
  sep: boolean;
  nakdan?: {
    options: NakdanOption[];
    fconfident?: boolean;
  };
}

export interface LetterNikud {
  base: string;
  dagesh: string;
  sinDot: string;
  vowel: string;
}

const useStyles = makeStyles({
  wrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "16px",
    fontFamily: "system-ui, -apple-system, sans-serif",
    width: "100%",
    minHeight: "100vh",
    boxSizing: "border-box",
    backgroundColor: tokens.colorNeutralBackground2,
  },
  card: {
    width: "100%",
    maxWidth: "500px",
    boxSizing: "border-box",
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: "16px",
    padding: "20px",
    boxShadow: tokens.shadow8,
    border: `1px solid ${tokens.colorTransparentStroke}`,
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  headerNav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: "12px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  dynamicWord: {
    fontSize: "clamp(28px, 10vw, 56px)",
    fontWeight: "900",
    textAlign: "center",
    color: tokens.colorNeutralForeground1,
    margin: "12px 0",
    direction: "rtl",
    wordBreak: "break-word",
    lineHeight: "1.2",
  },
  level1Button: {
    width: "100%",
    padding: "16px",
    fontSize: "clamp(22px, 6vw, 28px)",
    fontWeight: "bold",
    borderRadius: "12px",
    boxShadow: tokens.shadow2,
  },
  chipsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    justifyContent: "center",
  },
  chipButton: {
    fontSize: "18px",
    padding: "6px 16px",
    borderRadius: "100px",
    fontWeight: "600",
  },
  manualWordRow: {
    display: "flex",
    justifyContent: "center",
    direction: "rtl",
    padding: "12px 0",
    fontSize: "clamp(32px, 8vw, 48px)",
    fontWeight: "bold",
    flexWrap: "wrap",
  },
  manualLetter: {
    cursor: "pointer",
    padding: "0 2px",
    borderBottom: "4px solid transparent",
    transition: "all 0.15s ease",
  },
  manualLetterActive: {
    color: tokens.colorBrandForeground1,
    borderBottom: `4px solid ${tokens.colorBrandForeground1}`,
    backgroundColor: tokens.colorBrandBackground2,
    borderRadius: "4px",
  },
  keyboardFlow: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "8px",
    direction: "rtl",
    backgroundColor: tokens.colorNeutralBackground3,
    padding: "16px",
    borderRadius: "16px",
  },
  keyboardKey: {
    fontSize: "22px",
    minWidth: "48px",
    height: "48px",
    borderRadius: "8px",
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  settingsGroup: {
    display: 'flex', 
    flexDirection: 'column', 
    gap: '8px', 
    direction: 'rtl',
    textAlign: 'right'
  }
});

const NIKUD_KEYBOARD = [
  { label: "קמץ", symbol: "\u05B8" }, { label: "פתח", symbol: "\u05B7" },
  { label: "צירה", symbol: "\u05B5" }, { label: "סגול", symbol: "\u05B6" },
  { label: "חיריק", symbol: "\u05B4" }, { label: "חולם", symbol: "\u05B9" },
  { label: "קובוץ", symbol: "\u05BB" }, { label: "שווא", symbol: "\u05B0" },
  { label: "חטף קמץ", symbol: "\u05B3" }, { label: "חטף פתח", symbol: "\u05B2" },
  { label: "חטף סגול", symbol: "\u05B1" }, { label: "ללא", symbol: "" }
];

const TextInsertion: React.FC = () => {
  const styles = useStyles();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [wordsData, setWordsData] = useState<NakdanWord[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isManualMode, setIsManualMode] = useState<boolean>(false);
  const [manualLetters, setManualLetters] = useState<LetterNikud[]>([]);
  const [currentLetterIndex, setCurrentLetterIndex] = useState<number>(0);
  const [stopOnEveryWord, setStopOnEveryWord] = useState<boolean>(false);

  // כל ההגדרות במדויק. ברירות מחדל לפי ה-Payload שהעברת קודם
  const [apiSettings, setApiSettings] = useState({
    genre: "modern",
    addmorph: true,
    useTokenization: true,
    keepqq: true,
    nodageshdefmem: true,
    patachma: true,
    keepmetagim: true,
    matchpartial: true,
    fullspelling: false,
    ignoreoriginal: false,
    skipnikud: true,
    skippartial: false,
    skipsingle: false,
    skipacronyms: false,
    skipround: false,
    skipsquare: false,
    skipcurly: false,
    splitparentheses: false,
    shvadagesh: false
  });

const [isOnline, setIsOnline] = useState(navigator.onLine);

useEffect(() => {
  const goOnline = () => setIsOnline(true);
  const goOffline = () => setIsOnline(false);
  window.addEventListener('online', goOnline);
  window.addEventListener('offline', goOffline);
  return () => {
    window.removeEventListener('online', goOnline);
    window.removeEventListener('offline', goOffline);
  };
}, []);

if (!isOnline) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h2 style={{color: tokens.colorPaletteRedForeground1}}>אין חיבור אינטרנט</h2>
        <p>הנקדן זקוק לחיבור פעיל כדי לתקשר עם שרתי דיקטה. אנא התחבר ונסה שוב.</p>
        <Button onClick={() => window.location.reload()}>נסה שוב</Button>
      </div>
    </div>
  );
}

  const wordsDataRef = useRef(wordsData);
  const currentIndexRef = useRef(currentIndex);

  useEffect(() => {
    wordsDataRef.current = wordsData;
    currentIndexRef.current = currentIndex;
  }, [wordsData, currentIndex]);

  const cleanWord = (word: string) => word.replace(/\|/g, "");

  const getUniqueOptions = (options: NakdanOption[]) => {
    const unique: (NakdanOption & { cleanW: string })[] = [];
    const seen = new Set();
    options.forEach(opt => {
      const clean = cleanWord(opt.w);
      if (!seen.has(clean)) { seen.add(clean); unique.push({ ...opt, cleanW: clean }); }
    });
    return unique;
  };

  const clearBookmarks = async () => {
    try {
      await Word.run(async (context) => {
        context.document.deleteBookmark("DictaCurrentWord");
        context.document.deleteBookmark("DictaSearchOrigin");
        await context.sync();
      });
    } catch (e) {}
  };

  // מאזין קליקים שמעדכן גם את הסימניות
  useEffect(() => {
    const handleSelectionChange = async () => {
      if (!wordsDataRef.current) return;
      try {
        await Word.run(async (context) => {
          const selection = context.document.getSelection();
          selection.load("text");
          await context.sync();
          const clickedTextRaw = selection.text;
          if (!clickedTextRaw || clickedTextRaw.trim() === "") return;
          const clickedTextClean = clickedTextRaw.replace(/[\u0591-\u05C7.,:;!?\-\(\)"'\[\]\s]/g, '');
          if (!clickedTextClean) return;
          const foundIndex = wordsDataRef.current!.findIndex(w => !w.sep && w.str.replace(/[.,:;!?\-\(\)"'\[\]\s]/g, '') === clickedTextClean);
          
          if (foundIndex !== -1 && foundIndex !== currentIndexRef.current) {
             setCurrentIndex(foundIndex);
             setIsManualMode(false);
             
             // העברת הסימניות למילה החדשה שנבחרה
             selection.insertBookmark("DictaCurrentWord");
             selection.getRange("After").insertBookmark("DictaSearchOrigin");
             await context.sync();
          }
        });
      } catch (err) {}
    };
    Office.context.document.addHandlerAsync(Office.EventType.DocumentSelectionChanged, handleSelectionChange);
    return () => { Office.context.document.removeHandlerAsync(Office.EventType.DocumentSelectionChanged, { handler: handleSelectionChange }); };
  }, []);

  const processNextWords = async (startIndex: number, data: NakdanWord[], alwaysStop: boolean) => {
    let checkIndex = startIndex;
    try {
      await Word.run(async (context) => {
        while (checkIndex < data.length) {
          const word = data[checkIndex];
          if (!word.sep && word.nakdan?.options && word.nakdan.options.length > 0) {
            const uniqueOpts = getUniqueOptions(word.nakdan.options);
            const shouldStop = uniqueOpts.length > 1 || word.nakdan.fconfident === false || alwaysStop;
            
            // מתחיל חיפוש אך ורק מסמן המעקב הקודם (SearchOrigin)
            let origin;
            try {
              origin = context.document.getBookmarkRange("DictaSearchOrigin");
            } catch (e) {
              origin = context.document.getSelection().getRange("End");
            }
            
            const searchRange = origin.expandTo(context.document.body.getRange("End"));
            let results = searchRange.search(word.str, { matchCase: true, matchWholeWord: true });
            results.load("items");
            await context.sync();

            if (results.items.length === 0) {
               results = searchRange.search(word.str, { matchCase: true });
               results.load("items");
               await context.sync();
            }

            if (results.items.length > 0) {
              const targetItem = results.items[0];
              
              if (!shouldStop) {
                // מחליף את הטקסט ומזיז את נקודת החיפוש הבאה לשם
                const insertedRange = targetItem.insertText(uniqueOpts[0].cleanW, Word.InsertLocation.replace);
                insertedRange.getRange("After").insertBookmark("DictaSearchOrigin");
                await context.sync();
                checkIndex++;
              } else {
                // עוצר ומסמן למשתמש בסימניית עוגן קבועה
                setCurrentIndex(checkIndex);
                targetItem.select();
                targetItem.insertBookmark("DictaCurrentWord");
                targetItem.getRange("After").insertBookmark("DictaSearchOrigin");
                await context.sync();
                return;
              }
            } else {
              checkIndex++;
            }
          } else { 
            checkIndex++; 
          }
        }
        setCurrentIndex(-1); 
        setWordsData(null);
        clearBookmarks();
      });
    } catch (err) { console.error(err); }
  };

  const handleNikudClick = async () => {
    setIsLoading(true); setIsManualMode(false);
    try {
      let textToNikud = "";
      await Word.run(async (context) => {
        let selection = context.document.getSelection();
        selection.load("text");
        await context.sync();
        
        // משיכת כל הפסקה כדי לקבל הקשר, גם אם סומנה מילה בודדת (ללא רווחים) או לא סומן כלום
        if (!selection.text || selection.text.trim() === "" || selection.text.trim().indexOf(" ") === -1) {
          const paragraph = selection.paragraphs.getFirstOrNullObject();
          paragraph.load("text");
          await context.sync();
          
          if (!paragraph.isNullObject && paragraph.text.trim() !== "") {
            textToNikud = paragraph.text;
            paragraph.getRange().select();
            await context.sync();
            // מיקום הסימניה הראשונית
            context.document.getSelection().getRange("Start").insertBookmark("DictaSearchOrigin");
            await context.sync();
          }
        } else {
          textToNikud = selection.text;
          selection.getRange("Start").insertBookmark("DictaSearchOrigin");
          await context.sync();
        }
      });

      if (!textToNikud || textToNikud.trim() === "") { setIsLoading(false); return; }
      
      // פיצול חכם (Chunking) למשפטים כדי למנוע שגיאות Timeout בשרת
      const chunks = textToNikud.match(/[^.!?\n]+[.!?\n]*/g) || [textToNikud];

      // יצירת מערך של בקשות מקבילות לדיקטה
      const fetchPromises = chunks.map(chunk => {
        const trimmedChunk = chunk.trim();
        if (trimmedChunk.length === 0) return Promise.resolve({ data: [] });
        return fetchNakdan(trimmedChunk, apiSettings);
      });

      // המתנה לכל התשובות מהשרת יחד
      const results = await Promise.all(fetchPromises);
      
      // איחוד כל התוצאות (מערכים של מילים) למערך מילים אחד רציף (Flatten)
      const combinedWordsData = results.flatMap(res => res.data);

      setWordsData(combinedWordsData);
      await processNextWords(0, combinedWordsData, stopOnEveryWord);
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  const handleOptionSelect = async (cleanNikudText: string) => {
    try {
      await Word.run(async (context) => {
        // מתעלם לגמרי ממיקום העכבר הנוכחי! מחליף *רק* את המילה המסומנת בסימניה
        let targetItem;
        try {
          targetItem = context.document.getBookmarkRange("DictaCurrentWord");
        } catch (e) {
          targetItem = context.document.getSelection(); // גיבוי אחרון
        }
        const insertedRange = targetItem.insertText(cleanNikudText, Word.InsertLocation.replace);
        insertedRange.select();
        insertedRange.getRange("After").insertBookmark("DictaSearchOrigin");
        await context.sync();
      });
      await processNextWords(currentIndex + 1, wordsData!, stopOnEveryWord);
    } catch (error) { console.error(error); }
  };

  const handleCancelNikud = () => {
    setCurrentIndex(-1); setWordsData(null); setIsManualMode(false);
    clearBookmarks();
  };

  const updateWordLiveInDoc = async (letters: LetterNikud[]) => {
    const assembledWord = letters.map(l => l.base + l.sinDot + l.dagesh + l.vowel).join("");
    try {
      await Word.run(async (context) => {
        let targetItem;
        try { targetItem = context.document.getBookmarkRange("DictaCurrentWord"); } 
        catch (e) { targetItem = context.document.getSelection(); }
        
        const insertedRange = targetItem.insertText(assembledWord, Word.InsertLocation.replace);
        insertedRange.select();
        // מעדכן את הסימניה למילה החדשה כדי שגם הלחיצה הבאה תתלבש עליה בדיוק
        insertedRange.insertBookmark("DictaCurrentWord");
        insertedRange.getRange("After").insertBookmark("DictaSearchOrigin");
        await context.sync();
      });
    } catch (err) {}
  };

  const startManualMode = () => {
    const lettersArray: LetterNikud[] = wordsData![currentIndex].str.split('').map(char => ({ base: char, dagesh: "", sinDot: "", vowel: "" }));
    setManualLetters(lettersArray); setCurrentLetterIndex(0); setIsManualMode(true);
  };

  const toggleDagesh = async () => {
    const newLetters = [...manualLetters]; newLetters[currentLetterIndex].dagesh = newLetters[currentLetterIndex].dagesh === "" ? "\u05BC" : "";
    setManualLetters(newLetters); await updateWordLiveInDoc(newLetters);
  };

  const setSinDot = async (dot: string) => {
    const newLetters = [...manualLetters]; newLetters[currentLetterIndex].sinDot = newLetters[currentLetterIndex].sinDot === dot ? "" : dot;
    setManualLetters(newLetters); await updateWordLiveInDoc(newLetters);
  };

  const setVowel = async (vowel: string) => {
    const newLetters = [...manualLetters]; newLetters[currentLetterIndex].vowel = vowel;
    setManualLetters(newLetters); await updateWordLiveInDoc(newLetters);
    if (currentLetterIndex < manualLetters.length - 1) { setCurrentLetterIndex(currentLetterIndex + 1); }
  };

  const applyManualMode = async () => {
    setIsManualMode(false);
    processNextWords(currentIndex + 1, wordsData!, stopOnEveryWord);
  };

  const handleSettingChange = (key: string, value: any) => { setApiSettings(prev => ({ ...prev, [key]: value })); };

  const currentWord = wordsData && currentIndex >= 0 ? wordsData[currentIndex] : null;
  const currentBaseLetter = isManualMode && manualLetters[currentLetterIndex] ? manualLetters[currentLetterIndex].base : "";
  const uniqueOptions = currentWord?.nakdan ? getUniqueOptions(currentWord.nakdan.options) : [];
  const level1Options = uniqueOptions.filter(o => o.levelChoice === 1);
  const otherOptions = uniqueOptions.filter(o => o.levelChoice > 1);

  return (
    <div className={styles.wrapper}>
      {!wordsData && (
        <div className={styles.card}>
          <div style={{ textAlign: "center", marginBottom: "8px" }}>
            <h2 style={{ fontSize: "28px", margin: "0", color: tokens.colorBrandForeground1 }}>נקדן דיקטה</h2>
          </div>
          
          <Button appearance="primary" size="large" onClick={handleNikudClick} disabled={isLoading} style={{height: '56px', fontSize: '20px', borderRadius: '12px'}}>
            {isLoading ? <Spinner size="small" appearance="inverted" /> : "סמן ונקד (או לחץ לניקוד הפסקה)"}
          </Button>

          <Accordion collapsible>
            <AccordionItem value="settings">
              <AccordionHeader dir="rtl">הגדרות ניקוד מלאות</AccordionHeader>
              <AccordionPanel className={styles.settingsGroup}>
                <Label weight="semibold">סגנון טקסט:</Label>
                <RadioGroup value={apiSettings.genre} onChange={(_, d) => handleSettingChange("genre", d.value)} layout="horizontal">
                  <Radio value="modern" label="מודרני" />
                  <Radio value="rabbinic" label="רבני" />
                  <Radio value="modernpoetry" label="שירה מודרנית" />
                  <Radio value="medievalpoetry" label="שירת ימי הביניים" />
                </RadioGroup>
                
                <Divider style={{margin: '12px 0'}} />
                
                <Label weight="semibold">כללי ניקוד:</Label>
                <Checkbox size="large" label="ניקוד בכתיב מלא" checked={apiSettings.fullspelling} onChange={(_, d) => handleSettingChange("fullspelling", !!d.checked)} />
                <Checkbox size="large" label="ניקוד בקמץ קטן" checked={apiSettings.keepqq} onChange={(_, d) => handleSettingChange("keepqq", !!d.checked)} />
                <Checkbox size="large" label="השמטת דגש כבמקורות" checked={apiSettings.nodageshdefmem} onChange={(_, d) => handleSettingChange("nodageshdefmem", !!d.checked)} />
                <Checkbox size="large" label='ניקוד "מה" בפתח+דגש' checked={apiSettings.patachma} onChange={(_, d) => handleSettingChange("patachma", !!d.checked)} />
                <Checkbox size="large" label="שמור על מתגים" checked={apiSettings.keepmetagim} onChange={(_, d) => handleSettingChange("keepmetagim", !!d.checked)} />
                <Checkbox size="large" label="לא להתחשב בניקוד מקורי" checked={apiSettings.ignoreoriginal} onChange={(_, d) => handleSettingChange("ignoreoriginal", !!d.checked)} />
                
                <Divider style={{margin: '12px 0'}} />
                
                <Label weight="semibold">דלג על הניקוד באפשרויות הבאות:</Label>
                <Checkbox size="large" label="מילה מנוקדת" checked={apiSettings.skipnikud} onChange={(_, d) => handleSettingChange("skipnikud", !!d.checked)} />
                <Checkbox size="large" label="מילה מנוקדת חלקית" checked={apiSettings.skippartial} onChange={(_, d) => handleSettingChange("skippartial", !!d.checked)} />
                <Checkbox size="large" label="אות בודדת" checked={apiSettings.skipsingle} onChange={(_, d) => handleSettingChange("skipsingle", !!d.checked)} />
                <Checkbox size="large" label="ראשי תיבות" checked={apiSettings.skipacronyms} onChange={(_, d) => handleSettingChange("skipacronyms", !!d.checked)} />
                <Checkbox size="large" label="סוגריים עגולים ()" checked={apiSettings.skipround} onChange={(_, d) => handleSettingChange("skipround", !!d.checked)} />
                <Checkbox size="large" label="סוגריים מרובעים []" checked={apiSettings.skipsquare} onChange={(_, d) => handleSettingChange("skipsquare", !!d.checked)} />
                <Checkbox size="large" label="סוגריים מסולסלים {}" checked={apiSettings.skipcurly} onChange={(_, d) => handleSettingChange("skipcurly", !!d.checked)} />
                
                <Divider style={{margin: '12px 0'}} />
                <Label weight="semibold">הגדרות נוספות:</Label>
                <Checkbox size="large" label="פצל מילה עם סוגריים" checked={apiSettings.splitparentheses} onChange={(_, d) => handleSettingChange("splitparentheses", !!d.checked)} />
                <Checkbox size="large" label="השמט דגשים שאינם נשמעים" checked={apiSettings.shvadagesh} onChange={(_, d) => handleSettingChange("shvadagesh", !!d.checked)} />

                <Divider style={{margin: '12px 0'}} />
                <Checkbox size="large" label="עצור לאישור בכל מילה" checked={stopOnEveryWord} onChange={(_, d) => setStopOnEveryWord(!!d.checked)} style={{color: tokens.colorBrandForeground1, fontWeight: 'bold'}} />
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </div>
      )}

      {currentWord && !isManualMode && (
        <div className={styles.card}>
          <div className={styles.headerNav}>
            <Button appearance="subtle" onClick={handleCancelNikud} style={{color: tokens.colorPaletteRedForeground1}}>סיום/ביטול</Button>
            <Button appearance="secondary" onClick={startManualMode}>ידני ✍️</Button>
          </div>
          
          <div className={styles.dynamicWord}>{currentWord.str}</div>
          
          <div>
            {level1Options.map((opt, i) => (
              <Button key={`l1-${i}`} appearance="primary" className={styles.level1Button} onClick={() => handleOptionSelect(opt.cleanW)} title={opt.lex ? `שורש/למה: ${opt.lex}` : ""}>
                {opt.cleanW}
              </Button>
            ))}

            {otherOptions.length > 0 && (
              <div className={styles.chipsContainer}>
                {otherOptions.map((opt, i) => (
                  <Button key={`l2-${i}`} appearance="secondary" className={styles.chipButton} onClick={() => handleOptionSelect(opt.cleanW)} title={opt.lex ? `שורש/למה: ${opt.lex}` : ""}>
                    {opt.cleanW}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {isManualMode && (
        <div className={styles.card}>
          <div className={styles.headerNav}>
            <div style={{fontWeight: "bold", fontSize: "18px", color: tokens.colorNeutralForeground3}}>עריכה ידנית</div>
            <Button appearance="subtle" onClick={() => setIsManualMode(false)}>חזור לאפשרויות</Button>
          </div>

          <div className={styles.manualWordRow}>
            {manualLetters.map((l, i) => (
              <span key={i} className={`${styles.manualLetter} ${i === currentLetterIndex ? styles.manualLetterActive : ""}`} onClick={() => setCurrentLetterIndex(i)}>
                {l.base}{l.sinDot}{l.dagesh}{l.vowel}
              </span>
            ))}
          </div>
          
          <div className={styles.keyboardFlow}>
            <Button className={styles.keyboardKey} appearance="secondary" onClick={toggleDagesh}>{currentBaseLetter}ּ</Button>
            {currentBaseLetter === 'ש' && (
              <><Button className={styles.keyboardKey} appearance="secondary" onClick={() => setSinDot("\u05C1")}>שׁ</Button><Button className={styles.keyboardKey} appearance="secondary" onClick={() => setSinDot("\u05C2")}>שׂ</Button></>
            )}
            {NIKUD_KEYBOARD.map((n, i) => (
              <Button key={i} appearance="subtle" className={styles.keyboardKey} onClick={() => setVowel(n.symbol)} title={n.label}>
                {n.symbol === "" ? "❌" : `${currentBaseLetter}${n.symbol}`}
              </Button>
            ))}
          </div>

          <Button appearance="primary" size="large" style={{marginTop: "8px"}} onClick={applyManualMode}>
            החל והמשך
          </Button>
        </div>
      )}
    </div>
  );
};

export default TextInsertion;