document.addEventListener("DOMContentLoaded", () => {
  const backendUrl =
    "https://b55725d9-1c14-44dc-9825-364d90efcfc2-00-1fu19gbp22g4a.worf.replit.dev";

  // State variables
  let selectedPenguin = null;
  let customFields = {};
  let weightChart = null;

  // Get penguin ID from URL
  const params = new URLSearchParams(window.location.search);
  const penguinId = params.get("id");

  if (!penguinId) {
    console.error("No penguin ID provided in URL");
    document.getElementById("penguin-profile").innerHTML =
      "<p>No penguin ID provided</p>";
    return;
  }

  /**
   * Fetch data for the specified penguin ID
   */
  const fetchPenguinData = async () => {
    try {
      console.log(`Fetching data for penguin ${penguinId}`);
      const response = await fetch(
        `${backendUrl}/api/penguin/${penguinId}/specific`
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Received penguin data:", data);

      if (!data.measurements || data.measurements.length === 0) {
        throw new Error("No measurement data found");
      }

      const firstMeasurement = data.measurements[0];
      selectedPenguin = {
        id: penguinId,
        currentWeight: firstMeasurement.weight,
        lastSeen: `${firstMeasurement.date}, ${firstMeasurement.time}`,
        imageUrl: firstMeasurement.image_url,
        status: "active",
        weights: data.measurements.map((m) => ({
          value: m.weight,
          timestamp: `${m.date}T${m.time}`,
        })),
      };

      // Convert metadata array into key-value object
      customFields = {};
      if (data.metadata && Array.isArray(data.metadata)) {
        data.metadata.forEach(({ field_name, field_value }) => {
          customFields[field_name] = field_value;
        });
      }

      updatePenguinProfile();
      updateWeightChart();
    } catch (error) {
      console.error("Error loading penguin data:", error);
      document.getElementById(
        "penguin-profile"
      ).innerHTML = `<p>Error loading data for penguin ${penguinId}: ${error.message}</p>`;
    }
  };

  /**
   * Format date for display from timestamp
   * @param {string} timestamp - ISO timestamp
   * @return {string} Formatted date string
   */
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const month = date.toLocaleString("default", { month: "short" });
    const day = date.getDate();
    const time = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return `${month} ${day}, ${time}`;
  };

  /**
   * Format short date for chart labels
   * @param {string} timestamp - ISO timestamp
   * @return {string} Formatted date string for chart
   */
  const formatChartDate = (timestamp) => {
    const date = new Date(timestamp);
    const month = date.toLocaleString("default", { month: "short" });
    const day = date.getDate();
    const time = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return `${month} ${day}, ${time}`;
  };

  /**
   * Updates the penguin profile card with selected penguin data
   */
  const updatePenguinProfile = () => {
    if (!selectedPenguin) return;

    document.getElementById("penguin-id").textContent = selectedPenguin.id;
    document.getElementById(
      "penguin-weight"
    ).textContent = `${selectedPenguin.currentWeight} kg`;
    document.getElementById("penguin-last-seen").textContent =
      selectedPenguin.lastSeen;

    // Update image if available
    const profileImage = document.getElementById("penguin-profile-image");
    if (profileImage && selectedPenguin.imageUrl) {
      // Make sure image URL is properly formatted with backend URL if it's a relative path
      const imageUrl = selectedPenguin.imageUrl.startsWith("http")
        ? selectedPenguin.imageUrl
        : `${backendUrl}${selectedPenguin.imageUrl}`;
      profileImage.src = imageUrl;
    }

    // Update status badge
    const statusBadge = document.querySelector(".status-badge");
    if (statusBadge) {
      statusBadge.textContent =
        selectedPenguin.status === "active" ? "Active" : "Inactive";
      statusBadge.className = `status-badge ${selectedPenguin.status}`;
    }

    // Update custom fields
    updateCustomFields();
  };

  /**
   * Updates the custom fields section
   */
  const updateCustomFields = () => {
    const customFieldsContainer = document.getElementById("custom-fields");
    if (!customFieldsContainer) return;

    customFieldsContainer.innerHTML = "";

    Object.entries(customFields).forEach(([field, value]) => {
      const fieldElement = document.createElement("div");
      fieldElement.className = "detail-row custom-field fade-in";
      fieldElement.innerHTML = `
          <span class="detail-label">${capitalizeFirstLetter(field)}:</span>
          <span class="detail-value">${value}</span>
        `;
      customFieldsContainer.appendChild(fieldElement);
    });
  };

  /**
   * Updates the weight chart with selected penguin data
   */
  const updateWeightChart = () => {
    const chartCanvas = document.getElementById("weight-chart");
    if (!chartCanvas || !selectedPenguin || !selectedPenguin.weights) return;

    const ctx = chartCanvas.getContext("2d");

    // Prepare data for the chart - reverse the arrays to have latest data on the right
    const sortedWeights = [...selectedPenguin.weights].sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );

    const labels = sortedWeights.map((w) => formatChartDate(w.timestamp));
    const weightData = sortedWeights.map((w) => w.value);

    // Calculate average weight
    const avgWeight =
      weightData.reduce((sum, weight) => sum + weight, 0) / weightData.length;
    const formattedAvgWeight = avgWeight.toFixed(2);

    // If chart exists, update it
    if (weightChart) {
      weightChart.data.labels = labels;
      weightChart.data.datasets[0].data = weightData;
      weightChart.update();
    } else {
      // Create new chart
      weightChart = new Chart(ctx, {
        type: "line",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Weight (kg)",
              data: weightData,
              fill: false,
              borderColor: "#3b82f6",
              tension: 0.4,
              pointBackgroundColor: "#3b82f6",
              pointBorderColor: "#fff",
              pointRadius: 5,
              pointHoverRadius: 7,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              title: {
                display: true,
                text: "Weight (kg)",
              },
              min: Math.min(...weightData) - 0.5,
              max: Math.max(...weightData) + 0.5,
            },
            x: {
              title: {
                display: true,
                text: "Date",
              },
              ticks: {
                maxRotation: 45,
                minRotation: 45,
              },
            },
          },
          plugins: {
            legend: {
              display: false,
            },
          },
        },
      });
    }

    // Add or update the average weight display below the chart
    let avgWeightDisplay = document.getElementById("avg-weight-display");
    if (!avgWeightDisplay) {
      avgWeightDisplay = document.createElement("div");
      avgWeightDisplay.id = "avg-weight-display";
      avgWeightDisplay.className = "weight-average";
      chartCanvas.parentNode.appendChild(avgWeightDisplay);
    }
    //avgWeightDisplay.innerHTML = `Average Weight: <span class="text-blue-600">${formattedAvgWeight} kg</span>`;
    avgWeightDisplay.innerHTML = `Average Weight: <span class="value">${formattedAvgWeight} kg</span>`;
  };

  /**
   * Initialize search functionality
   */
  const initializeSearch = () => {
    const searchInput = document.getElementById("penguin-search");
    const searchResults = document.getElementById("search-results");

    if (!searchInput || !searchResults) return;

    searchInput.addEventListener("input", async () => {
      const searchTerm = searchInput.value.toLowerCase();

      if (searchTerm.length < 1) {
        searchResults.style.display = "none";
        return;
      }

      try {
        const response = await fetch(
          `${backendUrl}/api/penguin/search?q=${encodeURIComponent(searchTerm)}`
        );

        if (!response.ok) {
          throw new Error(`Search API error: ${response.status}`);
        }

        const data = await response.json();
        console.log("Search results:", data);

        searchResults.innerHTML = "";

        if (data.length > 0) {
          data.forEach((penguin) => {
            const resultItem = document.createElement("div");
            resultItem.className = "search-result-item";
            resultItem.textContent = penguin.id;
            resultItem.addEventListener("click", () => {
              window.location.href = `/penguin-details.html?id=${penguin.id}`;
            });
            searchResults.appendChild(resultItem);
          });
          searchResults.style.display = "block";
        } else {
          searchResults.style.display = "none";
        }
      } catch (error) {
        console.error("Search failed:", error);
      }
    });

    // Hide search results when clicking outside
    document.addEventListener("click", (event) => {
      if (
        !searchInput.contains(event.target) &&
        !searchResults.contains(event.target)
      ) {
        searchResults.style.display = "none";
      }
    });
  };

  /**
   * Initialize the form for adding custom fields
   */
  const initializeAddField = () => {
    const addFieldBtn = document.getElementById("add-field-btn");
    const fieldSelect = document.getElementById("field-select");
    const fieldValue = document.getElementById("field-value");

    if (!addFieldBtn || !fieldSelect || !fieldValue) return;

    addFieldBtn.addEventListener("click", async () => {
      const field = fieldSelect.value;
      const value = fieldValue.value;

      if (field && value) {
        try {
          const response = await fetch(
            `${backendUrl}/api/penguin/${penguinId}/metadata`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                field_name: field,
                field_value: value,
              }),
            }
          );

          if (!response.ok) {
            throw new Error(`Failed to save field: ${response.status}`);
          }

          customFields[field] = value;
          updateCustomFields();

          fieldSelect.selectedIndex = 0;
          fieldValue.value = "";
        } catch (error) {
          console.error("Error adding custom field:", error);
        }
      }
    });
  };

  /**
   * Helper function to capitalize first letter
   */
  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Initialize the app components
  fetchPenguinData();
  initializeSearch();
  initializeAddField();
});
