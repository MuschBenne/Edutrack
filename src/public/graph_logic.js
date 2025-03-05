// Vänta till allt på sidan har laddat klart
window.addEventListener("DOMContentLoaded", (e) => {
  (async function() {
      // Define the data for the bar chart
      const data = [
          { week10: 2010, lecture: 5, selfstudy: 3, homework: 2 },
          { week11: 2011, lecture: 10, selfstudy: 5, homework: 5 },
          { week12: 2012, lecture: 7, selfstudy: 6, homework: 2 },
          { week13: 2013, lecture: 12, selfstudy: 8, homework: 5 },
          { week14: 2014, lecture: 10, selfstudy: 9, homework: 3 },
          { week15: 2015, lecture: 15, selfstudy: 10, homework: 5 },
          { week16: 2016, lecture: 13, selfstudy: 12, homework: 3 },
      ];

      // Create the stacked bar chart
      new Chart(document.getElementById('graftest'), {
          type: 'bar',
          data: {
              labels: data.map(row => row.year),
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
                      label: 'Homework',
                      data: data.map(row => row.homework),
                      backgroundColor: 'rgba(255, 206, 86, 0.7)'
                  }
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
  })();
});