# Plan lekcji — zasady projektu

## Źródło zasad dotykowych
Podłogi dla ekranu dotykowego pochodzą z projektu LaunchPad (`design-system.md` §1 i §9). Trzymaj je w każdym ekranie telefonu:

- Kanwa telefonu: **412 × 915**, tylko portret.
- Tekst czytelny: **min. 17px**; najmniejszy rozmiar **14px** i tylko dla meta (godzina końca, przerwa, nazwisko). Nic mniejszego.
- Cele dotykowe: **≥ 44 × 44px**.
- Interlinia tekstu wielowierszowego: **≥ 1.3**.
- Kontrast: **WCAG AA** — 4.5:1 tekst zwykły, 3:1 duży tekst i elementy UI.
- **Stan nigdy samym kolorem** — zawsze dodatkowo kształt, ikona, tekst lub pozycja.
- Jednostki: **px**, nie rem. Ruch opcjonalny, nigdy nie nośnik stanu.

## Zasady specyficzne dla planu lekcji
- **Kolory lekcji to kod, nie dekoracja.** Zawsze w pełnej sile, dokładnie hexy z `lessons.json` (zielony = strój, niebieski = zajęcia dodatkowe, biały = zwykła lekcja). Nigdy nie rozcieńczaj ich ani nie zamieniaj na tokeny.
- Kolor lekcji zawsze idzie w parze z nazwą i legendą — kolor sam nie przenosi znaczenia.
- Tekst na lekcji: ciemny na jasnym tle, biały na nasyconym (luminancja < 0.55).
- Cały dzień mieści się na ekranie bez przewijania; dzień zmienia się gestem i tabkami.
- „Dziś” oznaczane kropką na tabce i plakietką przy nazwie dnia, nie kolorem.
- Dane, godziny i nazwiska są brane wprost z repo `autioch/lesson-plan` (patrz `github.md`); nie przepisuj ich ani nie skracaj nazw zajęć bez pytania.
- Copy po polsku, słownictwo z aplikacji („+15 min”, „przerwa”, nazwy dni pełne).

## Wariant na bazie LaunchPad
`launchpad-styles.css` to kopia `styles.css` z LaunchPad (tokeny, motywy, skale typu). Wariant „LaunchPad” linkuje ten plik w `<helmet>`, ustawia `data-surface="phone"` na korzeniu ekranu i czyta wyłącznie tokeny (`--fs-*`, `--space-*`, `--surface-*`, `--text-*`, `--accent`, `--radius-*`, `--line-subtle`). Jedyny świadomy wyjątek: tła lekcji, bo to dane domenowe planu, a nie kolory systemu.
