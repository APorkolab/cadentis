# Cadentis

**Cadentis** is a web application developed in Angular for real-time analysis and identification of poetic meter, syllable structures, and rhyme schemes. Inspired by ancient Greek prosody, Cadentis offers a comprehensive toolkit for understanding and crafting metrical poetry, making it an ideal resource for poets, linguists, and literature enthusiasts.

### Live Demo

A live, runnable version of this project is automatically deployed via GitHub Actions.

**[Access the Live Demo Here](https://aporkolab.github.io/cadentis/)**

*(Note: The deployment is updated automatically on every push to the `main` branch.)*

---

## Features

-   **Verse Analyzer**: A detailed, line-by-line analysis of poetic text, identifying metrical patterns, rhyme schemes, syllable counts, verse forms, and metrical direction.
-   **Syllable & Mora Counter**: A simple utility to get a quick count of the total syllables and moras in a block of text.
-   **Modern UI**: A clean, responsive, dark-themed UI built with Angular Material, featuring subtle animations for a professional feel.
-   **Performant**: User input is debounced using RxJS for a smooth experience without lagging on large inputs.
-   **Robust Error Handling**: A global error handler ensures the application remains stable and provides user-friendly notifications for unexpected issues.

## Architecture Overview

The application follows a modern, service-oriented architecture with standalone components.

-   **`AppComponent`**: The root component of the application.
-   **Components (`/components`)**:
    -   `VerseAnalyzerComponent`: Handles the main feature of detailed verse analysis.
    -   `SyllableCounterComponent`: Provides the simple counting utility.
-   **Services (`/services`)**:
    -   `VerseAnalysisService`: Contains the core business logic for analyzing verses.
    -   `TextParserService`: A low-level service responsible for parsing text into metrical patterns.
    -   `RhymeAnalyzerService`: Contains the logic for detecting rhyme schemes.
-   **Core Services (`/core`)**:
    -   `GlobalErrorHandler`: Catches all uncaught exceptions to provide stability.
    -   `NotificationService`: A wrapper around Angular Material's SnackBar for displaying user notifications.

## Technologies Used

-   **Framework**: Angular (v20)
-   **UI Components**: Angular Material (v20)
-   **State Management/Reactivity**: RxJS
-   **Language**: TypeScript (v5.8)
-   **CI/CD**: GitHub Actions for automated deployment to GitHub Pages.

## Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/APorkolab/cadentis.git
    cd cadentis
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the application:**
    ```bash
    ng serve
    ```

4.  Access the application in your browser at `http://localhost:4200`.

## Contributing

Contributions are welcome! Please follow these guidelines:

1.  **Fork** the repository.
2.  Create a new **feature branch**.
3.  Make your changes and ensure the code is formatted correctly (`ng lint`).
4.  Write **unit tests** for any new functionality.
5.  Open a **Pull Request** with a clear description of your changes.

---
---

# Cadentis (Magyar Dokumentáció)

A **Cadentis** egy Angular-alapú webalkalmazás, amely valós idejű elemzést nyújt a költői mértékek, szótagszerkezetek és rímképletek felismerésére. Az ókori görög időmértékes verselés ihlette, így a Cadentis átfogó eszköztárat kínál a versritmus és a rímformák elemzésére, ideális eszközt nyújtva költőknek, nyelvészeknek és irodalombarátoknak.

### Élő Demó

A projekt egy futtatható, élő verziója automatikusan telepítésre kerül a GitHub Actions segítségével.

**[Élő Demó Elérése Itt](https://aporkolab.github.io/cadentis/)**

*(Megjegyzés: Az oldal minden `main` branch-re történő push után automatikusan frissül.)*

---

## Funkciók

-   **Verselemző**: Részletes, soronkénti elemzés a költői szövegről, amely azonosítja a mértékmintákat, rímképleteket, szótagszámot, versformákat és a lejtésirányt.
-   **Szótag- és Moraszámláló**: Egy egyszerű segédeszköz, amely gyorsan megszámolja egy szöveg teljes szótag- és moraszámát.
-   **Modern Felhasználói Felület**: Letisztult, reszponzív, sötét témájú felület, amely az Angular Material komponenseit használja, finom animációkkal a professzionális megjelenésért.
-   **Nagy Teljesítményű**: A felhasználói bevitel RxJS segítségével van késleltetve (debounce), ami zökkenőmentes élményt biztosít nagyobb szövegek esetén is.
-   **Robusztus Hibakezelés**: Egy globális hibakezelő biztosítja az alkalmazás stabilitását és felhasználóbarát értesítéseket jelenít meg váratlan problémák esetén.

## Architektúra Áttekintés

Az alkalmazás egy modern, szolgáltatás-orientált architektúrát követ, önálló komponensekkel.

-   **`AppComponent`**: Az alkalmazás gyökérkomponense.
-   **Komponensek (`/components`)**:
    -   `VerseAnalyzerComponent`: A fő funkciót, a részletes verselemzést kezeli.
    -   `SyllableCounterComponent`: Az egyszerű számláló segédeszközt biztosítja.
-   **Szolgáltatások (`/services`)**:
    -   `VerseAnalysisService`: Tartalmazza a versek elemzésének központi üzleti logikáját.
    -   `TextParserService`: Egy alacsony szintű szolgáltatás, amely a szöveg metrikai mintákká való elemzéséért felel.
    -   `RhymeAnalyzerService`: A rímképletek felismerésének logikáját tartalmazza.
-   **Core Szolgáltatások (`/core`)**:
    -   `GlobalErrorHandler`: Minden el nem kapott kivételt elkap a stabilitás érdekében.
    -   `NotificationService`: Az Angular Material SnackBar köré épülő szolgáltatás a felhasználói értesítések megjelenítésére.

## Felhasznált Technológiák

-   **Keretrendszer**: Angular (v20)
-   **UI Komponensek**: Angular Material (v20)
-   **Állapotkezelés/Reaktivitás**: RxJS
-   **Nyelv**: TypeScript (v5.8)
-   **CI/CD**: GitHub Actions az automatizált GitHub Pages telepítéshez.

## Telepítés

1.  **Klónozd a repozitóriumot:**
    ```bash
    git clone https://github.com/APorkolab/cadentis.git
    cd cadentis
    ```

2.  **Telepítsd a függőségeket:**
    ```bash
    npm install
    ```

3.  **Indítsd el az alkalmazást:**
    ```bash
    ng serve
    ```

4.  Nyisd meg az alkalmazást a böngésződben: `http://localhost:4200`.

## Hozzájárulás

Szívesen fogadunk hozzájárulásokat! Kérjük, kövesd az alábbi irányelveket:

1.  **Forkold** a repozitóriumot.
2.  Hozz létre egy új **feature branch**-et.
3.  Végezd el a módosításokat, és győződj meg róla, hogy a kód megfelelően van formázva (`ng lint`).
4.  Írj **unit teszteket** minden új funkcióhoz.
5.  Nyiss egy **Pull Requestet** a változtatások egyértelmű leírásával.
