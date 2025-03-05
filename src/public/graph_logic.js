// Vänta till allt på sidan har laddat klart
window.addEventListener("DOMContentLoaded", (e) => {
  (async function() {
      // Define the data for the bar chart
    //   const data = [
    //       { week: 10, lecture: 5, selfstudy: 3, homework: 2 },
    //       { week: 11, lecture: 10, selfstudy: 5, homework: 5 },
    //       { week: 12, lecture: 7, selfstudy: 6, homework: 2 },
    //       { week: 13, lecture: 12, selfstudy: 8, homework: 5 },
    //       { week: 14, lecture: 10, selfstudy: 9, homework: 3 },
    //       { week: 15, lecture: 15, selfstudy: 10, homework: 5 },
    //       { week: 16, lecture: 13, selfstudy: 12, homework: 3 },
    //   ];
    //   // Create the stacked bar chart
    //   new Chart(document.getElementById('weeklyGraf'), {
    //       type: 'bar',
    //       data: {
    //           labels: data.map(row => row.week),
    //           datasets: [
    //               {
    //                   label: 'Lecture',
    //                   data: data.map(row => row.lecture),
    //                   backgroundColor: 'rgba(255, 99, 132, 0.7)'
    //               },
    //               {
    //                   label: 'Selfstudy',
    //                   data: data.map(row => row.selfstudy),
    //                   backgroundColor: 'rgba(54, 162, 235, 0.7)'
    //               },
    //               {
    //                   label: 'Homework',
    //                   data: data.map(row => row.homework),
    //                   backgroundColor: 'rgba(255, 206, 86, 0.7)'
    //               }
    //           ]
    //       },
    //       options: {
    //           responsive: true,
    //           scales: {
    //               x: {
    //                   stacked: true // Enables stacking on X-axis
    //               },
    //               y: {
    //                   stacked: true // Enables stacking on Y-axis
    //               }
    //           }
    //       }
    //   });
    
    const totaltime = totalHoursSpentDivided(COURSEDATA)
    const totalGrafData = {
    labels: Object.keysArray(totaltime),
        datasets: [{
        label: 'Total hours spent',
        data: Object.valuesArray(totaltime),
        hoverOffset: 4
        }]
    };
      


      

      new Chart(document.getElementById('totalGraf'), {
        type: 'pie',
        data: totalGrafData
    });
  })();
});