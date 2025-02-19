# BJB-AB
Project Repository for Program Design &amp; Data Structures

# Tjena boys
## För att börja:

1. Första gången ni ska sätta upp repot, eller skriver kod från en ny maskin, kör ni:
```bash
git clone "https://github.com/FrickTown/BJB-AB.git" &&
cd BJB-AB &&
git checkout dev &&
npm install;
```

2. Installera MongoDB på er dator.   
Länk hittar ni här:
https://www.mongodb.com/docs/manual/administration/install-community/#std-label-install-mdb-community-edition  

Installera Mongo Shell så ni kan kommunicera med databasen (Välj MacOS eller Windows under plattform):
https://www.mongodb.com/try/download/shell

(Om ni vill kan ni även MongoDB-Compass, en GUI till Mongo databaser. Kanske kan vara till hjälp.):
https://www.mongodb.com/try/download/compass

3. För att köra koden:
    
    1. Alternativ 1 (Bäst): 
    `npm run dev`
    2. Alternativ 2:

        3. Kompilera er kod till js: `npm build`

        4. För att starta webbservern: `npm start`