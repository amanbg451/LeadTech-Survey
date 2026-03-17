
let start_survey = '';
let end_survey = '';
let survey_count = 0;

// ==================== COOKIE HELPER FUNCTIONS ====================
function getCookie(name) {
    const cookieName = name + "=";
    const cookies = document.cookie.split(';');
    for(let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i];
        while (cookie.charAt(0) == ' ') {
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
    const userType = getCookie('user_type') || '';
    const userEmail = getCookie('user_email') || '';
    const fullName = getCookie('full_name') || '';
    const systemUser = getCookie('system_user') || '';
    const userId = getCookie('user_id') || '';
    
    return {
        userType: userType,
        email: decodeURIComponent(userEmail),
        fullName: decodeURIComponent(fullName),
        systemUser: systemUser,
        userId: decodeURIComponent(userId)
    };
}

// ========== AUTHORIZATION CHECK USING COOKIES ==========
(function () {
  const userData = getUserData();
  const fullName = userData.fullName;
  const systemUser = userData.systemUser;
  const userId = userData.userId;

  console.log("🔐 Authorization check - User data from cookies:", { fullName, systemUser, userId });

  // Dynamic authorization based on cookie presence and validity
  const isAuthorized = fullName && 
                      systemUser === "yes" && 
                      userId && 
                      fullName !== 'undefined' && 
                      fullName !== 'null' && 
                      userId !== 'undefined' && 
                      userId !== 'null';

  console.log("Authorization result:", isAuthorized ? "✅ Authorized" : "❌ Unauthorized");
      
  if (!isAuthorized) {
    document.getElementById("security").style.display = "flex";
    document.getElementById("to_show").style.display = "none";
    
    setTimeout(function () {
      alert("Unauthorized access! Redirecting to the login page.");
      window.location.href = "https://dev.leadtech.in/survey/login-test";
    }, 2000);
  } else {
    document.getElementById("security").style.display = "none";
    document.getElementById("to_show").style.display = "block";
    
    // Also update user display if elements exist
    const userNameEl = document.getElementById('userName');
    const userTypeBadge = document.getElementById('userTypeBadge');
    
    if (userNameEl) {
      userNameEl.textContent = fullName;
    }
    
    if (userTypeBadge && userData.userType) {
      userTypeBadge.textContent = userData.userType.replace('_', ' ');
    }
  }
})();

window.addEventListener("beforeunload", function (e) {
  const confirmationMessage = "Are you sure you want to leave this page?";
  e.returnValue = confirmationMessage;
  return confirmationMessage;
});

// ==================== API CONFIGURATION ====================

const API_BASE_URL = window.location.origin; // https://dev.leadtech.in
const API_TOKEN = '405e0af40f3d04a:885b55cc21d37d2';

// ==================== GLOBAL VARIABLES ====================

let CLIENTS_DATA = [];
let PROJECTS_DATA = [];
let SELECTED_CLIENT = '';
let SELECTED_PROJECT = '';

// Form data variables
let name = '';
let header_text = '';
let Wimage = {};
let loop_survey = false;
let location_mandatory = false;
let unique_number = false;
let audio_mandatory = false;

// ==================== CLIENT/PROJECT API FUNCTIONS ====================

async function fetchClientsAndProjects() {
    try {
        const clientDropdown = document.getElementById('client-dropdown');
        if (!clientDropdown) return;
        
        // Show loading state
        clientDropdown.innerHTML = '<option value="">Loading clients...</option>';
        
        const userData = getUserData();
        const userId = userData.userId;
        
        if (!userId) {
            console.error('User ID not found in cookies');
            clientDropdown.innerHTML = '<option value="">Please login first</option>';
            return;
        }
        
        console.log('Fetching data for user:', userId);
        console.log('API URL:', `${API_BASE_URL}/api/method/election_management.election_management.get_client_dropdown.get_top_banner_clients_and_projects`);
        
        const response = await fetch(`${API_BASE_URL}/api/method/election_management.election_management.get_client_dropdown.get_top_banner_clients_and_projects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${API_TOKEN}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                "email": userId
            })
        });

        const data = await response.json();
        console.log('API Response:', data);
        
        if (data.message && data.message.status === "success") {
            CLIENTS_DATA = data.message.clients || [];
            PROJECTS_DATA = data.message.projects || [];
            
            console.log('Clients loaded:', CLIENTS_DATA.length);
            console.log('Projects loaded:', PROJECTS_DATA.length);
            
            // Populate client dropdown
            populateClientDropdown();
            
            // DON'T restore saved selections - start fresh
            // restoreDropdownSelections(); // Commented out
        } else {
            console.error('Failed to fetch data:', data);
            clientDropdown.innerHTML = '<option value="">Failed to load clients</option>';
        }
    } catch (error) {
        console.error('Error fetching clients and projects:', error);
        const clientDropdown = document.getElementById('client-dropdown');
        if (clientDropdown) {
            clientDropdown.innerHTML = '<option value="">Error loading data</option>';
        }
    }
}

function populateClientDropdown() {
    const clientDropdown = document.getElementById('client-dropdown');
    if (!clientDropdown) return;
    
    clientDropdown.innerHTML = '<option value="">Select a client</option>';
    
    if (CLIENTS_DATA.length === 0) {
        clientDropdown.innerHTML = '<option value="">No clients available</option>';
        return;
    }
    
    CLIENTS_DATA.forEach(client => {
        const option = document.createElement('option');
        option.value = client.client_id || client.name || client;
        option.textContent = client.client_id || client.name || client;
        clientDropdown.appendChild(option);
    });
}

function populateProjectDropdown(clientId) {
    const projectDropdown = document.getElementById('project-dropdown');
    if (!projectDropdown) return;
    
    projectDropdown.innerHTML = '<option value="">Loading projects...</option>';
    
    if (!clientId) {
        projectDropdown.innerHTML = '<option value="">Select client first</option>';
        projectDropdown.disabled = true;
        return;
    }
    
    // Filter projects for the selected client
    const clientProjects = PROJECTS_DATA.filter(project => {
        const projectClient = project.client || project.client_id;
        return projectClient === clientId;
    });
    
    console.log(`Projects for client ${clientId}:`, clientProjects.length);
    
    if (clientProjects.length === 0) {
        projectDropdown.innerHTML = '<option value="">No projects available</option>';
        projectDropdown.disabled = true;
    } else {
        projectDropdown.innerHTML = '<option value="">Select a project</option>';
        clientProjects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.project_id || project.name || project;
            option.textContent = project.project_id || project.name || project;
            projectDropdown.appendChild(option);
        });
        projectDropdown.disabled = false;
    }
}

function onClientChange() {
    const clientDropdown = document.getElementById('client-dropdown');
    if (!clientDropdown) return;
    
    SELECTED_CLIENT = clientDropdown.value;
    console.log('Selected client:', SELECTED_CLIENT);
    
    // Save to localStorage
    if (SELECTED_CLIENT) {
        localStorage.setItem('selectedClient', SELECTED_CLIENT);
    } else {
        localStorage.removeItem('selectedClient');
    }
    
    // Update project dropdown
    populateProjectDropdown(SELECTED_CLIENT);
    
    // Reset project selection
    const projectDropdown = document.getElementById('project-dropdown');
    if (projectDropdown) {
        projectDropdown.value = '';
    }
    SELECTED_PROJECT = '';
    localStorage.removeItem('selectedProject');
}

function onProjectChange() {
    const projectDropdown = document.getElementById('project-dropdown');
    if (!projectDropdown) return;
    
    SELECTED_PROJECT = projectDropdown.value;
    console.log('Selected project:', SELECTED_PROJECT);
    
    // Save to localStorage
    if (SELECTED_PROJECT) {
        localStorage.setItem('selectedProject', SELECTED_PROJECT);
    } else {
        localStorage.removeItem('selectedProject');
    }
}

async function saveSurveyToAPI(surveyName, projectId, startDate, endDate, count) {
    try {
        console.log('Saving survey to API:', { 
            surveyName, 
            projectId,
            start_survey: startDate,
            end_survey: endDate,
            survey_count: count
        });
        
        const response = await fetch(`${API_BASE_URL}/api/method/election_management.election_management.put_project_survey.add_survey_to_project`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${API_TOKEN}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                "project_id": projectId,
                "name1": surveyName,
                "start_survey": startDate,
                "end_survey": endDate,
                "survey_count": parseInt(count, 10) // Ensure it's an integer
            })
        });

        const data = await response.json();
        console.log('Survey saved to API response:', data);
        
        if (data.message && data.message.status === "success") {
            return { success: true, data: data.message };
        } else {
            return { success: false, error: data.message || data._error_message || 'Unknown error' };
        }
    } catch (error) {
        console.error('Error saving survey to API:', error);
        return { success: false, error: error.message };
    }
}

// ==================== FILE UPLOAD FUNCTION ====================

async function uploadFile(file, fileName) {
  const formData = new FormData();
  formData.append("file", file, fileName);
  formData.append("is_private", "0");

  try {
    const response = await fetch(`${API_BASE_URL}/api/method/upload_file`, {
      method: "POST",
      headers: {
        "Authorization": `Token ${API_TOKEN}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log('Upload response:', responseData);
    
    if (responseData.message && responseData.message.file_url) {
      return {
        url: responseData.message.file_url,
        name: fileName
      };
    } else {
      throw new Error("File URL not found in response");
    }
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

// ==================== SURVEY FUNCTIONS ====================

// Get the 'Survey' parameter from the URL
const surveyParam = new URLSearchParams(window.location.search).get("Survey");

// Check if the 'Survey' parameter exists and is not empty
if (surveyParam) {
  PopulateRows(surveyParam);
}

function PopulateRows(name) {
  let localStorageData = JSON.parse(localStorage.getItem("formData"));

  if (localStorageData && localStorageData.name === name) {
    loadFormData();
  } else {
    const rowsContainer = document.getElementById("tableBody");
    if (rowsContainer) {
      rowsContainer.innerHTML = "";
    }

    fetch(`${API_BASE_URL}/api/resource/DocType/${name}?fields=["*"]`, {
      method: "GET",
      headers: {
        "Authorization": `Token ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.data && data.data.fields) {
          data.data.fields.forEach((item) => {
            if (
              item.fieldtype !== "Link" &&
              item.fieldtype !== "Image" &&
              item.fieldtype !== "Small Text"
            ) {
              addRow2(item);
            }
          });
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }
}

function addRow2(data) {
  const tableBodysolid = document.querySelector("#tableBody");
  if (!tableBodysolid) return;
  
  const newRow = document.createElement("tr");
  newRow.classList.add("draggable");
  newRow.draggable = true;

  newRow.innerHTML = `
        <td>
            <select name="inputType" onchange="updateFormat2(this)">
                <option value="select">Select Question Type</option>
                <option value="drop_down">Drop Down</option>
                <option value="group">Group</option>
                <option value="drop_down_other">Drop Down With other</option>
                <option value="text_block">Text Block</option>
                <option value="singleline_text_input">Singleline Text Input</option>
                <option value="multiline_text_input">Multiline Text Input</option>
                <option value="number_input">Number Input</option>
                <option value="decimal_input">Decimal Input</option>
                <option value="email">Email</option>
                <option value="phone_number">Phone Number</option>
                <option value="radio_button">Radio Button Options</option>
                <option value="radio_button_other">Radio Button Options with Other</option>
                <option value="checkbox_list">Checkbox List</option>
                <option value="checkbox">Checkbox</option>
                <option value="date">Date</option>
                <option value="time">Time</option>
                <option value="photo_capture">Photo Capture</option>
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

  switch (data.fieldtype) {
    case "Select":
      let condition = data.options ? data.options.split("\n")[0] : "";
      if (condition === "Select Type") {
        variable = "drop_down";
      } else if (condition === "Radio Type") {
        variable = "radio_button";
      } else if (condition === "Check Type") {
        variable = "checkbox_list";
      } else {
        variable = "drop_down";
      }
      break;
    case "Heading":
      variable = "text_block";
      break;
    case "Data":
      variable = "singleline_text_input";
      break;
    case "Float":
      variable = "decimal_input";
      break;
    case "Int":
      variable = "number_input";
      break;
    case "Phone":
      variable = "phone_number";
      break;
    case "Rating":
      variable = "rating";
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
      variable = "photo_capture";
      break;
    case "Signature":
      variable = "signature";
      break;
    case "Check":
      variable = "checkbox_list";
      break;
    case "Checkbox":
      variable = "checkbox_list";
      break;
    default:
      variable = "singleline_text_input";
  }

  const selectElement = newRow.querySelector('select[name="inputType"]');
  if (selectElement) {
    selectElement.value = variable;
    updateFormat2(selectElement);
  }

  // Set the question label if provided
  setTimeout(() => {
    const formatCell = newRow.querySelector(".formatCell");
    const questionInput = formatCell ? formatCell.querySelector('input[name="questionName"]') : null;
    if (questionInput && data.label) {
      questionInput.value = data.label || "";
    }

    const optionsTextarea = formatCell ? formatCell.querySelector('textarea[name="options"]') : null;
    if (optionsTextarea && data.options) {
      optionsTextarea.value = data.options;
    }
  }, 100);
}

function updateFormat2(selectElement) {
  const formatCell = selectElement.closest("tr").querySelector(".formatCell");
  if (!formatCell) return;
  
  const selectedType = selectElement.value;

  formatCell.innerHTML = "";

  formatCell.innerHTML +=
    '<input type="text" name="questionName" placeholder="Question">';

  switch (selectedType) {
    case "select":
      formatCell.innerHTML += "<p>Please Select a question type</p>";
      break;
    case "drop_down":
    case "drop_down_other":
    case "radio_button":
    case "checkbox_list":
    case "radio_button_other":
      formatCell.innerHTML +=
        '<br><textarea name="options" placeholder="Options (one per line)" style="width:100%;" rows="3"></textarea>';
      break;
    case "drop_down_grid":
    case "checkbox_grid":
    case "data_grid":
      formatCell.innerHTML +=
        '<br><textarea name="rowoptions" placeholder="Row Options (one per line)" style="width:100%;" rows="2"></textarea>' +
        '<br><textarea name="coloptions" placeholder="Column Options (one per line)" style="width:100%;" rows="2"></textarea>' +
        '<br><textarea name="options" placeholder="Grid Options (one per line)" style="width:100%;" rows="2"></textarea>';
      break;
  }
}

// ==================== FUNCTION TO ENSURE OTHERS IN OPTIONS ====================
function ensureOthersInOptions(optionsTextarea) {
  if (!optionsTextarea) return;
  
  let options = optionsTextarea.value;
  let optionsArray = options.split('\n').map(opt => opt.trim()).filter(opt => opt !== '');
  
  // Check if "Others" already exists (case insensitive)
  const hasOthers = optionsArray.some(opt => opt.toLowerCase() === 'others');
  
  if (!hasOthers && optionsArray.length > 0) {
    // Add "Others" at the end
    optionsArray.push('Others');
    optionsTextarea.value = optionsArray.join('\n');
  }
}

// Helper function for handling blur event on options textarea
function handleOthersBlur(event) {
  ensureOthersInOptions(event.target);
}

// ==================== UPDATED PREVIEW FUNCTION WITH FIXED OTHERS DISPLAY ====================
function preview() {
  const formName = document.getElementById("name").value.trim();
  const tableData = [];
  const rows = document.querySelectorAll("#tableBody tr");

  rows.forEach((row) => {
    const inputType = row.querySelector('select[name="inputType"]')?.value || "";
    const questionName =
      row.querySelector('input[name="questionName"]')?.value || "";
    const optionsText =
      row.querySelector('textarea[name="options"]')?.value || "";
    const rowoptionsText =
      row.querySelector('textarea[name="rowoptions"]')?.value || "";
    const coloptionsText =
      row.querySelector('textarea[name="coloptions"]')?.value || "";

    tableData.push({
      inputType,
      questionName,
      options: optionsText,
      rowoptions: rowoptionsText,
      coloptions: coloptionsText,
    });
  });

  let html = ``;

  tableData.forEach((item, index) => {
    if (!item.questionName) return;
    
    switch (item.inputType) {
      case "drop_down":
      case "drop_down_other":
        let dropDownOptions = item.options
          .split("\n")
          .map((option) => option.trim())
          .filter(option => option);
        
        // For drop_down_other, ensure "Others" is in the options
        if (item.inputType === "drop_down_other") {
          const hasOthers = dropDownOptions.some(opt => opt.toLowerCase() === 'others');
          if (!hasOthers) {
            dropDownOptions.push('Others');
          }
        }
        
        const optionsHtml = dropDownOptions
          .map((option) => `<option value="${option}">${option}</option>`)
          .join("");
        
        html += `
          <div class="form-group" style="margin-bottom:15px; border:1px solid #eee; padding:15px; border-radius:5px;" id="preview-group-${index}">
            <label style="display:block; margin-bottom:5px; font-weight:600;">${item.questionName}</label>
            <select class="preview-dropdown" data-question-index="${index}" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px; margin-bottom:10px;">
              <option value="">Select</option>
              ${optionsHtml}
            </select>
            <div class="others-input-container" id="others-container-${index}" style="display: none; margin-top:10px; padding:10px; background:#f9f9f9; border-radius:4px;">
              <label style="display:block; margin-bottom:5px; font-size:13px; color:#666;">Please specify:</label>
              <input type="text" placeholder="Enter your answer" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px;">
            </div>
          </div>
        `;
        break;

      case "singleline_text_input":
        html += `
          <div class="form-group" style="margin-bottom:15px;">
            <label style="display:block; margin-bottom:5px; font-weight:600;">${item.questionName}</label>
            <input type="text" placeholder="Enter text" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px;">
          </div>
        `;
        break;

      case "multiline_text_input":
        html += `
          <div class="form-group" style="margin-bottom:15px;">
            <label style="display:block; margin-bottom:5px; font-weight:600;">${item.questionName}</label>
            <textarea rows="4" placeholder="Enter comment" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px;"></textarea>
          </div>
        `;
        break;

      case "text_block":
        html += `
          <div class="form-group" style="margin-bottom:15px;">
            <h3 style="margin:10px 0; color:#333;">${item.questionName}</h3>
          </div>
        `;
        break;

      case "email":
        html += `
          <div class="form-group" style="margin-bottom:15px;">
            <label style="display:block; margin-bottom:5px; font-weight:600;">${item.questionName}</label>
            <input type="email" placeholder="Enter email" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px;">
          </div>
        `;
        break;

      case "phone_number":
        html += `
          <div class="form-group" style="margin-bottom:15px;">
            <label style="display:block; margin-bottom:5px; font-weight:600;">${item.questionName}</label>
            <input type="tel" placeholder="Enter phone number" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px;">
          </div>
        `;
        break;

      case "date":
        html += `
          <div class="form-group" style="margin-bottom:15px;">
            <label style="display:block; margin-bottom:5px; font-weight:600;">${item.questionName}</label>
            <input type="date" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px;">
          </div>
        `;
        break;

      case "time":
        html += `
          <div class="form-group" style="margin-bottom:15px;">
            <label style="display:block; margin-bottom:5px; font-weight:600;">${item.questionName}</label>
            <input type="time" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px;">
          </div>
        `;
        break;

      case "date_time":
        html += `
          <div class="form-group" style="margin-bottom:15px;">
            <label style="display:block; margin-bottom:5px; font-weight:600;">${item.questionName}</label>
            <input type="datetime-local" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px;">
          </div>
        `;
        break;

      case "photo_capture":
        html += `
          <div class="form-group" style="margin-bottom:15px;">
            <label style="display:block; margin-bottom:5px; font-weight:600;">${item.questionName}</label>
            <input type="file" accept="image/*" style="width:100%; padding:8px;">
          </div>
        `;
        break;

      case "map_coordinates":
        html += `
          <div class="form-group" style="margin-bottom:15px;">
            <label style="display:block; margin-bottom:5px; font-weight:600;">${item.questionName}</label>
            <button type="button" style="padding:8px 15px; background:#b03a2e; color:white; border:none; border-radius:4px; cursor:pointer;">Get Location</button>
          </div>
        `;
        break;

      case "radio_button":
      case "radio_button_other":
        let radioOptions = item.options
          .split("\n")
          .map(option => option.trim())
          .filter(option => option);
        
        // For radio_button_other, ensure "Others" is in the options
        if (item.inputType === "radio_button_other") {
          const hasOthers = radioOptions.some(opt => opt.toLowerCase() === 'others');
          if (!hasOthers) {
            radioOptions.push('Others');
          }
        }
        
        const radioHtml = radioOptions.map((option) => `
          <div style="margin:5px 0;">
            <input type="radio" name="preview_radio_${index}" value="${option}" id="radio_${index}_${option}">
            <label for="radio_${index}_${option}">${option}</label>
          </div>
        `).join("");
        
        html += `
          <div class="form-group" style="margin-bottom:15px; border:1px solid #eee; padding:15px; border-radius:5px;" id="preview-group-${index}">
            <label style="display:block; margin-bottom:5px; font-weight:600;">${item.questionName}</label>
            ${radioHtml}
            <div class="others-input-container" id="radio-others-container-${index}" style="display: none; margin-top:10px; padding:10px; background:#f9f9f9; border-radius:4px;">
              <label style="display:block; margin-bottom:5px; font-size:13px; color:#666;">Please specify:</label>
              <input type="text" placeholder="Enter your answer" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px;">
            </div>
          </div>
        `;
        break;

      case "checkbox_list":
        const checkButtonOptions = item.options
          .split("\n")
          .map(option => option.trim())
          .filter(option => option)
          .map(
            (option) => `
              <div style="margin:5px 0;">
                <input type="checkbox" name="preview_check" value="${option}" id="check_${option}">
                <label for="check_${option}">${option}</label>
              </div>
            `
          )
          .join("");

        html += `
          <div class="form-group" style="margin-bottom:15px;">
            <label style="display:block; margin-bottom:5px; font-weight:600;">${item.questionName}</label>
            ${checkButtonOptions}
          </div>
        `;
        break;

      case "number_input":
      case "decimal_input":
        html += `
          <div class="form-group" style="margin-bottom:15px;">
            <label style="display:block; margin-bottom:5px; font-weight:600;">${item.questionName}</label>
            <input type="number" ${item.inputType === "decimal_input" ? 'step="any"' : ""} style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px;">
          </div>
        `;
        break;

      default:
        break;
    }
  });

  const modalContent = document.getElementById("modalContent");
  if (modalContent) {
    modalContent.innerHTML = html;
  }
  
  const previewModal = document.getElementById("previewModal");
  if (previewModal) {
    previewModal.style.display = "flex";
    
    // Add event listeners for "Others" dropdowns after modal is shown
    setTimeout(() => {
      // For dropdowns
      document.querySelectorAll('.preview-dropdown').forEach(dropdown => {
        dropdown.addEventListener('change', function() {
          const index = this.dataset.questionIndex;
          const container = document.getElementById(`others-container-${index}`);
          if (container) {
            // Show container only if "Others" is selected
            container.style.display = this.value === 'Others' ? 'block' : 'none';
          }
        });
      });
      
      // For radio buttons
      document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', function() {
          // Find the parent group
          const group = this.closest('.form-group');
          if (group) {
            // Extract index from group ID
            const groupId = group.id;
            const index = groupId.split('-').pop();
            
            // Find the corresponding others container
            const container = document.getElementById(`radio-others-container-${index}`);
            if (container) {
              // Check if any radio with value "Others" in this group is checked
              const othersChecked = group.querySelectorAll('input[type="radio"]');
              let isOthersSelected = false;
              othersChecked.forEach(r => {
                if (r.checked && r.value === 'Others') {
                  isOthersSelected = true;
                }
              });
              container.style.display = isOthersSelected ? 'block' : 'none';
            }
          }
        });
      });
    }, 200);
  }
}

function closeModal() {
  document.getElementById("previewModal").style.display = "none";
}

function showRecordOption() {
  const popRecord = document.getElementById("pop_record");
  if (popRecord) {
    popRecord.style.display = "block";
  }
}

function toggleRecording() {
  let startButton = document.getElementById("startRecording");
  if (!startButton) return;
  
  let isRecording = startButton.textContent === "Stop Recording";

  if (isRecording) {
    stopRecording();
    startButton.textContent = "Start Recording";
  } else {
    startRecording();
    startButton.textContent = "Stop Recording";
  }
}

// ==================== UPDATED UPDATE FORMAT FUNCTION WITH OTHERS AUTO-ADD ====================
function updateFormat(selectElement) {
  const formatCell = selectElement.closest("tr").querySelector(".formatCell");
  if (!formatCell) return;
  
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
        '<br><textarea name="options" placeholder="Options (one per line)" style="width:100%;" rows="3"></textarea>';
      
      // For drop_down_other and radio_button_other, add event listener to ensure "Others" is included
      if (selectedType === "drop_down_other" || selectedType === "radio_button_other") {
        setTimeout(() => {
          const optionsTextarea = formatCell.querySelector('textarea[name="options"]');
          if (optionsTextarea) {
            // Remove any existing event listener and add new one
            optionsTextarea.removeEventListener('blur', handleOthersBlur);
            optionsTextarea.addEventListener('blur', handleOthersBlur);
            
            // Check if "Others" already exists when the field is created
            ensureOthersInOptions(optionsTextarea);
          }
        }, 100);
      }
      break;
    case "contact":
      formatCell.innerHTML = "<br><p>Contact Details Fields</p>";
      break;
    case "address":
      formatCell.innerHTML = "<br><p>Address Details Fields</p>";
      break;
    case "drop_down_grid":
    case "data_grid":
    case "checkbox_grid":
      formatCell.innerHTML =
        '<br><textarea name="rowoptions" placeholder="Row Options (one per line)" style="width:100%;" rows="2"></textarea>' +
        '<br><textarea name="coloptions" placeholder="Column Options (one per line)" style="width:100%;" rows="2"></textarea>' +
        '<br><textarea name="options" placeholder="Grid Options (one per line)" style="width:100%;" rows="2"></textarea>';
      break;
    case "map_coordinates":
      formatCell.innerHTML =
        '<input type="text" name="questionName" placeholder="Question" value="Location" readonly>';
      break;
  }
}

function addRow() {
  const tableBody = document.querySelector("#tableBody");
  if (!tableBody) return;
  
  const newRow = document.createElement("tr");
  newRow.classList.add("draggable");
  newRow.draggable = true;

  newRow.innerHTML = `
    <td>
      <select name="inputType" onchange="updateFormat(this)">
        <option value="select">Select Question Type</option>
        <option value="drop_down">Drop Down</option>
        <option value="group">Group</option>
        <option value="drop_down_other">Drop Down With other</option>
        <option value="text_block">Text Block</option>
        <option value="singleline_text_input">Singleline Text Input</option>
        <option value="multiline_text_input">Multiline Text Input</option>
        <option value="number_input">Number Input</option>
        <option value="decimal_input">Decimal Input</option>
        <option value="email">Email</option>
        <option value="phone_number">Phone Number</option>
        <option value="radio_button">Radio Button Options</option>
        <option value="radio_button_other">Radio Button Options with Other</option>
        <option value="checkbox_list">Checkbox List</option>
        <option value="checkbox">Checkbox</option>
        <option value="date">Date</option>
        <option value="time">Time</option>
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

function removeRow(button) {
  if (
    confirm(
      "Please Confirm! Once these questions are deleted, data will be lost. Are you sure you want to delete this record?",
    )
  ) {
    const row = button.closest("tr");
    if (row) {
      row.remove();
    }
  }
}

function updateForm() {
  console.log("updated");
}

// ==================== UPDATED NEWFORM FUNCTION ====================
function newForm() {
  // Clear ALL localStorage data
  localStorage.removeItem("formData");
  localStorage.removeItem("selectedClient");
  localStorage.removeItem("selectedProject");
  
  // Clear sessionStorage
  sessionStorage.removeItem('newForm');
  sessionStorage.removeItem('editingForm');
  
  // Reset all global variables
  SELECTED_CLIENT = '';
  SELECTED_PROJECT = '';
  name = '';
  header_text = '';
  Wimage = {};
  start_survey = '';      // NEW
  end_survey = '';        // NEW
  survey_count = 0;       // NEW
  location_mandatory = false;
  audio_mandatory = false;
  unique_number = false;
  
  // Reset the entire form
  const form = document.getElementById('createSurveyForm');
  if (form) form.reset();
  
  // Manually clear all input fields
  const nameField = document.getElementById("name");
  if (nameField) {
    nameField.value = "";
    nameField.defaultValue = "";
  }
  
  document.getElementById("hypertext").value = "";
  document.getElementById("hypertext").defaultValue = "";
  
  // Clear new fields
  const startField = document.getElementById("start_survey");
  if (startField) {
    startField.value = "";
    startField.defaultValue = "";
  }
  
  const endField = document.getElementById("end_survey");
  if (endField) {
    endField.value = "";
    endField.defaultValue = "";
  }
  
  const countField = document.getElementById("survey_count");
  if (countField) {
    countField.value = "";
    countField.defaultValue = "";
  }
  
  // Clear file input
  const fileInput = document.getElementById('welcome-image');
  if (fileInput) fileInput.value = '';
  
  // Uncheck all checkboxes
  document.getElementById('location-capture').checked = false;
  document.getElementById('audio-capture').checked = false;
  document.getElementById('unique_number').checked = false;
  
  // Uncheck all radio buttons
  document.querySelectorAll('input[name="slayout"]').forEach(radio => {
    radio.checked = false;
  });
  
  // Reset client dropdown to show "Select a client"
  const clientDropdown = document.getElementById('client-dropdown');
  if (clientDropdown) {
    clientDropdown.value = "";
    // Force reload clients from API
    fetchClientsAndProjects();
  }
  
  // Reset project dropdown
  const projectDropdown = document.getElementById('project-dropdown');
  if (projectDropdown) {
    projectDropdown.innerHTML = '<option value="">Select client first</option>';
    projectDropdown.disabled = true;
  }
  
  // Clear the question table
  const tableBody = document.querySelector("#tableBody");
  if (tableBody) {
    tableBody.innerHTML = "";
  }
  
  // Ensure screen1 is visible and screen2 is hidden
  document.querySelector(".screen1").style.display = "block";
  document.querySelector(".screen2").style.display = "none";
  
  // Add a timestamp to URL to prevent caching
  window.history.replaceState({}, document.title, window.location.pathname + '?new=' + Date.now());
  
  console.log("New form created - all data cleared");
}

function loadFormData() {
  const savedData = localStorage.getItem("formData");
  if (savedData) {
    try {
      const formData = JSON.parse(savedData);
      const nameInput = document.getElementById("name");
      if (nameInput && formData.name) {
        nameInput.value = formData.name;
      }

      // Restore global variables
      if (formData.header) header_text = formData.header;
      if (formData.Wel_image) Wimage = formData.Wel_image;
      if (formData.loc_mandatory !== undefined) location_mandatory = formData.loc_mandatory;
      if (formData.audio_mandatory !== undefined) audio_mandatory = formData.audio_mandatory;
      if (formData.unique_number !== undefined) unique_number = formData.unique_number;
      if (formData.client_id) SELECTED_CLIENT = formData.client_id;
      if (formData.project_id) SELECTED_PROJECT = formData.project_id;

      // Restore checkboxes
      const locationCheck = document.getElementById('location-capture');
      const audioCheck = document.getElementById('audio-capture');
      const uniqueCheck = document.getElementById('unique_number');
      
      if (locationCheck) locationCheck.checked = location_mandatory;
      if (audioCheck) audioCheck.checked = audio_mandatory;
      if (uniqueCheck) uniqueCheck.checked = unique_number;

      // Load questions
      if (formData.questions && formData.questions.length > 0) {
        // Clear existing rows first
        const tableBody = document.querySelector("#tableBody");
        if (tableBody) {
          tableBody.innerHTML = "";
        }
        
        formData.questions.forEach((questionData, index) => {
          if (index > 0) addRow();
          // Small delay to ensure DOM is updated
          setTimeout(() => {
            const rows = document.querySelectorAll("#tableBody tr");
            const row = rows[index];
            if (row) {
              const selectEl = row.querySelector('select[name="inputType"]');
              if (selectEl) {
                selectEl.value = questionData.inputType;
                updateFormat(selectEl);
                
                setTimeout(() => {
                  const questionInput = row.querySelector('input[name="questionName"]');
                  if (questionInput) questionInput.value = questionData.questionName || "";

                  const optionsTextarea = row.querySelector('textarea[name="options"]');
                  if (optionsTextarea && questionData.options) {
                    optionsTextarea.value = questionData.options;
                  }
                  
                  const rowoptionsTextarea = row.querySelector('textarea[name="rowoptions"]');
                  if (rowoptionsTextarea && questionData.rowoptions) {
                    rowoptionsTextarea.value = questionData.rowoptions;
                  }
                  
                  const coloptionsTextarea = row.querySelector('textarea[name="coloptions"]');
                  if (coloptionsTextarea && questionData.coloptions) {
                    coloptionsTextarea.value = questionData.coloptions;
                  }
                  
                  const mandatoryCheck = row.querySelector('input[name="mandatory"]');
                  if (mandatoryCheck && questionData.mandatory) {
                    mandatoryCheck.checked = questionData.mandatory;
                  }
                }, 100);
              }
            }
          }, index * 50);
        });
      }
    } catch (e) {
      console.error('Error loading form data:', e);
    }
  }
}

function updateButtonDisplay() {
  const formData = JSON.parse(localStorage.getItem("formData") || "{}");
  const isPublish = formData.isPublish || "0";

  const publishUpdateBtn = document.getElementById("publish_update_btn");
  if (!publishUpdateBtn) return;

  if (isPublish === "0") {
    publishUpdateBtn.innerHTML = `
      <button onclick="publishForm()">Publish</button>
      <button onclick="closePopup()">Don't Publish</button>
    `;
  } else if (isPublish === "1") {
    publishUpdateBtn.innerHTML = `
      <button onclick="updateForm()">Update</button>
      <button onclick="closePopup()">Go back</button>
    `;
  }
}

function saveForm() {
  const formName = document.getElementById("name").value.trim();
  const tableData = [];
  const rows = document.querySelectorAll("#tableBody tr");

  rows.forEach((row) => {
    const inputType = row.querySelector('select[name="inputType"]')?.value || "";
    const questionName =
      row.querySelector('input[name="questionName"]')?.value || "";
    const optionsText =
      row.querySelector('textarea[name="options"]')?.value || "";
    const rowoptionsText =
      row.querySelector('textarea[name="rowoptions"]')?.value || "";
    const coloptionsText =
      row.querySelector('textarea[name="coloptions"]')?.value || "";
    const mandatory = row.querySelector('input[name="mandatory"]')?.checked || false;

    if (questionName) {
      tableData.push({
        inputType,
        questionName,
        options: optionsText,
        rowoptions: rowoptionsText,
        coloptions: coloptionsText,
        mandatory: mandatory,
      });
    }
  });

  const formData = {
    name: formName,
    questions: tableData,
    isPublish: "0",
    header: header_text,
    Wel_image: Wimage,
    loop: loop_survey,
    loc_mandatory: location_mandatory,
    audio_mandatory: audio_mandatory,
    unique_number: unique_number,
    client_id: SELECTED_CLIENT,
    project_id: SELECTED_PROJECT
  };

  localStorage.setItem("formData", JSON.stringify(formData));
  
  const overlay = document.getElementById("overlay");
  const popup = document.getElementById("popup");
  
  if (overlay) overlay.style.display = "block";
  if (popup) popup.style.display = "block";
  
  updateButtonDisplay();
  showAlert('Form saved successfully!');
}

function closePopup() {
  const overlay = document.getElementById("overlay");
  const popup = document.getElementById("popup");
  
  if (overlay) overlay.style.display = "none";
  if (popup) popup.style.display = "none";
}

function splitLabelAndDescription(label, maxLength = 140) {
  if (!label || typeof label !== "string") {
    return { label: "", description: "" };
  }

  if (label.length <= maxLength) {
    return {
      label: label,
      description: "",
    };
  }

  return {
    label: label.substring(0, maxLength),
    description: label.substring(maxLength).trim(),
  };
}

// ==================== UPDATED PUBLISH FUNCTION WITH REDIRECT ====================
// function publishForm() {
//   const dataString = localStorage.getItem("formData");
//   if (!dataString) {
//     alert("No data to publish. Please save the form first.");
//     return;
//   }
  
//   const data = JSON.parse(dataString);

//   if (!data || !Array.isArray(data.questions)) {
//     console.error("Data.questions is not an array");
//     alert("Invalid form data structure");
//     return;
//   }

//   const formName = data.name || document.getElementById("name").value;
//   if (!formName) {
//     alert("Please enter a form name");
//     return;
//   }

//   const dynamicFields = [];

//   // Add image field if exists
//   if (data.Wel_image && data.Wel_image.url) {
//     dynamicFields.push({
//       fieldname: "image",
//       fieldtype: "Image",
//       label: "Image",
//       options: data.Wel_image.url,
//     });
//   }

//   // Add header field if exists
//   if (data.header) {
//     const headerFieldName =
//       data.header
//         .toLowerCase()
//         .replace(/ /g, "_")
//         .replace(/[^a-z_]/g, "") || "header";

//     const { label, description } = splitLabelAndDescription(data.header);

//     dynamicFields.push({
//       fieldname: headerFieldName,
//       fieldtype: "Heading",
//       label: label,
//       description: description,
//       options: "",
//     });
//   }

//   // Always add location field (mandatory)
//   dynamicFields.push({
//     fieldname: "location",
//     fieldtype: "Geolocation",
//     label: "Location",
//     options: "",
//     reqd: 1,
//   });
//   dynamicFields.push({
//     fieldname: "survey_start_date",
//     fieldtype: "Datetime",
//     label: "Survey Start Date",
//     options: "",
//     reqd: 1,
//   });
//   dynamicFields.push({
//     fieldname: "survey_end_date",
//     fieldtype: "Datetime",
//     label: "Survey End Date",
//     options: "",
//     reqd: 1,
//   });
//   dynamicFields.push({
//     fieldname: "survey_duration",
//     fieldtype: "Data",
//     label: "Survey Duration",
//     options: "",
//     reqd: 1,
//   });

//   // Always add audio field (mandatory)
//   dynamicFields.push({
//     fieldname: "audio",
//     fieldtype: "Attach",
//     label: "Audio",
//     options: "Audio",
//     reqd: 1,
//   });

//   // Add unique number field if required
//   if (data.unique_number) {
//     dynamicFields.push({
//       fieldname: "unique_number",
//       fieldtype: "Data",
//       label: "Unique Number",
//       options: "",
//       reqd: 1,
//       unique: 1,
//     });
//   }

//   // Process all questions
//   data.questions.forEach((questionData, index) => {
//     if (!questionData.questionName) return;

//     let fieldType = "Data";
//     let options = "";
//     const reqd = questionData.mandatory ? 1 : 0;
//     const { label, description } = splitLabelAndDescription(questionData.questionName);
//     const fieldname = `q_${index + 1}`;

//     // Map input types to Frappe fieldtypes
//     switch (questionData.inputType) {
//       case "drop_down":
//         fieldType = "Select";
//         options = questionData.options || "";
//         break;
        
//       case "drop_down_other":
//         fieldType = "Select";
//         // Ensure "Others" is in options
//         let dropDownOptions = questionData.options ? questionData.options.split("\n") : [];
//         dropDownOptions = dropDownOptions.map(opt => opt.trim()).filter(opt => opt);
//         const hasOthers = dropDownOptions.some(opt => opt.toLowerCase() === 'others');
//         if (!hasOthers) {
//           dropDownOptions.push('Others');
//         }
//         options = dropDownOptions.join("\n");
//         break;
        
//       case "radio_button":
//         fieldType = "Select";
//         options = questionData.options || "";
//         break;
        
//       case "radio_button_other":
//         fieldType = "Select";
//         // Ensure "Others" is in options
//         let radioOptions = questionData.options ? questionData.options.split("\n") : [];
//         radioOptions = radioOptions.map(opt => opt.trim()).filter(opt => opt);
//         const hasOthersRadio = radioOptions.some(opt => opt.toLowerCase() === 'others');
//         if (!hasOthersRadio) {
//           radioOptions.push('Others');
//         }
//         options = radioOptions.join("\n");
//         break;
        
//       case "checkbox_list":
//         fieldType = "MultiSelect";
//         options = questionData.options || "";
//         break;
        
//       case "text_block":
//         fieldType = "Heading";
//         break;
//       case "singleline_text_input":
//         fieldType = "Data";
//         break;
//       case "multiline_text_input":
//         fieldType = "Long Text";
//         break;
//       case "number_input":
//         fieldType = "Int";
//         break;
//       case "decimal_input":
//         fieldType = "Float";
//         break;
//       case "email":
//         fieldType = "Data";
//         options = "Email";
//         break;
//       case "phone_number":
//         fieldType = "Data";
//         options = "Phone";
//         break;
//       case "date":
//         fieldType = "Date";
//         break;
//       case "time":
//         fieldType = "Time";
//         break;
//       case "date_time":
//         fieldType = "Datetime";
//         break;
//       case "photo_capture":
//       case "record_video":
//       case "record_audio":
//         fieldType = "Attach";
//         if (questionData.inputType === "record_audio") {
//           options = "Audio";
//         }
//         break;
//       case "map_coordinates":
//         fieldType = "Geolocation";
//         break;
//       case "barcode_scanner":
//         fieldType = "Barcode";
//         break;
//       case "signature":
//         fieldType = "Signature";
//         break;
//       case "checkbox":
//         fieldType = "Check";
//         break;
//       case "rating":
//         fieldType = "Rating";
//         break;
//       case "group":
//         fieldType = "Section Break";
//         break;
//       default:
//         fieldType = "Data";
//     }

//     dynamicFields.push({
//       fieldname: fieldname,
//       fieldtype: fieldType,
//       label: label,
//       description: description,
//       options: options,
//       reqd: reqd,
//     });
//   });

//   // Add user field (mandatory)
//   const fieldsArray = [
//     {
//       fieldname: "user",
//       fieldtype: "Link",
//       label: "User",
//       options: "User",
//       reqd: 1,
//     },
//     ...dynamicFields
//   ];

//   const finalData = {
//     __newname: formName,
//     module: "leadtech_survey",
//     track_changes: 1,
//     track_seen: 1,
//     track_views: 1,
//     custom: 1,
//     naming_rule: "Expression (old style)",
//     autoname: formName + ".######",
//     name_case: "Title Case",
//     allow_rename: 1,
//     index_web_pages_for_search: 1,
//     fields: fieldsArray,
//     permissions: [
//       {
//         role: "Leadtech Survey Admin",
//         read: 1,
//         write: 1,
//         create: 1,
//         delete: 1,
//         report: 1,
//         export: 1,
//       },
//       {
//         role: "Super Admin LeadTech",
//         read: 1,
//         write: 1,
//         create: 1,
//         delete: 1,
//         report: 1,
//         export: 1,
//       },
//       {
//         role: "Lead Tech Politician",
//         read: 1,
//         write: 1,
//         create: 1,
//         delete: 0,
//         report: 1,
//         export: 1,
//       },
//       {
//         role: "Lead Tech Volunteer",
//         read: 1,
//         write: 0,
//         create: 0,
//         delete: 0,
//         report: 0,
//         export: 0,
//       },
//     ],
//   };

//   console.log('Publishing form with data:', finalData);

//   fetch(`${API_BASE_URL}/api/method/leadtech_survey.leadtech_survey.create_survey_doctype.allow_doctype_creation`, {
//     method: "POST",
//     headers: {
//       "Authorization": `Token ${API_TOKEN}`,
//       "Content-Type": "application/json",
//       "Accept": "application/json",
//     },
//     body: JSON.stringify(finalData),
//   })
//     .then(async (res) => {
//       if (!res.ok) {
//         const errorText = await res.text();
//         throw new Error(`HTTP ${res.status}: ${errorText}`);
//       }
//       return res.json();
//     })
//     .then((res) => {
//       console.log("Publish success:", res);
//       showAlert("Form published successfully!");
//       createUserPermission(formName);
//       closePopup();
      
//       // Update publish status
//       const formData = JSON.parse(localStorage.getItem("formData") || "{}");
//       formData.isPublish = "1";
//       localStorage.setItem("formData", JSON.stringify(formData));
      
//       // 🔴 KEY CHANGE: Redirect to fresh create page after successful publish
//       setTimeout(() => {
//         newForm(); // Call the existing newForm function to clear everything
//       }, 500); // Small delay to show success message first
//     })
//     .catch((err) => {
//       console.error("Publish failed:", err);
//       alert("Failed to publish form: " + err.message);
//     });
// }
function publishForm() {
  const dataString = localStorage.getItem("formData");
  if (!dataString) {
    alert("No data to publish. Please save the form first.");
    return;
  }
  
  const data = JSON.parse(dataString);

  if (!data || !Array.isArray(data.questions)) {
    console.error("Data.questions is not an array");
    alert("Invalid form data structure");
    return;
  }

  const formName = data.name || document.getElementById("name").value;
  if (!formName) {
    alert("Please enter a form name");
    return;
  }

  const dynamicFields = [];

  // Add image field if exists
  if (data.Wel_image && data.Wel_image.url) {
    dynamicFields.push({
      fieldname: "image",
      fieldtype: "Image",
      label: "Image",
      options: data.Wel_image.url,
    });
  }

  // Add header field if exists
  if (data.header) {
    const headerFieldName =
      data.header
        .toLowerCase()
        .replace(/ /g, "_")
        .replace(/[^a-z_]/g, "") || "header";

    const { label, description } = splitLabelAndDescription(data.header);

    dynamicFields.push({
      fieldname: headerFieldName,
      fieldtype: "Heading",
      label: label,
      description: description,
      options: "",
    });
  }

  // Always add location field (mandatory)
  dynamicFields.push({
    fieldname: "location",
    fieldtype: "Geolocation",
    label: "Location",
    options: "",
    reqd: 1,
  });
  dynamicFields.push({
    fieldname: "survey_start_date",
    fieldtype: "Datetime",
    label: "Survey Start Date",
    options: "",
    reqd: 1,
  });
  dynamicFields.push({
    fieldname: "survey_end_date",
    fieldtype: "Datetime",
    label: "Survey End Date",
    options: "",
    reqd: 1,
  });
  dynamicFields.push({
    fieldname: "survey_duration",
    fieldtype: "Data",
    label: "Survey Duration",
    options: "",
    reqd: 1,
  });
   dynamicFields.push({
    fieldname: "enable_disable",
    fieldtype: "Check",
    label: "Enable Disable",
    options: "",
    reqd: 0,
  });

  // Always add audio field (mandatory)
  dynamicFields.push({
    fieldname: "audio",
    fieldtype: "Attach",
    label: "Audio",
    options: "Audio",
    reqd: 1,
  });

  // Process all questions
  data.questions.forEach((questionData, index) => {
    if (!questionData.questionName) return;

    let fieldType = "Data";
    let options = "";
    const reqd = questionData.mandatory ? 1 : 0;
    const { label, description } = splitLabelAndDescription(questionData.questionName);
    const fieldname = `q_${index + 1}`;

    // Map input types to Frappe fieldtypes
    switch (questionData.inputType) {
      case "drop_down":
        fieldType = "Select";
        options = questionData.options || "";
        dynamicFields.push({
          fieldname: fieldname,
          fieldtype: fieldType,
          label: label,
          description: description,
          options: options,
          reqd: reqd,
        });
        break;
        
      case "drop_down_other":
        // First field: The dropdown with options + "Others"
        let dropDownOptions = questionData.options ? questionData.options.split("\n") : [];
        dropDownOptions = dropDownOptions.map(opt => opt.trim()).filter(opt => opt);
        const hasOthers = dropDownOptions.some(opt => opt.toLowerCase() === 'others');
        if (!hasOthers) {
          dropDownOptions.push('Others');
        }
        
        // Push the dropdown field
        dynamicFields.push({
          fieldname: fieldname,
          fieldtype: "Select",
          label: label,
          description: description,
          options: dropDownOptions.join("\n"),
          reqd: reqd,
        });
        
        // Second field: The "Other" text input (Small Text field)
        dynamicFields.push({
          fieldname: "other_" + fieldname,
          fieldtype: "Small Text",
          label: "Other (please specify)",
          description: "Enter your answer if you selected 'Others' above",
          options: "",
          reqd: 0, // Usually not required
        });
        break;
        
      case "radio_button":
        fieldType = "Select";
        options = questionData.options || "";
        dynamicFields.push({
          fieldname: fieldname,
          fieldtype: fieldType,
          label: label,
          description: description,
          options: options,
          reqd: reqd,
        });
        break;
        
      case "radio_button_other":
        // First field: The radio options (as Select) with "Others"
        let radioOptions = questionData.options ? questionData.options.split("\n") : [];
        radioOptions = radioOptions.map(opt => opt.trim()).filter(opt => opt);
        const hasOthersRadio = radioOptions.some(opt => opt.toLowerCase() === 'others');
        if (!hasOthersRadio) {
          radioOptions.push('Others');
        }
        
        // Push the radio/select field
        dynamicFields.push({
          fieldname: fieldname,
          fieldtype: "Select",
          label: label,
          description: description,
          options: radioOptions.join("\n"),
          reqd: reqd,
        });
        
        // Second field: The "Other" text input
        dynamicFields.push({
          fieldname: "other_" + fieldname,
          fieldtype: "Small Text",
          label: "Other (please specify)",
          description: "Enter your answer if you selected 'Others' above",
          options: "",
          reqd: 0,
        });
        break;
        
      case "checkbox_list":
        fieldType = "MultiSelect";
        options = questionData.options || "";
        dynamicFields.push({
          fieldname: fieldname,
          fieldtype: fieldType,
          label: label,
          description: description,
          options: options,
          reqd: reqd,
        });
        break;
        
      case "text_block":
        fieldType = "Heading";
        dynamicFields.push({
          fieldname: fieldname,
          fieldtype: fieldType,
          label: label,
          description: description,
          options: "",
        });
        break;
      case "singleline_text_input":
        fieldType = "Data";
        dynamicFields.push({
          fieldname: fieldname,
          fieldtype: fieldType,
          label: label,
          description: description,
          options: "",
          reqd: reqd,
        });
        break;
      case "multiline_text_input":
        fieldType = "Long Text";
        dynamicFields.push({
          fieldname: fieldname,
          fieldtype: fieldType,
          label: label,
          description: description,
          options: "",
          reqd: reqd,
        });
        break;
      case "number_input":
        fieldType = "Int";
        dynamicFields.push({
          fieldname: fieldname,
          fieldtype: fieldType,
          label: label,
          description: description,
          options: "",
          reqd: reqd,
        });
        break;
      case "decimal_input":
        fieldType = "Float";
        dynamicFields.push({
          fieldname: fieldname,
          fieldtype: fieldType,
          label: label,
          description: description,
          options: "",
          reqd: reqd,
        });
        break;
      case "email":
        fieldType = "Data";
        options = "Email";
        dynamicFields.push({
          fieldname: fieldname,
          fieldtype: fieldType,
          label: label,
          description: description,
          options: options,
          reqd: reqd,
        });
        break;
      case "phone_number":
        fieldType = "Int";
        options = "Phone";
        dynamicFields.push({
          fieldname: fieldname,
          fieldtype: fieldType,
          label: label,
          description: description,
          options: options,
          reqd: reqd,
          unique: data.unique_number ? 1 : 0
        });
        break;
      case "date":
        fieldType = "Date";
        dynamicFields.push({
          fieldname: fieldname,
          fieldtype: fieldType,
          label: label,
          description: description,
          options: "",
          reqd: reqd,
        });
        break;
      case "time":
        fieldType = "Time";
        dynamicFields.push({
          fieldname: fieldname,
          fieldtype: fieldType,
          label: label,
          description: description,
          options: "",
          reqd: reqd,
        });
        break;
      case "date_time":
        fieldType = "Datetime";
        dynamicFields.push({
          fieldname: fieldname,
          fieldtype: fieldType,
          label: label,
          description: description,
          options: "",
          reqd: reqd,
        });
        break;
      case "photo_capture":
      case "record_video":
      case "record_audio":
        fieldType = "Attach";
        if (questionData.inputType === "record_audio") {
          options = "Audio";
        }
        dynamicFields.push({
          fieldname: fieldname,
          fieldtype: fieldType,
          label: label,
          description: description,
          options: options,
          reqd: reqd,
        });
        break;
      case "map_coordinates":
        fieldType = "Geolocation";
        dynamicFields.push({
          fieldname: fieldname,
          fieldtype: fieldType,
          label: label,
          description: description,
          options: "",
          reqd: reqd,
        });
        break;
      case "barcode_scanner":
        fieldType = "Barcode";
        dynamicFields.push({
          fieldname: fieldname,
          fieldtype: fieldType,
          label: label,
          description: description,
          options: "",
          reqd: reqd,
        });
        break;
      case "signature":
        fieldType = "Signature";
        dynamicFields.push({
          fieldname: fieldname,
          fieldtype: fieldType,
          label: label,
          description: description,
          options: "",
          reqd: reqd,
        });
        break;
      case "checkbox":
        fieldType = "Check";
        dynamicFields.push({
          fieldname: fieldname,
          fieldtype: fieldType,
          label: label,
          description: description,
          options: "",
          reqd: reqd,
        });
        break;
      case "rating":
        fieldType = "Rating";
        dynamicFields.push({
          fieldname: fieldname,
          fieldtype: fieldType,
          label: label,
          description: description,
          options: "",
          reqd: reqd,
        });
        break;
      case "group":
        fieldType = "Section Break";
        dynamicFields.push({
          fieldname: fieldname,
          fieldtype: fieldType,
          label: label,
          description: description,
          options: "",
        });
        break;
      default:
        fieldType = "Data";
        dynamicFields.push({
          fieldname: fieldname,
          fieldtype: fieldType,
          label: label,
          description: description,
          options: "",
          reqd: reqd,
        });
    }
  });

  // Add user field (mandatory)
  const fieldsArray = [
    {
      fieldname: "user",
      fieldtype: "Link",
      label: "User",
      options: "User",
      reqd: 1,
    },
    ...dynamicFields
  ];

  const finalData = {
    __newname: formName,
    module: "leadtech_survey",
    track_changes: 1,
    track_seen: 1,
    track_views: 1,
    custom: 1,
    naming_rule: "Expression (old style)",
    autoname: formName + ".######",
    name_case: "Title Case",
    allow_rename: 1,
    index_web_pages_for_search: 1,
    fields: fieldsArray,
    permissions: [
      {
        role: "Leadtech Survey Admin",
        read: 1,
        write: 1,
        create: 1,
        delete: 1,
        report: 1,
        export: 1,
      },
      {
        role: "Super Admin LeadTech",
        read: 1,
        write: 1,
        create: 1,
        delete: 1,
        report: 1,
        export: 1,
      },
    ],
  };

  console.log('Publishing form with data:', finalData);

  fetch(`${API_BASE_URL}/api/method/leadtech_survey.leadtech_survey.create_survey_doctype.allow_doctype_creation`, {
    method: "POST",
    headers: {
      "Authorization": `Token ${API_TOKEN}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(finalData),
  })
    .then(async (res) => {
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
      return res.json();
    })
    .then((res) => {
      console.log("Publish success:", res);
      showAlert("Form published successfully!");
      createUserPermission(formName);
      closePopup();
      
      // Update publish status
      const formData = JSON.parse(localStorage.getItem("formData") || "{}");
      formData.isPublish = "1";
      localStorage.setItem("formData", JSON.stringify(formData));
      
      // Redirect to fresh create page after successful publish
      setTimeout(() => {
        newForm(); // Call the existing newForm function to clear everything
      }, 500); // Small delay to show success message first
    })
    .catch((err) => {
      console.error("Publish failed:", err);
      alert("Failed to publish form: " + err.message);
    });
}

// Drag and Drop functionality
let draggedRow = null;

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
if (tableBody) {
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
}

// ==================== EVENT LISTENERS ====================

// File upload handler
document.addEventListener('DOMContentLoaded', function() {
  const welcomeImage = document.getElementById('welcome-image');
  if (welcomeImage) {
    welcomeImage.addEventListener('change', async function (event) {
      const fileInput = event.target;

      if (fileInput.files.length === 0) {
        console.error("No file selected.");
        return;
      }

      const file = fileInput.files[0];
      const fileName = file.name;
      
      // Show file name in the UI (optional)
      const fileLabel = document.querySelector('.file-name-label');
      if (fileLabel) {
        fileLabel.textContent = fileName;
      }
      
      try {
        Wimage = await uploadFile(file, fileName);
        console.log('File uploaded successfully:', Wimage);
        showAlert('File uploaded successfully!');
      } catch (error) {
        console.error("Failed to upload file:", error);
        alert('Failed to upload file: ' + error.message);
      }
    });
  }
});


document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('createSurveyForm');
  if (form) {
    form.addEventListener('submit', async function(event) {
      event.preventDefault();
      
      const screen2 = document.querySelector(".screen2");
      const screen1 = document.querySelector(".screen1");
      
      // Get form values
      name = document.getElementById("name").value.trim();
      header_text = document.getElementById("hypertext").value;
      
      // Get new field values
      start_survey = document.getElementById("start_survey")?.value || '';
      end_survey = document.getElementById("end_survey")?.value || '';
      survey_count = document.getElementById("survey_count")?.value || 0;
      
      audio_mandatory = document.getElementById("audio-capture")?.checked || false;
      location_mandatory = document.getElementById("location-capture")?.checked || false;
      unique_number = document.getElementById("unique_number")?.checked || false;
      
      // Get client and project values
      const clientId = document.getElementById("client-dropdown")?.value;
      const projectId = document.getElementById("project-dropdown")?.value;
      
      // Validate required fields
      const errors = [];
      if (!name) errors.push("Survey Name is required");
      if (!clientId) errors.push("Please select a client");
      if (!projectId) errors.push("Please select a project");
      
      // Validate new fields
      if (!start_survey) errors.push("Start Survey date is required");
      if (!end_survey) errors.push("End Survey date is required");
      if (!survey_count || survey_count <= 0) errors.push("Survey Count must be a positive number");
      
      // Validate date logic (end date should be after start date)
      if (start_survey && end_survey && new Date(end_survey) < new Date(start_survey)) {
        errors.push("End Survey date must be after Start Survey date");
      }
      
      if (errors.length > 0) {
        alert(errors.join("\n"));
        return;
      }
      
      // Show loading state
      const saveBtn = document.querySelector('.save-btn');
      if (!saveBtn) return;
      
      const originalText = saveBtn.textContent;
      saveBtn.textContent = 'Saving...';
      saveBtn.disabled = true;
      
      try {
        // Save to API first - PASS THE NEW FIELDS
        const result = await saveSurveyToAPI(name, projectId, start_survey, end_survey, survey_count);
        
        if (result.success) {
          // Save form data to localStorage (including new fields)
          const formData = {
            name: name,
            header: header_text,
            Wel_image: Wimage,
            start_survey: start_survey,
            end_survey: end_survey,
            survey_count: parseInt(survey_count, 10),
            loc_mandatory: location_mandatory,
            audio_mandatory: audio_mandatory,
            unique_number: unique_number,
            client_id: clientId,
            project_id: projectId,
            questions: [],
            isPublish: "0"
          };
          
          // Merge with existing questions if any
          const existingData = JSON.parse(localStorage.getItem('formData') || '{}');
          if (existingData.questions) {
            formData.questions = existingData.questions;
          }
          
          localStorage.setItem('formData', JSON.stringify(formData));
          
          // Set the name in screen2
          const nameDisplay = document.getElementById("name-display");
          if (nameDisplay) {
            nameDisplay.value = name;
          }
          
          // Clear any existing rows in the table (to remove default rows)
          const tableBody = document.querySelector("#tableBody");
          if (tableBody) {
            tableBody.innerHTML = "";
          }
          
          // Hide screen1 and show screen2
          if (screen1) screen1.style.display = "none";
          if (screen2) screen2.style.display = "block";
          
          // Clear localStorage selections
          localStorage.removeItem('selectedClient');
          localStorage.removeItem('selectedProject');
          
          showAlert('Survey saved successfully!');
          console.log('Saved with dates:', start_survey, end_survey, 'count:', survey_count);
        } else {
          alert(`Failed to save survey: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error saving survey:', error);
        alert('An error occurred while saving. Please try again.');
      } finally {
        // Restore button state
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
      }
    });
  }
});

// Cancel function
function CancelToggle() {
  const screen1 = document.querySelector(".screen1");
  const screen2 = document.querySelector(".screen2");
  
  if (screen1) screen1.style.display = "none";
  if (screen2) screen2.style.display = "block";
}

// Edit function
function Edit() {
  const screen1 = document.querySelector(".screen1");
  const screen2 = document.querySelector(".screen2");
  
  if (screen1) screen1.style.display = "block";
  if (screen2) screen2.style.display = "none";
}

// Create user permission
function createUserPermission(doctypeName) {
  const userPermissionData = {
    doctype: "User Permission",
    user: "Administrator",
    allow: "DocType",
    for_value: doctypeName,
    applicable_for: doctypeName,
    is_default: 1,
  };

  return fetch(`${API_BASE_URL}/api/resource/User Permission`, {
    method: "POST",
    headers: {
      "Authorization": `Token ${API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userPermissionData),
  })
    .then((res) => {
      if (!res.ok) {
        console.warn("User Permission creation failed, but form was published");
        return Promise.resolve();
      }
      return res.json();
    })
    .catch((err) => {
      console.warn("User Permission creation error (non-critical):", err);
      return Promise.resolve();
    });
}

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', function() {
  // --- Clear any existing data on page load for a fresh start ---
  localStorage.removeItem("selectedClient");
  localStorage.removeItem("selectedProject");
  
  // --- Disable browser autofill on the entire form ---
  const form = document.getElementById('createSurveyForm');
  if (form) {
    form.setAttribute('autocomplete', 'off');
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => input.setAttribute('autocomplete', 'off'));
  }

  // Fetch clients and projects
  fetchClientsAndProjects();
  
  // Add event listeners to dropdowns
  const clientDropdown = document.getElementById('client-dropdown');
  const projectDropdown = document.getElementById('project-dropdown');
  
  if (clientDropdown) {
    clientDropdown.addEventListener('change', onClientChange);
  }
  
  if (projectDropdown) {
    projectDropdown.addEventListener('change', onProjectChange);
  }
  
  // Check if we're in edit mode
  const urlParams = new URLSearchParams(window.location.search);
  const flag = urlParams.get("flag") || "";
  const surveyName = urlParams.get("Survey") || "";
  
  if (flag === "C" && surveyName) {
    const nameInput = document.getElementById("name");
    if (nameInput) {
      nameInput.value = surveyName;
    }
  }
  
  // DON'T load saved form data - we want a fresh form
  // loadFormData(); // Commented out
  
  // If no survey is being edited and no saved data, clear the table to remove any default rows from HTML
  if (!surveyParam && !localStorage.getItem('formData')) {
    const tableBody = document.querySelector("#tableBody");
    if (tableBody) {
      tableBody.innerHTML = "";
    }
  }

  // --- NEW: If we just created a new form, force clear all fields again (overrides autofill) ---
  if (sessionStorage.getItem('newForm') === 'true') {
    // Immediate clear
    const nameField = document.getElementById("name");
    if (nameField) {
      nameField.value = "";
      nameField.defaultValue = ""; // also set defaultValue
    }
    document.getElementById("hypertext").value = "";
    document.getElementById("hypertext").defaultValue = "";
    document.getElementById("location-capture").checked = false;
    document.getElementById("audio-capture").checked = false;
    document.getElementById("unique_number").checked = false;

    // Uncheck radio buttons
    document.querySelectorAll('input[name="slayout"]').forEach(radio => {
      radio.checked = false;
    });

    const clientDropdown = document.getElementById('client-dropdown');
    if (clientDropdown) {
      clientDropdown.value = "";
      // Also clear any selected option's default selection
      for (let opt of clientDropdown.options) opt.selected = false;
    }

    const projectDropdown = document.getElementById('project-dropdown');
    if (projectDropdown) {
      projectDropdown.innerHTML = '<option value="">Select client first</option>';
      projectDropdown.disabled = true;
    }

    // Remove the flag
    sessionStorage.removeItem('newForm');

    // Delayed second clear to catch any late autofill
    setTimeout(() => {
      if (nameField) nameField.value = "";
      document.getElementById("hypertext").value = "";
      document.getElementById("location-capture").checked = false;
      document.getElementById("audio-capture").checked = false;
      document.getElementById("unique_number").checked = false;
      document.querySelectorAll('input[name="slayout"]').forEach(radio => {
        radio.checked = false;
      });
      const clientDropdown = document.getElementById('client-dropdown');
      if (clientDropdown) clientDropdown.value = "";
      const projectDropdown = document.getElementById('project-dropdown');
      if (projectDropdown) {
        projectDropdown.innerHTML = '<option value="">Select client first</option>';
        projectDropdown.disabled = true;
      }
    }, 150);
  }
  
  // Update button display
  updateButtonDisplay();
});

// Show alert function
function showAlert(message) {
  const alert = document.getElementById('copyAlert');
  const alertMessage = document.getElementById('alertMessage');
  
  if (alert && alertMessage) {
    alertMessage.textContent = message;
    alert.classList.add('show');

    setTimeout(() => {
      alert.classList.remove('show');
    }, 3000);
  } else {
    alert(message);
  }
}

function closeAlert() {
  const alert = document.getElementById('copyAlert');
  if (alert) {
    alert.classList.remove('show');
  }
}