// Fetch data from a JSON file or API endpoint
async function fetchData() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// Populate the page with data
async function populatePage() {
    const data = await fetchData();
    
    // Populate About section
    document.getElementById('about-content').textContent = data.about;
    
    // Populate Projects section
    const projectsContainer = document.getElementById('projects-container');
    data.projects.forEach(project => {
        const projectDiv = document.createElement('div');
        projectDiv.className = 'project';
        projectDiv.innerHTML = `
            <h3>${project.title}</h3>
            <p>${project.description}</p>
        `;
        projectsContainer.appendChild(projectDiv);
    });
    
    // Populate Timeline section
    const timelineContainer = document.getElementById('timeline-container');
    data.timeline.forEach(item => {
        const timelineItem = document.createElement('div');
        timelineItem.className = 'timeline-item';
        timelineItem.innerHTML = `
            <div class="timeline-date">${item.date}</div>
            <div class="timeline-content">${item.content}</div>
        `;
        timelineContainer.appendChild(timelineItem);
    });
}

// Call the function to populate the page when the script loads
populatePage();
