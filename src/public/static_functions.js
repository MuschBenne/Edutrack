/**
 * Detta js dokument servas till användaren i webbläsaren och bör bara innehålla statiska funktioner.
 */
// Exempel (Vi antar att sessionData är sessions biten på en activeCourses entry)


/**
 *calculates the average wellbeing over all session on course
 * @param {object} takes sessiondata as input 
 * @returns {number} returns average wellbeing as number
*/
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

/**
 *calculates the average rating of sessions
 * @param {object} takes sessiondata as input
 * @returns {number} returns average rating as number
*/
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

/**
 *calculates total time spent on a course
 * @param {object} takes sessiondata as input
 * @returns {number} returns time spent in minutes
*/
function calculateTotalTime(sessionData){
    let timeTotal = 0;
    for(date in sessionData){
        sessionData[date].forEach(session => {
            timeTotal += session.time;
        })
    }
    return timeTotal; 
}

/**
 *returns time spent on a course
 * @param {object} takes sessiondata as input
 * @returns {string} returns time spent in hours
*/
function hoursSpent(sessionData){
    let timeSpent = calculateTotalTime(sessionData);
    return (timeSpent / 60).toFixed(1);//returns string
}

/**
* Takes sessiondata from a course an returns it divided weekly
* @param {object} contains sessiondata for a course
* @returns {object} containing time spent on each type of study ex {Lecture:10,Selfstudies:40 .... }
*/
function totalHoursSpentDivided(sessionData) {
    const labels = ['Lecture', 'Selfstudies', 'Lesson', 'Homework', 'Labs', 'Project', 'TentaP', 'Other'];
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


/**
* Takes sessiondata from a course an returns it divided weekly and merges type of studies seperatly
* @param {object} contains sessiondata for a course
* @returns {array{object}} Returns array with objects separeted weekly and time spent on each type of study.
//ex return [{week:1,Lecture:60},{week2:Lecture:10,Selfstudies:70}]
*/
function totalHoursSpentWeekly(sessionData){
    //converts date from session into a valid date
    function getWeekNumber(date) {
        // Create a new Date object from the input date
        const parsedDate = parseCustomDate(date)
        const d = new Date(parsedDate);
        if (isNaN(d.getTime())) {
            throw new Error("Invalid date format.");
        }
    
        // Set to the nearest Thursday: current date + 4 - current day number
        // This ensures the calculation aligns with ISO 8601 (weeks start on Monday)
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    
        // Get the first day of the year
        const yearStart = new Date(d.getFullYear(), 0, 1);
    
        // Calculate the full weeks to the nearest Thursday
        const weekNumber = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return weekNumber;
    }
    function parseCustomDate(dateString) {
        // Split the input string into parts
        const parts = dateString.split('_');
        if (parts.length !== 4) {
            throw new Error("Invalid date format. Expected format: Wed_Mar_05_2025");
        }
    
        // Extract day, month, and year
        const day = parseInt(parts[2], 10);
        const month = parts[1];
        const year = parseInt(parts[3], 10);
    
        // Convert month name to numeric value (0-indexed)
        const monthNames = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];
        const monthIndex = monthNames.indexOf(month);
        if (monthIndex === -1) {
            throw new Error("Invalid month name.");
        }
    
        // Create a Date object
        return new Date(year, monthIndex, day);
    }
    const labels = ['Lecture', 'Selfstudies', 'Lesson', 'Homework', 'Labs', 'Project', 'TentaP', 'Other'];
    let weeks = [];
    let weekTracker = []
    let count = 0;
    for(date in sessionData){
        let weekNumber = getWeekNumber(date);
        console.log(weekNumber)
        if(!weekTracker.includes(weekNumber)){
            let weekObj = {}
            weekObj['week'] = weekNumber;
            labels.forEach(label => {
                weekObj[label] = 0;
            });
            weeks.push(weekObj);
            weekTracker.push(weekNumber);
            count++;
        }
            sessionData[date].forEach(session => {
                if (labels.includes(session.typeOfStudy)) {
                    weeks[count-1][session.typeOfStudy] += session.time;
                }
            });

            
        
    }
    console.log(weeks)
    return weeks;
        
}


    
    
    