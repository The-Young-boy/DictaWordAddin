import * as React from "react";
import { useEffect, useState } from "react";
import TextInsertion from "./TextInsertion";
import { FluentProvider, webLightTheme, webDarkTheme, makeStyles, tokens } from "@fluentui/react-components";

const useStyles = makeStyles({
  root: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: tokens.colorNeutralBackground1, // מתחלף אוטומטית בהיר/כהה
    color: tokens.colorNeutralForeground1,
  },
});

const AppContent: React.FC = () => {
  const styles = useStyles();
  return (
    <div className={styles.root}>
      <TextInsertion />
    </div>
  );
};

const App: React.FC = () => {
  // מאזין למצב הכהה של מערכת ההפעלה/דפדפן
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const matchMedia = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDarkMode(matchMedia.matches);

    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    matchMedia.addEventListener("change", handler);
    return () => matchMedia.removeEventListener("change", handler);
  }, []);

  return (
    <FluentProvider theme={isDarkMode ? webDarkTheme : webLightTheme} style={{ minHeight: "100vh" }}>
      <AppContent />
    </FluentProvider>
  );
};

export default App;