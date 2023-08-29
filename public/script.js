document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    const promptInput = document.querySelector('textarea[name="prompt"]');
    const imageCache = {}; 
    const loadingScreen = document.getElementById('loadingScreen');
    const loadingBarContainer = document.getElementById('loadingBarContainer');
    const loadingBar = document.getElementById('loadingBar');
    const generatedImage = document.getElementById('generatedImage');
    const imageModal = document.getElementById('imageModal');
    const closeModal = document.querySelector('.close');
    const previewButton = document.getElementById('previewButton');

     // Function to update the loading bar and countdown based on the ETA
     function updateLoadingBarAndCountdown(eta) {
        const etaInSeconds = parseInt(eta.split(" ")[0]); // Extract the number of seconds from the ETA string
        const totalDuration = 10; // Total duration in seconds (assuming 10 seconds as the maximum ETA)
        const percentage = ((totalDuration - etaInSeconds) / totalDuration) * 100;

        // Update loading bar
        if (loadingBar) {
            loadingBar.style.width = percentage + '%';
        }

        // Start countdown
        startCountdown(etaInSeconds);
    }

    function startCountdown(seconds) {
        const countdownDisplay = document.getElementById('countdownDisplay');
        const countdownValue = document.getElementById('countdownValue');
    
        countdownDisplay.style.display = 'block';
        countdownValue.textContent = seconds;
    
        const interval = setInterval(() => {
            seconds--;
            countdownValue.textContent = seconds;
    
            if (seconds <= 0) {
                clearInterval(interval);
                countdownDisplay.style.display = 'none';
            }
        }, 1000);
    }

    if (form) {
        form.addEventListener('submit', async function(event) {
            event.preventDefault();
    
            const promptValue = promptInput.value;
    
            clearServerCache(promptValue);
    
            if (imageCache[promptValue]) {
                showGeneratedImage(imageCache[promptValue]);
                return;
            }
    
            if (loadingScreen) loadingScreen.style.display = 'block';
            if (loadingBarContainer) loadingBarContainer.style.display = 'block';
    
            try {
                const response = await fetch('/api/images/generate-image', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ prompt: promptValue })
                });
    
                const data = await response.json();
    
                if (data.url) {
                    fetchETAFromURL(data.url);
                } else {
                    handleServerResponse(data, promptValue);
                }
    
            } catch (error) {
                console.error('Error:', error);
                if (loadingScreen) loadingScreen.style.display = 'none';
                alert('There was an error generating the image. Please try again.');
            }
        });
    }

    function simulateLoading(duration) {
        let width = 0;
        const increment = 100 / (duration / 100);
        const interval = setInterval(function() {
            if (width < 100) {
                width += increment;
                loadingBar.style.width = width + '%';
            } else {
                clearInterval(interval);
                loadingBar.style.width = '100%';
            }
        }, 100);
    }

    function handleServerResponse(response, promptValue) {
        if (!response || !response.imageUrl) {
            console.error("No response or unexpected response format:", response);
            alert('There was an error generating the image. Please try again.');
        } else if (response.imageUrl) {
            showGeneratedImage(response.imageUrl, promptValue);
        } else if (response.data && response.data.status === "error") {
            console.error("Error status received:", response.data.errorMessage || "Unknown error");
            alert('There was an error generating the image. Please try again.');
        } else if (response.data && response.data.status === "Processing") {
            pollAndUpdateLoadingBar(response.data.url);
        } else {
            console.error("Unexpected response format:", response);
            alert('There was an error generating the image. Please try again.');
        }
    }

    async function pollAndUpdateLoadingBar(url) {
        let retries = 10;
        let delay = 2000;

        while (retries > 0) {
            let response = await fetch(url);
            let data = await response.json();

            console.log("Polled URL response:", data);

            if (data.Status !== "Processing") {
                handleServerResponse(data, promptValue);
                break;
            }

            updateLoadingBar(data.ETA);

            await new Promise(resolve => setTimeout(resolve, delay));
            retries--;
        }
    }

    function updateLoadingBar(eta) {
        const etaInSeconds = parseInt(eta.split(" ")[0]);
        const totalDuration = 10;
        const percentage = ((totalDuration - etaInSeconds) / totalDuration) * 100;

        console.log("ETA in seconds:", etaInSeconds);
        console.log("Loading bar percentage:", percentage);

        if (loadingBar) {
            loadingBar.style.width = percentage + '%';
        }
    }

    function showGeneratedImage(imageUrl, promptValue) {
        console.log("Attempting to display image:", imageUrl);
        const imageElement = document.getElementById('generatedImage');
        const modal = document.getElementById('imageModal');
        const closeModal = document.querySelector('.close');
        const loadingScreen = document.getElementById('loadingScreen');
        const form = document.querySelector('form');
    
        if (loadingScreen) loadingScreen.style.display = 'none';
    
        imageElement.src = imageUrl;
        modal.style.display = 'block';
    
        function resetAndHide(promptValue) {
            if (form) form.reset();
            modal.style.display = 'none';
            if (loadingScreen) loadingScreen.style.display = 'none';
            delete imageCache[promptValue];
        }
    
        setTimeout(() => {
            resetAndHide(promptValue);
        }, 15000);
    
        closeModal.onclick = function() {
            resetAndHide();
        }
    
        window.onclick = function(event) {
            if (event.target === modal) {
                resetAndHide();
            }
        }
    }

    function clearServerCache(prompt) {
        fetch('/api/images/clear-cache', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: prompt })
        })
        .then(response => response.json())
        .then(data => {
            console.log(data.message);
        })
        .catch(error => {
            console.error('Error clearing server cache:', error);
        });
    }
    // Add the new function here
async function fetchETAFromURL(url) {
    try {
        const response = await fetch(url);
        const htmlContent = await response.text();

        // This is a placeholder. You'll need to adjust this based on the actual structure of the HTML.
        const etaRegex = /ETA: (\d+) seconds/; 
        const match = htmlContent.match(etaRegex);

        if (match) {
            const etaInSeconds = parseInt(match[1], 10);
            startCountdown(etaInSeconds);
        } else {
            console.error("Could not extract ETA from URL content.");
        }
    } catch (error) {
        console.error("Error fetching ETA from URL:", error);
    }
}


    if (previewButton) {
        previewButton.addEventListener('click', function() {
            const dataString = document.getElementById('dataInput').value;

            fetch('/extract-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ data: dataString }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.url) {
                    const imgElement = document.createElement('img');
                    imgElement.src = data.url;
                    imgElement.alt = 'Image Preview';
                    imgElement.width = 300;

                    const imageContainer = document.getElementById('imageContainer');
                    if (imageContainer) {
                        imageContainer.innerHTML = '';
                        imageContainer.appendChild(imgElement);
                    }
                } else {
                    alert(data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
        });
    }
});

