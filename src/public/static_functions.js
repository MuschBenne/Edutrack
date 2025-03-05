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


function totalHoursSpentDivided(sessionData) {
    const labels = ['Lecture', 'SelfStudies', 'Lesson', 'Homework', 'Labs', 'Project', 'TentaP', 'Other'];
    const totalHours = {}; 

    // Initialize totals with 0 for each label
    labels.forEach(label => {
        totalHours[label] = 0;
    });

    // Iterate through sessionData
    for (const date in sessionData) {
        sessionData[date].forEach(session => {
            if (labels.includes(session.typeOfStudy)) {
                totalHours[session.typeOfStudy] += session.time;
            }
        });
    }
    return totalHours;
}

function totalHoursSpentWeekly(sessionData){
    return [
        { week: 10, lecture: 5, selfstudy: 3, homework: 2, labs:2, lesson:2, project:3 },
        { week: 11, lecture: 10, selfstudy: 5, homework: 5 },
        { week: 12, lecture: 7, selfstudy: 6, homework: 2 },
        { week: 13, lecture: 12, selfstudy: 8, homework: 5 },
        { week: 14, lecture: 10, selfstudy: 9, homework: 3 },
        { week: 15, lecture: 15, selfstudy: 10, homework: 5 },
        { week: 16, tentaP:20},
    ];
}