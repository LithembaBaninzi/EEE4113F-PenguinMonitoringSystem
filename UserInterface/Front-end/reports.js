document.addEventListener("DOMContentLoaded", function () {
  // Global variables to store data
  let penguinData = [];
  let filteredData = [];

  // Fetch data from API when page loads
  fetchReportData();
  fetchSummaryData();

  // Function to fetch report data from API
  function fetchReportData(filter = "id") {
    fetch(`/reports/table?filter=${filter}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        penguinData = data;
        filteredData = [...penguinData];
        populateTable(filteredData);
      })
      .catch((error) => {
        console.error("Error fetching penguin data:", error);
        document.getElementById("error-message").textContent =
          "Failed to load penguin data. Please try again later.";
        document.getElementById("error-message").style.display = "block";
      });
  }

  // Function to fetch summary data
  function fetchSummaryData() {
    fetch("/reports/summary")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        // Update summary stats in the UI
        document.getElementById("total-penguins").textContent =
          data.total_penguins;
        document.getElementById(
          "avg-weight"
        ).textContent = `${data.avg_weight_7d} kg`;

        if (data.heaviest && data.heaviest.id) {
          document.getElementById(
            "heaviest-penguin"
          ).textContent = `${data.heaviest.id} (${data.heaviest.weight} kg)`;
        }

        if (data.lightest && data.lightest.id) {
          document.getElementById(
            "lightest-penguin"
          ).textContent = `${data.lightest.id} (${data.lightest.weight} kg)`;
        }
      })
      .catch((error) => {
        console.error("Error fetching summary data:", error);
      });
  }

  // Function to populate the table
  function populateTable(data) {
    const tableBody = document.querySelector("#penguin-table tbody");
    tableBody.innerHTML = "";

    // Reset select all checkbox when repopulating table
    const selectAllCheckbox = document.getElementById("select-all-checkbox");
    if (selectAllCheckbox) {
      selectAllCheckbox.checked = false;
    }

    data.forEach((penguin) => {
      const tr = document.createElement("tr");

      // Format date and time
      const lastSeenDate = new Date(penguin.last_seen);
      const formattedDate = lastSeenDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const formattedTime = penguin.time || "00:00";
      const lastSeen = `${formattedDate}, ${formattedTime}`;

      // Create status icon and class based on status
      let statusIcon = "";
      let statusClass = "";

      switch (penguin.status.toLowerCase()) {
        case "normal":
          statusIcon = "check";
          statusClass = "normal";
          break;
        case "overweight":
          statusIcon = "exclamation";
          statusClass = "overweight";
          break;
        case "underweight":
          statusIcon = "exclamation";
          statusClass = "underweight";
          break;
      }

      // Build the table row
      tr.innerHTML = `
                <td>
                    <label class="checkbox-container">
                        <input type="checkbox" data-penguin-id="${
                          penguin.penguin_id
                        }">
                        <span class="checkmark"></span>
                    </label>
                </td>
                <td>${penguin.penguin_id}</td>
                <td>${lastSeen}</td>
                <td>${penguin.current_weight} kg</td>
                <td>${penguin.avg_weight_7d} kg</td>
                <td>
                    <span class="status-badge status-${penguin.status.toLowerCase()}">
                        <span class="status-icon ${statusClass}">
                            <i class="fas fa-${statusIcon}"></i>
                        </span>
                        ${
                          penguin.status.charAt(0).toUpperCase() +
                          penguin.status.slice(1)
                        }
                    </span>
                </td>
                <td>${penguin.comments || ""}</td>
            `;

      tableBody.appendChild(tr);
    });

    // Update record count
    document.getElementById(
      "records-count"
    ).textContent = `Showing ${data.length} of ${penguinData.length} penguins`;

    // Reset selected count display
    updateSelectedCount();
  }

  // Filter functionality
  const filters = document.querySelectorAll("select");
  filters.forEach((filter) => {
    filter.addEventListener("change", function () {
      // Get filter values
      const penguinId = document.getElementById("penguin-id").value;
      const status = document.getElementById("anomaly-status").value;
      const timePeriod = document.getElementById("time-period").value;

      // If status filter changed, fetch new data from API
      if (filter.id === "anomaly-status") {
        let apiFilter = "id";
        if (
          status === "underweight" ||
          status === "overweight" ||
          status === "normal"
        ) {
          apiFilter = status;
        }
        fetchReportData(apiFilter);
        return;
      }

      // For other filters, filter the data client-side
      filteredData = [...penguinData];

      // Filter by penguin ID
      if (penguinId) {
        filteredData = filteredData.filter((penguin) =>
          penguin.penguin_id.toLowerCase().includes(penguinId.toLowerCase())
        );
      }

      // Filter by time period if implemented
      if (timePeriod !== "all") {
        // Implementation for time period filtering would go here
        // This would require additional date parsing logic
      }

      populateTable(filteredData);
    });
  });

  // Export button functionality
  document.getElementById("csv-export").addEventListener("click", function () {
    exportTableToCSV("penguin_report.csv");
  });

  document
    .getElementById("excel-export")
    .addEventListener("click", function () {
      exportTableToExcel("penguin_report.xlsx");
    });

  document.getElementById("pdf-export").addEventListener("click", function () {
    exportTableToPDF();
  });

  // Function to export table to CSV
  function exportTableToCSV(filename) {
    const headers = [
      "ID",
      "Last Seen",
      "Current Weight",
      "Avg Weight (7d)",
      "Status",
      "Notes",
    ];
    let csvContent = headers.join(",") + "\n";

    filteredData.forEach((penguin) => {
      const row = [
        penguin.penguin_id,
        `${penguin.last_seen} ${penguin.time || ""}`,
        penguin.current_weight,
        penguin.avg_weight_7d,
        penguin.status,
        `"${penguin.comments || ""}"`,
      ];
      csvContent += row.join(",") + "\n";
    });

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");

    // Create URL for the blob
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";

    // Append to document, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Function to export table to Excel
  function exportTableToExcel(filename) {
    alert("Exporting to Excel...");
    // This would require a library like SheetJS/xlsx
    // Basic implementation could convert the CSV to Excel format
  }

  // Function to export table to PDF
  function exportTableToPDF() {
    // Use jsPDF and html2canvas libraries for PDF export
    if (typeof jsPDF === "undefined" || typeof html2canvas === "undefined") {
      // If libraries not loaded, load them dynamically
      loadPDFLibraries()
        .then(() => {
          generatePDF();
        })
        .catch((error) => {
          console.error("Failed to load PDF libraries:", error);
          alert("Failed to export to PDF. Please try again later.");
        });
    } else {
      // Libraries already loaded, generate PDF directly
      generatePDF();
    }
  }

  // Function to dynamically load PDF export libraries
  function loadPDFLibraries() {
    return new Promise((resolve, reject) => {
      // Load jsPDF
      const jsPDFScript = document.createElement("script");
      jsPDFScript.src =
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      jsPDFScript.onload = () => {
        // After jsPDF loads, load html2canvas
        const html2canvasScript = document.createElement("script");
        html2canvasScript.src =
          "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
        html2canvasScript.onload = resolve;
        html2canvasScript.onerror = reject;
        document.head.appendChild(html2canvasScript);
      };
      jsPDFScript.onerror = reject;
      document.head.appendChild(jsPDFScript);
    });
  }

  // Function to generate PDF
  function generatePDF() {
    // Show loading indicator
    const loadingIndicator = document.createElement("div");
    loadingIndicator.id = "pdf-loading";
    loadingIndicator.innerHTML = "<span>Generating PDF...</span>";
    loadingIndicator.style.position = "fixed";
    loadingIndicator.style.top = "50%";
    loadingIndicator.style.left = "50%";
    loadingIndicator.style.transform = "translate(-50%, -50%)";
    loadingIndicator.style.background = "rgba(0,0,0,0.7)";
    loadingIndicator.style.color = "white";
    loadingIndicator.style.padding = "20px";
    loadingIndicator.style.borderRadius = "5px";
    loadingIndicator.style.zIndex = "9999";
    document.body.appendChild(loadingIndicator);

    // Get the table element
    const table = document.getElementById("penguin-table");

    // Create a clone of the table to modify for PDF
    const tableClone = table.cloneNode(true);

    // Remove checkbox column
    const headerRows = tableClone.querySelectorAll("thead tr");
    const bodyRows = tableClone.querySelectorAll("tbody tr");

    headerRows.forEach((row) => {
      const firstCell = row.querySelector("th:first-child");
      if (firstCell) firstCell.remove();
    });

    bodyRows.forEach((row) => {
      const firstCell = row.querySelector("td:first-child");
      if (firstCell) firstCell.remove();
    });

    // Apply some basic styling for PDF
    tableClone.style.width = "100%";
    tableClone.style.borderCollapse = "collapse";
    tableClone.style.fontSize = "10px";

    const cells = tableClone.querySelectorAll("th, td");
    cells.forEach((cell) => {
      cell.style.border = "1px solid #ddd";
      cell.style.padding = "5px";
      cell.style.textAlign = "left";
    });

    // Create a container for the PDF content
    const container = document.createElement("div");
    container.style.padding = "20px";
    container.style.width = "740px"; // A4 width at 96 DPI

    // Add title and date
    const title = document.createElement("h2");
    title.textContent = "Penguin Health Report";
    title.style.textAlign = "center";

    const dateElement = document.createElement("p");
    const today = new Date();
    dateElement.textContent = `Generated on: ${today.toLocaleDateString()}`;
    dateElement.style.textAlign = "right";

    // Get summary data
    const summaryData = document.createElement("div");
    summaryData.style.marginBottom = "20px";
    summaryData.style.padding = "10px";
    summaryData.style.backgroundColor = "#f5f5f5";
    summaryData.style.borderRadius = "5px";

    summaryData.innerHTML = `
            <h3>Summary</h3>
            <p>Total Penguins: ${
              document.getElementById("total-penguins").textContent
            }</p>
            <p>Average Weight (7d): ${
              document.getElementById("avg-weight").textContent
            }</p>
            <p>Heaviest Penguin: ${
              document.getElementById("heaviest-penguin").textContent
            }</p>
            <p>Lightest Penguin: ${
              document.getElementById("lightest-penguin").textContent
            }</p>
        `;

    // Assemble the container
    container.appendChild(title);
    container.appendChild(dateElement);
    container.appendChild(summaryData);
    container.appendChild(tableClone);

    // Temporarily add to document (invisible)
    container.style.position = "absolute";
    container.style.left = "-9999px";
    document.body.appendChild(container);

    // Use html2canvas to convert to image
    html2canvas(container, {
      scale: 2, // Higher scale for better quality
      logging: false,
      useCORS: true,
    }).then((canvas) => {
      // Create PDF with jsPDF
      const pdf = new jspdf.jsPDF("p", "pt", "a4");
      const imgData = canvas.toDataURL("image/png");

      // Get dimensions
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      // Add image to PDF (the table)
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

      // If content exceeds one page, add more pages
      if (pdfHeight > pdf.internal.pageSize.getHeight()) {
        let heightLeft = pdfHeight;
        let position = 0;

        pdf.addPage();
        heightLeft -= pdf.internal.pageSize.getHeight();
        position -= pdf.internal.pageSize.getHeight();

        while (heightLeft >= 0) {
          pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
          heightLeft -= pdf.internal.pageSize.getHeight();
          position -= pdf.internal.pageSize.getHeight();

          if (heightLeft >= 0) {
            pdf.addPage();
          }
        }
      }

      // Save the PDF
      pdf.save("penguin_report.pdf");

      // Clean up
      document.body.removeChild(container);
      document.body.removeChild(loadingIndicator);
    });
  }

  // Select All checkbox functionality
  const selectAllCheckbox = document.getElementById("select-all-checkbox");
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener("change", function () {
      const isChecked = this.checked;
      const checkboxes = document.querySelectorAll(
        '#penguin-table tbody input[type="checkbox"]'
      );

      // Update all checkboxes to match the select all state
      checkboxes.forEach((checkbox) => {
        checkbox.checked = isChecked;
      });

      // Update selected count
      updateSelectedCount();
    });
  }

  // Individual checkbox selection functionality
  document.addEventListener("change", function (e) {
    if (e.target.type === "checkbox" && e.target.id !== "select-all-checkbox") {
      // If any individual checkbox is unchecked, uncheck the "select all" checkbox
      if (!e.target.checked && selectAllCheckbox) {
        selectAllCheckbox.checked = false;
      }

      // If all individual checkboxes are checked, check the "select all" checkbox
      if (e.target.checked && selectAllCheckbox) {
        const checkboxes = document.querySelectorAll(
          '#penguin-table tbody input[type="checkbox"]'
        );
        const checkedBoxes = document.querySelectorAll(
          '#penguin-table tbody input[type="checkbox"]:checked'
        );
        if (checkboxes.length === checkedBoxes.length) {
          selectAllCheckbox.checked = true;
        }
      }

      // Update selected count
      updateSelectedCount();
    }
  });

  // Function to update the selected count display
  function updateSelectedCount() {
    const selectedCheckboxes = document.querySelectorAll(
      '#penguin-table tbody input[type="checkbox"]:checked'
    );
    const selectedCount = selectedCheckboxes.length;

    // Update UI to show selected count
    if (document.getElementById("selected-count")) {
      document.getElementById("selected-count").textContent =
        selectedCount > 0 ? `${selectedCount} penguins selected` : "";
    }

    // Enable/disable bulk action buttons based on selection
    const bulkActionButtons = document.querySelectorAll(".bulk-action-btn");
    bulkActionButtons.forEach((button) => {
      button.disabled = selectedCount === 0;
    });
  }
});
