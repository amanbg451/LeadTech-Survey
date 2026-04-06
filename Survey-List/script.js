const API_BASE = window.location.origin;

// ---------- COOKIE UTILITIES (from dashboard) ----------
function getCookie(name) {
  const cookieName = name + "=";
  const cookies = document.cookie.split(";");
  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i];
    while (cookie.charAt(0) == " ") {
      cookie = cookie.substring(1);
    }
    if (cookie.indexOf(cookieName) == 0) {
      try {
        return JSON.parse(cookie.substring(cookieName.length, cookie.length));
      } catch {
        return cookie.substring(cookieName.length, cookie.length);
      }
    }
  }
  return null;
}

function getUserData() {
  return {
    userType: getCookie("user_type"),
    email: getCookie("user_email"),
    fullName: getCookie("full_name"),
  };
}

// Helper function to safely decode URI components
function decodeIfNeeded(str) {
  if (!str || typeof str !== "string") return str;

  // If string contains %20 or other URL encoded characters, decode it
  if (str.includes("%")) {
    try {
      return decodeURIComponent(str);
    } catch (e) {
      console.warn("Failed to decode string:", str);
      return str;
    }
  }
  return str;
}

// ---------- SIDEBAR PERMISSION FUNCTIONS ----------
function applyMenuPermissions(userType) {
  const surveysLink = document.getElementById("surveys-link");
  const createSurveyLink = document.getElementById("create-survey-link");
  const responseLink = document.getElementById("response-link");
  const projectIdLink = document.getElementById("project-id-link");
  const usersLink = document.getElementById("users-link");

  //   console.log("Survey List - Applying permissions for user type:", userType);

  const userTypeLower = userType ? userType.toLowerCase() : "";
  const isGuest =
    userTypeLower.includes("guest") ||
    userTypeLower.includes("viewer") ||
    userTypeLower.includes("read");

  if (isGuest) {
    // Guest: only Surveys and Response remain visible
    if (createSurveyLink) createSurveyLink.style.display = "none";
    if (projectIdLink) projectIdLink.style.display = "none";
    if (usersLink) usersLink.style.display = "none";
    if (surveysLink) surveysLink.style.display = "block";
    if (responseLink) responseLink.style.display = "block";
  } else {
    // Authorised users (including super_admin): show all
    if (surveysLink) surveysLink.style.display = "block";
    if (createSurveyLink) createSurveyLink.style.display = "block";
    if (responseLink) responseLink.style.display = "block";
    if (projectIdLink) projectIdLink.style.display = "block";
    if (usersLink) usersLink.style.display = "block";
  }

  setActiveMenu();
}

function setActiveMenu() {
  const currentPath = window.location.pathname;
  const menuItems = document.querySelectorAll("#full-menu li");
  menuItems.forEach((item) => item.classList.remove("active"));

  menuItems.forEach((item) => {
    const link = item.querySelector("a");
    if (link) {
      const href = link.getAttribute("href");
      if (
        currentPath.includes("/survey-project-wise") &&
        href.includes("/survey-project-wise")
      ) {
        item.classList.add("active");
      } else if (
        currentPath === href ||
        (href !== "/" && currentPath.includes(href))
      ) {
        item.classList.add("active");
      }
    }
  });
}

// ---------- LOGOUT FUNCTION ----------
// async function logout() {
//     try {
//         const response = await fetch(`${window.location.origin}/api/method/logout`, { method: 'GET' });
//         if (response.ok) {
//             document.cookie.split(";").forEach(function(c) {
//                 document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
//             });
//             const cookiesToClear = [
//                 'user_email', 'user_type', 'user_login_data', 'user_projects',
//                 'full_name', 'user_id', 'home_page', 'client_id', 'user_clients',
//                 'permission_data', 'sid', 'system_user', 'user_image'
//             ];
//             cookiesToClear.forEach(cookieName => {
//                 document.cookie = cookieName + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
//                 document.cookie = cookieName + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + window.location.hostname;
//             });
//             window.location.href = `${window.location.origin}/survey/login-test`;
//         } else {
//             window.location.href = `${window.location.origin}/survey/login-test`;
//         }
//     } catch (error) {
//         console.error('Logout error:', error);
//         window.location.href = `${window.location.origin}/survey/login-test`;
//     }
// }

// ---------- HELPER: format user name ----------
function formatUserName(userData) {
  let name = "";

  // Get the raw value and decode it properly
  if (
    userData.fullName &&
    userData.fullName !== "undefined" &&
    userData.fullName !== "null"
  ) {
    name = decodeIfNeeded(userData.fullName);
  } else if (userData.email) {
    name = decodeIfNeeded(userData.email);
    if (name.length > 25) {
      name = name.substring(0, 22) + "...";
    }
    return name;
  } else {
    name = "User";
  }

  return name;
}

// ---------- AUTHORISATION CHECK (runs immediately) ----------
(function () {
  const userData = getUserData();
  const userType = userData.userType;
  const userEmail = userData.email;

  const isAuthorized =
    userType &&
    userEmail &&
    userType !== "undefined" &&
    userType !== "null" &&
    userEmail !== "undefined" &&
    userEmail !== "null";

  if (!isAuthorized) {
    document.getElementById("security").style.display = "flex";
    document.getElementById("to_show").style.display = "none";
    setTimeout(function () {
      window.location.href = "https://dev.leadtech.in/survey/login-test";
    }, 2000);
  } else {
    document.getElementById("security").style.display = "none";
    document.getElementById("to_show").style.display = "block";

    // Update user info in navbar with proper decoding
    const userNameSpan = document.getElementById("userName");
    const badgeSpan = document.getElementById("userTypeBadge");

    if (userNameSpan) userNameSpan.textContent = formatUserName(userData);
    if (badgeSpan) {
      // Decode user type and replace underscores with spaces
      let userTypeDisplay = decodeIfNeeded(userType);
      userTypeDisplay = userTypeDisplay.replace(/_/g, " ");
      badgeSpan.textContent = userTypeDisplay;
    }

    // Apply menu permissions
    applyMenuPermissions(userType);

    // Show welcome alert
    setTimeout(() => {
      const alert = document.getElementById("copyAlert");
      if (alert) {
        alert.classList.add("show");
        setTimeout(() => alert.classList.remove("show"), 3000);
      }
    }, 100);
  }
})();

// ---------- HELPER: get query parameter from URL ----------
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// --- Global variable to hold surveys of the current project (if any) ---
let currentProjectSurveys = null;

// --- Function to fetch projects for logged‑in user and extract surveys for a given projectId ---
async function loadProjectSurveys(projectId) {
  //   console.log("Project id:", projectId);
  const email = getCookie("user_id");
  if (!email) {
    console.warn("No user_id cookie found – cannot filter by project.");
    return;
  }
  const apiUrl = `${API_BASE}/api/method/leadtech_survey.leadtech_survey.get_survey_project_permission.get_data_by_email`;
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: "Token 405e0af40f3d04a:885b55cc21d37d2",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: decodeURIComponent(email) }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    let projects = [];
    if (data && data.message && data.message.projects) {
      projects = data.message.projects;
    } else if (data && data.projects) {
      projects = data.projects;
    }
    const project = projects.find((p) => p.project_id === projectId);
    if (project && project.surveys) {
      currentProjectSurveys = project.surveys.map((name) => name.trim());
      //   console.log(`Project "${projectId}" surveys:`, currentProjectSurveys);
    } else {
      console.warn(
        `No project found with ID "${projectId}" or it has no surveys.`,
      );
      currentProjectSurveys = [];
    }
  } catch (error) {
    console.error("Error loading project surveys:", error);
    currentProjectSurveys = null;
  }
}

// --- This will run after authorisation (DOMContentLoaded) ---
document.addEventListener("DOMContentLoaded", function () {
  // Only proceed if user is authorised (already checked above)
  const userData = getUserData();
  if (!userData.userType || !userData.email) return; // double-check, but already handled

  // Check for project_id in URL
  const projectId = getQueryParam("project_id");
  if (projectId) {
    loadProjectSurveys(projectId).then(() => {
      fetchSurveys();
    });
  } else {
    fetchSurveys();
  }
});

let selectedEmails = [];
let currentEditSurveyName = "";

const authHeader = {
  Authorization: "Token 405e0af40f3d04a:885b55cc21d37d2",
  Cookie:
    "full_name=Guest; sid=Guest; system_user=no; user_id=Guest; user_image=",
};

function fetchSurveys(query = "", sortBy = "creation desc") {
  const apiUrl =
    `${API_BASE}/api/method/leadtech_survey.leadtech_survey.get_all_survey.get_all_doctype_same_format` +
    `?search=${encodeURIComponent(query)}` +
    `&sort_by=${encodeURIComponent(sortBy)}`;

  fetch(apiUrl, {
    headers: authHeader,
    credentials: "include",
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      const surveyTableBody = document.querySelector("#surveyTable tbody");
      let surveyData = data.data || [];

      // --- IMPROVED FILTERING ---
      if (currentProjectSurveys && Array.isArray(currentProjectSurveys)) {
        function normalizeForComparison(name) {
          return name.trim().toLowerCase().replace(/\s+/g, " ").trim();
        }
        function normalizeStrict(name) {
          return name.trim().toLowerCase();
        }

        const normalizedProject = currentProjectSurveys.map(
          normalizeForComparison,
        );
        const strictProject = currentProjectSurveys.map(normalizeStrict);

        surveyData = surveyData.filter((survey) => {
          const normalizedName = normalizeForComparison(survey.name);
          const strictName = normalizeStrict(survey.name);
          return (
            normalizedProject.includes(normalizedName) ||
            strictProject.includes(strictName)
          );
        });

        // console.log(`Filtered ${surveyData.length} surveys for project`);
      }
      // --------------------
      surveyTableBody.innerHTML = "";

      if (!surveyData || surveyData.length === 0) {
        surveyTableBody.innerHTML =
          '<tr><td colspan="100%">No Surveys available.</td></tr>';
        return;
      }
      let index = 1;
      surveyData.forEach((survey) => {
        const row = document.createElement("tr");
        row.innerHTML = `
                    <td>${index++}</td>
                    <td><input type="checkbox" class="survey-bulk-checkbox" data-name="${survey.name}"></td>
                    <td>${survey.name}</td>
                    <td>${new Date(survey.creation).toLocaleDateString()}</td>
                    <td>${new Date(survey.modified).toLocaleDateString()}</td>
                    <td><i class="fas fa-trash-alt" onclick="requestPinAndDelete('${survey.name}')"></i></td>
                    <td><i class="fas fa-copy" onclick="duplicate('${survey.name}')"></i></td>
                    <td><i class="fas fa-cogs" title="Edit Fields" onclick="editSurveyFields('${survey.name}')"></i></td>
                `;
        surveyTableBody.appendChild(row);
      });
    })
    .catch((error) => {
      console.error("Error fetching surveys:", error);
    });
}

// ---------- MISSING FUNCTION (added) ----------
function toggleAllSurveyCheckboxes(source) {
  const checkboxes = document.querySelectorAll(".survey-bulk-checkbox");
  checkboxes.forEach((cb) => (cb.checked = source.checked));
}

// ---------- Search functionality ----------
document.querySelector(".search-btn").addEventListener("click", () => {
  const searchQuery = document.querySelector(".search-input").value.trim();
  fetchSurveys(searchQuery);
});

document.querySelector(".reset-btn").addEventListener("click", () => {
  document.querySelector(".search-input").value = "";
  fetchSurveys();
});

function editSurveyFields(surveyName) {
  currentEditSurveyName = surveyName;
  openEditFieldsModal(surveyName);
}

function openEditFieldsModal(surveyName) {
  document.getElementById("editFieldsOverlay").style.display = "block";
  const modal = document.getElementById("editFieldsModal");
  modal.style.display = "block";

  // Update modal title
  modal.querySelector(".modal-header h3").textContent =
    `Edit Fields: ${surveyName}`;

  // Load survey fields
  loadSurveyFields(surveyName);
}
function loadSurveyFields(surveyName) {
  const container = document.getElementById("editFieldsContainer");
  container.innerHTML = "<p>Loading fields...</p>";

  // Fetch survey fields
  const apiUrl = `${API_BASE}/api/method/leadtech_survey.leadtech_survey.get_all_field_survey_by_name.get_doctype_by_name?name=${encodeURIComponent(surveyName)}`;

  fetch(apiUrl, {
    method: "GET",
    headers: {
      Authorization: "Token 405e0af40f3d04a:885b55cc21d37d2",
      "Content-Type": "application/json",
    },
    credentials: "include",
  })
    .then((response) => response.json())
    .then((data) => {
      if (data && data.data && data.data.fields) {
        renderEditFields(data.data.fields);
      } else {
        container.innerHTML = "<p>No fields found.</p>";
      }
    })
    .catch((error) => {
      console.error("Error loading fields:", error);
      container.innerHTML = "<p>Error loading fields. Please try again.</p>";
    });
}

function renderEditFields(fields) {
  const container = document.getElementById("editFieldsContainer");
  container.innerHTML = "";

  // Add header
  const header = document.createElement("div");
  header.className = "fields-header";
  header.innerHTML = `
        <div style="margin-bottom: 20px; padding: 10px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #17a2b8;">
            <h4 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">
                <i class="fas fa-info-circle"></i> Label Limit: 140 Characters
            </h4>
            <p style="margin: 0; font-size: 13px; color: #666;">
                Labels longer than 140 characters will be automatically moved to the description field.
                The label will be truncated with "..." and the full text will be visible below the field.
            </p>
        </div>
    `;
  container.appendChild(header);

  // Filter out system fields
  const editableFields = fields.filter(
    (field) =>
      ![
        "user",
        "name",
        "owner",
        "creation",
        "modified",
        "modified_by",
        "idx",
        "docstatus",
        "parent",
        "parentfield",
        "parenttype",
      ].includes(field.fieldname),
  );

  // Render existing fields
  editableFields.forEach((field) => {
    const fieldRow = createFieldRow(field, false);
    container.appendChild(fieldRow);
  });

  // Add "Add New Field" button
  const addButton = document.createElement("button");
  addButton.innerHTML = '<i class="fas fa-plus"></i> Add New Field';
  addButton.className = "add-field-btn";
  addButton.onclick = addNewFieldRow;
  container.appendChild(addButton);
}

function createFieldRow(fieldData, isNew = false) {
  const row = document.createElement("div");
  row.className = `field-row ${isNew ? "new-field-row" : ""}`;
  row.dataset.isNew = isNew;

  // Get fieldname
  const fieldname = fieldData.fieldname || "";

  // Check if label is long and has description
  const fullLabel = fieldData.label || "";
  const hasLongLabel = fullLabel.length > 140;
  let displayLabel = fullLabel;
  let description = fieldData.description || "";

  // Configuration: Set to false if you don't want "..." in truncated label
  const ADD_ELLIPSIS = false; // CHANGE THIS to true if you want "..."

  if (hasLongLabel) {
    // Split: first 140 chars go to label, rest to description
    if (ADD_ELLIPSIS) {
      displayLabel = fullLabel.substring(0, 137) + "...";
    } else {
      displayLabel = fullLabel.substring(0, 140);
    }

    // If description is empty OR if the description is the full label (from previous save)
    if (!description || description === fullLabel) {
      description = fullLabel.substring(140);
    }
  }

  // Field name input (always show, disabled)
  const fieldnameInput = document.createElement("input");
  fieldnameInput.type = "text";
  fieldnameInput.className = "field-input fieldname-display";
  fieldnameInput.value = fieldname;
  fieldnameInput.disabled = true;
  fieldnameInput.placeholder = "Auto-generated";

  // Label input
  const labelInput = document.createElement("input");
  labelInput.type = "text";
  labelInput.className = "field-input";
  labelInput.value = displayLabel;
  labelInput.placeholder =
    "Field Label (max 140 chars will auto-split to description)";
  // Remove maxLength to allow capturing full text for splitting
  // labelInput.maxLength = 140;  // COMMENT THIS OUT or remove it

  labelInput.addEventListener("input", function (e) {
    // Auto-generate fieldname from label for new fields
    if (isNew && !fieldnameInput.value) {
      const labelText = this.value.trim();
      if (labelText) {
        const generatedFieldname = "q_" + getNextFieldNumber();
        fieldnameInput.value = generatedFieldname;
      }
    }

    // Auto-split long labels
    const currentLabel = this.value;
    if (currentLabel.length > 140) {
      let truncatedLabel;
      const remainingText = currentLabel.substring(140);

      if (ADD_ELLIPSIS) {
        truncatedLabel = currentLabel.substring(0, 137) + "...";
      } else {
        truncatedLabel = currentLabel.substring(0, 140);
      }

      // Update label input with truncated version
      this.value = truncatedLabel;

      // Update description field with remaining text
      const descriptionTextarea = row.querySelector(".description-input");
      if (descriptionTextarea) {
        const existingDesc = descriptionTextarea.value;
        descriptionTextarea.value =
          remainingText + (existingDesc ? "\n\n" + existingDesc : "");

        // Visual feedback - highlight description field
        descriptionTextarea.style.backgroundColor = "#fff3cd";
        descriptionTextarea.style.borderColor = "#ffc107";
        setTimeout(() => {
          descriptionTextarea.style.backgroundColor = "";
          descriptionTextarea.style.borderColor = "";
        }, 2000);
      }

      // Show alert to user
      showAlert(
        `Label split: First 140 chars kept in label, remaining moved to description.`,
      );
    }
  });

  // Add paste event handler for better UX
  labelInput.addEventListener("paste", function (e) {
    // Small delay to let the paste complete before processing
    setTimeout(() => {
      // Trigger the input handler after paste completes
      const event = new Event("input", { bubbles: true });
      this.dispatchEvent(event);
    }, 10);
  });

  // Get next field number helper
  function getNextFieldNumber() {
    const container = document.getElementById("editFieldsContainer");
    const existingRows = container.querySelectorAll(".field-row");
    let maxNumber = 0;

    existingRows.forEach((row) => {
      const fieldnameInput = row.querySelector(".fieldname-display");
      if (fieldnameInput) {
        const fieldname = fieldnameInput.value.trim();
        const match = fieldname.match(/q_(\d+)/);
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxNumber) maxNumber = num;
        }
      }
    });

    return maxNumber + 1;
  }

  // Description field - ALWAYS show for ALL fields
  let descriptionInput = document.createElement("textarea");
  descriptionInput.className = "field-input description-input";
  // Set initial description value
  if (description) {
    descriptionInput.value = description;
  } else if (hasLongLabel) {
    // If label was split, description should contain the remaining part
    descriptionInput.value = fullLabel.substring(140);
  } else {
    descriptionInput.value = "";
  }
  descriptionInput.placeholder = "Description (full text for long labels)";
  descriptionInput.rows = 3;
  descriptionInput.style.width = "100%";
  descriptionInput.style.marginTop = "8px";
  descriptionInput.style.padding = "8px";
  descriptionInput.style.fontSize = "13px";
  descriptionInput.style.color = "#495057";
  descriptionInput.style.border = "1px solid #ced4da";
  descriptionInput.style.borderRadius = "4px";
  descriptionInput.style.resize = "vertical";

  // Field type display
  let fieldTypeElement;
  if (isNew) {
    const select = document.createElement("select");
    select.className = "field-input fieldtype-select";
    select.innerHTML = `
            <option value="Data">Text Input</option>
            <option value="Phone">Phone Number</option>
            <option value="Email">Email</option>
            <option value="Select">Dropdown</option>
            <option value="Select_other">Dropdown with Other</option>
            <option value="Int">Number</option>
            <option value="Float">Decimal</option>
            <option value="Date">Date</option>
            <option value="Time">Time</option>
            <option value="Check">Checkbox</option>
            <option value="Attach">File Upload</option>
            <option value="Geolocation">Map Location</option>
            <option value="Section Break">Section</option>
            <option value="Heading">Heading</option>
            <option value="Text">Long Text</option>
        `;

    if (fieldData.fieldtype) {
      // Map Frappe fieldtypes to UI types
      const typeMap = {
        Data: "Data",
        Int: "Int",
        Float: "Float",
        Select: "Select",
        Check: "Check",
        Attach: "Attach",
        Geolocation: "Geolocation",
        Date: "Date",
        Time: "Time",
        Datetime: "Date",
        Heading: "Heading",
        "Section Break": "Section Break",
        Text: "Text",
      };
      select.value = typeMap[fieldData.fieldtype] || "Data";
    }

    select.addEventListener("change", function () {
      const row = this.closest(".field-row");
      const optionsContainer = row.querySelector(".options-container");
      if (this.value === "Select" || this.value === "Select_other") {
        if (optionsContainer) optionsContainer.style.display = "block";
      } else {
        if (optionsContainer) optionsContainer.style.display = "none";
      }
    });

    fieldTypeElement = select;
  } else {
    const span = document.createElement("span");
    span.className = "field-type-disabled";
    span.textContent = getDisplayFieldtype(
      fieldData.fieldtype,
      fieldData.options,
    );
    fieldTypeElement = span;
  }

  // Helper function to get display fieldtype
  function getDisplayFieldtype(frappeType, options) {
    if (frappeType === "Data") {
      if (options === "Phone") return "Phone Number";
      if (options === "Email") return "Email";
      return "Text Input";
    }
    if (frappeType === "Select") return "Dropdown";
    if (frappeType === "Int") return "Number";
    if (frappeType === "Float") return "Decimal";
    if (frappeType === "Check") return "Checkbox";
    if (frappeType === "Attach") return "File Upload";
    if (frappeType === "Geolocation") return "Map Location";
    if (frappeType === "Section Break") return "Section";
    if (frappeType === "Heading") return "Heading";
    if (frappeType === "Text") return "Long Text";
    return frappeType || "Text Input";
  }

  // Required checkbox
  const requiredContainer = document.createElement("div");
  requiredContainer.className = "checkbox-container";
  const requiredCheckbox = document.createElement("input");
  requiredCheckbox.type = "checkbox";
  requiredCheckbox.id = `req_${Date.now()}_${Math.random()}`;
  requiredCheckbox.name = "mandatory";
  requiredCheckbox.checked = fieldData.reqd == 1;
  const requiredLabel = document.createElement("label");
  requiredLabel.htmlFor = requiredCheckbox.id;
  requiredLabel.textContent = "Required";
  requiredContainer.appendChild(requiredCheckbox);
  requiredContainer.appendChild(requiredLabel);

  // Options container
  const optionsContainer = document.createElement("div");
  optionsContainer.className = "options-container";

  const optionsLabel = document.createElement("span");
  optionsLabel.className = "field-label";
  optionsLabel.textContent = "Options:";

  const optionsInput = document.createElement("textarea");
  optionsInput.className = "field-input options-input";

  // Format options for display
  let displayOptions = fieldData.options || "";
  if (fieldData.fieldtype === "Select" && displayOptions) {
    if (displayOptions.startsWith("Select Type\n")) {
      displayOptions = displayOptions.substring(12);
    }
    if (displayOptions.endsWith("\nOthers")) {
      displayOptions = displayOptions.substring(0, displayOptions.length - 7);
    }
  }

  optionsInput.value = displayOptions.trim();
  optionsInput.placeholder =
    "Enter options (one per line)\nExample:\nOption 1\nOption 2\nOption 3";
  optionsInput.rows = 4;

  optionsContainer.appendChild(optionsLabel);
  optionsContainer.appendChild(optionsInput);

  // Show options for Select fields
  if (
    (fieldData.fieldtype === "Select" ||
      fieldData.fieldtype === "Select_other") &&
    displayOptions
  ) {
    optionsContainer.style.display = "block";
  } else {
    optionsContainer.style.display = "none";
  }

  // Remove button (only for new fields)
  const removeButton = document.createElement("button");
  removeButton.innerHTML = '<i class="fas fa-trash"></i> Remove';
  removeButton.className = "remove-btn";
  removeButton.onclick = () => row.remove();
  if (!isNew) removeButton.style.display = "none";

  // Create layout
  const fieldInfoContainer = document.createElement("div");
  fieldInfoContainer.className = "field-info-container";

  // Field name row
  const fieldnameRow = document.createElement("div");
  fieldnameRow.style.marginBottom = "10px";
  fieldnameRow.innerHTML = '<span class="field-label">Field Name:</span>';
  fieldnameRow.appendChild(fieldnameInput);

  // Label row
  const labelRow = document.createElement("div");
  labelRow.style.marginBottom = "10px";
  labelRow.innerHTML = '<span class="field-label">Label:</span>';
  labelRow.appendChild(labelInput);

  // Type and required row
  const typeRow = document.createElement("div");
  typeRow.style.display = "flex";
  typeRow.style.gap = "15px";
  typeRow.style.marginBottom = "10px";
  typeRow.style.alignItems = "center";

  const typeWrapper = document.createElement("div");
  typeWrapper.style.flex = "2";
  typeWrapper.innerHTML = '<span class="field-label">Type:</span>';
  typeWrapper.appendChild(fieldTypeElement);

  const requiredWrapper = document.createElement("div");
  requiredWrapper.style.flex = "1";
  requiredWrapper.appendChild(requiredContainer);

  typeRow.appendChild(typeWrapper);
  typeRow.appendChild(requiredWrapper);

  fieldInfoContainer.appendChild(fieldnameRow);
  fieldInfoContainer.appendChild(labelRow);
  fieldInfoContainer.appendChild(typeRow);

  // Add description if exists
  if (descriptionInput) {
    const descriptionRow = document.createElement("div");
    descriptionRow.style.marginTop = "10px";
    descriptionRow.style.marginBottom = "10px";
    descriptionRow.innerHTML =
      '<span class="field-label" style="color: #17a2b8;">Description (full text for long labels):</span>';
    descriptionRow.appendChild(descriptionInput);
    fieldInfoContainer.appendChild(descriptionRow);
  }

  // Add remove button for new fields
  if (isNew) {
    const actionRow = document.createElement("div");
    actionRow.style.marginTop = "15px";
    actionRow.style.textAlign = "right";
    actionRow.appendChild(removeButton);
    fieldInfoContainer.appendChild(actionRow);
  }

  // Append all elements
  row.appendChild(fieldInfoContainer);
  row.appendChild(optionsContainer);

  // Store original data
  row.dataset.originalData = JSON.stringify(fieldData);

  return row;
}

function addNewFieldRow() {
  const container = document.getElementById("editFieldsContainer");

  // Get all existing fieldnames to find the next number
  const existingRows = container.querySelectorAll(".field-row");
  let maxNumber = 0;

  existingRows.forEach((row) => {
    const fieldnameInput = row.querySelector(".fieldname-display");
    const fieldname = fieldnameInput ? fieldnameInput.value.trim() : "";
    if (fieldname) {
      const match = fieldname.match(/q_(\d+)/);
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxNumber) maxNumber = num;
      }
    }
  });

  const nextNumber = maxNumber + 1;
  const autoFieldname = `q_${nextNumber}`;
  const autoLabel = `Question ${nextNumber}`;

  const newFieldRow = createFieldRow(
    {
      fieldname: autoFieldname,
      label: autoLabel,
      fieldtype: "Data",
      reqd: 0,
      options: "",
    },
    true,
  );

  // CRITICAL FIX: Append to the BOTTOM instead of inserting before add button
  const addButton = container.querySelector(".add-field-btn");
  if (addButton) {
    // Insert BEFORE the add button (so new field appears just above the button)
    // But this makes new fields appear at the bottom of the list (above the Add button)
    container.insertBefore(newFieldRow, addButton);
    console.log(
      `✅ New field added at BOTTOM (position: ${container.querySelectorAll(".field-row").length - 1})`,
    );
  } else {
    container.appendChild(newFieldRow);
    console.log(`✅ New field appended to BOTTOM`);
  }

  // Auto-focus on the label input
  setTimeout(() => {
    const labelInput = newFieldRow.querySelector(
      'input[type="text"]:nth-child(2)',
    );
    if (labelInput) labelInput.focus();
  }, 100);
}

// Function to handle field type change for new fields
function handleFieldTypeChange(selectElement) {
  const row = selectElement.closest(".field-row");
  const isNew = row.dataset.isNew === "true";

  if (!isNew) return;

  const fieldType = selectElement.value;
  const optionsInput = row.querySelector(".options-input");
  const optionsLabel = row.querySelector(".field-label:last-child");

  // Show/hide options field based on field type
  if (fieldType === "Select") {
    if (optionsInput) {
      optionsInput.style.display = "block";
      optionsInput.placeholder = "Options (one per line)";
    }
    if (optionsLabel && optionsLabel.textContent === "Options:") {
      optionsLabel.style.display = "inline";
    }
  } else {
    if (optionsInput) {
      optionsInput.style.display = "none";
    }
    if (optionsLabel && optionsLabel.textContent === "Options:") {
      optionsLabel.style.display = "none";
    }
  }
}

function saveUpdatedFields() {
  const container = document.getElementById("editFieldsContainer");
  const fieldRows = container.querySelectorAll(".field-row");

  const update_fields = [];
  const usedFieldnames = new Set();
  const processedFields = new Set(); // Track processed fieldnames to avoid duplicates

  // Helper function to compare values
  function hasValueChanged(newValue, oldValue) {
    if (newValue === undefined || newValue === null) newValue = "";
    if (oldValue === undefined || oldValue === null) oldValue = "";

    const newStr = String(newValue).trim();
    const oldStr = String(oldValue).trim();

    return newStr !== oldStr;
  }

  // Map user-friendly types to Frappe fieldtypes
  function mapToFrappeFieldtype(userType, options = "") {
    if (userType === "Phone") return "Data";
    if (userType === "Email") return "Data";
    if (userType === "Select_other") return "Select";
    return userType;
  }

  // Generate options for fieldtype
  function generateOptions(userType, userOptions) {
    let options = "";

    if (userType === "Select" || userType === "Select_other") {
      if (userOptions) {
        const lines = userOptions.split("\n").filter((line) => line.trim());
        options = lines.join("\n");

        // Add "Others" for Select_other
        if (userType === "Select_other" && !lines.includes("Others")) {
          options += (options ? "\n" : "") + "Others";
        }
      } else if (userType === "Select_other") {
        options = "Others";
      }
    } else if (userType === "Phone") {
      options = "Phone";
    } else if (userType === "Email") {
      options = "Email";
    }

    return options;
  }

  // First, collect all field data including dependent fields
  const allFields = [];

  fieldRows.forEach((row, index) => {
    const originalData = row.dataset.originalData
      ? JSON.parse(row.dataset.originalData)
      : {};
    const isNew = row.classList.contains("new-field-row");

    // Get fieldname from input
    const fieldnameInput = row.querySelector('input[type="text"]:first-child');
    let fieldname = fieldnameInput ? fieldnameInput.value.trim() : "";

    // For NEW fields without fieldname, generate a new fieldname
    if (isNew) {
      if (!fieldname) {
        // Generate unique fieldname for new field
        let newFieldNumber = 1;
        while (usedFieldnames.has(`q_${newFieldNumber}`)) {
          newFieldNumber++;
        }
        fieldname = `q_${newFieldNumber}`;
      }
    } else {
      // For EXISTING fields, use the original fieldname
      if (!fieldname && originalData.fieldname) {
        fieldname = originalData.fieldname;
      }
    }

    // Skip if missing fieldname
    if (!fieldname) {
      console.warn(`⚠ Skipping row ${index + 1}: Missing fieldname`);
      return;
    }

    // Handle duplicate fieldnames by adding suffix
    let finalFieldname = fieldname;
    let counter = 1;
    while (
      usedFieldnames.has(finalFieldname) ||
      processedFields.has(finalFieldname)
    ) {
      finalFieldname = `${fieldname}_${counter}`;
      counter++;
    }

    processedFields.add(finalFieldname);

    // Get label
    const labelInputs = row.querySelectorAll('input[type="text"]');
    let fullLabel = labelInputs.length > 1 ? labelInputs[1].value.trim() : "";
    let label = fullLabel;
    let description = "";

    // Handle long labels (> 140 characters) - Split to description
    if (fullLabel.length > 140) {
      // First 140 chars go to label (with ...)
      label = fullLabel.substring(0, 137) + "...";

      // Remaining chars go to description
      const remainingText = fullLabel.substring(140);

      // If there's already description content, combine
      if (description) {
        description = remainingText + "\n\n" + description;
      } else {
        description = remainingText;
      }

      console.log(
        `📝 Long label detected (${fullLabel.length} chars). Split: Label=${label.substring(0, 50)}..., Description=${remainingText.substring(0, 50)}...`,
      );
    }

    const descriptionInput = row.querySelector("textarea.description-input");
    if (descriptionInput) {
      // Always set description to whatever is in the UI (could be empty string)
      description = descriptionInput.value.trim();
      console.log(`📝 Description for ${fieldname}: "${description}"`);
    }

    // Get fieldtype
    let userFieldtype = "";
    if (isNew) {
      const selectElement = row.querySelector("select");
      userFieldtype = selectElement ? selectElement.value : "Data";
    } else {
      // For existing fields, determine from original data
      const originalType = originalData.fieldtype || "Data";
      const originalOptions = originalData.options || "";

      if (originalType === "Data") {
        if (originalOptions === "Email") userFieldtype = "Email";
        else if (originalOptions === "Phone") userFieldtype = "Phone";
        else userFieldtype = "Data";
      } else if (originalType === "Select") {
        userFieldtype = "Select";
      } else if (originalType === "Int") {
        if (originalOptions === "Phone") userFieldtype = "Phone";
        else userFieldtype = "Int";
      } else if (originalType === "Float") {
        userFieldtype = "Float";
      } else if (originalType === "Check") {
        userFieldtype = "Check";
      } else {
        userFieldtype = originalType;
      }
    }

    // Get required
    const requiredCheckbox = row.querySelector('input[name="mandatory"]');
    const required = requiredCheckbox ? (requiredCheckbox.checked ? 1 : 0) : 0;

    // Get options
    const optionsInput = row.querySelector(".options-input");
    const userOptions = optionsInput ? optionsInput.value.trim() : "";

    // Get depends_on from original data if it exists
    let dependsOn = null;
    if (originalData.depends_on) {
      dependsOn = originalData.depends_on;
    }

    // CRITICAL FIX: Calculate order index to maintain proper sequence
    let orderIndex;
    if (isNew) {
      // New fields get a high order index to ensure they go to the bottom
      // Use current timestamp + index to ensure unique ordering
      orderIndex = Date.now() + index;
    } else {
      // For existing fields, extract the field number from fieldname
      const match = originalData.fieldname?.match(/q_(\d+)/);
      if (match) {
        orderIndex = parseInt(match[1]);
      } else if (originalData.fieldname?.startsWith("other_")) {
        // For "other" fields, place them after their parent
        const otherMatch = originalData.fieldname?.match(/other_q_(\d+)/);
        if (otherMatch) {
          orderIndex = parseInt(otherMatch[1]) + 0.5;
        } else {
          orderIndex = index;
        }
      } else {
        orderIndex = index;
      }
    }

    allFields.push({
      fieldname: finalFieldname,
      originalFieldname: fieldname,
      label,
      description,
      userFieldtype,
      required,
      userOptions,
      isNew,
      originalData,
      dependsOn,
      row,
      orderIndex, // Store for sorting
    });
  });

  // CRITICAL FIX: Sort fields to maintain correct order
  // Existing fields come first (by orderIndex), new fields go to the end
  allFields.sort((a, b) => {
    // Existing fields come before new fields
    if (!a.isNew && b.isNew) return -1;
    if (a.isNew && !b.isNew) return 1;
    // Both existing or both new, sort by orderIndex
    return a.orderIndex - b.orderIndex;
  });

  console.log(
    "Sorted fields order:",
    allFields.map((f) => `${f.fieldname} (${f.isNew ? "NEW" : "EXISTING"})`),
  );

  // Clear usedFieldnames for the second pass
  usedFieldnames.clear();

  // Now process all fields in sorted order
  allFields.forEach((field) => {
    const {
      fieldname,
      originalFieldname,
      label,
      description,
      userFieldtype,
      required,
      userOptions,
      isNew,
      originalData,
      dependsOn,
    } = field;

    // Check for duplicates
    if (usedFieldnames.has(fieldname)) {
      console.error(
        `❌ Duplicate fieldname detected: ${fieldname}. Skipping duplicate.`,
      );
      return;
    }

    usedFieldnames.add(fieldname);

    // Map to Frappe fieldtype
    const frappeFieldtype = mapToFrappeFieldtype(userFieldtype);

    // Generate final options
    const options = generateOptions(userFieldtype, userOptions);

    // Create the main field
    const fieldData = {
      fieldname: fieldname,
      label: label || `Question ${fieldname}`,
      fieldtype: frappeFieldtype,
      reqd: required,
    };

    // Add description if it exists
    // if (description) {
    fieldData.description = description;
    // }

    // Add options if needed
    if (options) {
      fieldData.options = options;
    }

    // Set appropriate length
    if (
      frappeFieldtype === "Data" ||
      frappeFieldtype === "Text" ||
      frappeFieldtype === "Small Text"
    ) {
      fieldData.length = 350;
    } else if (frappeFieldtype === "Int") {
      fieldData.length = 10;
    }

    // For Select fields, add "Select Type" prefix
    if (userFieldtype === "Select" || userFieldtype === "Select_other") {
      if (options && !options.startsWith("Select Type\n")) {
        fieldData.options = "Select Type\n" + options;
      }
    }

    // CRITICAL FIX: Add depends_on for "other" fields or preserve from original data
    if (fieldname.startsWith("other_")) {
      const mainFieldname = originalFieldname.substring(6); // Remove "other_" prefix
      fieldData.depends_on = `eval:doc.${mainFieldname}=='Others'`;
      fieldData.fieldtype = "Small Text";
      console.log(`🔗 Added dependency for ${fieldname} -> ${mainFieldname}`);
    } else if (dependsOn) {
      fieldData.depends_on = dependsOn;
      console.log(`🔗 Preserved dependency for ${fieldname} -> ${dependsOn}`);
    }

    // CRITICAL FIX: Check if this is a dropdown that should have "Others" option
    if (userFieldtype === "Select" && originalData.options) {
      const optionsLines = originalData.options.split("\n");
      const lastOption = optionsLines[optionsLines.length - 1];

      // If the original dropdown had "Others", preserve it
      if (lastOption && lastOption.includes("Others")) {
        if (!fieldData.options.includes("Others")) {
          fieldData.options = fieldData.options + "\nOthers";
        }
        console.log(`📌 Preserved "Others" option for ${fieldname}`);
      }
    }

    update_fields.push(fieldData);
    console.log(`✓ Adding field "${fieldname}"`, {
      label: label,
      description: description
        ? description.substring(0, 50) + "..."
        : "(none)",
      type: frappeFieldtype,
      options: fieldData.options,
      depends_on: fieldData.depends_on || "none",
      position: update_fields.length,
    });

    // If this is a "Dropdown with Other" field, create the dependent "Other" field
    if (userFieldtype === "Select_other") {
      const otherFieldname = `other_${fieldname}`;

      // Check if other field already exists in our list
      const otherFieldExists = allFields.some(
        (f) =>
          f.fieldname === otherFieldname ||
          f.originalFieldname === otherFieldname,
      );

      if (!otherFieldExists) {
        // Create the dependent "Other" field
        const otherFieldData = {
          fieldname: otherFieldname,
          label: `${label} (Please specify)`,
          fieldtype: "Small Text",
          reqd: 0,
          description: `Appears only when 'Others' is selected in ${fieldname}`,
          depends_on: `eval:doc.${fieldname}=='Others'`,
          length: 350,
        };

        update_fields.push(otherFieldData);
        console.log(
          `✓ Adding dependent other field "${otherFieldname}" -> depends on "${fieldname}" at position ${update_fields.length}`,
        );
      }
    }
  });

  console.log("Total fields to update:", update_fields.length);
  console.log(
    "Final fields order:",
    update_fields.map((f) => f.fieldname),
  );
  console.log("Fields data:", update_fields);

  if (update_fields.length === 0) {
    showAlert(
      "No changes detected. Please modify at least one field before saving.",
    );
    return;
  }

  // Prepare API request
  const apiData = {
    doctype_name: currentEditSurveyName,
    update_fields: update_fields,
  };

  console.log("API Request Data:", JSON.stringify(apiData, null, 2));

  // Show loading
  const saveBtn = document.querySelector(
    '#editFieldsModal button[onclick="saveUpdatedFields()"]',
  );
  if (!saveBtn) {
    console.error("Save button not found");
    return;
  }

  const originalText = saveBtn.innerHTML;
  saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
  saveBtn.disabled = true;

  // Call the update API
  fetch(
    `${API_BASE}/api/method/leadtech_survey.leadtech_survey.create_survey.update_doctype_fields`,
    {
      method: "POST",
      headers: {
        Authorization: "Token 405e0af40f3d04a:885b55cc21d37d2",
        "Content-Type": "application/json",
        "X-Frappe-CSRF-Token":
          frappe.csrf_token ||
          document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute("content") ||
          "",
      },
      body: JSON.stringify(apiData),
    },
  )
    .then((response) => {
      console.log("API Response Status:", response.status);

      // Reset button
      saveBtn.innerHTML = originalText;
      saveBtn.disabled = false;

      if (!response.ok) {
        return response.text().then((text) => {
          console.error("API Error Response:", text);

          if (
            text.includes("CharacterLengthExceededError") ||
            text.includes("will get truncated")
          ) {
            const labelMatch = text.match(/'([^']+)'\) will get truncated/);
            if (labelMatch && labelMatch[1]) {
              const longLabel = labelMatch[1];
              showAlert(
                `Label too long: "${longLabel.substring(0, 50)}..." - Max 140 characters allowed`,
              );
            } else {
              showAlert(
                "One or more labels exceed 140 characters. Please shorten them.",
              );
            }
          } else {
            showAlert(`Error ${response.status}: Failed to update fields`);
          }
          throw new Error(`HTTP ${response.status}`);
        });
      }
      return response.json();
    })
    .then((data) => {
      console.log("API Response Data:", data);

      if (
        data &&
        (data.message === "success" || data.message?.status === "success")
      ) {
        showAlert("Fields updated successfully!");
        closeEditFieldsModal();
        fetchSurveys();
      } else {
        console.error("API Error:", data);
        alert("Failed to update fields. Check console for details.");
      }
    })
    .catch((error) => {
      console.error("Error updating fields:", error);

      if (saveBtn) {
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
      }

      if (!error.message.includes("417")) {
        alert(`Error: ${error.message}`);
      }
    });
}

function addRow2(data) {
  console.log("API Field Data:", data);

  const tableBody = document.querySelector("#tableBody");
  const newRow = document.createElement("tr");
  newRow.classList.add("draggable");
  newRow.draggable = true;

  newRow.innerHTML = `
        <td>
            <select name="inputType" onchange="updateFormat2(this)">
                <option value="select">Select Question Type</option>
                <option value="drop_down">Drop Down</option>
                <option value="drop_down_dependent">Drop Down Dependent</option>
                <option value="group">Group</option>
                <option value="drop_down_other">Drop Down With other</option>
                <option value="text_block">Text Block</option>
                <option value="singleline_text_input">Singleline Text Input</option>
                <option value="multiline_text_input">Multiline Text Input</option>
                <option value="number_input">Number Input</option>
                <option value="decimal_input">Decimal Input</option>
                <option value="map_coordinates">Map Coordinates (GPS)</option>
                <option value="email">Email</option>
                <option value="phone_number">Phone Number</option>
                <option value="radio_button">Radio Button Options</option>
                <option value="radio_button_other">Radio Button Options with Other</option>
                <option value="checkbox_list">Checkbox List</option>
                <option value="checkbox">Checkbox</option>
                <option value="date">Date</option>
                <option value="time">Time</option>
                <option value="date_time">Date & Time</option>
                <option value="photo_capture">Photo Capture</option>
                <option value="record_audio">Audio Record</option>
                <option value="contact">Contact Details</option>
                <option value="address">Address Details</option>
                <option value="drop_down_grid">Drop Down Grid</option>
                <option value="checkbox_grid">Check Box Grid</option>
                <option value="data_grid">Data Grid</option>
            </select>
        </td>
        <td class="formatCell">
        </td>
        <td>
            <input name="mandatory" type="checkbox" />
        </td>
        <td>
            <button type="button" onclick="removeRow(this)">Remove</button>
        </td>
    `;

  tableBody.appendChild(newRow);

  // Determine the correct UI type from Frappe fieldtype
  let variable = "select";
  let isOtherField = false;
  let dependsOn = null;
  let dependsValue = null;

  // Check if this is an "other" field (starts with "other_")
  if (data.fieldname && data.fieldname.startsWith("other_")) {
    isOtherField = true;
    variable = "singleline_text_input"; // Other fields are text inputs
    console.log(`🔍 Detected OTHER field: ${data.fieldname}`);
  }

  // If not an other field, determine the type normally
  if (!isOtherField) {
    switch (data.fieldtype) {
      case "Select":
        let optionsArray = data.options ? data.options.split("\n") : [];
        let firstLine = optionsArray[0] || "";
        let lastLine = optionsArray[optionsArray.length - 1] || "";

        if (firstLine.includes("Select Type")) {
          if (lastLine.includes("Others")) {
            variable = "drop_down_other";
            console.log(`📌 Dropdown with Other detected: ${data.fieldname}`);
          } else {
            variable = "drop_down";
          }
        } else if (firstLine.includes("Radio Type")) {
          if (lastLine.includes("Others")) {
            variable = "radio_button_other";
          } else {
            variable = "radio_button";
          }
        } else if (firstLine.includes("Check Type")) {
          variable = "checkbox_list";
        }

        // Check if it's a dependent dropdown (has depends_on field)
        if (data.depends_on) {
          variable = "drop_down_dependent";
          dependsOn = data.depends_on;
          dependsValue = data.depends_on_value;
        }
        break;

      case "Heading":
        variable = "text_block";
        break;

      case "Data":
        if (data.options === "Email") {
          variable = "email";
        } else {
          variable = "singleline_text_input";
        }
        break;

      case "Text":
        variable = "multiline_text_input";
        break;

      case "Float":
        variable = "decimal_input";
        break;

      case "Int":
        if (data.options === "Phone") {
          variable = "phone_number";
        } else {
          variable = "number_input";
        }
        break;

      case "Section Break":
        variable = "group";
        break;

      case "Date":
        variable = "date";
        break;

      case "Time":
        variable = "time";
        break;

      case "Datetime":
        variable = "date_time";
        break;

      case "Geolocation":
        variable = "map_coordinates";
        break;

      case "Attach":
        if (data.options === "Audio") {
          variable = "record_audio";
        } else {
          variable = "photo_capture";
        }
        break;

      case "Check":
        variable = "checkbox";
        break;

      case "Signature":
        variable = "signature";
        break;

      default:
        variable = "singleline_text_input";
    }
  }

  const selectElement = newRow.querySelector('select[name="inputType"]');
  selectElement.value = variable;

  // Trigger format update
  updateFormat2(selectElement);

  // Populate data
  setTimeout(() => {
    const questionInput = newRow.querySelector('input[name="questionName"]');
    if (questionInput) {
      questionInput.value = data.label || "";
    }

    const mandatoryCheck = newRow.querySelector('input[name="mandatory"]');
    if (mandatoryCheck) {
      mandatoryCheck.checked = data.reqd === 1;
    }

    // Handle options
    const optionsTextarea = newRow.querySelector('textarea[name="options"]');
    if (optionsTextarea && data.options && !isOtherField) {
      let optionsValue = data.options;

      // Clean options (remove type prefixes and Others)
      const lines = optionsValue.split("\n");
      let cleanLines = [];

      for (let line of lines) {
        line = line.trim();
        if (
          line &&
          !line.includes("Select Type") &&
          !line.includes("Radio Type") &&
          !line.includes("Check Type") &&
          !line.includes("Others")
        ) {
          cleanLines.push(line);
        }
      }

      optionsTextarea.value = cleanLines.join("\n");
    }

    // Handle dependent dropdown fields
    if (variable === "drop_down_dependent") {
      const dependsField = newRow.querySelector(
        'select[name="depends_on_field"]',
      );
      const dependsValueInput = newRow.querySelector(
        'input[name="depends_on_value"]',
      );

      if (dependsField && dependsOn) {
        // Try to match with existing fields
        for (let opt of dependsField.options) {
          if (opt.value === dependsOn) {
            opt.selected = true;
            break;
          }
        }
      }

      if (dependsValueInput && dependsValue) {
        dependsValueInput.value = dependsValue;
      }
    }

    // For "other" fields, we need to set the dependency if it exists
    if (isOtherField && data.depends_on) {
      console.log(
        `🔗 Setting dependency for ${data.fieldname} -> ${data.depends_on}`,
      );
      // Store the dependency info in the row data for later use
      newRow.dataset.dependsOn = data.depends_on;
      newRow.dataset.dependsValue = data.depends_on_value || "Others";
    }
  }, 100);
}

// Helper function to compare values
function hasValueChanged(newValue, oldValue) {
  if (newValue === undefined || newValue === null) newValue = "";
  if (oldValue === undefined || oldValue === null) oldValue = "";

  // Convert both to string for comparison
  const newStr = String(newValue).trim();
  const oldStr = String(oldValue).trim();

  return newStr !== oldStr;
}

function closeEditFieldsModal() {
  document.getElementById("editFieldsOverlay").style.display = "none";
  document.getElementById("editFieldsModal").style.display = "none";
  currentEditSurveyName = "";
}

document.querySelector(".sort-select").addEventListener("change", () => {
  const sortValue = document.querySelector(".sort-select").value;
  let sortBy = "creation desc";

  if (sortValue === "Name ASC") sortBy = "name asc";
  else if (sortValue === "Name DESC") sortBy = "name desc";
  else if (sortValue === "Date ASC") sortBy = "creation asc";
  else if (sortValue === "Date DESC") sortBy = "creation desc";

  const searchQuery = document.querySelector(".search-input").value.trim();
  fetchSurveys(searchQuery, sortBy);
});

function requestPinAndDelete(surveyName) {
  if (
    confirm(
      "Please Confirm!! Once the survey is deleted, it will lose all associated data. Are you sure you want to continue to delete this survey?",
    )
  ) {
    fetch(
      `${API_BASE}/api/method/leadtech_survey.leadtech_survey.send_pin.send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Frappe-CSRF-Token": frappe.csrf_token,
        },
      },
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.message.message === "sent" && data.message.pin) {
          showAlert("PIN sent on specified email ID.");
          askForPinAndDelete(data.message.pin, surveyName); // Step 2: Ask user to enter PIN
        } else {
          showAlert("Failed to send PIN.");
        }
      })
      .catch(() => showAlert("Server error while sending PIN."));
  } else {
    console.log("Survey deletion canceled by the user.");
  }
  // Step 1: Ask server to generate + send PIN
}

function askForPinAndDelete(generatedPin, surveyName) {
  const modal = document.createElement("div");
  modal.innerHTML = `
<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;">
  <div style="background:#fff;padding:25px 20px;border-radius:10px;position:relative;width:280px;text-align:center;box-shadow:0 4px 12px rgba(0,0,0,0.2);">
    <span id="closePin" style="position:absolute;top:10px;right:15px;font-size:30px;color:#888;cursor:pointer;">&times;</span>
    <p>Enter 6-Digit PIN</p>
    <input type="password" id="pinInput" maxlength="6" placeholder="••••••" style="width:100%;padding:10px;font-size:18px;letter-spacing:8px;text-align:center;border:1px solid #ccc;border-radius:8px;margin:15px 0;">
    <button id="confirmPin" style="padding:10px 20px;background:linear-gradient(135deg, #b03a2e, #c0392b);color:#fff;border:none;border-radius:6px;cursor:pointer;">Confirm</button>
  </div>
</div>

  `;
  document.body.appendChild(modal);
  modal.querySelector("#closePin").onclick = () => modal.remove();

  modal.querySelector("#confirmPin").onclick = () => {
    const inputPin = modal.querySelector("#pinInput").value;
    if (inputPin === generatedPin.toString()) {
      modal.remove();
      deleteSurvey(surveyName); // <-- your existing deleteSurvey function
    } else {
      showAlert("Incorrect PIN. Please try again.");
    }
  };
}

function deleteSurvey(surveyName) {
  const url = `${API_BASE}/api/resource/DocType/${encodeURIComponent(
    surveyName,
  )}?fields=["*"]`;
  const token = "405e0af40f3d04a:15d3aa43672a581";

  fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
      Cookie:
        "full_name=Guest; sid=Guest; system_user=no; user_id=Guest; user_image=",
      "X-Frappe-CSRF-Token": frappe.csrf_token,
    },
  })
    .then((response) =>
      response.text().then((responseData) => ({
        status: response.status,
        statusText: response.statusText,
        body: responseData,
      })),
    )
    .then((response) => {
      if (response.status >= 200 && response.status < 300) {
        showAlert("Survey Deleted Successfully.");
        setTimeout(function () {
          window.location.reload();
        }, 2500); // Reload after 2.5 seconds
      } else {
        console.error(
          "Failed to delete survey:",
          response.status,
          response.statusText,
          response.body,
        );
        showAlert("Failed to delete the survey. Please try again.");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      showAlert("An unexpected error occurred.");
    });
}

function showAlert(message) {
  const alert = document.getElementById("copyAlert");
  const alertMessage = document.getElementById("alertMessage");
  alertMessage.textContent = message; // Update the alert message
  alert.classList.add("show");

  // Hide the alert after 3 seconds
  setTimeout(() => {
    alert.classList.remove("show");
  }, 2000);
}

// Close the alert manually
function closeAlert() {
  document.getElementById("copyAlert").classList.remove("show");
}

/////////////////////////END///////////////////////

function PopulateRows(name) {
  // Show edit form, hide list
  document.getElementById("editForm").style.display = "block";
  document.getElementById("surveyList").style.display = "none";

  // Check if survey already has responses
  isBuiltInDisplayEmpty(name, function (flag) {
    if (flag) {
      console.log(`${name} is empty. You can update.`);
      document.getElementById("saveformupdate").style.display = "block";
      document.getElementById("addmorebuttom").style.display = "block";
    } else {
      console.log(`${name} has data. Cannot update.`);
      document.getElementById("saveformupdate").style.display = "none";
      document.getElementById("addmorebuttom").style.display = "none";
      alert("Editing is disabled as this survey form already has responses.");
    }
  });

  // Debug localStorage
  const localStorageData = JSON.parse(localStorage.getItem("formData"));
  console.log("LocalStorage Data:", localStorageData);

  // Clear existing rows
  const rowsContainer = document.getElementById("tableBody");
  rowsContainer.innerHTML = "";

  // ✅ Correct API
  const apiUrl = `${API_BASE}/api/method/leadtech_survey.leadtech_survey.get_all_field_survey_by_name.get_doctype_by_name?name=${encodeURIComponent(name)}`;

  console.log("Calling API:", apiUrl);

  fetch(apiUrl, {
    method: "GET",
    headers: {
      Authorization: "Token 405e0af40f3d04a:885b55cc21d37d2",
      "Content-Type": "application/json",
    },
    credentials: "include",
  })
    .then((response) => {
      console.log("Response Status:", response.status);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("===== FULL API RESPONSE =====");
      console.log(data);
      console.log("===== FORMATTED =====");
      console.log(JSON.stringify(data, null, 2));

      // ✅ FIX: use data.data instead of data.message
      if (!data || !data.data) {
        alert("No survey data found");
        return;
      }

      // ✅ Set survey name
      document.getElementById("name").value = data.data.name;

      console.log("Fields Count:", data.data.fields.length);
      console.log("Fields Data:", data.data.fields);

      // CRITICAL FIX: Filter and sort fields by fieldname number
      const systemFields = [
        "user",
        "name",
        "owner",
        "creation",
        "modified",
        "modified_by",
        "idx",
        "docstatus",
        "parent",
        "parentfield",
        "parenttype",
        "creation_date",
      ];

      const skipFieldTypes = ["Link", "Image"];

      let editableFields = data.data.fields.filter(
        (field) =>
          !systemFields.includes(field.fieldname) &&
          !skipFieldTypes.includes(field.fieldtype),
      );

      // Sort fields by their number (q_1, q_2, etc.)
      editableFields.sort((a, b) => {
        let aNum = 9999,
          bNum = 9999;

        const aMatch = a.fieldname?.match(/q_(\d+)/);
        const bMatch = b.fieldname?.match(/q_(\d+)/);

        if (aMatch) aNum = parseInt(aMatch[1]);
        if (bMatch) bNum = parseInt(bMatch[1]);

        // Handle "other" fields (put them after their parent)
        if (a.fieldname?.startsWith("other_")) {
          const aOtherMatch = a.fieldname?.match(/other_q_(\d+)/);
          if (aOtherMatch) aNum = parseInt(aOtherMatch[1]) + 0.5;
        }
        if (b.fieldname?.startsWith("other_")) {
          const bOtherMatch = b.fieldname?.match(/other_q_(\d+)/);
          if (bOtherMatch) bNum = parseInt(bOtherMatch[1]) + 0.5;
        }

        return aNum - bNum;
      });

      console.log(
        "Sorted fields (by number):",
        editableFields.map((f) => f.fieldname),
      );

      // ✅ Render fields in sorted order
      editableFields.forEach((item, index) => {
        console.log(`--- FIELD ${index + 1} ---`, item);

        if (
          item.fieldtype !== "Link" &&
          item.fieldtype !== "Image" &&
          item.fieldtype !== "Small Text"
        ) {
          addRow2(item);
        }
      });
    })
    .catch((error) => {
      console.error("Error loading survey:", error);

      rowsContainer.innerHTML = `
        <tr>
          <td colspan="100%" style="color:red;text-align:center;padding:20px;">
            Failed to load survey data<br>
            ${error.message}
           </td>
         </tr>
      `;
    });
}

function isBuiltInDisplayEmpty(name, callback) {
  fetch(`${API_BASE}/api/resource/${name}`, {
    method: "GET",
    headers: {
      Authorization: "Token 405e0af40f3d04a:885b55cc21d37d2",
      Cookie:
        "full_name=Guest; sid=Guest; system_user=no; user_id=Guest; user_image=",
    },
    credentials: "include",
  })
    .then((response) => response.json())
    .then((result) => {
      const isEmpty = result.data.length === 0;
      console.log(`Response length for "${name}":`, result.data.length);
      callback(isEmpty); // Send true/false to caller
    })
    .catch((error) => {
      console.error(`Error checking data for "${name}":`, error);
      callback(false); // On error, assume not empty
    });
}

function duplicate(surveyName) {
  if (surveyName) {
    // Store the survey name in localStorage
    localStorage.setItem("surveyName", surveyName);

    // Set a flag for duplication
    localStorage.setItem("duplicateFlag", "true");

    // Redirect to create survey page with the survey name as parameter
    window.location.href = `${API_BASE}/survey/create?Survey=${encodeURIComponent(surveyName)}&flag=D`;
  } else {
    showAlert("Survey Name is required for duplication");
  }
}

let surveyName1 = "";

function openPopup(surveyName) {
  event.preventDefault();
  surveyName1 = surveyName;
  console.log("Hello, this function clicked");
  console.log("Hello, this function clicked", surveyName1);
  userDataShareSurvey(surveyName);
}
function userDataShareSurvey(survey) {
  const url = `${API_BASE}/api/method/leadtech_survey.leadtech_survey.survey_users.get_user?document_name=${survey}`;
  const headers = {
    Authorization: "Token 405e0af40f3d04a:885b55cc21d37d2",
    Cookie:
      "full_name=Guest; sid=Guest; system_user=no; user_id=Guest; user_image=;",
  };

  const nameDisplay = document.querySelector("#popupSurveyName span");
  if (nameDisplay) {
    nameDisplay.textContent = survey;
  }

  // Show the overlay and the popup
  document.getElementById("popup-overlay").style.display = "block";
  const popup = document.getElementById("popup");
  popup.style.display = "block";

  // Fetch the data from the API
  fetch(url, { method: "GET", headers: headers })
    .then((response) => response.json())
    .then((data) => {
      const loadingMessage = document.getElementById("loadingMessage");
      loadingMessage.style.display = "none"; // Hide loading message
      console.log(data);
      if (data && data.message) {
        const users = data.message;
        renderTable(users, survey);

        // Add event listeners to buttons
        document
          .getElementById("showAll")
          .addEventListener("click", () => renderTable(users));
        document
          .getElementById("showAssigned")
          .addEventListener("click", () =>
            renderTable(
              users.filter((user) => user.assignment_status === "Assigned"),
            ),
          );
        document
          .getElementById("showUnassigned")
          .addEventListener("click", () =>
            renderTable(
              users.filter((user) => user.assignment_status !== "Assigned"),
            ),
          );
      } else {
        document.getElementById("userTable").innerHTML =
          '<tr><td colspan="3" class="loading">No data available.</td></tr>';
      }
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
      document.getElementById("loadingMessage").textContent =
        "Failed to load data.";
    });
}

function renderTable(users, survey) {
  let tableBody = "";
  users.forEach((user) => {
    let status_assign = "";
    console.log("Render Survey Name ", survey);
    if (user.assignment_status === "Assigned") {
      status_assign += `
  <div style="display:flex; justify-content: space-between; align-items:center; gap:10px;">
    <p>Assigned</p>
    <p onclick="unassignedShareSurvey('${user.email}')">&#10060;</p>
  </div>`;
    } else {
      status_assign += `<input type="checkbox" name="userSelect" data-email="${user.email}">`;
    }
    tableBody += `
      <tr>
        <td style="padding: 8px; border: 1px solid #ccc;">${user.e_name || "N/A"}</td>
        <td style="padding: 8px; border: 1px solid #ccc;">${user.phone || "N/A"}</td>
        <td style="padding: 8px; border: 1px solid #ccc;">${user.email || "N/A"}</td>
        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">
          ${status_assign}
        </td>
      </tr>
    `;
  });
  document.querySelector("#userTable tbody").innerHTML =
    `<p id="bridge_element" style="display:none;">${survey}</p>${tableBody}`;

  console.log("Survey12:", survey); // <-- Print survey here
  const bridgeValue = document.getElementById("bridge_element")?.textContent;
  console.log("Bridge Element:", bridgeValue);
  // Add event listener to checkboxes
  document.querySelectorAll('input[name="userSelect"]').forEach((checkbox) => {
    checkbox.addEventListener("change", (event) =>
      handleCheckboxChange(event.target),
    );
  });

  // Add event listener to the search input
  const searchInput = document.getElementById("searchInput");
  searchInput.addEventListener("input", () => {
    const filter = searchInput.value.toLowerCase();
    const rows = document.querySelectorAll("#userTable tbody tr");
    rows.forEach((row) => {
      const nameCell = row.cells[0].textContent.toLowerCase();
      const phoneCell = row.cells[1].textContent.toLowerCase();
      const emailCell = row.cells[2].textContent.toLowerCase();
      if (
        nameCell.includes(filter) ||
        phoneCell.includes(filter) ||
        emailCell.includes(filter)
      ) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }
    });
  });

  // Add event listeners for Select All and Deselect All
  const selectAllButton = document.getElementById("selectAllButton");
  const deselectAllButton = document.getElementById("deselectAllButton");

  if (selectAllButton && deselectAllButton) {
    selectAllButton.addEventListener("click", () => {
      document
        .querySelectorAll('input[name="userSelect"]')
        .forEach((checkbox) => {
          if (!checkbox.checked) {
            checkbox.checked = true;
            handleCheckboxChange(checkbox);
          }
        });
    });

    deselectAllButton.addEventListener("click", () => {
      document
        .querySelectorAll('input[name="userSelect"]')
        .forEach((checkbox) => {
          if (checkbox.checked) {
            checkbox.checked = false;
            handleCheckboxChange(checkbox);
          }
        });
    });
  }
}

function handleCheckboxChange(checkbox) {
  const email = checkbox.getAttribute("data-email");

  if (checkbox.checked) {
    // Add email to selectedEmails array
    if (!selectedEmails.includes(email)) {
      selectedEmails.push(email);
      console.log(selectedEmails);
    }
  } else {
    // Remove email from selectedEmails array
    selectedEmails = selectedEmails.filter((item) => item !== email);
  }
}

// Close the popup
function closePopupSomil() {
  document.getElementById("popup").style.display = "none";
  document.getElementById("popup-overlay").style.display = "none";

  // Ensure scrolling is restored
  document.body.style.overflow = "auto";
}

function assignUser() {
  const documentName = surveyName1;

  console.log(documentName);
  console.log("Hello, this function clicked to assign users");
  console.log("CSRF Token:", frappe.csrf_token);

  const postData = {
    user_emails: selectedEmails,
    doctype_name: "DocType", // Replace with actual doctype name
    document_name: documentName, // Replace with actual document name
  };

  const postHeaders = {
    Authorization: "Token 405e0af40f3d04a:885b55cc21d37d2",
    "Content-Type": "application/json",
    "X-Frappe-CSRF-Token": frappe.csrf_token,
    Cookie:
      "full_name=Guest; sid=Guest; system_user=no; user_id=Guest; user_image=;",
  };

  fetch(
    `${API_BASE}/api/method/leadtech_survey.leadtech_survey.share_survey.share`,
    {
      method: "POST",
      headers: postHeaders,
      body: JSON.stringify(postData),
    },
  )
    .then((response) => response.json()) // Parse the JSON response
    .then((data) => {
      console.log(data);
      if (data.message) {
        showAlert("Survey Assigned Successfully!");
        selectedEmails.length = 0;
        userDataShareSurvey(documentName);
      } else {
        alert("Please select a survey and try again!");
      }
    })
    .catch((error) => {
      console.error("Error posting data:", error);
      showAlert("Have some Issue!");
    });
}

function unassignedShareSurvey(email) {
  console.log("Unassigning survey document name:", surveyName1);
  const documentName = surveyName1;

  console.log("Unassigning survey for user:", email);

  // FIX: check surveyName1 instead of undefined 'survey'
  if (!surveyName1) {
    console.error("ERROR: surveyName1 is undefined!");
    return;
  }

  if (confirm("Are you sure you want to unassign?")) {
    const postData = {
      user: email,
      document_name: documentName,
    };

    const postHeaders = {
      Authorization: "Token 405e0af40f3d04a:885b55cc21d37d2",
      "Content-Type": "application/json",
      "X-Frappe-CSRF-Token": frappe.csrf_token,
      Cookie:
        "full_name=Guest; sid=Guest; system_user=no; user_id=Guest; user_image=;",
    };

    fetch(
      `${API_BASE}/api/method/leadtech_survey.leadtech_survey.Unassign_survey.delete`,
      {
        method: "POST",
        headers: postHeaders,
        body: JSON.stringify(postData),
      },
    )
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        if (data.message) {
          showAlert("Survey Unassigned Successfully!");
          userDataShareSurvey(documentName);
        } else {
          alert("Error unassigning survey!");
        }
      })
      .catch((error) => {
        console.error("Error posting data:", error);
        showAlert("Have some Issue!");
      });
  }
}

function backToSurveyList() {
  document.getElementById("editForm").style.display = "none";
  document.getElementById("surveyList").style.display = "block";
}

function addRow2(data) {
  console.log(data);
  const tableBodysolid = document.querySelector("#tableBody");
  const newRow = document.createElement("tr");
  newRow.classList.add("draggable");
  newRow.draggable = true;

  newRow.innerHTML = `
        <td>
            <select name="inputType" onchange="updateFormat2(this)">
                <option value="select">Select Question Type</option>
                <option value="drop_down">Drop Down</option>
                        <option value="drop_down_dependent">Drop Down Dependent</option>
                        <option value="group">Group</option>
                        <option value="drop_down_other">Drop Down With other</option>
                        <option value="text_block">Text Block</option>
                        <option value="singleline_text_input">Singleline Text Input</option>
                        <option value="multiline_text_input">Multiline Text Input</option>
                        <option value="number_input">Number Input</option>
                        <option value="decimal_input">Decimal Input</option>
                        <option value="map_coordinates">Map Coordinates (GPS)</option>
                        <option value="email">Email</option>
                        <option value="phone_number">Phone Number</option>
                        <option value="radio_button">Radio Button Options</option>
                        <option value="radio_button_other">Radio Button Options with Other</option>
                        <option value="checkbox_list">Checkbox List</option>
                        <option value="checkbox">Checkbox</option>
                        <option value="date">Date</option>
                        <option value="time">Time</option>
                        <option value="date_time">Date & Time</option>
                        <option value="photo_capture">Photo Capture</option>
                        <option value="record_audio">Audio Record</option>
                        <option value="contact">Contact Details</option>
                        <option value="address">Address Details</option>
                        <option value="drop_down_grid">Drop Down Grid</option>
                        <option value="checkbox_grid">Check Box Grid</option>
                        <option value="data_grid">Data Grid</option>
            </select>
        </td>
        <td class="formatCell">
        </td>
        <td>
             <input name="mandatory" type="checkbox" />
        </td>
        <td>
            <button type="button" onclick="removeRow(this)">Remove</button>
        </td>
    `;

  tableBodysolid.appendChild(newRow);

  let variable = "dummy";
  console.log(variable);
  console.log(data.fieldtype);

  switch (data.fieldtype) {
    case "Select":
      let array_condition = data.options.split("\n");
      let condition = array_condition[0];
      let other_condition = array_condition[array_condition.length - 1];

      if (condition === "Select Type" && other_condition != "Others") {
        variable = "drop_down";
        console.log("somil dropdow");
      } else if (condition === "Select Type" && other_condition === "Others") {
        variable = "drop_down_dependent";
        console.log("drop_down_dependent");
      } else if (condition === "Select Type" && other_condition === "Others") {
        variable = "drop_down_other";
        console.log("dropdow");
      } else if (condition === "Radio Type" && other_condition != "Others") {
        variable = "radio_button";
        console.log("radio button");
      } else if (condition === "Radio Type" && other_condition === "Others") {
        variable = "radio_button_other";
        console.log("radio button with other");
      } else if (condition === "Check Type") {
        variable = "checkbox_list";
        console.log("check type");
      }
      break;
    case "Heading":
      variable = "text_block";

      break;
    case "Data":
      if (data.options) {
        let array_condition3 = data.options.split("\n");
        let condition3 = array_condition3[0];
        if (condition3 === "Phone") {
          variable = "phone_number";
          console.log("phone_number");
        } else {
          variable = "singleline_text_input";
        }
      } else {
        variable = "singleline_text_input";
      }
      break;
    case "Float":
      variable = "decimal_input";

      break;
    case "Int":
      variable = "number_input";

      break;
    case "Section Break":
      variable = "group";

      break;
    case "Date":
      variable = "date";

      break;
    case "Time":
      variable = "date_time";

      break;
    case "Barcode":
      variable = "barcode_scanner";

      break;
    case "Geolocation":
      variable = "map_coordinates";

      break;
    case "Attach":
      if (data.options) {
        let array_condition2 = data.options.split("\n");
        let condition2 = array_condition2[0];
        if (condition2 === "Audio") {
          variable = "record_audio";
          console.log("record_audio");
        } else {
          variable = "photo_capture";
        }
      } else {
        variable = "photo_capture";
      }

      break;
    case "Signature":
      variable = "signature";

      break;
    case "Check":
      variable = "checkbox";

      break;
  }

  console.log(variable);

  const selectElement = newRow.querySelector('select[name="inputType"]');
  selectElement.value = variable;
  updateFormat2(selectElement);

  const formatCell = newRow.querySelector(".formatCell");
  const questionInput = formatCell.querySelector('input[name="questionName"]');
  if (questionInput) {
    questionInput.value = data.label || "";
  }

  const mandatory_check_mark = newRow.querySelector('input[name="mandatory"]');
  if (mandatory_check_mark) {
    mandatory_check_mark.checked = data.reqd === 1;
  }
  const unique_check_mark = newRow.querySelector('input[name="unique_value"]');
  if (unique_check_mark) {
    unique_check_mark.checked = data.unique === 1;
  }
  const optionsTextarea = formatCell.querySelector('textarea[name="options"]');

  if (optionsTextarea && data.options) {
    const optionsArray = data.options.split("\n");

    while (
      optionsArray.length > 0 &&
      (optionsArray[0].toLowerCase().includes("select type") ||
        optionsArray[0].toLowerCase().includes("radio type") ||
        optionsArray[0].toLowerCase().includes("check type"))
    ) {
      optionsArray.shift();
    }
    while (
      optionsArray.length > 0 &&
      optionsArray[optionsArray.length - 1].toLowerCase().includes("others")
    ) {
      optionsArray.pop();
    }

    optionsTextarea.value = optionsArray.join("\n");
  }
}

function getQuestionOptions(currentIndex) {
  console.log("currentIndex:", currentIndex);
  console.log("FORM_STATE.questions:", FORM_STATE.questions);
  console.log("length:", FORM_STATE.questions?.length);

  return FORM_STATE.questions
    .map((q, i) => {
      if (i >= currentIndex) return "";
      return `<option value="q_${i + 1}">
        ${q.questionName || `Question ${i + 1}`}
      </option>`;
    })
    .join("");
}

function updateFormat2(selectElement) {
  const row = selectElement.closest("tr");
  const formatCell = row.querySelector(".formatCell");
  const selectedType = selectElement.value;
  const currentIndex = Array.from(row.parentNode.children).indexOf(row);

  // Clear previous content
  formatCell.innerHTML = "";

  // Add question label input
  formatCell.innerHTML +=
    '<input type="text" name="questionName" placeholder="Question Label (max 142 chars will auto-truncate)">';

  // Add additional elements based on the selected type
  switch (selectedType) {
    case "select":
      formatCell.innerHTML +=
        '<p style="color:#999;margin-top:5px;">Please select a question type</p>';
      break;

    case "drop_down":
    case "radio_button":
    case "checkbox_list":
      formatCell.innerHTML +=
        '<br><textarea name="options" placeholder="Enter options (one per line)" style="width:100%;" rows="4"></textarea>' +
        '<p style="font-size:11px;color:#666;margin:2px 0;">One option per line. Example:<br>Option 1<br>Option 2</p>';
      break;

    case "drop_down_other":
    case "radio_button_other":
      formatCell.innerHTML +=
        '<br><textarea name="options" placeholder="Enter options (one per line)" style="width:100%;" rows="4"></textarea>' +
        '<p style="font-size:11px;color:#666;margin:2px 0;">"Others" will be added automatically at the end</p>' +
        '<p style="font-size:11px;color:#b03a2e;">✓ "Other" field will be created automatically</p>';
      break;

    case "drop_down_dependent":
      formatCell.innerHTML +=
        '<br><textarea name="options" placeholder="Enter dependent options (one per line)" style="width:100%;" rows="4"></textarea>' +
        '<div style="margin-top:12px;background:#f5f5f5;padding:8px;border-radius:4px;">' +
        '<label style="font-size:13px;display:block;margin-bottom:4px;font-weight:bold;">🔗 Depends on Question</label>' +
        '<select name="depends_on_field" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;">' +
        '<option value="">-- Select Parent Question --</option>';

      // Add options from previous questions
      const allRows = document.querySelectorAll("#tableBody tr");
      for (let i = 0; i < currentIndex; i++) {
        const prevRow = allRows[i];
        const prevSelect = prevRow.querySelector('select[name="inputType"]');
        const prevQuestion = prevRow.querySelector(
          'input[name="questionName"]',
        );

        if (prevSelect && prevQuestion && prevQuestion.value.trim()) {
          const prevValue = prevSelect.value;
          // Only allow dropdowns or radio buttons as parent
          if (
            prevValue === "drop_down" ||
            prevValue === "drop_down_other" ||
            prevValue === "radio_button" ||
            prevValue === "radio_button_other"
          ) {
            formatCell.innerHTML += `<option value="q_${i + 1}">${prevQuestion.value} (${prevValue})</option>`;
          }
        }
      }

      formatCell.innerHTML +=
        "</select>" +
        "</div>" +
        '<div style="margin-top:10px;background:#f5f5f5;padding:8px;border-radius:4px;">' +
        '<label style="font-size:13px;display:block;margin-bottom:4px;font-weight:bold;">🎯 Show when answer equals</label>' +
        '<input type="text" name="depends_on_value" placeholder="e.g. Yes, Uttar Pradesh, Option 1" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;" />' +
        '<p style="font-size:11px;color:#666;margin:4px 0 0 0;">Enter exact value from parent dropdown</p>' +
        "</div>";
      break;

    case "phone_number":
      formatCell.innerHTML +=
        '<br><div style="display:flex;align-items:center;margin-top:5px;">' +
        '<input type="checkbox" name="unique_value" id="unique_' +
        Date.now() +
        '" style="margin-right:5px;">' +
        '<label for="unique_' +
        Date.now() +
        '">Is Unique? (no duplicates allowed)</label>' +
        "</div>";
      break;

    case "singleline_text_input":
    case "multiline_text_input":
    case "email":
    case "number_input":
    case "decimal_input":
      // No extra options needed
      break;

    case "date":
    case "time":
    case "date_time":
      formatCell.innerHTML +=
        '<br><p style="font-size:12px;color:#666;margin:5px 0;">📅 Date picker will be shown</p>';
      break;

    case "group":
    case "text_block":
      formatCell.innerHTML +=
        '<br><p style="font-size:12px;color:#666;margin:5px 0;">This is a section/heading only</p>';
      break;

    case "map_coordinates":
      formatCell.innerHTML +=
        '<br><p style="font-size:12px;color:#666;margin:5px 0;">📍 GPS location picker</p>';
      break;

    case "photo_capture":
      formatCell.innerHTML +=
        '<br><p style="font-size:12px;color:#666;margin:5px 0;">📸 Camera capture</p>';
      break;

    case "contact":
    case "address":
      formatCell.innerHTML +=
        '<br><p style="font-size:12px;color:#666;margin:5px 0;">Multiple fields will be created automatically</p>';
      break;

    case "drop_down_grid":
    case "checkbox_grid":
    case "data_grid":
      formatCell.innerHTML +=
        '<br><textarea name="rowoptions" placeholder="Row Options (one per line)" style="width:100%;margin-bottom:5px;" rows="3"></textarea>' +
        '<textarea name="coloptions" placeholder="Column Options (one per line)" style="width:100%;margin-bottom:5px;" rows="3"></textarea>';

      if (selectedType === "drop_down_grid") {
        formatCell.innerHTML +=
          '<textarea name="options" placeholder="Dropdown Options (one per line)" style="width:100%;" rows="3"></textarea>';
      }

      formatCell.innerHTML +=
        '<p style="font-size:11px;color:#666;margin:2px 0;">Each cell will be created as a separate field</p>';
      break;
  }

  // Preserve existing values if any
  const oldQuestion = row.querySelector('input[name="questionName"]');
  if (oldQuestion && oldQuestion.value) {
    const newQuestion = formatCell.querySelector('input[name="questionName"]');
    if (newQuestion) newQuestion.value = oldQuestion.value;
  }
}

function updateFormat(selectElement) {
  const row = selectElement.closest("tr");
  const index = row.rowIndex - 1;

  const formatCell = row.querySelector(".formatCell");
  const selectedType = selectElement.value;

  formatCell.innerHTML =
    '<input type="text" name="questionName" placeholder="Question">';

  switch (selectedType) {
    case "select":
      formatCell.innerHTML = "<p>Please Select a question type</p>";
      break;

    case "drop_down":
    case "drop_down_other":
    case "radio_button":
    case "checkbox_list":
    case "radio_button_other":
      formatCell.innerHTML +=
        '<br><textarea name="options" placeholder="Options" style="width:100%;"></textarea>';
      break;

    case "contact":
      formatCell.innerHTML = "<br><p>Contact Details Fields</p>";
      break;

    case "address":
      formatCell.innerHTML = "<br><p>Address Details Fields</p>";
      break;

    case "drop_down_grid":
      formatCell.innerHTML =
        '<br><textarea name="rowoptions" placeholder="Row Options" style="width:100%;"></textarea>' +
        '<br><textarea name="coloptions" placeholder="Column Options" style="width:100%;"></textarea>' +
        '<br><textarea name="options" placeholder="Options" style="width:100%;"></textarea>';
      break;

    case "data_grid":
    case "checkbox_grid":
      formatCell.innerHTML =
        '<br><textarea name="rowoptions" placeholder="Row Options" style="width:100%;"></textarea>' +
        '<br><textarea name="coloptions" placeholder="Column Options" style="width:100%;"></textarea>';
      break;

    case "map_coordinates":
      formatCell.innerHTML =
        '<input type="text" name="questionName" value="Location" readonly>';
      break;

    case "phone_number":
      formatCell.innerHTML +=
        '<br><input name="unique_value" type="checkbox" />';
      break;

    case "drop_down_dependent":
      formatCell.innerHTML += `
        <br>
        <textarea name="options" placeholder="Options" style="width:100%;"></textarea>

        <div style="margin-top:8px">
          <label style="font-size:12px">Depends on Question</label>
          <select name="depends_on_field" style="width:100%;">
            <option value="">-- Select Question --</option>
            ${getQuestionOptions(index)}
          </select>
        </div>

        <div style="margin-top:6px">
          <label style="font-size:12px">Show when answer equals</label>
          <input type="text"
            name="depends_on_value"
            placeholder="e.g. Uttar Pradesh"
            style="width:100%;" />
        </div>
      `;
      break;
  }
}

function removeRow(button) {
  const row = button.closest("tr");
  row.remove();
}

function newForm() {
  localStorage.removeItem("formData");
  window.location.reload();
}

// Function to load form data from local storage
function loadFormData() {
  // Check if we're on a page that actually has the form builder elements
  const nameInput = document.getElementById("name");
  const tableBody = document.getElementById("tableBody");

  // If these elements don't exist, we're on the wrong page - exit safely
  if (!nameInput || !tableBody) {
    console.log(
      "loadFormData: Form builder elements not found on this page - skipping",
    );
    return;
  }

  const savedData = localStorage.getItem("formData");
  if (savedData) {
    const formData = JSON.parse(savedData);
    nameInput.value = formData.name || "";

    // Load questions data into the form
    formData.questions.forEach((questionData, index) => {
      if (index > 0) addRow(); // Add rows as needed
      const rows = document.querySelectorAll("#tableBody tr");
      if (index >= rows.length) return; // Safety check

      const row = rows[index];

      // Safely set input type
      const inputTypeSelect = row.querySelector('select[name="inputType"]');
      if (inputTypeSelect) {
        inputTypeSelect.value = questionData.inputType;
        updateFormat(inputTypeSelect);
      }

      // Safely set question name
      const questionNameInput = row.querySelector('input[name="questionName"]');
      if (questionNameInput && questionData.questionName) {
        questionNameInput.value = questionData.questionName;
      }

      // Safely set options
      if (questionData.options) {
        const textarea = row.querySelector('textarea[name="options"]');
        if (textarea) textarea.value = questionData.options;
      }

      // Safely set row options
      if (questionData.rowoptions) {
        const textarea = row.querySelector('textarea[name="rowoptions"]');
        if (textarea) textarea.value = questionData.rowoptions;
      }

      // Safely set column options
      if (questionData.coloptions) {
        const textarea = row.querySelector('textarea[name="coloptions"]');
        if (textarea) textarea.value = questionData.coloptions;
      }
    });
  }
}

function saveForm() {
  const formName = document.getElementById("name").value.trim();

  if (!formName) {
    alert("Please enter a survey name");
    return;
  }

  const tableData = [];
  const rows = document.querySelectorAll("#tableBody tr");

  // Check if there are any questions
  if (rows.length === 0) {
    alert("Please add at least one question");
    return;
  }

  rows.forEach((row, index) => {
    const inputType = row.querySelector('select[name="inputType"]')?.value;
    const questionName =
      row.querySelector('input[name="questionName"]')?.value || "";
    const optionsText =
      row.querySelector('textarea[name="options"]')?.value || "";
    const rowoptionsText =
      row.querySelector('textarea[name="rowoptions"]')?.value || "";
    const coloptionsText =
      row.querySelector('textarea[name="coloptions"]')?.value || "";
    const mandatory =
      row.querySelector('input[name="mandatory"]')?.checked || false;
    const unique =
      row.querySelector('input[name="unique_value"]')?.checked || false;
    const dependsOnField =
      row.querySelector('select[name="depends_on_field"]')?.value || "";
    const dependsOnValue =
      row.querySelector('input[name="depends_on_value"]')?.value || "";

    // Validate question type is selected
    if (inputType === "select") {
      alert(`Please select a question type for row ${index + 1}`);
      throw new Error("Question type not selected");
    }

    // Validate question name for non-heading/group types
    if (!questionName && !["group", "text_block"].includes(inputType)) {
      alert(`Please enter a question label for row ${index + 1}`);
      throw new Error("Question label missing");
    }

    tableData.push({
      inputType,
      questionName,
      options: optionsText,
      rowoptions: rowoptionsText,
      coloptions: coloptionsText,
      mandatory,
      unique,
      depends_on_field: dependsOnField,
      depends_on_value: dependsOnValue,
    });
  });

  const formData = {
    name: formName,
    questions: tableData,
  };

  localStorage.setItem("formData", JSON.stringify(formData));
  showAlert("Form saved successfully!");

  // Optionally open publish popup
  document.getElementById("overlay").style.display = "block";
  document.getElementById("popup").style.display = "block";
}

// Function to close the popup
function closePopup() {
  document.getElementById("popup").style.display = "none";
  document.getElementById("overlay").style.display = "none";
}

function publishForm() {
  console.log("this publish function triggered");
  const dataString = localStorage.getItem("formData");
  if (dataString) {
    const data = JSON.parse(dataString);
    console.log("Updated Data:", data);

    if (data && Array.isArray(data.questions)) {
      const surveyName = document.getElementById("name").value;
      fetch(
        `${API_BASE}/api/method/leadtech_survey.leadtech_survey.get_all_field_survey_by_name.get_doctype_by_name?name=${encodeURIComponent(surveyName)}`,
        {
          method: "GET",
          headers: {
            Authorization: "Token 405e0af40f3d04a:885b55cc21d37d2",
            "Content-Type": "application/json",
          },
        },
      )
        .then((response) => response.json())
        .then((existingData) => {
          let existingFields = [];
          if (existingData && existingData.data && existingData.data.fields) {
            existingFields = existingData.data.fields.filter(
              (field) =>
                ![
                  "user",
                  "name",
                  "owner",
                  "creation",
                  "modified",
                  "modified_by",
                  "idx",
                  "docstatus",
                  "parent",
                  "parentfield",
                  "parenttype",
                ].includes(field.fieldname),
            );
          }
          const existingFieldsMap = {};
          existingFields.forEach((field) => {
            existingFieldsMap[field.fieldname] = field;
          });

          console.log("Existing fields:", existingFields);

          const updatedFields = [];
          let fieldCounter = 1;
          const allFieldnames = new Set();
          existingFields.forEach((field) => {
            allFieldnames.add(field.fieldname);
            const match = field.fieldname.match(/^q_(\d+)$/);
            if (match) {
              const num = parseInt(match[1]);
              if (num >= fieldCounter) fieldCounter = num + 1;
            }
          });
          data.questions.forEach((questionData, index) => {
            let fieldType;
            let options;
            let reqd;
            let unique_check;
            let fieldname;
            let description = "";

            const selectTypeLabel = "Select Type";
            const radioTypeLabel = "Radio Type";
            const checkTypeLabel = "Check Type";
            const separator = "\n";
            if (
              questionData.fieldname &&
              existingFieldsMap[questionData.fieldname]
            ) {
              fieldname = questionData.fieldname;
            } else {
              if (
                questionData.questionName &&
                questionData.questionName.length > 0
              ) {
                fieldname = questionData.questionName
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "_")
                  .replace(/^_+|_+$/g, "")
                  .substring(0, 140);
                if (allFieldnames.has(fieldname)) {
                  fieldname = `q_${fieldCounter++}`;
                } else {
                  allFieldnames.add(fieldname);
                }
              } else {
                fieldname = `q_${fieldCounter++}`;
                allFieldnames.add(fieldname);
              }
            }
            if (
              questionData.questionName &&
              questionData.questionName.length > 142
            ) {
              description = questionData.questionName;
              questionData.questionName =
                questionData.questionName.substring(0, 139) + "...";
            }

            if (questionData.inputType === "contact") {
              updatedFields.push(
                {
                  fieldname: "contact_details",
                  fieldtype: "Heading",
                  label: "Contact Details",
                  options: "",
                  description: description || "",
                },
                {
                  fieldname: "first_name",
                  fieldtype: "Data",
                  label: "First Name",
                  options: "",
                  reqd: questionData.mandatory == true ? 1 : 0,
                  length: 350,
                  description: description || "",
                },
                {
                  fieldname: "last_name",
                  fieldtype: "Data",
                  label: "Last Name",
                  options: "",
                  reqd: questionData.mandatory == true ? 1 : 0,
                  length: 350,
                  description: description || "",
                },
                {
                  fieldname: "contact_phone_number",
                  fieldtype: "Data",
                  label: "Phone Number",
                  options: "Phone",
                  reqd: questionData.mandatory == true ? 1 : 0,
                  length: 15,
                  description: description || "",
                },
                {
                  fieldname: "contact_email",
                  fieldtype: "Data",
                  label: "Email Address",
                  options: "Email",
                  reqd: questionData.mandatory == true ? 1 : 0,
                  length: 350,
                  description: description || "",
                },
                {
                  fieldname: "message",
                  fieldtype: "Data",
                  label: "Message",
                  options: "",
                  reqd: questionData.mandatory == true ? 1 : 0,
                  length: 350,
                  description: description || "",
                },
              );
            } else if (questionData.inputType === "address") {
              updatedFields.push(
                {
                  fieldname: "address_details",
                  fieldtype: "Heading",
                  label: "Address Details",
                  options: "",
                  description: description || "",
                },
                {
                  fieldname: "address",
                  fieldtype: "Data",
                  label: "Address",
                  options: "",
                  reqd: questionData.mandatory == true ? 1 : 0,
                  length: 350,
                  description: description || "",
                },
                {
                  fieldname: "city",
                  fieldtype: "Data",
                  label: "City/Town",
                  options: "",
                  reqd: questionData.mandatory == true ? 1 : 0,
                  length: 350,
                  description: description || "",
                },
                {
                  fieldname: "state",
                  fieldtype: "Data",
                  label: "State/Province",
                  options: "",
                  reqd: questionData.mandatory == true ? 1 : 0,
                  length: 350,
                  description: description || "",
                },
                {
                  fieldname: "postal_code",
                  fieldtype: "Data",
                  label: "ZIP/Postal Code",
                  options: "",
                  reqd: questionData.mandatory == true ? 1 : 0,
                  length: 350,
                  description: description || "",
                },
                {
                  fieldname: "country",
                  fieldtype: "Data",
                  label: "Country",
                  options: "",
                  reqd: questionData.mandatory == true ? 1 : 0,
                  length: 350,
                  description: description || "",
                },
              );
            } else if (
              questionData.inputType === "drop_down_other" ||
              questionData.inputType === "radio_button_other"
            ) {
              let optionsArray = questionData.options
                ? questionData.options.split("\n").filter((opt) => opt.trim())
                : [];

              let typeLabel =
                questionData.inputType === "drop_down_other"
                  ? selectTypeLabel
                  : radioTypeLabel;

              let mainFieldname = fieldname;
              let otherFieldname = `other_${mainFieldname}`;
              let otherFieldExists = existingFieldsMap[otherFieldname];
              updatedFields.push({
                fieldname: mainFieldname,
                fieldtype: "Select",
                label: questionData.questionName,
                options:
                  typeLabel +
                  separator +
                  optionsArray.join("\n") +
                  separator +
                  "Others",
                reqd: questionData.mandatory == true ? 1 : 0,
                description: description || "",
              });

              // Add or update the OTHER field with dependency
              updatedFields.push({
                fieldname: otherFieldname,
                fieldtype: "Small Text",
                label:
                  questionData.questionName + " (Please specify if Others)",
                options: "",
                depends_on: `eval:doc.${mainFieldname}=='Others'`,
                description:
                  "This field appears only when 'Others' is selected above",
                reqd: 0,
              });

              console.log(
                `Dropdown "${mainFieldname}" with dependent other field "${otherFieldname}"`,
              );
            } else if (questionData.inputType === "drop_down_dependent") {
              // Parse options
              let optionsArray = questionData.options
                ? questionData.options.split("\n").filter((opt) => opt.trim())
                : [];

              updatedFields.push({
                fieldname: fieldname,
                fieldtype: "Select",
                label: questionData.questionName,
                options: selectTypeLabel + separator + optionsArray.join("\n"),
                reqd: questionData.mandatory == true ? 1 : 0,
                depends_on: `eval:doc.${questionData.depends_on_field}=='${questionData.depends_on_value}'`,
                description: description || "",
              });
            } else if (questionData.inputType === "drop_down_grid") {
              updatedFields.push({
                fieldname: "drop_down_grid_heading_" + index,
                fieldtype: "Heading",
                label: questionData.questionName || "Drop Down Grid",
                options: "",
                description: description || "",
              });

              const rowoptions = questionData.rowoptions
                ? questionData.rowoptions.split("\n").filter((r) => r.trim())
                : [];
              const coloptions = questionData.coloptions
                ? questionData.coloptions.split("\n").filter((c) => c.trim())
                : [];

              rowoptions.forEach((rowOption, rowIdx) => {
                coloptions.forEach((colOption, colIdx) => {
                  updatedFields.push({
                    fieldname: `${fieldname}_${rowIdx}_${colIdx}`,
                    fieldtype: "Select",
                    label: `${rowOption} - ${colOption}`,
                    options:
                      selectTypeLabel +
                      separator +
                      (questionData.options || ""),
                    reqd: questionData.mandatory == true ? 1 : 0,
                    description: description || "",
                  });
                });
              });
            } else if (questionData.inputType === "phone_number") {
              updatedFields.push({
                fieldname: fieldname,
                fieldtype: "Data",
                label: questionData.questionName,
                options: "Phone",
                reqd: questionData.mandatory == true ? 1 : 0,
                unique: questionData.unique == true ? 1 : 0,
                length: 15,
                description: description || "",
              });
            } else if (questionData.inputType === "checkbox_list") {
              updatedFields.push({
                fieldname: "check_options_heading_" + index,
                fieldtype: "Heading",
                label: questionData.questionName,
                options: "",
                description: description || "",
              });

              const checkoptions = questionData.options
                ? questionData.options.split("\n").filter((opt) => opt.trim())
                : [];
              checkoptions.forEach((label, optIdx) => {
                updatedFields.push({
                  fieldname: `${fieldname}_${optIdx}`,
                  fieldtype: "Check",
                  label: label,
                  options: "",
                  description: description || "",
                });
              });
            } else if (questionData.inputType === "checkbox_grid") {
              updatedFields.push({
                fieldname: "checkbox_grid_heading_" + index,
                fieldtype: "Heading",
                label: questionData.questionName || "Checkbox Grid",
                options: "",
                description: description || "",
              });

              const rowoptions = questionData.rowoptions
                ? questionData.rowoptions.split("\n").filter((r) => r.trim())
                : [];
              const coloptions = questionData.coloptions
                ? questionData.coloptions.split("\n").filter((c) => c.trim())
                : [];

              rowoptions.forEach((rowOption, rowIdx) => {
                coloptions.forEach((colOption, colIdx) => {
                  updatedFields.push({
                    fieldname: `${fieldname}_${rowIdx}_${colIdx}`,
                    fieldtype: "Check",
                    label: `${rowOption} - ${colOption}`,
                    options: "",
                    description: description || "",
                  });
                });
              });
            } else if (questionData.inputType === "data_grid") {
              updatedFields.push({
                fieldname: "data_grid_heading_" + index,
                fieldtype: "Heading",
                label: questionData.questionName || "Data Grid",
                options: "",
                description: description || "",
              });

              const rowoptions = questionData.rowoptions
                ? questionData.rowoptions.split("\n").filter((r) => r.trim())
                : [];
              const coloptions = questionData.coloptions
                ? questionData.coloptions.split("\n").filter((c) => c.trim())
                : [];

              rowoptions.forEach((rowOption, rowIdx) => {
                coloptions.forEach((colOption, colIdx) => {
                  updatedFields.push({
                    fieldname: `${fieldname}_${rowIdx}_${colIdx}`,
                    fieldtype: "Data",
                    label: `${rowOption} - ${colOption}`,
                    options: "",
                    reqd: questionData.mandatory == true ? 1 : 0,
                    length: 350,
                    description: description || "",
                  });
                });
              });
            } else if (questionData.inputType === "select") {
              alert("Please select a question type for row " + (index + 1));
              return;
            } else {
              switch (questionData.inputType) {
                case "drop_down":
                  fieldType = "Select";
                  options =
                    selectTypeLabel + separator + (questionData.options || "");
                  reqd = questionData.mandatory == true ? 1 : 0;
                  break;
                case "radio_button":
                  fieldType = "Select";
                  options =
                    radioTypeLabel + separator + (questionData.options || "");
                  reqd = questionData.mandatory == true ? 1 : 0;
                  break;
                case "text_block":
                  fieldType = "Heading";
                  options = "";
                  reqd = 0;
                  break;
                case "singleline_text_input":
                case "multiline_text_input":
                  fieldType =
                    questionData.inputType === "multiline_text_input"
                      ? "Text"
                      : "Data";
                  options = "";
                  reqd = questionData.mandatory == true ? 1 : 0;
                  break;
                case "decimal_input":
                  fieldType = "Float";
                  options = "";
                  reqd = questionData.mandatory == true ? 1 : 0;
                  break;
                case "number_input":
                  fieldType = "Int";
                  options = "";
                  reqd = questionData.mandatory == true ? 1 : 0;
                  break;
                case "email":
                  fieldType = "Data";
                  options = "Email";
                  reqd = questionData.mandatory == true ? 1 : 0;
                  break;
                case "group":
                  fieldType = "Section Break";
                  options = "";
                  reqd = 0;
                  break;
                case "date":
                  fieldType = "Date";
                  options = "";
                  reqd = questionData.mandatory == true ? 1 : 0;
                  break;
                case "time":
                  fieldType = "Time";
                  options = "";
                  reqd = questionData.mandatory == true ? 1 : 0;
                  break;
                case "date_time":
                  fieldType = "Datetime";
                  options = "";
                  reqd = questionData.mandatory == true ? 1 : 0;
                  break;
                case "map_coordinates":
                  fieldType = "Geolocation";
                  options = "";
                  reqd = questionData.mandatory == true ? 1 : 0;
                  break;
                case "photo_capture":
                case "record_video":
                case "record_audio":
                  fieldType = "Attach";
                  options =
                    questionData.inputType === "record_audio" ? "Audio" : "";
                  reqd = questionData.mandatory == true ? 1 : 0;
                  break;
                case "signature":
                  fieldType = "Signature";
                  options = "";
                  reqd = questionData.mandatory == true ? 1 : 0;
                  break;
                case "checkbox":
                  fieldType = "Check";
                  options = "";
                  reqd = questionData.mandatory == true ? 1 : 0;
                  break;
                default:
                  fieldType = "Data";
                  options = "";
                  reqd = questionData.mandatory == true ? 1 : 0;
              }

              let fieldObj = {
                fieldname: fieldname,
                fieldtype: fieldType,
                label: questionData.questionName,
                options: options,
                reqd: reqd,
                description: description || "",
              };

              if (
                fieldType === "Data" ||
                fieldType === "Text" ||
                fieldType === "Small Text"
              ) {
                fieldObj.length = 350;
              }

              if (
                questionData.unique &&
                (questionData.inputType === "phone_number" ||
                  questionData.unique === true)
              ) {
                fieldObj.unique = 1;
              }

              updatedFields.push(fieldObj);
            }
          });

          console.log("Updated Fields:", updatedFields);

          const defaultFields = [
            {
              fieldname: "user",
              fieldtype: "Link",
              label: "User",
              options: "User",
            },
            {
              fieldname: "creation_date",
              fieldtype: "Datetime",
              label: "Creation Date",
              options: "",
              default: "Now",
            },
          ];

          const allFields = [...defaultFields, ...updatedFields];

          let payload = {
            fields: allFields,
          };

          return fetch(
            `${API_BASE}/api/resource/DocType/${encodeURIComponent(surveyName)}`,
            {
              method: "PUT",
              headers: {
                Authorization: "Token 405e0af40f3d04a:885b55cc21d37d2",
                "Content-Type": "application/json",
                "X-Frappe-CSRF-Token":
                  frappe.csrf_token ||
                  document
                    .querySelector('meta[name="csrf-token"]')
                    ?.getAttribute("content") ||
                  "",
              },
              body: JSON.stringify(payload),
            },
          );
        })
        .then(async (response) => {
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }
          return response.json();
        })
        .then((data) => {
          console.log("Form published successfully!", data);
          showAlert("Form Updated Successfully!");

          setTimeout(() => {
            fetch(
              `${API_BASE}/api/method/leadtech_survey.leadtech_survey.doctype_sync.sync_doctype_schema`,
              {
                method: "POST",
                headers: {
                  Authorization: "Token 405e0af40f3d04a:885b55cc21d37d2",
                  "Content-Type": "application/json",
                  "X-Frappe-CSRF-Token": frappe.csrf_token || "",
                },
                body: JSON.stringify({ doctype_name: surveyName }),
              },
            ).catch((err) => console.log("Schema sync triggered:", err));
          }, 1000);

          closePopup();
        })
        .catch((error) => {
          console.error("Error publishing form:", error);

          if (error.message.includes("413") || error.message.includes("blob")) {
            alert(
              "Survey is too large. Please reduce the number of questions or split into multiple surveys.",
            );
          } else {
            alert("Error publishing form: " + error.message);
          }
        });
    } else {
      console.error("Data.questions is not an array");
      alert("Invalid form data. Please save again.");
    }
  } else {
    alert("No data to publish. Please save the form first.");
  }
}

window.onload = () => {
  loadFormData();
};

function addRow() {
  const tableBody = document.querySelector("#tableBody");
  const newRow = document.createElement("tr");
  newRow.classList.add("draggable");
  newRow.draggable = true;

  newRow.innerHTML = `
                <td>
                    <select name="inputType" onchange="updateFormat(this)">
                        <option value="select">Select Question Type</option>
                        <option value="drop_down">Drop Down</option>
                        <option value="drop_down_dependent">Drop Down Dependent</option>
                        <option value="group">Group</option>
                        <option value="drop_down_other">Drop Down With other</option>
                        <option value="text_block">Text Block</option>
                        <option value="singleline_text_input">Singleline Text Input</option>
                        <option value="multiline_text_input">Multiline Text Input</option>
                        <option value="number_input">Number Input</option>
                        <option value="decimal_input">Decimal Input</option>
                        <option value="map_coordinates">Map Coordinates (GPS)</option>
                        <option value="email">Email</option>
                        <option value="phone_number">Phone Number</option>
                        <option value="radio_button">Radio Button Options</option>
                        <option value="radio_button_other">Radio Button Options with Other</option>
                        <option value="checkbox_list">Checkbox List</option>
                        <option value="checkbox">Checkbox</option>
                        <option value="date">Date</option>
                        <option value="time">Time</option>
                        <option value="date_time">Date & Time</option>
                        <option value="photo_capture">Photo Capture</option>
                        <option value="contact">Contact Details</option>
                        <option value="address">Address Details</option>
                        <option value="drop_down_grid">Drop Down Grid</option>
                        <option value="checkbox_grid">Check Box Grid</option>
                        <option value="data_grid">Data Grid</option>
                    </select>
                </td>
                <td class="formatCell">
                    <p>Please Select the Question type</p>
                </td>
                <td>
                    <input name="mandatory" type="checkbox" />
                </td>
                <td>
                    <button type="button" onclick="removeRow(this)">Remove</button>
                </td>
            `;
  tableBody.appendChild(newRow);
}

let draggedRow = null;

// Drag and Drop Functionality
document.addEventListener("dragstart", function (event) {
  if (event.target.tagName === "TR") {
    draggedRow = event.target;
    event.target.classList.add("dragging");
  }
});

document.addEventListener("dragend", function (event) {
  if (event.target.tagName === "TR") {
    event.target.classList.remove("dragging");
    draggedRow = null;
  }
});

const tableBody = document.getElementById("tableBody");
tableBody.addEventListener("dragover", function (event) {
  event.preventDefault();
  if (event.target.tagName === "TR" && event.target !== draggedRow) {
    event.target.classList.add("drag-over");
  }
});

tableBody.addEventListener("dragleave", function (event) {
  if (event.target.tagName === "TR") {
    event.target.classList.remove("drag-over");
  }
});

tableBody.addEventListener("drop", function (event) {
  event.preventDefault();
  const targetRow =
    event.target.tagName === "TR" ? event.target : event.target.closest("tr");

  if (targetRow && targetRow !== draggedRow) {
    targetRow.classList.remove("drag-over");

    const rows = Array.from(tableBody.querySelectorAll("tr"));
    const indexDragged = rows.indexOf(draggedRow);
    const indexDropped = rows.indexOf(targetRow);

    if (indexDragged < indexDropped) {
      tableBody.insertBefore(draggedRow, targetRow.nextSibling);
    } else {
      tableBody.insertBefore(draggedRow, targetRow);
    }
  }
});

// Function to open the modal
function openCreateSurveyModal(event) {
  console.log("Opening the create survey modal");
  event.preventDefault();
  document.getElementById("createSurveyModal").style.display = "block";
}

function createSurvey() {
  const surveyNameInput = document.getElementById("surveyName").value;

  if (surveyNameInput != "") {
    window.location.href = `${API_BASE}/survey/create?Survey=${encodeURIComponent(
      surveyNameInput,
    )}&flag=C`;
  } else {
    alert("Survey Name Mandatory");
  }

  console.log("clicked");
}

function closeCreateSurveyModal() {
  console.log("Closing the create survey modal");
  document.getElementById("createSurveyModal").style.display = "none";
}

window.onclick = function (event) {
  var modal = document.getElementById("createSurveyModal");
  var modal2 = document.getElementById("popup-overlay");
  var editModal = document.getElementById("editFieldsOverlay");

  console.log("Click detected outside the modal");

  if (event.target == modal) {
    console.log("Closing modal because the user clicked outside");
    modal.style.display = "none";
  }
  if (event.target == modal2) {
    modal2.style.display = "none";
  }
  if (event.target == editModal) {
    closeEditFieldsModal();
  }
};

let isBulkMode = false;
let bulkSurveyList = [];

function openBulkPopup() {
  bulkSurveyList = Array.from(
    document.querySelectorAll(".survey-bulk-checkbox:checked"),
  ).map((cb) => cb.getAttribute("data-name"));

  if (bulkSurveyList.length === 0) {
    alert("Please select at least one survey checkbox first.");
    return;
  }

  isBulkMode = true;
  const nameDisplay = document.querySelector("#popupSurveyName");
  if (nameDisplay) {
    nameDisplay.innerHTML =
      '<h3 style="margin: 0; color: #b03a2e;">Bulk Assign/Unassign Surveys</h3>';
  }
  userDataShareSurvey(bulkSurveyList[0]);
}

const originalAssignUser = assignUser;
assignUser = function () {
  if (!isBulkMode) {
    originalAssignUser();
    return;
  }

  executeBulkRequest(
    `${API_BASE}/api/method/election_management.election_management.bulk_doctype_assign.bulk_assign_doctypes`,
    "Assigned",
  );
};

const originalUnassignUser = unassignedShareSurvey;
unassignedShareSurvey = function (email) {
  if (!isBulkMode) {
    originalUnassignUser(email);
    return;
  }

  if (
    confirm(`Unassign these ${bulkSurveyList.length} surveys from ${email}?`)
  ) {
    executeBulkRequest(
      `${API_BASE}/api/method/election_management.election_management.bulk_doctype_assign.bulk_unassign_doctypes`,
      "Unassigned",
      email,
    );
  }
};

function executeBulkRequest(url, actionName, singleEmail = null) {
  const payload = {
    document_name: bulkSurveyList,
    users: singleEmail ? [singleEmail] : selectedEmails,
  };

  fetch(url, {
    method: "POST",
    headers: {
      Authorization: "Token 405e0af40f3d04a:885b55cc21d37d2",
      "Content-Type": "application/json",
      "X-Frappe-CSRF-Token": frappe.csrf_token,
    },
    body: JSON.stringify(payload),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.message) {
        showAlert(`Bulk ${actionName} Successfully!`);
        userDataShareSurvey(bulkSurveyList[0]);
        selectedEmails = [];
      }
    })
    .catch((err) => showAlert("Bulk action failed."));
}
const originalClose = closePopupSomil;
closePopupSomil = function () {
  originalClose();
  isBulkMode = false;
  bulkSurveyList = [];
};
