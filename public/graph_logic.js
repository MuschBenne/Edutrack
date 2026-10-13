var totalGraf;
var totalGrafData;
var weeklyGraf;
var weeklyGrafData;

// Define shared colors (matches the palette in master.css)
const colors = {
    Lecture: '#152242',     // Navy
    Selfstudies: '#B8953F', // Gold
    Lesson: '#5B7BB2',      // Steel blue
    Homework: '#9AAFD3',    // Light blue
    Labs: '#2F6B48',        // Green
    Project: '#D9C08A',     // Pale gold
    TentaP: '#6B7389',      // Slate
    Other: '#C9C2B2'        // Warm grey
};

// Display names for the stored study types
const typeLabels = {
    Selfstudies: 'Self studies',
    TentaP: 'Exam prep'
};
const labelFor = (key) => typeLabels[key] ?? key;

// Shared Chart.js look
if (typeof Chart !== "undefined") {
    Chart.defaults.font.family = "'IBM Plex Sans', system-ui, sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.color = '#4A5672';
    Chart.defaults.borderColor = '#EEEAE1';
    Chart.defaults.maintainAspectRatio = false;
    Chart.defaults.plugins.legend.position = 'bottom';
    Chart.defaults.plugins.legend.labels.boxWidth = 10;
    Chart.defaults.plugins.legend.labels.boxHeight = 10;
    Chart.defaults.plugins.tooltip.backgroundColor = '#152242';
    Chart.defaults.plugins.tooltip.cornerRadius = 4;
}

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
                    x: { stacked: true, grid: { display: false } }, // Enables stacking on X-axis
                    y: { stacked: true, beginAtZero: true }  // Enables stacking on Y-axis
                }
            }
        });
        
        // Create the pie chart
        totalGraf = new Chart(document.getElementById('totalGraf'), {
            type: 'doughnut',
            data: totalGrafData,
            options: { cutout: '60%', plugins: { legend: { position: window.innerWidth < 600 ? 'bottom' : 'right' } } }
        });
  
    })();
  
    // Admin only
    if(typeof ALLCOURSEDATA !== "undefined")
  	    (async function() {
        	const totaltime = totalHoursSpentDivided(ALLCOURSEDATA)
        	const totalGrafData = {
        	labels: Object.keys(totaltime).map(labelFor),
        	    datasets: [{
        	    label: 'Total minutes spent',
        	    data: Object.values(totaltime),
        	    hoverOffset: 4,
                backgroundColor: Object.keys(totaltime).map(key => colors[key])
        	    }]
        	};
        	new Chart(document.getElementById('allCourseGraf'), {
        		type: 'doughnut',
        		data: totalGrafData,
        		options: { cutout: '60%', plugins: { legend: { position: window.innerWidth < 600 ? 'bottom' : 'right' } } }
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
        labels: data.map(row => 'w' + row.week),
        // Only show study types that have any time logged
        datasets: Object.keys(colors)
            .filter(key => data.some(row => row[key] > 0))
            .map(key => ({
                label: labelFor(key),
                data: data.map(row => row[key]),
                backgroundColor: colors[key]
            }))
    }

    const totaltime = Object.fromEntries(
        Object.entries(totalHoursSpentDivided(COURSEDATA.sessions)).filter(([, minutes]) => minutes > 0)
    );
    totalGrafData = {
        labels: Object.keys(totaltime).map(labelFor),
        datasets: [{
            label: 'Total minutes spent',
            data: Object.values(totaltime),
            backgroundColor: Object.keys(totaltime).map(key => colors[key]), // Match colors
            borderColor: '#FFFFFF',
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