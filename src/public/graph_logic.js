// Vänta till allt på sidan har laddat klart
window.addEventListener("DOMContentLoaded", (e) => {
    (async function() {
        // Definiera datan
        const data = [
          { year: 2010, count: 10 },
          { year: 2011, count: 20 },
          { year: 2012, count: 15 },
          { year: 2013, count: 25 },
          { year: 2014, count: 22 },
          { year: 2015, count: 30 },
          { year: 2016, count: 28 },
        ];
        // Här skapar vi grafen, notera att detta kräver IDt på canvas taggen som skapas i CoursePage.ejs
        new Chart(
          document.getElementById('graftest'),
          {
            type: 'bar',
            data: {
              labels: data.map(row => row.year),
              datasets: [
                {
                  label: 'Acquisitions by year',
                  data: data.map(row => row.count)
                }
              ]
            }
          }
        );
        new Chart(
          document.getElementById('graftest2'),
          {
            type:'pie',
            data : {
              labels: ['Lecture','Selfstudies','Homework'],
              datasets:[{ 
                data  :[100,100,100],
              hoverOffset: 4
            }]
          }
          }
        );
      
      })();
});