// Vänta till allt på sidan har laddat klart
window.addEventListener("DOMContentLoaded", (e) => {
  (async function() {
      
      const data = totalHoursSpentWeekly(COURSEDATA.sessions)
      // Create the stacked bar chart
      new Chart(document.getElementById('weeklyGraf'), {
          type: 'bar',
          data: {
              labels: data.map(row => row.week),
              datasets: [
                  {
                      label: 'Lecture',
                      data: data.map(row => row.lecture),
                      backgroundColor: 'rgba(255, 99, 132, 0.7)'
                  },
                  {
                      label: 'Selfstudy',
                      data: data.map(row => row.selfstudy),
                      backgroundColor: 'rgba(54, 162, 235, 0.7)'
                  },
                  {
                    label: 'Lesson',
                    data: data.map(row => row.lesson),
                    backgroundColor: 'rgba(108, 255, 86, 0.7)'
                  },
                  {
                    label: 'Homework',
                    data: data.map(row => row.homework),
                    backgroundColor: 'rgba(221, 221, 58, 0.7)'
                  },
                  {
                    label: 'Labs',
                    data: data.map(row => row.labs),
                    backgroundColor: 'rgba(86, 255, 255, 0.7)'
                },
                  {
                      label: 'Project',
                      data: data.map(row => row.project),
                      backgroundColor: 'rgba(93, 7, 93, 0.7)'
                  },
                  {
                    label: 'TentaP',
                    data: data.map(row => row.tentaP),
                    backgroundColor: 'rgba(8, 9, 8, 0.7)'
                },
                {
                  label: 'Other',
                  data: data.map(row => row.other),
                  backgroundColor: 'rgba(242, 246, 245, 0.7)'
              },


              ]
          },
          options: {
              responsive: true,
              scales: {
                  x: {
                      stacked: true // Enables stacking on X-axis
                  },
                  y: {
                      stacked: true // Enables stacking on Y-axis
                  }
              }
          }
      });





    const totaltime = totalHoursSpentDivided(COURSEDATA.sessions)
    const totalGrafData = {
    labels: Object.keys(totaltime),
        datasets: [{
        label: 'Total minutes spent',
        data: Object.values(totaltime),
        hoverOffset: 4
        }]
    };
      


      

      new Chart(document.getElementById('totalGraf'), {
        type: 'pie',
        data: totalGrafData
    });
  })();
});