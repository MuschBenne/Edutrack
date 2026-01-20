var totalGraf;
var totalGrafData;
var weeklyGraf;
var weeklyGrafData;

// Define shared colors
const colors = {
    Lecture: 'rgba(255, 99, 132, 0.7)',    // Red
    Selfstudies: 'rgba(54, 162, 235, 0.7)', // Blue
    Lesson: 'rgba(108, 255, 86, 0.7)',    // Green
    Homework: 'rgba(221, 221, 58, 0.7)',  // Yellow
    Labs: 'rgba(86, 255, 255, 0.7)',      // Cyan
    Project: 'rgba(93, 7, 93, 0.7)',      // Purple
    TentaP: 'rgba(8, 9, 8, 0.7)',         // Dark Grey
    Other: 'rgba(242, 246, 245, 0.7)'     // Light Grey
};

// Vänta till allt på sidan har laddat klart
window.addEventListener("DOMContentLoaded", (e) => {
    renderGraphs();
    document.addEventListener("newSession", updateGraphs);
});


function renderGraphs() {

    (async function() {

        // Parse the COURSEDATA global variable
        await parseGraphData();

        // Create the stacked bar chart
        weeklyGraf = new Chart(document.getElementById('weeklyGraf'), {
            type: 'bar',
            data: weeklyGrafData,
            options: {
                responsive: true,
                scales: {
                    x: { stacked: true }, // Enables stacking on X-axis
                    y: { stacked: true }  // Enables stacking on Y-axis
                }
            }
        });
        
        // Create the pie chart
        totalGraf = new Chart(document.getElementById('totalGraf'), {
            type: 'pie',
            data: totalGrafData
        });
  
    })();
  
    // Admin only
    if(typeof ALLCOURSEDATA !== "undefined")
  	    (async function() {
        	const totaltime = totalHoursSpentDivided(ALLCOURSEDATA)
        	const totalGrafData = {
        	labels: Object.keys(totaltime),
        	    datasets: [{
        	    label: 'Total minutes spent',
        	    data: Object.values(totaltime),
        	    hoverOffset: 4,
                backgroundColor: Object.keys(totaltime).map(key => colors[key])
        	    }]
        	};
        	new Chart(document.getElementById('allCourseGraf'), {
        		type: 'pie',
        		data: totalGrafData
        	});
  	    })();
}

// Refetch the course session data and replace the COURSEDATA global variable's value with this new data.
async function fetchGraphData() {
    let response = await fetch("/app/?action=fetchUserCourseData",
        {
		    method: "POST",
		    body: JSON.stringify({courseId: COURSEDATA.courseId}),
		    headers: {
		        "Content-type": "application/json; charset=UTF-8" // Set content type to JSON
		    }
	    }
    );

    let responseJSON = await response.json();
    COURSEDATA = responseJSON.data;
}

// Read the COURSEDATA global variable and parse it into a format suitable for Chart.js
async function parseGraphData() {

    const data = totalHoursSpentWeekly(COURSEDATA.sessions);
    weeklyGrafData = {
        labels: data.map(row => row.week),
        datasets: Object.keys(colors).map(key => ({
            label: key,
            data: data.map(row => row[key]),
            backgroundColor: colors[key]
        }))
    }

    const totaltime = totalHoursSpentDivided(COURSEDATA.sessions);
    totalGrafData = {
        labels: Object.keys(totaltime),
        datasets: [{
            label: 'Total minutes spent',
            data: Object.values(totaltime),
            backgroundColor: Object.keys(totaltime).map(key => colors[key]), // Match colors
            hoverOffset: 4
        }]
    };
    
}

// Refetch the course session data and redraw the graphs. Called when a new session is added.
async function updateGraphs(e) {
    await fetchGraphData();
    await parseGraphData();
    totalGraf.data = totalGrafData;
    weeklyGraf.data = weeklyGrafData;
    totalGraf.update();
    weeklyGraf.update();
}