# Git Instruktioner och Cheat Sheet

Aight boys, här kommer det väsentliga:

# Setup
Första gången ni ska sätta upp repot, eller skriver kod från en ny maskin, kör ni:  
`git clone "https://github.com/FrickTown/BJB-AB.git"`

I VSCode, tryck CTRL+Shift+P och skriv "Settings". Tryck enter, och sök efter en inställning som heter "Autofetch". Se till att den är satt till **true**. Detta bara ser till att VSCode kollar då och då om någon har pushat något, så ni vet om ni behöver pulla något.

# Innan en sesh
När ni börjar en kodskrivar sesh, börja alltid med en  
```bash
git pull
```  
så alla senaste ändringar är med.
Det kan förhindra en del krångel i merge conflicts senare.
När ni använder VSCode kan ni trycka CTRL + Shift + P och skriva git pull (Command + istället för CTRL på Mac).Alternativet är att använda git i sidebaren under "Source Control".

# Under en sesh
Medans ni skriver kod i en fil, kan det vara bra när ni lagt till ett par rader som ni är säkra på
är konkreta och självständigt värdefulla (exempelvis en ny funktion som ni testat), att ni ***sparar*** filen,
och sen i VSCode's git ruta (under Changes), trycker på **+** bredvid filnamnet, och skriver i meddelande-rutan:

    Added *funktionsnamn*: *kort beskrivning*

Sen trycker ni ✅ Commit, och därefter trycker ni push eller sync.

# Efter en sesh
När ni avslutar en kodsesh, avsluta den ***helst*** när ni har gjort en ordentlig commit och pushat den. 
Om ni är mitt uppe i att skriva någon funktion eller så, committa inte den koden, utan låt den bara vara.

# När vi fått en feature fullt implementerad
Då mergear vi `dev`-branchen med `main`-branchen. Se alltid till att ni är på dev-branchen, det står längst ned i vänstra hörnet av VSCode fönstret.

