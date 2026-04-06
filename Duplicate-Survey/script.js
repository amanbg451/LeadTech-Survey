function persistFormState() {
  localStorage.setItem("formData", JSON.stringify(FORM_STATE));
}

let FORM_STATE = {
  name: "",
  header: "",
  Wel_image: "",
  loop: false,
  loc_mandatory: false,
  audio_mandatory: false,
  unique_number: false,
  start_survey: "", // NEW - Survey start date
  end_survey: "", // NEW - Survey end date
  survey_count: 0,
  questions: [],
};
const API_TOKEN = "405e0af40f3d04a:885b55cc21d37d2";

const LOCATION_MASTER = {
  "Uttar Pradesh": {
    Lucknow: {
      "Bakshi Ka Talab": ["Village A", "Village B"],
      Malihabad: ["Village C", "Village D"],
    },
    Kanpur: {
      Bilhaur: ["Village E", "Village F"],
    },
  },

  Delhi: {
    "New Delhi": {
      Central: ["Connaught Place", "Karol Bagh"],
    },
  },
};

const API_BASE = window.location.origin;
console.log("base_api:", API_BASE);

(function () {
  const getCookie = (name) =>
    document.cookie
      .split("; ")
      .find((c) => c.startsWith(name + "="))
      ?.split("=")[1];
  const fullName = decodeURIComponent(getCookie("full_name") || "");
  const systemUser = decodeURIComponent(getCookie("system_user") || "");
  const userId = decodeURIComponent(getCookie("user_id") || "");

  console.log("fullName:", fullName);
  console.log("userId:", userId);
  console.log("systemUser:", systemUser);
  console.log("base_api:", window.location.origin);
  const isAuthorized =
    (fullName === "Super Admin Leadtech" &&
      systemUser === "yes" &&
      userId === "leadtech.superadmin@gmail.com") ||
    (fullName === "Electoral%20Commission" &&
      systemUser === "yes" &&
      userId === "sunil@leadtech.in") ||
    userId === "zainabnaiyer@gmail.com" ||
    (fullName === "Admin New" &&
      systemUser === "yes" &&
      userId === "superadminleadtechnew@gmail.com");

  console.log("Admin%20New:", isAuthorized);

  if (!isAuthorized) {
    document.getElementById("security").style.display = "flex";
    setTimeout(function () {
      alert("Unauthorized access! Redirecting to the login page.");
      window.location.href = `${API_BASE}/survey/login`;
    }, 2000);
  } else {
    document.getElementById("security").style.display = "none";
    document.getElementById("to_show").style.display = "block";
  }
})();

function enableUnloadWarning() {
  window.onbeforeunload = function () {
    return "Are you sure you want to leave this page?";
  };
}

function disableUnloadWarning() {
  window.onbeforeunload = null;
}

enableUnloadWarning();
const surveyParam = new URLSearchParams(window.location.search).get("Survey");

function PopulateRows(name) {
  let localStorageData = JSON.parse(localStorage.getItem("formData"));
  console.log(localStorageData);

  if (localStorageData && localStorageData.name === name) {
    loadFormData();
  } else {
    const rowsContainer = document.getElementById("tableBody");
    rowsContainer.innerHTML = "";

    fetch(`${API_BASE}/api/resource/DocType/${name}?fields=["*"]`, {
      method: "GET",
      headers: {
        Authorization: "Token 405e0af40f3d04a:885b55cc21d37d2",
        Cookie:
          "full_name=Guest; sid=Guest; system_user=no; user_id=Guest; user_image=",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Response:", data);

        console.log("Response:", data.data.fields);
        data.data.fields.forEach((item) => {
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
        console.error("Error:", error);
      });
  }
}

function addRow2(data) {
  console.log("API Field Data:", data);

  let variable = "select";

  const isMandatory =
    data.reqd === 1 || data.reqd === "1" || data.reqd === true;

  const fieldType = (data.fieldtype || "").trim();
  const fieldOptions = (data.options || "").trim();

  if (fieldType === "Select") variable = "drop_down";
  else if (fieldType === "MultiSelect") variable = "checkbox_list";
  else if (fieldType === "Int") variable = "number_input";
  else if (fieldType === "Float" || fieldType === "Currency")
    variable = "decimal_input";
  else if (fieldType === "Date") variable = "date";
  else if (fieldType === "Time") variable = "time";
  else if (fieldType === "Geolocation") variable = "geo_location";
  else if (fieldType === "Attach") {
    if (fieldOptions.toLowerCase().includes("audio")) variable = "audio_upload";
    else variable = "photo_capture";
  } else if (fieldType === "Check") variable = "checkbox";
  else if (fieldType === "Rating") variable = "rating";
  else if (fieldType === "Section Break" || fieldType === "Heading")
    variable = "text_block";
  else if (fieldType === "Long Text" || fieldType === "Text")
    variable = "multiline_text_input";
  else if (fieldType === "Data") {
    if (fieldOptions.toLowerCase() === "email") variable = "email";
    else if (fieldOptions.toLowerCase() === "phone") variable = "phone_number";
    else variable = "singleline_text_input";
  }

  FORM_STATE.questions.push({
    inputType: variable,
    questionName: data.label || "",
    options: fieldOptions || "",
    rowoptions: "",
    coloptions: "",
    mandatory: isMandatory,
    hidden: data.hidden ? true : false,
    system: data.system ? true : false,
  });

  persistFormState();
  renderTable();
}
let name = {};
let header_text = {};
let Wimage = {};
let loop_survey = {};
let location_mandatory = {};
let unique_number = {};
let audio_mandatory = {};

function preview() {
  const formName = document.getElementById("name")?.value?.trim() || "";

  const tableData = [...FORM_STATE.questions];
  console.log("Preview Data:", tableData);

  let html = ``;

  tableData.forEach((item) => {
    switch (item.inputType) {
      case "drop_down":
      case "drop_down_dependent": {
        const fieldId =
          item.fieldname || item.questionName.replace(/\s+/g, "_");

        const dropDownOptions = (item.options || "")
          .split("\n")
          .map((option) => option.trim())
          .filter((option) => option)
          .map((option) => `<option value="${option}">${option}</option>`)
          .join("");

        html += `
          <div class="form-group"
            id="wrap_${fieldId}"
            data-depends-field="${item.depends_on_field || ""}"
            data-depends-value="${item.depends_on_value || ""}"
            style="${
              item.inputType === "drop_down_dependent"
                ? "display:none"
                : "display:block"
            }">

            <label>${item.questionName}</label>
            <select id="${fieldId}" onchange="handleDependencyChange()">
              <option value="">Select</option>
              ${dropDownOptions}
            </select>
          </div>
        `;
        break;
      }

      case "drop_down_other": {
        const fieldId =
          item.fieldname || item.questionName.replace(/\s+/g, "_");

        let optionsArr = (item.options || "")
          .split("\n")
          .map((o) => o.trim())
          .filter((o) => o);

        if (item.hasOthers) {
          optionsArr.push("Others");
        }

        const dropDownOptions = optionsArr
          .map((option) => `<option value="${option}">${option}</option>`)
          .join("");

        html += `
          <div class="form-group">
            <label>${item.questionName}</label>

            <select id="${fieldId}" onchange="handleOtherDropdown('${fieldId}')">
              <option value="">Select</option>
              ${dropDownOptions}
            </select>

            <input
              type="text"
              id="${fieldId}_other"
              placeholder="Please specify..."
              style="display:none; margin-top:8px;"
            />
          </div>
        `;
        break;
      }

      case "singleline_text_input":
        html += `
          <div class="form-group">
            <p>${item.questionName}</p>
            <input type="text" placeholder="Enter text">
          </div>
        `;
        break;

      case "multiline_text_input":
        html += `
          <div class="form-group">
            <p>${item.questionName}</p>
            <textarea rows="4" cols="50" placeholder="Enter comment"></textarea>
          </div>
        `;
        break;

      case "text_block":
        html += `
          <div class="form-group">
            <h3>${item.questionName}</h3>
          </div>
        `;
        break;

      case "email":
        html += `
          <div class="form-group">
            <p>${item.questionName}</p>
            <input type="text" placeholder="Enter email">
          </div>
        `;
        break;

      case "phone_number":
        html += `
          <div class="form-group">
            <p>${item.questionName}</p>
            <input type="tel" placeholder="Enter phone number">
          </div>
        `;
        break;

      case "date":
        html += `
          <div class="form-group">
            <p>${item.questionName}</p>
            <input type="date">
          </div>
        `;
        break;

      case "time":
        html += `
          <div class="form-group">
            <p>${item.questionName}</p>
            <input type="time">
          </div>
        `;
        break;

      case "date_time":
        html += `
          <div class="form-group">
            <p>${item.questionName}</p>
            <input type="datetime-local">
          </div>
        `;
        break;

      case "photo_capture":
        html += `
          <div class="form-group">
            <p>${item.questionName}</p>
            <input type="file" accept="image/*" capture="environment">
          </div>
        `;
        break;

      //   case "map_coordinates":
      case "geo_location":
        html += `
          <div class="form-group">
            <p>${item.questionName}</p>
            <button type="button" id="getLocation">Get Location</button>
            <p id="locationDisplay"></p>
          </div>
        `;
        break;

      case "radio_button": {
        const radioButtonOptions = (item.options || "")
          .split("\n")
          .map((option) => option.trim())
          .filter((option) => option)
          .map(
            (option) => `
              <div class="form-check">
                <input class="form-check-input" type="radio" name="${item.questionName}" value="${option}">
                <label class="form-check-label">${option}</label>
              </div>
            `,
          )
          .join("");

        html += `
          <div class="form-group">
            <label>${item.questionName}</label>
            ${radioButtonOptions}
          </div>
        `;
        break;
      }

      case "checkbox_list": {
        const checkButtonOptions = (item.options || "")
          .split("\n")
          .map((option) => option.trim())
          .filter((option) => option)
          .map(
            (option) => `
              <div class="form-check">
                <input class="form-check-input" type="checkbox" name="${item.questionName}" value="${option}">
                <label class="form-check-label">${option}</label>
              </div>
            `,
          )
          .join("");

        html += `
          <div class="form-group">
            <label>${item.questionName}</label>
            ${checkButtonOptions}
          </div>
        `;
        break;
      }

      case "number_input":
      case "decimal_input":
        html += `
          <div class="form-group">
            <label>${item.questionName}</label>
            <input type="number" ${item.inputType === "decimal_input" ? 'step="any"' : ""}>
          </div>
        `;
        break;

      default:
        console.warn("Unknown inputType:", item.inputType);
        break;
    }
  });

  document.getElementById("modalContent").innerHTML = html;
  document.getElementById("previewModal").style.display = "flex";

  initStateDropdown();
  setTimeout(handleDependencyChange, 0);
}

function handleOtherDropdown(fieldId) {
  const selectEl = document.getElementById(fieldId);
  const otherInput = document.getElementById(fieldId + "_other");

  if (!selectEl || !otherInput) return;

  //   if (selectEl.value.toLowerCase() === "other") {
  if (selectEl.value.toLowerCase() === "others") {
    otherInput.style.display = "block";
    otherInput.required = true;
  } else {
    otherInput.style.display = "none";
    otherInput.required = false;
    otherInput.value = "";
  }
}

function updateOptions(selectId, options) {
  const select = document.getElementById(selectId);
  if (!select) return;

  select.innerHTML =
    `<option value="">Select</option>` +
    options.map((o) => `<option value="${o}">${o}</option>`).join("");
}

function initStateDropdown() {
  updateOptions("q_1", Object.keys(LOCATION_MASTER));
}
function handleDependencyChange() {
  FORM_STATE.questions.forEach((q, index) => {
    if (!q.depends_on_field) return;

    const currentFieldId = `q_${index + 1}`;
    const parentFieldId = q.depends_on_field;

    const parentValue = document.getElementById(parentFieldId)?.value || "";

    const wrapper = document.getElementById(`wrap_${currentFieldId}`);

    if (!wrapper) return;

    if (parentValue === q.depends_on_value) {
      wrapper.style.display = "block";
    } else {
      wrapper.style.display = "none";
    }
  });
}

function closeModal() {
  document.getElementById("previewModal").style.display = "none";
}

function showRecordOption() {
  document.getElementById("pop_record").style.display = "block";
}

function toggleRecording() {
  let startButton = document.getElementById("startRecording");
  let isRecording = startButton.textContent === "Stop Recording";

  if (isRecording) {
    stopRecording();
    startButton.textContent = "Start Recording";
  } else {
    startRecording();
    startButton.textContent = "Stop Recording";
  }
}

function updateForm() {
  console.log("updated");
}

function newForm() {
  localStorage.removeItem("formData");
  window.location.reload();
}

function loadFormData() {
  const saved = JSON.parse(localStorage.getItem("formData"));
  if (!saved) return;

  FORM_STATE = saved;
  renderTable();
}

function saveForm() {
  // Get the new field values from UI
  const startSurvey = document.getElementById("start_survey")?.value || "";
  const endSurvey = document.getElementById("end_survey")?.value || "";
  const surveyCount = document.getElementById("survey_count")?.value || 0;

  // Make sure FORM_STATE has the isPublish flag
  if (!FORM_STATE.hasOwnProperty("isPublish")) {
    FORM_STATE.isPublish = "0";
  }

  // Update FORM_STATE with new fields
  FORM_STATE.start_survey = startSurvey;
  FORM_STATE.end_survey = endSurvey;
  FORM_STATE.survey_count = parseInt(surveyCount, 10);

  localStorage.setItem("formData", JSON.stringify(FORM_STATE));

  document.getElementById("overlay").style.display = "block";
  document.getElementById("popup").style.display = "block";

  updateButtonDisplay();
}

function updateButtonDisplay() {
  const formData = JSON.parse(localStorage.getItem("formData") || "{}");
  const isPublish = formData.isPublish || "0";

  console.log("updateButtonDisplay - isPublish:", isPublish); // Debug log

  const publishUpdateBtn = document.getElementById("publish_update_btn");

  if (!publishUpdateBtn) {
    console.error("publish_update_btn not found!");
    return;
  }

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

function addRow() {
  FORM_STATE.questions.push({
    inputType: "select",
    questionName: "",
    options: "",
    rowoptions: "",
    coloptions: "",
    mandatory: false,
  });

  persistFormState();
  renderTable();
}

function renderTable() {
  const tableBody = document.getElementById("tableBody");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  const visibleQuestions = FORM_STATE.questions.filter((q) => !q.hidden);

  visibleQuestions.forEach((q, visibleIndex) => {
    const realIndex = getRealIndexFromVisibleIndex(visibleIndex);

    const tr = document.createElement("tr");
    tr.className = "draggable";
    tr.draggable = true;

    tr.innerHTML = `
      <td>
        <select onchange="onTypeChangeVisible(${visibleIndex}, this.value)">
          ${getTypeOptions(q.inputType)}
        </select>
      </td>

      <td class="formatCell">
        ${renderFormatCellVisible(q, visibleIndex)}
      </td>

      <td>
        <input type="checkbox"
          ${q.mandatory ? "checked" : ""}
          onchange="visibleQuestionsMandatoryUpdate(${visibleIndex}, this.checked)"
        />
      </td>

      <td>
        <button onclick="removeVisibleRow(${visibleIndex})">Remove</button>
      </td>
    `;

    tableBody.appendChild(tr);
  });

  console.log(
    "✅ renderTable FIXED: mandatory values",
    FORM_STATE.questions.map((q) => ({
      q: q.questionName,
      mandatory: q.mandatory,
      hidden: q.hidden,
    })),
  );
}

function updateMandatory(realIndex, checked) {
  if (!FORM_STATE.questions[realIndex]) return;

  FORM_STATE.questions[realIndex].mandatory = checked;

  console.log("✅ Mandatory Updated:", {
    realIndex,
    question: FORM_STATE.questions[realIndex].questionName,
    mandatory: FORM_STATE.questions[realIndex].mandatory,
  });
}
function getQuestionOptions(currentIndex) {
  return FORM_STATE.questions
    .map((q, i) => {
      if (i >= currentIndex) return "";
      return `<option value="q_${i + 1}">${q.questionName || `Question ${i + 1}`}</option>`;
    })
    .join("");
}

function renderFormatCell(q, index) {
  let html = `
    <input type="text"
      placeholder="Question"
      value="${q.questionName || ""}"
      oninput="FORM_STATE.questions[${index}].questionName = this.value"
    />
  `;
  if (
    [
      "drop_down",
      "drop_down_other",
      "radio_button",
      "checkbox_list",
      "radio_button_other",
      "drop_down_dependent",
    ].includes(q.inputType)
  ) {
    html += `
      <textarea
        placeholder="Options (one per line)"
        oninput="FORM_STATE.questions[${index}].options = this.value"
      >${q.options || ""}</textarea>
    `;
    if (q.inputType === "drop_down_dependent") {
      html += `
    <div style="margin-top:8px">
      <label style="font-size:12px">Depends on Question</label>
      <select
        onchange="FORM_STATE.questions[${index}].depends_on_field = this.value"
      >
        <option value="">-- Select Question --</option>
        ${getQuestionOptions(index)}
      </select>
    </div>

    <div style="margin-top:6px">
      <label style="font-size:12px">Show when answer equals</label>
      <input
        type="text"
        placeholder="e.g. Uttar Pradesh"
        value="${q.depends_on_value || ""}"
        oninput="FORM_STATE.questions[${index}].depends_on_value = this.value"
      />
    </div>
  `;
    }
  }

  if (["drop_down_grid", "checkbox_grid", "data_grid"].includes(q.inputType)) {
    html += `
      <textarea placeholder="Row Options"
        oninput="FORM_STATE.questions[${index}].rowoptions = this.value"
      >${q.rowoptions || ""}</textarea>

      <textarea placeholder="Column Options"
        oninput="FORM_STATE.questions[${index}].coloptions = this.value"
      >${q.coloptions || ""}</textarea>
    `;
  }

  return html;
}

function getVisibleQuestions() {
  return FORM_STATE.questions.filter((q) => !q.hidden);
}

function getRealIndexFromVisibleIndex(visibleIndex) {
  const visibleQuestions = getVisibleQuestions();
  const target = visibleQuestions[visibleIndex];
  return FORM_STATE.questions.findIndex((q) => q === target);
}

function onTypeChangeVisible(visibleIndex, value) {
  const realIndex = getRealIndexFromVisibleIndex(visibleIndex);
  if (realIndex === -1) return;

  FORM_STATE.questions[realIndex].inputType = value;
  renderTable();
}

function renderFormatCellVisible(q, visibleIndex) {
  const realIndex = getRealIndexFromVisibleIndex(visibleIndex);
  if (realIndex === -1) return "";

  let html = `
    <input type="text"
        placeholder="Question"
        value="${q.questionName || ""}"
        oninput="FORM_STATE.questions[${realIndex}].questionName = this.value; persistFormState();"
    />
    <br>
    <textarea
        placeholder="Description (full text for long labels)"
        oninput="FORM_STATE.questions[${realIndex}].description = this.value; persistFormState();"
        style="width:100%; margin-top:5px;"
    >${q.description || ""}</textarea>
`;
  if (
    [
      "drop_down",
      "drop_down_other",
      "radio_button",
      "checkbox_list",
      "radio_button_other",
      "drop_down_dependent",
    ].includes(q.inputType)
  ) {
    html += `
      <textarea
        placeholder="Options (one per line)"
        oninput="FORM_STATE.questions[${realIndex}].options = this.value"
      >${q.options || ""}</textarea>
    `;
    if (q.inputType === "drop_down_dependent") {
      html += `
        <div style="margin-top:8px">
          <label style="font-size:12px">Depends on Question</label>
          <select
            onchange="FORM_STATE.questions[${realIndex}].depends_on_field = this.value"
          >
            <option value="">-- Select Question --</option>
            ${getQuestionOptions(realIndex)}
          </select>
        </div>

        <div style="margin-top:6px">
          <label style="font-size:12px">Show when answer equals</label>
          <input type="text"
            placeholder="e.g. Uttar Pradesh"
            value="${q.depends_on_value || ""}"
            oninput="FORM_STATE.questions[${realIndex}].depends_on_value = this.value"
          />
        </div>
      `;
    }
  }

  if (["drop_down_grid", "checkbox_grid", "data_grid"].includes(q.inputType)) {
    html += `
      <textarea placeholder="Row Options"
        oninput="FORM_STATE.questions[${realIndex}].rowoptions = this.value"
      >${q.rowoptions || ""}</textarea>

      <textarea placeholder="Column Options"
        oninput="FORM_STATE.questions[${realIndex}].coloptions = this.value"
      >${q.coloptions || ""}</textarea>
    `;
  }

  return html;
}

function visibleQuestionsMandatoryUpdate(visibleIndex, checked) {
  const visibleQuestions = FORM_STATE.questions.filter((q) => !q.hidden);
  const targetQuestion = visibleQuestions[visibleIndex];

  const realIndex = FORM_STATE.questions.findIndex((q) => q === targetQuestion);
  if (realIndex === -1) return;

  FORM_STATE.questions[realIndex].mandatory = checked;

  persistFormState();

  console.log("✅ Mandatory Updated:", {
    visibleIndex,
    realIndex,
    question: FORM_STATE.questions[realIndex].questionName,
    mandatory: FORM_STATE.questions[realIndex].mandatory,
  });
}

function removeVisibleRow(visibleIndex) {
  if (confirm("Delete this question?")) {
    const realIndex = getRealIndexFromVisibleIndex(visibleIndex);
    FORM_STATE.questions.splice(realIndex, 1);
    renderTable();
  }
}

function onTypeChange(index, value) {
  FORM_STATE.questions[index].inputType = value;
  renderTable();
}

function removeRow(index) {
  if (confirm("Delete this question?")) {
    FORM_STATE.questions.splice(index, 1);
    renderTable();
  }
}

function getTypeOptions(selected) {
  const types = [
    "select",
    "drop_down",
    "drop_down_dependent",
    "group",
    "drop_down_other",
    "text_block",
    "singleline_text_input",
    "multiline_text_input",
    "number_input",
    "decimal_input",
    "email",
    "phone_number",
    "radio_button",
    "radio_button_other",
    "checkbox_list",
    "checkbox",
    "date",
    "time",
    "photo_capture",
    "record_audio",
    // "map_coordinates",
    "geo_location",
    "contact",
    "address",
    "drop_down_grid",
    "checkbox_grid",
    "data_grid",
  ];

  return types
    .map(
      (t) =>
        `<option value="${t}" ${t === selected ? "selected" : ""}>
      ${t.replaceAll("_", " ")}
    </option>`,
    )
    .join("");
}

function closePopup() {
  document.getElementById("popup").style.display = "none";
  document.getElementById("overlay").style.display = "none";
  console.log(localStorage.getItem("formData"));
}

function generateFieldname(question, index, existingFields = []) {
  if (!question || !question.questionName) {
    return `field_${index + 1}`;
  }

  // Convert question to lowercase, replace spaces with underscores, remove special characters
  let baseFieldname = question.questionName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "") // Remove special characters
    .replace(/\s+/g, "_") // Replace spaces with underscore
    .substring(0, 40); // Limit length

  // If base fieldname is empty after cleaning, use default
  if (!baseFieldname) {
    baseFieldname = `field_${index + 1}`;
  }

  // Check if this fieldname already exists in existing fields
  let fieldname = baseFieldname;
  let counter = 1;

  while (existingFields.includes(fieldname)) {
    fieldname = `${baseFieldname}_${counter}`;
    counter++;
  }

  return fieldname;
}

async function publishForm() {
  console.log("Publish triggered");

  const data = JSON.parse(localStorage.getItem("formData"));
  if (!data || !data.name) {
    alert("Please save survey details first");
    return;
  }

  console.log("Survey Name being published:", data.name);

  // Build the fields array like the working code
  const fieldsArray = [];

  // Add header field if exists
  if (data.header && data.header.trim()) {
    fieldsArray.push({
      fieldname: "header",
      fieldtype: "Heading",
      label: data.header,
      description: "",
      options: "",
    });
  }

  // Add welcome image if exists
  if (data.Wel_image && data.Wel_image.url) {
    fieldsArray.push({
      fieldname: "welcome_image",
      fieldtype: "Image",
      label: "Welcome Image",
      options: data.Wel_image.url,
    });
  }

  // Add location field if mandatory
  if (data.loc_mandatory) {
    fieldsArray.push({
      fieldname: "location",
      fieldtype: "Geolocation",
      label: "Location",
      options: "",
      reqd: data.loc_mandatory ? 1 : 0,
    });
  }

  // Add audio field if mandatory
  if (data.audio_mandatory) {
    fieldsArray.push({
      fieldname: "audio",
      fieldtype: "Attach",
      label: "Audio",
      options: "Audio",
      reqd: data.audio_mandatory ? 1 : 0,
    });
  }

  // Add unique number field if enabled
  if (data.unique_number) {
    fieldsArray.push({
      fieldname: "unique_number",
      fieldtype: "Data",
      label: "Unique Number",
      options: "",
      reqd: 1,
      unique: 1,
    });
  }

  // NEW: Add survey date fields (always added like in working code)
  fieldsArray.push({
    fieldname: "survey_start_date",
    fieldtype: "Datetime",
    label: "Survey Start Date",
    options: "",
    reqd: 1,
  });

  fieldsArray.push({
    fieldname: "survey_end_date",
    fieldtype: "Datetime",
    label: "Survey End Date",
    options: "",
    reqd: 1,
  });

  fieldsArray.push({
    fieldname: "survey_duration",
    fieldtype: "Data",
    label: "Survey Duration",
    options: "",
    reqd: 1,
  });

  // Filter out system questions before processing
  const regularQuestions = data.questions.filter((q) => {
    // Skip system questions that are only for UI display
    if (q.system === true) return false;
    // Skip by question name if they match system fields
    if (q.questionName === "User" && q.inputType === "user") return false;
    if (q.questionName === "Geo Location" && q.inputType === "geo_location")
      return false;
    if (q.questionName === "Audio Upload" && q.inputType === "audio_upload")
      return false;
    if (q.questionName === "Unique Number" && q.inputType === "number_input")
      return false;
    return true;
  });

  console.log("Regular questions to publish:", regularQuestions.length);
  console.log(
    "Skipped system questions:",
    data.questions.length - regularQuestions.length,
  );

  // Process only regular questions
  regularQuestions.forEach((q, index) => {
    if (!q.questionName) return;

    const reqd = q.mandatory ? 1 : 0;
    const fieldname = `q_${index + 1}`;

    // CRITICAL FIX: Split long labels (>140 chars) into label and description
    let label = q.questionName;
    let description = q.description || "";

    // Check if label exceeds 140 characters
    if (label.length > 140) {
      // First 140 chars go to label (without "...")
      label = label.substring(0, 140);

      // Remaining chars go to description
      const remainingText = q.questionName.substring(140);

      // If there's already description content, combine
      if (description && description.trim()) {
        description = remainingText + "\n\n" + description;
      } else {
        description = remainingText;
      }

      console.log(`📝 Split long label for ${fieldname}:`, {
        original_length: q.questionName.length,
        label_length: label.length,
        description_length: description.length,
      });
    }

    // Handle different input types
    switch (q.inputType) {
      case "drop_down":
        fieldsArray.push({
          fieldname: fieldname,
          fieldtype: "Select",
          label: label,
          description: description,
          options: q.options || "",
          reqd: reqd,
        });
        break;

      case "drop_down_other":
        let dropDownOptions = q.options ? q.options.split("\n") : [];
        dropDownOptions = dropDownOptions
          .map((opt) => opt.trim())
          .filter((opt) => opt);
        const hasOthers = dropDownOptions.some(
          (opt) => opt.toLowerCase() === "others",
        );
        if (!hasOthers) {
          dropDownOptions.push("Others");
        }

        fieldsArray.push({
          fieldname: fieldname,
          fieldtype: "Select",
          label: label,
          description: description,
          options: dropDownOptions.join("\n"),
          reqd: reqd,
        });

        fieldsArray.push({
          fieldname: `other_${fieldname}`,
          fieldtype: "Small Text",
          label: "Other (please specify)",
          description: "Enter your answer if you selected 'Others' above",
          options: "",
          reqd: 0,
        });
        break;

      // ... rest of your switch cases remain the same ...
      case "radio_button":
        fieldsArray.push({
          fieldname: fieldname,
          fieldtype: "Select",
          label: label,
          description: description,
          options: q.options || "",
          reqd: reqd,
        });
        break;

      case "checkbox_list":
        fieldsArray.push({
          fieldname: fieldname,
          fieldtype: "MultiSelect",
          label: label,
          description: description,
          options: q.options || "",
          reqd: reqd,
        });
        break;

      case "text_block":
        fieldsArray.push({
          fieldname: fieldname,
          fieldtype: "Heading",
          label: label,
          description: description,
          options: "",
        });
        break;

      case "singleline_text_input":
        fieldsArray.push({
          fieldname: fieldname,
          fieldtype: "Data",
          label: label,
          description: description,
          options: "",
          reqd: reqd,
        });
        break;

      case "multiline_text_input":
        fieldsArray.push({
          fieldname: fieldname,
          fieldtype: "Long Text",
          label: label,
          description: description,
          options: "",
          reqd: reqd,
        });
        break;

      case "number_input":
        fieldsArray.push({
          fieldname: fieldname,
          fieldtype: "Int",
          label: label,
          description: description,
          options: "",
          reqd: reqd,
        });
        break;

      case "decimal_input":
        fieldsArray.push({
          fieldname: fieldname,
          fieldtype: "Float",
          label: label,
          description: description,
          options: "",
          reqd: reqd,
        });
        break;

      case "email":
        fieldsArray.push({
          fieldname: fieldname,
          fieldtype: "Data",
          label: label,
          description: description,
          options: "Email",
          reqd: reqd,
        });
        break;

      case "phone_number":
        fieldsArray.push({
          fieldname: fieldname,
          fieldtype: "Data",
          label: label,
          description: description,
          options: "Phone",
          reqd: reqd,
        });
        break;

      case "date":
        fieldsArray.push({
          fieldname: fieldname,
          fieldtype: "Date",
          label: label,
          description: description,
          options: "",
          reqd: reqd,
        });
        break;

      case "time":
        fieldsArray.push({
          fieldname: fieldname,
          fieldtype: "Time",
          label: label,
          description: description,
          options: "",
          reqd: reqd,
        });
        break;

      case "photo_capture":
        fieldsArray.push({
          fieldname: fieldname,
          fieldtype: "Attach",
          label: label,
          description: description,
          options: "",
          reqd: reqd,
        });
        break;

      case "audio_upload":
        fieldsArray.push({
          fieldname: fieldname,
          fieldtype: "Attach",
          label: label,
          description: description,
          options: "Audio",
          reqd: reqd,
        });
        break;

      case "geo_location":
      case "map_coordinates":
        fieldsArray.push({
          fieldname: fieldname,
          fieldtype: "Geolocation",
          label: label,
          description: description,
          options: "",
          reqd: reqd,
        });
        break;

      case "checkbox":
        fieldsArray.push({
          fieldname: fieldname,
          fieldtype: "Check",
          label: label,
          description: description,
          options: "",
          reqd: reqd,
        });
        break;

      case "rating":
        fieldsArray.push({
          fieldname: fieldname,
          fieldtype: "Rating",
          label: label,
          description: description,
          options: "",
          reqd: reqd,
        });
        break;

      case "drop_down_dependent":
        fieldsArray.push({
          fieldname: fieldname,
          fieldtype: "Select",
          label: label,
          description: description,
          options: q.options || "",
          reqd: reqd,
          depends_on:
            q.depends_on_field && q.depends_on_value
              ? `eval:doc.${q.depends_on_field}=='${q.depends_on_value}'`
              : "",
        });
        break;

      default:
        fieldsArray.push({
          fieldname: fieldname,
          fieldtype: "Data",
          label: label,
          description: description,
          options: "",
          reqd: reqd,
        });
    }
  });

  // Always add user field at the end
  fieldsArray.push({
    fieldname: "user",
    fieldtype: "Link",
    label: "User",
    options: "User",
    reqd: 1,
  });

  // Build the final payload
  const finalPayload = {
    __newname: data.name,
    module: "leadtech_survey",
    track_changes: 1,
    track_seen: 1,
    track_views: 1,
    custom: 1,
    naming_rule: "Expression (old style)",
    autoname: data.name + ".######",
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

  console.log("FINAL PAYLOAD:", finalPayload);

  try {
    const response = await fetch(
      `${API_BASE}/api/method/leadtech_survey.leadtech_survey.create_survey_doctype.allow_doctype_creation`,
      {
        method: "POST",
        headers: {
          Authorization: `Token ${API_TOKEN}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(finalPayload),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log("API RESPONSE:", result);

    if (result.message?.status === "success" || result.message) {
      alert("Survey published successfully!");

      createUserPermission(data.name);

      const formData = JSON.parse(localStorage.getItem("formData") || "{}");
      formData.isPublish = "1";
      localStorage.setItem("formData", JSON.stringify(formData));

      disableUnloadWarning();
      closePopup();

      setTimeout(() => {
        newForm();
      }, 500);
    } else {
      alert(
        result._error_message ||
          result.message?.message ||
          "Survey creation failed",
      );
    }
  } catch (err) {
    console.error("Publish failed:", err);
    alert("Failed to publish form: " + err.message);
  }
}

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

function checkForDuplication() {
  const surveyName = localStorage.getItem("surveyName");
  const duplicateFlag = localStorage.getItem("duplicateFlag");
  const urlFlag = new URLSearchParams(window.location.search).get("flag");

  console.log("Checking duplication:", { surveyName, duplicateFlag, urlFlag });

  if (surveyName && (duplicateFlag === "true" || urlFlag === "D")) {
    localStorage.removeItem("surveyName");
    localStorage.removeItem("duplicateFlag");

    document.getElementById("survey-name").value = surveyName;

    loadSurveyForDuplication(surveyName);

    return true;
  }
  return false;
}

function loadSurveyForDuplication(surveyName) {
  console.log("Loading survey for duplication:", surveyName);

  showAlert(`Loading survey "${surveyName}" for duplication...`);

  const apiUrl = `${API_BASE}/api/method/leadtech_survey.leadtech_survey.get_all_field_survey_by_name.get_doctype_by_name?name=${encodeURIComponent(surveyName)}`;

  fetch(apiUrl, {
    method: "GET",
    headers: {
      Authorization: `Token ${API_TOKEN}`,
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Survey data loaded for duplication:", data);

      if (!data || !data.data) {
        throw new Error("No survey data found");
      }

      // Set the survey name with "_Copy" suffix
      const nameInput =
        document.getElementById("survey-name") ||
        document.querySelector('input[name="survey-name"]');
      if (nameInput) {
        nameInput.value = data.data.name + "_Copy";
      } else {
        console.warn("⚠ Survey name input not found in DOM");
      }

      // Clear existing FORM_STATE and reset flags
      FORM_STATE = {
        name: data.data.name + "_Copy",
        header: "",
        Wel_image: "",
        loop: false,
        loc_mandatory: false,
        audio_mandatory: false,
        unique_number: false,
        start_survey: "", // NEW - Reset start survey
        end_survey: "", // NEW - Reset end survey
        survey_count: 0, // NEW - Reset survey count
        questions: [],
        isPublish: "0",
      };

      // Sort fields by original order
      const sortedFields = data.data.fields.sort(
        (a, b) => (a.idx || 0) - (b.idx || 0),
      );

      // List of system field names that should never appear as questions
      const systemFieldNames = [
        "user",
        "location",
        "audio",
        "survey_start_date",
        "survey_end_date",
        "survey_duration",
        "welcome_image",
        "header",
      ];

      sortedFields.forEach((item) => {
        console.log(
          "Processing field:",
          item.fieldname,
          item.fieldtype,
          item.label,
        );

        // Skip all system fields by fieldname
        if (systemFieldNames.includes(item.fieldname)) {
          console.log(`Skipping system field: ${item.fieldname}`);

          // Set the appropriate flags based on the field
          if (item.fieldname === "location") {
            FORM_STATE.loc_mandatory = item.reqd === 1;
          }
          if (item.fieldname === "audio") {
            FORM_STATE.audio_mandatory = item.reqd === 1;
          }
          if (
            item.fieldname === "welcome_image" &&
            item.fieldtype === "Image"
          ) {
            FORM_STATE.Wel_image = item.options || "";
          }
          if (item.fieldname === "header" && item.fieldtype === "Heading") {
            FORM_STATE.header = item.label || "";
          }
          // Note: survey_start_date, survey_end_date, survey_duration are not stored in FORM_STATE
          // as they are handled separately in the UI
          return; // Skip adding to questions
        }

        // Also skip by fieldtype for any other Link fields that might be user
        if (item.fieldtype === "Link" && item.options === "User") {
          console.log(`Skipping User Link field: ${item.fieldname}`);
          return;
        }

        // Skip Image fields (like welcome image)
        if (item.fieldtype === "Image") {
          console.log(`Skipping Image field: ${item.fieldname}`);
          return;
        }

        // Skip Small Text fields (these are usually "Other" text fields)
        if (item.fieldtype === "Small Text") {
          console.log(`Skipping Small Text field: ${item.fieldname}`);
          return;
        }

        // For all other fields that start with 'q_' (regular questions), add to questions array
        if (item.fieldname && item.fieldname.startsWith("q_")) {
          console.log(`Adding regular question: ${item.fieldname}`);
          addFieldToFormState(item);
        } else if (
          item.fieldname &&
          !systemFieldNames.includes(item.fieldname)
        ) {
          // Also add any other custom fields that might not follow q_ naming convention
          console.log(`Adding custom field: ${item.fieldname}`);
          addFieldToFormState(item);
        }
      });

      // Add system questions to UI builder based on flags
      if (FORM_STATE.loc_mandatory) {
        addSystemQuestionIfMissing("geo_location", "Geo Location");
      } else {
        removeSystemQuestion("geo_location", "Geo Location");
      }

      if (FORM_STATE.audio_mandatory) {
        addSystemQuestionIfMissing("audio_upload", "Audio Upload");
      } else {
        removeSystemQuestion("audio_upload", "Audio Upload");
      }

      // Always add User field in UI builder
      addSystemQuestionIfMissing("user", "User");

      // Update checkboxes on screen1
      const locCheck = document.getElementById("location-capture");
      if (locCheck) locCheck.checked = FORM_STATE.loc_mandatory;

      const audioCheck = document.getElementById("audio-capture");
      if (audioCheck) audioCheck.checked = FORM_STATE.audio_mandatory;

      const uniqueCheck = document.getElementById("unique-number");
      if (uniqueCheck) uniqueCheck.checked = FORM_STATE.unique_number;

      renderTable();
      persistFormState();

      showAlert(`Survey "${surveyName}" loaded for duplication!`);
    })
    .catch((error) => {
      console.error("Error loading survey for duplication:", error);
      showAlert("Failed to load survey data");
    });
}

function addFieldToFormState(data) {
  console.log("Adding field to FORM_STATE:", data);

  let variable = "select";
  const isMandatory =
    data.reqd === 1 || data.reqd === "1" || data.reqd === true;
  const fieldType = (data.fieldtype || "").trim();
  const fieldOptions = (data.options || "").trim();

  // Map fieldtype to inputType
  if (fieldType === "Select") {
    const optionLines = fieldOptions
      .split("\n")
      .map((o) => o.trim().toLowerCase());
    variable = optionLines.includes("others") ? "drop_down_other" : "drop_down";
  } else if (fieldType === "MultiSelect") variable = "checkbox_list";
  else if (fieldType === "Int") variable = "number_input";
  else if (fieldType === "Float" || fieldType === "Currency")
    variable = "decimal_input";
  else if (fieldType === "Date") variable = "date";
  else if (fieldType === "Time") variable = "time";
  else if (fieldType === "Geolocation") variable = "geo_location";
  else if (fieldType === "Attach") {
    variable = fieldOptions.toLowerCase().includes("audio")
      ? "audio_upload"
      : "photo_capture";
  } else if (fieldType === "Check") variable = "checkbox";
  else if (fieldType === "Rating") variable = "rating";
  else if (fieldType === "Section Break" || fieldType === "Heading")
    variable = "text_block";
  else if (fieldType === "Long Text" || fieldType === "Text")
    variable = "multiline_text_input";
  else if (fieldType === "Small Text") {
    // Small Text is an auxiliary field (e.g., for "Other") – map to a simple text input
    variable = "singleline_text_input";
  } else if (fieldType === "Data") {
    if (fieldOptions.toLowerCase() === "email") variable = "email";
    else if (fieldOptions.toLowerCase() === "phone") variable = "phone_number";
    else variable = "singleline_text_input";
  }

  // Clean options (remove special markers like "Select Type" and the literal "Others")
  let cleanOptions = fieldOptions;
  try {
    if (cleanOptions) {
      let lines = cleanOptions.split("\n");
      // Remove first line if it's a type indicator
      if (
        lines.length > 0 &&
        (lines[0].includes("Select Type") ||
          lines[0].includes("Radio Type") ||
          lines[0].includes("Check Type"))
      ) {
        lines.shift();
      }
      // For drop_down_other, remove the literal "Others" option
      if (variable === "drop_down_other") {
        lines = lines.filter((o) => o.trim().toLowerCase() !== "others");
      }
      cleanOptions = lines.join("\n");
    }
  } catch (e) {
    console.warn("Error cleaning options for field:", data.label, e);
    cleanOptions = fieldOptions;
  }

  // Hidden logic: Small Text fields are always hidden in the UI builder;
  // otherwise preserve the original hidden flag.
  const hidden = fieldType === "Small Text" ? true : data.hidden ? true : false;

  FORM_STATE.questions.push({
    inputType: variable,
    questionName: data.label || "",
    description: data.description || "",
    options: cleanOptions,
    hasOthers: variable === "drop_down_other",
    rowoptions: "",
    coloptions: "",
    mandatory: isMandatory,
    hidden: hidden,
    system: data.system ? true : false,
    depends_on_field: data.depends_on || "",
    depends_on_value: data.depends_on_value || "",
    original_fieldtype: fieldType, // <-- critical for correct publishing
    original_fieldname: data.fieldname || "",
  });
}

window.onload = function () {
  updateButtonDisplay();
  loadFormData();

  let check = new URLSearchParams(window.location.search).get("flag") || "";
  console.log("flag:", check);
  if (check === "C") {
    document.getElementById("survey-name").value =
      new URLSearchParams(window.location.search).get("Survey") || "";
  }

  if (check === "D") {
    const surveyName =
      new URLSearchParams(window.location.search).get("Survey") || "";
    if (surveyName) {
      document.getElementById("survey-name").value = surveyName;
      loadSurveyForDuplication(surveyName);
    } else {
      checkForDuplication();
    }
  } else {
    checkForDuplication();
  }
};

async function uploadFile(file, fileName) {
  const formData = new FormData();
  formData.append("file", file, fileName);

  const headers = {
    Authorization: "Token 405e0af40f3d04a:885b55cc21d37d2",
    "X-Frappe-CSRF-Token": frappe.csrf_token,
  };

  try {
    const response = await fetch(`${API_BASE}/api/method/upload_file`, {
      method: "POST",
      headers: headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload file");
    }

    const responseData = await response.json();
    if (responseData.message && responseData.message.file_url) {
      return responseData.message.file_url;
    } else {
      throw new Error("File URL not found in response");
    }
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

document
  .getElementById("welcome-image")
  .addEventListener("change", async function (event) {
    console.log("it runs");
    const fileInput = event.target;

    if (fileInput.files.length === 0) {
      console.error("No file selected.");
      return;
    }

    const file = fileInput.files[0];
    const fileName = file.name;
    console.log(" here" + file + fileName);
    try {
      Wimage = await uploadFile(file, fileName);
      console.log("File uploaded successfully. URL:", Wimage);
    } catch (error) {
      console.error("Failed to upload file:", error);
    }
  });

document.querySelector(".save-btn").addEventListener("click", function () {
  const nameEl = document.getElementById("survey-name");
  const headerEl = document.getElementById("header-text");
  const uniqueEl = document.getElementById("unique-number");

  if (!nameEl) {
    console.warn("survey-name not found");
    return;
  }

  name = nameEl.value;
  header_text = headerEl ? headerEl.value : "";
  audio_mandatory = document.getElementById("audio-capture")?.checked || false;
  location_mandatory =
    document.getElementById("location-capture")?.checked || false;
  unique_number = uniqueEl ? uniqueEl.checked : false;
});

function CancelToggle() {
  const screen1 = document.querySelector(".screen1");
  const screen2 = document.querySelector(".screen2");

  screen1.style.display = "none";
  screen2.style.display = "block";
}

function Edit() {
  const screen1 = document.querySelector(".screen1");
  const screen2 = document.querySelector(".screen2");

  screen1.style.display = "block";
  screen2.style.display = "none";

  screen1.style.display = "flex";
  screen1.style.display = "jusutify-content";
}

function createUserPermission(doctype_name) {
  const url = "/api/resource/User Permission";

  const user = "leadtech.superadmin@gmail.com";

  const data = {
    user: user,
    allow: "DocType",
    for_value: doctype_name,
    read: 1,
    write: 1,
    create: 1,
    delete: 1,
    submit: 1,
    cancel: 1,
    amend: 1,
    report: 1,
    export: 1,
    share: 1,
    print: 1,
    email: 1,
  };

  fetch(url, {
    method: "POST",
    credentials: "omit",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token 405e0af40f3d04a:885b55cc21d37d2`,
      "X-Frappe-CSRF-Token": frappe.csrf_token,
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("User Permission Created:", data);
    })
    .catch((error) => {
      console.error("Error creating User Permission:", error);
    });
}

function addSystemQuestionIfMissing(type, questionName) {
  const exists = FORM_STATE.questions.some(
    (q) => q.inputType === type && q.questionName === questionName,
  );

  if (!exists) {
    FORM_STATE.questions.unshift({
      inputType: type,
      questionName: questionName,
      options: "",
      rowoptions: "",
      coloptions: "",
      mandatory: false,
      system: true,
      hidden: true,
    });

    persistFormState();
  }
}

function removeSystemQuestion(type, questionName) {
  FORM_STATE.questions = FORM_STATE.questions.filter(
    (q) => !(q.inputType === type && q.questionName === questionName),
  );

  persistFormState();
}

function removeSystemQuestion(type, questionName) {
  FORM_STATE.questions = FORM_STATE.questions.filter(
    (q) => !(q.inputType === type && q.questionName === questionName),
  );
}

let IS_INITIAL_SAVE = true;
function applyMetaQuestions() {
  if (FORM_STATE.loc_mandatory) {
    addSystemQuestionIfMissing("geo_location", "Geo Location");
  } else {
    removeSystemQuestion("geo_location", "Geo Location");
  }

  if (FORM_STATE.audio_mandatory) {
    addSystemQuestionIfMissing("audio_upload", "Audio Upload");
  } else {
    removeSystemQuestion("audio_upload", "Audio Upload");
  }

  if (FORM_STATE.unique_number) {
    addSystemQuestionIfMissing("number_input", "Unique Number");
  } else {
    removeSystemQuestion("number_input", "Unique Number");
  }
  // Always add User field (system)
  addSystemQuestionIfMissing("user", "User");
}

function saveSurveyMeta() {
  const surveyName = document.getElementById("survey-name").value.trim();

  if (!surveyName) {
    alert("Survey Name is required");
    return;
  }

  FORM_STATE.name = surveyName;
  FORM_STATE.header = document.getElementById("header-text").value || "";
  FORM_STATE.loc_mandatory =
    document.getElementById("location-capture").checked;
  FORM_STATE.audio_mandatory = document.getElementById("audio-capture").checked;
  FORM_STATE.unique_number = document.getElementById("unique-number").checked;

  // IMPORTANT: Set isPublish to "0" for new/duplicated forms
  FORM_STATE.isPublish = "0";

  const urlFlag = new URLSearchParams(window.location.search).get("flag") || "";
  const isDuplication =
    urlFlag === "D" || localStorage.getItem("duplicateFlag") === "true";

  applyMetaQuestions();

  if (!FORM_STATE.questions) {
    FORM_STATE.questions = [];
  }

  persistFormState();
  renderTable();

  document.querySelector(".screen1").style.display = "none";
  document.querySelector(".screen2").style.display = "block";

  document.getElementById("name-display").value = surveyName;

  localStorage.removeItem("duplicateFlag");
}
