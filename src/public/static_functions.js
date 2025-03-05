/**
 * Detta js dokument servas till användaren i webbläsaren och bör bara innehålla statiska funktioner.
 */

// Statistik: Skapa funktioner som beräknar diverse genomsnitt på en användares data

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

function calculateAverageRating(sessionData){
    let ratingTotal = 0;
    let entryCount = 0;
    for(date in sessionData){
        sessionData[date].forEach(session => {
            ratingTotal += session.gradeSess;
            entryCount++;
        });
    }
    return ratingTotal/ entryCount;
}

//returns total time spent on course in minutes
function calculateTotalTime(sessionData){
    let timeTotal = 0;
    for(date in sessionData){
        sessionData[date].forEach(session => {
            timeTotal += session.time;
        })
    }
    return timeTotal; 
}

function hoursSpent(sessionData){
    let timeSpent = calculateTotalTime(sessionData);
    return (timeSpent / 60).toFixed(1);//returns string
}




function totalHoursSpentDivided(sessionData){
    let lectureTotal = 0;
    let selfstudiesTotal = 0;
    let homeworkTotal = 0;
    let projectTotal = 0;
    let tentaPTotal = 0;
    let labsTotal = 0;
    let lessonTotal = 0;
    let otherTotal = 0;

    


}