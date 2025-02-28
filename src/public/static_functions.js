/**
 * Detta js dokument servas till användaren i webbläsaren och bör bara innehålla statiska funktioner.
 */

//TODO: Statistik: Skapa funktioner som beräknar diverse genomsnitt på en användares data

// Exempel (Vi antar att sessionData är sessions biten på en activeCourses entry)
function calculateAverageWellbeing(sessionData){
    let wellbeingTotal = 0;
    let entryCount = 0;
    for(date in sessionData){
        sessionData[date].forEach(session => {
            wellbeingTotal += session.health;
            entryCount++;
        });
    }
    return wellbeingTotal / entryCount;
}