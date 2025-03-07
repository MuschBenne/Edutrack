// Vänta till allt på sidan har laddat klart
window.addEventListener("DOMContentLoaded", (e) => {
    const colors = {
        Lecture: 'rgba(255, 99, 132, 0.7)',    // Red
        Selfstudy: 'rgba(54, 162, 235, 0.7)', // Blue
        Lesson: 'rgba(108, 255, 86, 0.7)',    // Green
        Homework: 'rgba(221, 221, 58, 0.7)',  // Yellow
        Labs: 'rgba(86, 255, 255, 0.7)',      // Cyan
        Project: 'rgba(93, 7, 93, 0.7)',      // Purple
        TentaP: 'rgba(8, 9, 8, 0.7)',         // Dark Grey
        Other: 'rgba(242, 246, 245, 0.7)'     // Light Grey
    };
    (async function() {
  
        // Define shared colors
        
  
        const data = totalHoursSpentWeekly(COURSEDATA.sessions);
  
        // Create the stacked bar chart
        new Chart(document.getElementById('weeklyGraf'), {
            type: 'bar',
            data: {
                labels: data.map(row => row.week),
                datasets: Object.keys(colors).map(key => ({
                    label: key,
                    data: data.map(row => row[key]),
                    backgroundColor: colors[key]
                }))
            },
            options: {
                responsive: true,
                scales: {
                    x: { stacked: true }, // Enables stacking on X-axis
                    y: { stacked: true }  // Enables stacking on Y-axis
                }
            }
        });
  
        // Generate pie chart data using shared colors
        const totaltime = totalHoursSpentDivided(COURSEDATA.sessions);
        const totalGrafData = {
            labels: Object.keys(totaltime),
            datasets: [{
                label: 'Total minutes spent',
                data: Object.values(totaltime),
                backgroundColor: Object.keys(totaltime).map(key => colors[key]), // Match colors
                hoverOffset: 4
            }]
        };
  
        new Chart(document.getElementById('totalGraf'), {
            type: 'pie',
            data: totalGrafData
        });
  
    })();
  
    	// Admin only
  	(async function() {
    	const totaltime = totalHoursSpentDivided(ALLCOURSEDATA)
    	const totalGrafData = {
    	labels: Object.keys(totaltime),
    	    datasets: [{
    	    label: 'Total hours spent',
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
});
  