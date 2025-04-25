document.addEventListener("DOMContentLoaded", () => {
  const toggleButton = document.getElementById("toggle-panel");
  if (toggleButton) {
    const sidePanel    = document.getElementById("side-panel");
    const zoomInButton = document.getElementById("zoom-in");
    const zoomOutButton= document.getElementById("zoom-out");
    const resetButton  = document.getElementById("reset-button");
    const svg          = document.querySelector("svg");
    const mapContainer = document.querySelector(".map-container");

    let scale = 1, translateX = 0, translateY = 0;
    let isDragging = false, startX, startY;
    let activeBuilding = null;

    const maxTranslateX = 500, maxTranslateY = 500;
    const minTranslateX = -500, minTranslateY = -500;

    initMap();

    document.querySelectorAll(".room").forEach(r => r.classList.remove("visible"));

    function initMap() {
      updateTransform();
      setupDragHandlers();
      setupZoomHandlers();
      setupBuildingClickHandlers();
      setupRoomClickHandlers();
      setupResetButton();
    }

    function updateTransform() {
      translateX = Math.max(minTranslateX, Math.min(maxTranslateX, translateX));
      translateY = Math.max(minTranslateY, Math.min(maxTranslateY, translateY));
      svg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }

    function setupDragHandlers() {
      mapContainer.addEventListener("mousedown", e => {
        if (e.target === svg || e.target === mapContainer) {
          isDragging = true;
          startX = e.clientX - translateX;
          startY = e.clientY - translateY;
          mapContainer.style.cursor = "grabbing";
        }
      });
      document.addEventListener("mousemove", e => {
        if (isDragging) {
          translateX = e.clientX - startX;
          translateY = e.clientY - startY;
          updateTransform();
        }
      });
      document.addEventListener("mouseup", () => {
        isDragging = false;
        mapContainer.style.cursor = "grab";
      });
    }

    function setupZoomHandlers() {
      zoomInButton.addEventListener("click", () => zoom(1.1));
      zoomOutButton.addEventListener("click", () => zoom(1/1.1));
      svg.addEventListener("wheel", e => {
        if (e.ctrlKey) {
          e.preventDefault();
          zoom(e.deltaY < 0 ? 1.1 : 1/1.1, e.clientX, e.clientY);
        }
      });
    }

    function zoom(zoomFactor, clientX, clientY) {
      scale *= zoomFactor;
      if (clientX != null && clientY != null) {
        const rect = svg.getBoundingClientRect();
        const offsetX = clientX - rect.left;
        const offsetY = clientY - rect.top;
        translateX -= (offsetX - translateX) * (zoomFactor - 1);
        translateY -= (offsetY - translateY) * (zoomFactor - 1);
      }
      updateTransform();
    }

    function showRoomsForBuilding(buildingId) {
      document.querySelectorAll(`.room.${buildingId}`)
        .forEach(r => r.classList.add("visible"));
    }

    function hideAllRooms() {
      document.querySelectorAll(".room")
        .forEach(r => r.classList.remove("visible"));
    }

    function setupRoomClickHandlers() {
      document.querySelectorAll(".room").forEach(room => {
        room.addEventListener("click", e => {
          e.stopPropagation();
          document.querySelectorAll(".room").forEach(r => r.classList.remove("selected"));
          room.classList.add("selected");
          openSidePanel();
          updateRoomInfo(room);
        });
      });
    }

    function setupBuildingClickHandlers() {
      document.querySelectorAll(".building").forEach(building => {
        building.addEventListener("click", async e => {
          e.stopPropagation();
          openSidePanel();
          if (activeBuilding) {
            activeBuilding.classList.remove("active");
            hideAllRooms();
          }
          activeBuilding = building;
          building.classList.add("active");
          const id = building.id;
          showRoomsForBuilding(id);
          await updateBuildingInfo(id);
        });
      });
    }

    function openSidePanel() {
      sidePanel.classList.remove("collapsed");
    }

    var room_Data = [];
    async function initData() {
      const resp = await fetch("static/rooms.json");
      room_Data = await resp.json();
    }

    async function fetchRoomData(buildingId) {
      await initData();
      const rooms = [];
      document.querySelectorAll(`.room.${buildingId}`)
        .forEach(r => {
          const num = r.id.split("-").pop();
          rooms.push({
            id: r.id,
            number: room_Data.find(x => x[1] == +num)?.[1] || num,
            status: "Available",
            capacity: getRoomCapacity(num),
            type: getRoomType(num),
            lastCleaned: getLastCleanedDate(num)
          });
        });
      return rooms;
    }

    async function updateBuildingInfo(buildingId) {
      const ac = document.getElementById("roomsAccordion");
      ac.innerHTML = `<div class="accordion-item"><div class="accordion-body"><p>Loading rooms...</p></div></div>`;
      try {
        const rooms = await fetchRoomData(buildingId);
        if (!rooms.length) {
          ac.innerHTML = `<div class="accordion-item"><div class="accordion-body"><p>No rooms available</p></div></div>`;
          return;
        }
        ac.innerHTML = "";
        rooms.forEach(room => {
          const num = room.id.split("-").pop();
          const item = document.createElement("div");
          item.className = "accordion-item";
          item.innerHTML = `
            <h2 class="accordion-header" id="heading${room.id}">
             <button class="accordion-button collapsed" type="button"
               data-bs-toggle="collapse" data-bs-target="#collapse${room.id}"
               aria-expanded="false" aria-controls="collapse${room.id}"
               data-room-id="${room.id}">
               Room ${num}
             </button>
            </h2>
            <div id="collapse${room.id}" class="accordion-collapse collapse" aria-labelledby="heading${room.id}">
              <div class="accordion-body">
                <p>Status: ${room.status}</p>
                <p>Capacity: ${room.capacity}</p>
                <p>Type: ${room.type}</p>
                <p>Last cleaned: ${room.lastCleaned}</p>
                <button class="btn btn-primary schedule-btn" data-room="${num}">Schedule</button>
              </div>
            </div>`;
          ac.appendChild(item);
          item.querySelector(".schedule-btn")
            .addEventListener("click", () => showScheduleModal(num));
          document.getElementById(room.id)
            ?.addEventListener("click", () => {
              openSidePanel();
              document.querySelectorAll(".accordion-collapse")
                .forEach(col => bootstrap.Collapse.getInstance(col)?.hide());
              new bootstrap.Collapse(document.getElementById(`collapse${room.id}`), { toggle: true }).show();
            });
        });
      } catch (err) {
        ac.innerHTML = `<div class="accordion-item"><div class="accordion-body"><p>Error loading rooms</p></div></div>`;
      }
    }

    function showScheduleModal(roomNumber) {
      const modal = new bootstrap.Modal(document.getElementById("scheduleModal"));
      document.getElementById("scheduleModalLabel").textContent = `Schedule for Room ${roomNumber}`;
      document.getElementById("scheduleContent").innerHTML = `
        <ul>
          <li>9:00 AM - 10:30 AM: Math 101</li>
          <li>11:00 AM - 12:30 PM: History 201</li>
          <li>2:00 PM - 3:30 PM: CS Seminar</li>
        </ul>`;
      modal.show();
    }

    function getRoomCapacity(n) {
      const caps = { '105':30,'106':45,'107':20,'108':60,'109':25,'110':40,'111':35 };
      return caps[n]||25;
    }
    function getRoomType(n) {
      const types = {'105':'Classroom','106':'Lecture Hall','107':'Lab','108':'Conference Room','109':'Seminar Room','110':'Study Room','111':'Meeting Room'};
      return types[n]||'Room';
    }
    function getLastCleanedDate(n) {
      const dates = {'105':'Today','106':'Yesterday','107':'2 days ago','108':'This week','109':'Today','110':'Yesterday','111':'This week'};
      return dates[n]||'Recently';
    }

    function setupResetButton() {
      resetButton.style.display = "block";
      resetButton.addEventListener("click", () => {
        scale=1; translateX=0; translateY=0; updateTransform();
        activeBuilding?.classList.remove("active"); activeBuilding=null;
        hideAllRooms();
        document.getElementById("roomsAccordion").innerHTML = `
          <div class="accordion-item">
            <div class="accordion-body"><p>Select a building to view rooms.</p></div>
          </div>`;
      });
    }

    [
      { room_id: 'woodward-106', status: 'available' },
      { room_id: 'woodward-120', status: 'occupied' },
      { room_id: 'woodward-125', status: 'upcoming' },
      { room_id: 'woodward-130', status: 'available' },
      { room_id: 'woodward-135', status: 'occupied'},
      { room_id: 'woodward-150', status: 'occupied'},
      { room_id: 'woodward-155', status: 'upcoming'}
    ].forEach(r => {
      const el = document.getElementById(r.room_id);
      if (el) {
        el.classList.remove('available','occupied','upcoming');
        el.classList.add(r.status);
      }
    });
  }

  const form = document.getElementById("contactForm");
  if (form) {
    const feedback     = document.getElementById("contactFeedback");
    const ticketListEl = document.querySelector("#ticketList .list-group");

    function loadTickets()  { return JSON.parse(sessionStorage.getItem("tickets") || "[]"); }
    function saveTickets(t) { sessionStorage.setItem("tickets", JSON.stringify(t)); }

    function renderTicketList() {
      const tickets = loadTickets();
      ticketListEl.innerHTML = "";
      tickets.forEach(t => {
        const li = document.createElement("li");
        li.className = "list-group-item";
        li.textContent = `${t.timestamp} — [${t.issueTypeText}] ${t.buildingName} Rm ${t.roomNumber}: ${t.issueDescription}`;
        ticketListEl.appendChild(li);
      });
    }

    function showAlert(message, type="success") {
      feedback.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
          ${message}
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>`;
    }

    form.addEventListener("submit", e => {
      e.preventDefault();
      const issueTypeSelect = form.querySelector("#issueType");
      const issueTypeText   = issueTypeSelect.options[issueTypeSelect.selectedIndex].text;
      const buildingName    = form.querySelector("#buildingName").value.trim() || "—";
      const roomNumber      = form.querySelector("#roomNumber").value.trim()   || "—";
      const issueDesc       = form.querySelector("#issueDescription").value.trim();
      if (!issueDesc) {
        return showAlert("Please describe your issue before submitting.", "warning");
      }
      const tickets = loadTickets();
      tickets.push({
        timestamp: new Date().toLocaleString(),
        issueTypeText,
        buildingName,
        roomNumber,
        issueDescription: issueDesc
      });
      saveTickets(tickets);
      showAlert("Thanks! Your ticket has been submitted.", "success");
      renderTicketList();
      form.reset();
    });

    renderTicketList();
  }


  const roomsAccordion = document.getElementById("roomsAccordion");
  if (roomsAccordion) {
    roomsAccordion.addEventListener("shown.bs.collapse", e => {
      const btn = roomsAccordion.querySelector(`[aria-controls="${e.target.id}"]`);
      if (!btn) return;
      document.getElementById(btn.dataset.roomId)?.classList.add("selected");
    });
    roomsAccordion.addEventListener("hidden.bs.collapse", e => {
      const btn = roomsAccordion.querySelector(`[aria-controls="${e.target.id}"]`);
      if (!btn) return;
      document.getElementById(btn.dataset.roomId)?.classList.remove("selected");
    });
  }
});
