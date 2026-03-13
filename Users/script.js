const API_BASE = window.location.origin;

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

    console.log("🔐 Users Page - Authorization check - User data from cookies:", { fullName, systemUser, userId });

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
        
        setTimeout(function() {
            alert('Unauthorized access! Redirecting to the login page.');
            window.location.href = `${API_BASE}/survey/login-test`; 
        }, 2000); 
    } else {
        document.getElementById("security").style.display = "none";
        document.getElementById("to_show").style.display = "block";
        
        // Update user display if elements exist
        const userNameEl = document.getElementById('userName');
        const userTypeBadge = document.getElementById('userTypeBadge');
        
        if (userNameEl && fullName) {
            userNameEl.textContent = fullName;
        }
        
        if (userTypeBadge && userData.userType) {
            userTypeBadge.textContent = userData.userType.replace('_', ' ');
        }
    }
})();

const rowsPerPage = 10;
let currentPage = 1;
let totalPages = 1;
let data = [];

async function fetchData() {
  const headers = {
    Authorization: 'Token 405e0af40f3d04a:885b55cc21d37d2',
    Cookie: 'full_name=Guest; sid=Guest; system_user=no; user_id=Guest; user_image=',
  };

  try {
      const userEmail = getCookie('user_email') || '';
    const response = await fetch(
      `${API_BASE}/api/method/election_management.election_management.survey_users_new.get_user?email=${userEmail}`,
      {
        method: 'GET',
        headers: headers,
      }
    );

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const responseData = await response.json();
    //console.log('Response Data:', responseData);

    if (!Array.isArray(responseData.message)) {
      throw new Error('Data is not in the expected format');
    }

    data = responseData.message;

    // Update the global `totalPages`
    totalPages = Math.ceil(data.length / rowsPerPage);
    //console.log('Total Pages:', totalPages);

    updateTable();
    updatePagination();
  } catch (error) {
    console.error('There was a problem with the fetch operation:', error);
  }
}

function updateTable() {
  const tableBody = document.getElementById('searchResultsBody');
  tableBody.innerHTML = ''; // Clear previous data

  const searchInput = document
    .getElementById('searchInput')
    .value.toLowerCase()
    .trim();
  //console.log('Search Input:', searchInput);

  let filteredData = data;

  if (searchInput !== '') {
    filteredData = data.filter(
      (item) =>
        (item.e_name && item.e_name.toLowerCase().includes(searchInput)) ||
        (item.phone && item.phone.toLowerCase().includes(searchInput)) ||
        (item.id_card_no && item.id_card_no.toLowerCase().includes(searchInput)) ||
        (item.email && item.email.toLowerCase().includes(searchInput)) ||
        (item.user_status && item.user_status.toLowerCase().includes(searchInput))
    );
  }

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  if (paginatedData.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 6; // Adjust colspan based on the number of columns
    cell.textContent = 'No matching data found';
    row.appendChild(cell);
    tableBody.appendChild(row);
  } else {
    paginatedData.forEach((item) => {
      const row = document.createElement('tr');
      row.innerHTML = `
                <td>${item.e_name || ''}</td>
                <td>${item.email || ''}</td>
                <td>${item.phone || ''}</td>
                <td>${item.id_card_no || ''}</td>
                <td><span class="statusText">${item.user_status}</span></td>
                <td><button class="toggleButton" onclick="change('${item.email}', '${item.user_status}')">Change</button></td>
            `;
      tableBody.appendChild(row);
    });
  }
}

function updatePagination() {
  const paginationContainer = document.getElementById('pagination');
  paginationContainer.innerHTML = ''; // Clear previous pagination

  const maxVisiblePages = 5;
  const half = Math.floor(maxVisiblePages / 2);

  // Calculate start and end page numbers
  let startPage = Math.max(1, currentPage - half);
  let endPage = startPage + maxVisiblePages - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  const createPageButton = (pageNumber, text, isDisabled = false, isActive = false) => {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = 'pagination-button';
    if (isDisabled) {
      button.classList.add('disabled');
      button.disabled = true;
    } else {
      button.addEventListener('click', () => {
        currentPage = pageNumber;
        updateTable();
        updatePagination();
      });
    }
    if (isActive) {
      button.classList.add('active');
    }
    return button;
  };

  // Previous slide button
  paginationContainer.appendChild(
    createPageButton(
      Math.max(1, startPage - maxVisiblePages),
      '«',
      startPage === 1
    )
  );

  // Page number buttons
  for (let i = startPage; i <= endPage; i++) {
    paginationContainer.appendChild(
      createPageButton(i, i, false, i === currentPage)
    );
  }

  // Next slide button
  paginationContainer.appendChild(
    createPageButton(
      Math.min(totalPages, startPage + maxVisiblePages),
      '»',
      endPage === totalPages
    )
  );
}

function change(email, status) {
  const willDisable = status === "Enabled"; // If currently enabled, we will disable
  const newStatus = willDisable ? 0 : 1;

  // Show loader
  const loader = document.getElementById("loader");
  loader.style.display = "block";

  fetch(`${API_BASE}/api/resource/User/${email}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Token 405e0af40f3d04a:b40e4d048e8466e',
      'X-Frappe-CSRF-Token': frappe.csrf_token,
    },
    body: JSON.stringify({ enabled: newStatus }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      return response.json();
    })
    .then(() => {
      // Hide loader
      loader.style.display = "none";

      const indicator = document.getElementById("status-indicator");

      if (newStatus === 1) {
        indicator.innerHTML = `✔ User <span style="color: green;">Enabled</span>`;
        showAlert("User Enabled!");
      } else {
        indicator.innerHTML = `✖ User <span style="color: red;">Disabled</span>`;
        showAlert("User Disabled!");
      }

      // Optional: reload after 1 second
      setTimeout(() => {
        window.location.reload();
      }, 500);
    })
    .catch((error) => {
      console.error('Error updating status:', error);
      loader.style.display = "none";
      showAlert("Error updating status.");
    });
}

function showAlert(message) {
  alert(message); // You can replace this with a styled modal or toast if needed
}

// Search input event listener
document.getElementById('searchInput').addEventListener('input', () => {
  currentPage = 1; // Reset to first page on search
  updateTable();
  updatePagination();
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', fetchData);