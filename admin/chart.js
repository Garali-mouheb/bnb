let allSubmissions = [];

async function fetchSubmissions() {
    console.log('Fetching submissions...');
    try {
        const response = await fetch('/api/submissions');
        console.log('Received response:', response);
        const data = await response.json();
        console.log('Fetched Data:', data);
        
        if (Array.isArray(data) && data.length > 0) {
            allSubmissions = data;
            renderChart(data);
        } else {
            console.error('No submissions data available');
        }
    } catch (error) {
        console.error('Error fetching submissions:', error);
    }
}

function renderChart(submissions) {
    const ctx = document.getElementById('submissionsChart').getContext('2d');
    const chartData = {
        labels: submissions.map(s => new Date(s.created_at).toLocaleDateString()),
        datasets: [{
            label: 'Number of Submissions',
            data: submissions.reduce((acc, current, index, array) => {
                const date = new Date(current.created_at).toLocaleDateString();
                const existingIndex = acc.findIndex(item => item.date === date);
                if (existingIndex !== -1) {
                    acc[existingIndex].count++;
                } else {
                    acc.push({ date, count: 1 });
                }
                return acc;
            }, []).map(item => item.count),
            backgroundColor: 'rgba(52, 152, 219, 0.5)',
            borderColor: 'rgba(52, 152, 219, 1)',
            borderWidth: 1
        }]
    };

    const submissionsChart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

fetchSubmissions();