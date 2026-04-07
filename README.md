# RzabiakPack - Panel Dodatkow do Margonem

Zestaw przydatnych dodatków do gry [Margonem](https://margonem.pl/) w formie panelu Tampermonkey.

## Instalacja

1. Zainstaluj rozszerzenie [Tampermonkey](https://www.tampermonkey.net/) w swojej przeglądarce.
2. Kliknij poniższy link, aby zainstalować skrypt:

   **[➡ Zainstaluj RzabiakPack](https://raw.githubusercontent.com/kruulxd/RzabiakPack/main/rzabiak-pack.user.js)**

3. Tampermonkey zapyta o potwierdzenie instalacji — kliknij **Install**.
4. Wejdź na [margonem.pl](https://margonem.pl/) i zaloguj się. Panel pojawi się automatycznie.

## Automatyczne aktualizacje

Skrypt pobiera wszystkie pliki bezpośrednio z tego repozytorium, więc każda zmiana w repo jest od razu widoczna po odświeżeniu gry.

Aby sprawdzić i zainstalować aktualizację metadanych skryptu (np. nowa wersja), wejdź w Dashboard Tampermonkey → prawy przycisk przy skrypcie → **Check for Updates**.

## Dostępne dodatki

| Addon | Opis | Interfejs |
|-------|------|-----------|
| **Ulepszarka NI** | Automatyczne ulepszanie i rozbijanie przedmiotów | Nowy |
| **Ulepszarka SI** | Automatyczne ulepszanie i rozbijanie przedmiotów | Stary |
| **Grupa w zasięgu** | Podświetla nicki członków grupy poza zasięgiem walki | Nowy |
| **Timer respy** | Timer respu E2 i Tytana pokazany w oknie gry | Nowy |
| **Super sprzedawca** | Szybkie sprzedawanie przedmiotów u NPC | Nowy |
| **Kalendarz** | Automatyczne odbieranie kalendarza | Nowy |
| **Random group** | Losowanie do grupy | Nowy |

> Dodatki oznaczone jako WIP (work in progress) są widoczne w panelu, ale jeszcze nie działają.

## Dla developerów

Jeśli chcesz uruchomić projekt lokalnie (np. do testowania zmian):

```bash
npm install
npm start
```

Serwer lokalny działa na `http://localhost:3001`. Zainstaluj wersję lokalną z `Rzabiak-Pack/rzabiak-pack-user.js` zamiast tej z GitHub.

## Autor

**kruulxd**
