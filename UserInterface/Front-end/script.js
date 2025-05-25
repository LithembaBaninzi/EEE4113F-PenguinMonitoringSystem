document.addEventListener("DOMContentLoaded", () => {
  const backendUrl =
    "https://b55725d9-1c14-44dc-9825-364d90efcfc2-00-1fu19gbp22g4a.worf.replit.dev";
  let weightChart;
  let weightHistoryData = []; // Changed to let instead of const for reassignment

  // Add CSS for chart instructions
  const style = document.createElement("style");
  style.textContent = `
    .chart-instruction {
      text-align: center;
      font-size: 0.9em;
      margin-top: 10px;
      color: #555;
      font-style: italic;
    }
    .weight-history-item {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      border-bottom: 1px solid #eee;
    }
    .weight-history-item:last-child {
      border-bottom: none;
    }
  `;
  document.head.appendChild(style);

  const updatePenguinDetails = (penguinData) => {
    document.getElementById("penguin-id").textContent = penguinData.id;
    document.getElementById("penguin-weight").textContent =
      penguinData.weight + " kg";
    document.getElementById("penguin-timestamp").textContent = `${
      penguinData.date || "Unknown date"
    }, ${penguinData.time || "Unknown time"}`;

    let imageUrl = penguinData.imageUrl || "/api/placeholder/400/300";
    if (imageUrl.startsWith("/")) {
      imageUrl = backendUrl + imageUrl;
    }
    document.getElementById("penguin-image").src = imageUrl;
  };

  // This is a focused tooltip fix for the chart
  // This function isolates and fixes just the tooltip functionality

  const fixChartTooltips = () => {
    // Only modify the chart if it exists
    if (!weightChart) {
      console.log("Chart not initialized yet, no tooltips to fix");
      return;
    }

    console.log("Fixing chart tooltips...");

    // Log the current chart data for debugging
    console.log("Current chart data:", {
      labels: weightChart.data.labels,
      dataPoints: weightChart.data.datasets[0].data,
      pointColors: weightChart.data.datasets[0].pointBackgroundColor,
    });

    // Get the chart's data structure
    const chartData = weightChart.data;
    const datasetData = chartData.datasets[0].data;
    const chartLabels = chartData.labels;

    // Debugging - check if the data arrays align properly
    if (chartLabels.length !== datasetData.length) {
      console.error(
        "Data length mismatch: labels and data points don't match",
        chartLabels.length,
        datasetData.length
      );
    }

    // Fix the tooltip configuration
    weightChart.options.plugins.tooltip = {
      callbacks: {
        // This is where the tooltip text is generated
        label: function (context) {
          // Get the index of the hovered item
          const index = context.dataIndex;

          // Get the actual data point value directly from the chart dataset
          const value = context.dataset.data[index];

          // Debug what's being accessed
          console.log(`Tooltip requested for index ${index}:`, {
            dataValue: value,
            rawValue: context.raw,
            formattedValue: context.formattedValue,
            label: chartLabels[index],
          });

          // Extract penguin ID from the label if possible
          // Format is typically "yyyy-mm-dd HH:MM:SS"
          const labelParts = chartLabels[index].split(",");
          let penguinId = "Unknown";

          // Try to get penguin ID from the chart's custom data if available
          if (
            weightHistoryData &&
            weightHistoryData[index] &&
            weightHistoryData[index].id
          ) {
            penguinId = weightHistoryData[index].id;
          }

          // If we still don't have a penguin ID, try to get it from elsewhere
          if (
            penguinId === "Unknown" &&
            document.getElementById("penguin-id")
          ) {
            penguinId = document.getElementById("penguin-id").textContent;
          }

          // Build tooltip text with larger font and cleaner data
          if (value === undefined || isNaN(value)) {
            return ["No valid weight data available"];
          }

          return [`Penguin ID: ${penguinId}`, `Weight: ${value} kg`];
        },
        // This controls the tooltip title (typically the x-axis label)
        title: function (context) {
          if (context.length > 0) {
            // Format the date and time to be more readable
            const fullLabel = context[0].label;

            // If the label contains a comma (date, time format)
            if (fullLabel.includes(",")) {
              // Split and trim the parts
              const [date, time] = fullLabel
                .split(",")
                .map((part) => part.trim());

              // Format the date if it's in YYYY-MM-DD format
              let formattedDate = date;
              if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                try {
                  // Create a more readable date format
                  const dateObj = new Date(date);
                  formattedDate = dateObj.toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  });
                } catch (e) {
                  console.warn("Error formatting date:", e);
                }
              }

              // Return the formatted date and time
              return `${formattedDate}, ${time}`;
            }

            // If no comma, return the original label
            return fullLabel;
          }
          return "";
        },
      },
      // Increase font sizes
      titleFont: {
        size: 14,
      },
      bodyFont: {
        size: 14,
      },
      // Make the tooltip more visible
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      titleColor: "#ffffff",
      bodyColor: "#ffffff",
      borderColor: "#26a69a",
      borderWidth: 1,
      // Ensure the tooltip has enough padding
      padding: {
        top: 10,
        bottom: 10,
        left: 12,
        right: 12,
      },
    };

    // Update the chart with our fixed tooltips
    weightChart.update();
    console.log("Chart tooltips fixed and updated");
  };

  // Modify the updateWeightChart function to ensure the weightHistoryData
  // is properly aligned with the chart data when updating existing charts
  const updateWeightChart = (chartData) => {
    try {
      const chartElement = document.getElementById("weight-chart");
      if (!chartElement) {
        console.warn("Chart element not found");
        return;
      }

      const ctx = chartElement.getContext("2d");
      if (!ctx) {
        console.warn("Could not get 2d context from chart element");
        return;
      }

      // Ensure the chartData is an array
      if (!Array.isArray(chartData)) {
        console.error("chartData is not an array:", chartData);
        return;
      }

      // Make a deep copy of the chart data to avoid mutation issues
      const chartDataCopy = JSON.parse(JSON.stringify(chartData || []));

      // Sort data chronologically to ensure consistent display
      const sortedData = [...chartData].sort((a, b) => {
        // First compare dates
        const dateA = new Date(a.date || "1970-01-01");
        const dateB = new Date(b.date || "1970-01-01");
        if (dateA - dateB !== 0) return dateA - dateB;

        // If dates are the same, compare times
        return (a.time || "").localeCompare(b.time || "");
      });

      // Format dates for labels
      const labels = sortedData.map((item) => {
        const date = item.date || "Unknown date";
        const time = item.time || "Unknown time";
        return `${date}, ${time}`;
      });

      // Extract weight values as numbers
      const dataPoints = sortedData.map((item) => {
        const weight = parseFloat(item.weight);
        // Filter out NaN values to prevent chart errors
        return isNaN(weight) ? null : weight;
      });

      // Store penguin IDs for reference
      const penguinIds = sortedData.map((item) => item.id || "Unknown");

      // Calculate min/max for Y axis scaling (ignoring null values)
      const validWeights = dataPoints.filter((w) => w !== null);
      const minWeight =
        validWeights.length > 0 ? Math.min(...validWeights) - 0.2 : 0;
      const maxWeight =
        validWeights.length > 0 ? Math.max(...validWeights) + 0.2 : 10;

      // Define colors for different penguin IDs
      const colors = [
        "#26a69a",
        "#ef5350",
        "#7e57c2",
        "#66bb6a",
        "#ffa726",
        "#42a5f5",
        "#ec407a",
      ];

      // Get unique penguin IDs for color assignment
      const uniquePenguinIds = [...new Set(penguinIds)];
      const penguinColorMap = {};

      // Assign colors to each unique penguin ID
      uniquePenguinIds.forEach((id, index) => {
        penguinColorMap[id] = colors[index % colors.length];
      });

      // Update the global weightHistoryData to ensure it matches the chart data exactly
      // This is critical for tooltip accuracy
      weightHistoryData = sortedData;

      if (weightChart) {
        // Updating existing chart
        weightChart.data.labels = labels;
        weightChart.data.datasets[0].data = dataPoints;
        weightChart.options.scales.y.min = minWeight;
        weightChart.options.scales.y.max = maxWeight;
        weightChart.data.datasets[0].pointBackgroundColor = dataPoints.map(
          (_, i) => penguinColorMap[penguinIds[i]] || "#26a69a"
        );

        // Fix tooltips specifically
        fixChartTooltips();

        // Apply all updates
        weightChart.update();
      } else {
        if (weightChart) {
        // Destroy and recreate the chart to prevent partial updates
        weightChart.destroy();
        weightChart = null;
        }
        // Creating new chart
        weightChart = new Chart(ctx, {
          type: "line",
          data: {
            labels: labels,
            datasets: [
              {
                label: "Weight (kg)",
                data: dataPoints,
                fill: false,
                borderColor: "#26a69a",
                tension: 0.4,
                pointBackgroundColor: dataPoints.map(
                  (_, i) => penguinColorMap[penguinIds[i]] || "#26a69a"
                ),
                pointBorderColor: "#fff",
                pointRadius: 6,
                pointHoverRadius: 8,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: false,
                min: minWeight,
                max: maxWeight,
                title: { display: true, text: "Weight (kg)" },
              },
              x: {
                title: { display: true, text: "Date & Time" },
                ticks: { maxRotation: 45, minRotation: 45 },
              },
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: function (context) {
                    const dataIndex = context.dataIndex;
                    const value = dataPoints[dataIndex];

                    if (value === null || value === undefined) {
                      return ["No valid weight data available"];
                    }

                    return [
                      `Penguin ID: ${penguinIds[dataIndex]}`,
                      `Weight: ${value} kg`,
                    ];
                  },
                  title: function (context) {
                    if (context.length > 0) {
                      const fullLabel = context[0].label;

                      if (fullLabel.includes(",")) {
                        const [date, time] = fullLabel
                          .split(",")
                          .map((part) => part.trim());
                        let formattedDate = date;

                        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                          try {
                            const dateObj = new Date(date);
                            formattedDate = dateObj.toLocaleDateString(
                              undefined,
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            );
                          } catch (e) {
                            console.warn("Error formatting date:", e);
                          }
                        }

                        return `${formattedDate}, ${time}`;
                      }

                      return fullLabel;
                    }
                    return "";
                  },
                },
                titleFont: {
                  size: 14,
                },
                bodyFont: {
                  size: 14,
                },
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                titleColor: "#ffffff",
                bodyColor: "#ffffff",
                borderColor: "#26a69a",
                borderWidth: 1,
                padding: {
                  top: 10,
                  bottom: 10,
                  left: 12,
                  right: 12,
                },
              },
            },
            onHover: function (event, elements) {
              if (chartElement) {
                chartElement.style.cursor =
                  elements && elements.length > 0 ? "pointer" : "default";
              }
            },
            onClick: function (event, elements) {
              if (elements && elements.length > 0) {
                const index = elements[0].index;
                const penguinId = penguinIds[index];
                // Navigate to penguin details page
                window.location.href = `/penguin-details.html?id=${penguinId}`;
              }
            },
          },
        });

        // Additional check to ensure tooltips are properly configured
        setTimeout(fixChartTooltips, 200);
      }

      // Always update the average weight when chart data changes
      updateAverageWeight(sortedData);
    } catch (error) {
      console.error("Error in updateWeightChart:", error);
    }
  };

  const updateGlobalWeightChart = () => {
    const chartElement = document.getElementById("weight-chart");
    if (!chartElement) {
      console.warn("Chart element for global chart not found");
      return;
    }

    fetch(`${backendUrl}/api/latest-global-measurements`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch global measurements");
        }
        return response.json();
      })
      .then((data) => {
        if (data.length === 0) {
          console.warn("No global weight data to display");
          return;
        }

        const chartData = data.map((item) => ({
          date: item.date || "Unknown",
          time: item.time || "Unknown",
          weight: parseFloat(item.weight) || 0,
          id: item.penguinId || item.id, // Use penguinId field if available, otherwise fallback to id
        }));

        updateWeightChart(chartData);
      })
      .catch((error) => {
        console.error("Error fetching global weight chart data:", error);
      });
  };

  const updateWeightHistory = (penguinId) => {
    console.log(`Fetching history for penguin: ${penguinId}`);

    // Add a loading indicator
    const historyList = document.getElementById("weight-history-list");
    historyList.innerHTML =
      "<div class='loading-message'>Loading weight history...</div>";

    fetch(`${backendUrl}/api/penguin/${penguinId}/recent`)
      .then((response) => {
        console.log("History API response status:", response.status);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log("Received weight history data:", data);
        historyList.innerHTML = "";

        if (data.length === 0) {
          historyList.innerHTML =
            "<div class='no-data-message'>No weight history available</div>";
          return;
        }

        // Sanitize and validate data
        weightHistoryData = data.map((item) => ({
          date: item.date || "Unknown date",
          time: item.time || "Unknown time",
          weight: parseFloat(item.weight) || 0,
          id: penguinId, // Add the penguin ID for chart coloring and navigation
        }));

        // ✅ Save to localStorage
        localStorage.setItem(
          "weightHistoryData",
          JSON.stringify(weightHistoryData)
        );

        // Display each history item in the list
        data.forEach((item) => {
          const historyItem = document.createElement("div");
          historyItem.className = "weight-history-item";
          historyItem.innerHTML = `
            <div>${item.date || "Unknown date"}, ${
            item.time || "Unknown time"
          }</div>
            <div>${item.weight} kg</div>
          `;
          historyList.appendChild(historyItem);
        });

        // Return the data for further processing if needed
        return data;
      })
      .then((data) => {
        // Only try to update the chart if there's data and if the chart element exists
        if (data && data.length > 0) {
          try {
            // Check if the chart element exists before attempting to update
            const chartElement = document.getElementById("weight-chart");
            if (chartElement) {
              updateWeightChart(weightHistoryData);
            } else {
              console.warn("Chart element not found, skipping chart update");
            }
          } catch (chartError) {
            console.error("Error updating chart:", chartError);
            // Don't let chart errors affect the rest of the UI
          }
        }
      })
      .catch((error) => {
        console.error("Error fetching penguin history:", error);
        historyList.innerHTML =
          "<div class='error-message'>Failed to load weight history: " +
          error.message +
          "</div>";
      });
  };

  const updateAverageWeight = (chartData) => {
    if (!chartData || chartData.length === 0) {
      document.getElementById("average-weight").textContent = "No data";
      return;
    }

    // Ensure we're only averaging valid weights
    const validWeights = chartData
      .map((item) => parseFloat(item.weight))
      .filter((weight) => !isNaN(weight));

    if (validWeights.length === 0) {
      document.getElementById("average-weight").textContent = "No valid data";
      return;
    }

    const totalWeight = validWeights.reduce((sum, weight) => sum + weight, 0);
    const averageWeight = (totalWeight / validWeights.length).toFixed(1);
    document.getElementById(
      "average-weight"
    ).textContent = `${averageWeight} kg`;
  };

  // Function to initialize or update everything
  const loadPenguinData = (penguinId) => {
    if (!penguinId) {
      console.log("No penguin ID provided, cannot load data");
      return;
    }

    console.log(`Loading data for penguin ID: ${penguinId}`);
    updateWeightHistory(penguinId);

    // Try to update the chart separately after a brief delay
    // to ensure DOM elements are ready
    setTimeout(() => {
      try {
        if (weightHistoryData.length > 0) {
          const chartElement = document.getElementById("weight-chart");
          if (chartElement) {
            updateWeightChart(weightHistoryData);
          } else {
            console.warn(
              "Chart element not found, skipping delayed chart update"
            );
          }
        }
      } catch (error) {
        console.error("Error in delayed chart update:", error);
      }
    }, 100);
  };

  // 🔁 Load from localStorage on page load
  const savedPenguinData = localStorage.getItem("latestPenguinData");
  if (savedPenguinData) {
    try {
      const penguinData = JSON.parse(savedPenguinData);
      updatePenguinDetails(penguinData);

      // Instead of just pushing to the array, load the complete history
      loadPenguinData(penguinData.id);
    } catch (error) {
      console.error("Error parsing saved penguin data:", error);
      // Clear potentially corrupted data
      localStorage.removeItem("latestPenguinData");
    }
  } else {
    console.log("No saved penguin data found in localStorage");
  }

  const savedHistoryData = localStorage.getItem("weightHistoryData");
  if (savedHistoryData) {
    try {
      weightHistoryData = JSON.parse(savedHistoryData);

      // Make sure each history item has an ID if possible
      if (savedPenguinData) {
        try {
          const penguinData = JSON.parse(savedPenguinData);
          weightHistoryData = weightHistoryData.map((item) => ({
            ...item,
            id: item.id || penguinData.id, // Add ID if missing
          }));
        } catch (error) {
          console.error("Error adding ID to history items:", error);
        }
      }

      // Populate weight history list from saved data
      const historyList = document.getElementById("weight-history-list");
      historyList.innerHTML = "";

      weightHistoryData.forEach((item) => {
        const historyItem = document.createElement("div");
        historyItem.className = "weight-history-item";
        historyItem.innerHTML = `
          <div>${item.date || "Unknown date"}, ${
          item.time || "Unknown time"
        }</div>
          <div>${item.weight} kg</div>
        `;
        historyList.appendChild(historyItem);
      });

      updateWeightChart(weightHistoryData); // ✅ draw chart immediately
      // Average weight is now updated inside updateWeightChart
    } catch (e) {
      console.warn("Could not parse weight history data from localStorage", e);
    }
  }

  // 🔁 Set up Server-Sent Events
  const eventSource = new EventSource(`${backendUrl}/stream`);

  eventSource.onopen = () => {
    console.log("SSE connection established");
  };

  eventSource.onerror = (error) => {
    console.error("SSE connection error:", error);
    // Attempt to reconnect after a delay
    setTimeout(() => {
      console.log("Attempting to reconnect SSE...");
      eventSource.close();
      const newEventSource = new EventSource(`${backendUrl}/stream`);
      // Transfer event handlers to new connection
      newEventSource.onopen = eventSource.onopen;
      newEventSource.onerror = eventSource.onerror;
      newEventSource.onmessage = eventSource.onmessage;
    }, 300);
  };

  eventSource.onmessage = (event) => {
    try {
      const penguinData = JSON.parse(event.data);
      console.log("New penguin data received via SSE:", penguinData);

      // Add id property if not present
      if (!penguinData.id && penguinData.penguinId) {
        penguinData.id = penguinData.penguinId;
      }

      // Update the UI with the new data
      updatePenguinDetails(penguinData);
      localStorage.setItem("latestPenguinData", JSON.stringify(penguinData)); // 💾 Save to localStorage

      // Reload the complete history instead of just adding one item
      loadPenguinData(penguinData.id);

      // Update the global chart
      //updateGlobalWeightChart();
    } catch (error) {
      console.error("Error processing SSE data:", error);
    }
  };

  // Initialize the chart on page load
  setTimeout(() => {
    updateGlobalWeightChart(); // ⬅️ This triggers the global chart display at startup
  }, 500);

  document.getElementById("track-history-btn").addEventListener("click", () => {
    const penguinId = document.getElementById("penguin-id").textContent;
    window.location.href = `/penguin-details.html?id=${penguinId}`;
  });
});
