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
    initRoomData();
    var schedule_Data = [];
    initScheduleData();
  
  
    async function initRoomData() {
      const response = await fetch("static/rooms.json");
      var check = await response.json();
      room_Data = check;
    }
  
  
    async function initScheduleData() {
      const schedResponse = await fetch("static/schedules.json");
      var check2 = await schedResponse.json();
      schedule_Data = check2;
      console.log(schedule_Data);
      updateRoomStatuses();
    }
  
  
    // Async function to fetch room data (will be replaced with database call later)
    async function fetchRoomData(buildingId) {
  
  
      await initRoomData();
      await initScheduleData();
      const rooms = [];
      document.querySelectorAll(`.room.${buildingId}`).forEach(room => {
        const roomNumber = room.id.split('-').pop();
        var currentRoom;
        for (var i = 0; i < room_Data.length; i++) {
          if (room_Data[i][1] == roomNumber) {
            currentRoom = room_Data[i];
          }
          
      }
      slots = getTimeSlots(106);
      console.log(slots);
        rooms.push({
          id: room.id,
          number: roomNumber,
          status: "Available", // Defaults - will come from DB later
          capacity: currentRoom[3],
          type: currentRoom[4],
          details: currentRoom[5]
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
          var numSlots = getTimeSlots(num);
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
                <p>Details: ${room.details}</p>
                <button class="btn btn-success schedule-btn" data-room="${num}">Schedule</button>
              </div>
            </div>`;
          ac.appendChild(item);
          item.querySelector(".schedule-btn")
            .addEventListener("click", () => showScheduleModal(num, numSlots));
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

    function showScheduleModal(roomNumber, numSlots) {
      const modal = new bootstrap.Modal(document.getElementById("scheduleModal"));
      document.getElementById("scheduleModalLabel").textContent = `Schedule for Room ${roomNumber}`;
      document.getElementById("scheduleContent").innerHTML = `
        <ul id="slotList"></ul>`;
        let list = document.getElementById("slotList");
        for (i = 0; i < numSlots.length; ++i) {
            let li = document.createElement('li');
            li.innerText = numSlots[i][4] +', '+ numSlots[i][5] + ' - ' + numSlots[i][6] + ', ' + numSlots[i][2] +': ' + numSlots[i][3];
            list.appendChild(li);
        }
      modal.show();
    }

    function getTimeSlots(roomNumber) {
      var timeSlots = [];
      for (var i = 0; i < schedule_Data.length; i++) {
       
        if (schedule_Data[i][1] == roomNumber) {
          timeSlots.push(schedule_Data[i]);
        }
       
      }
      return timeSlots
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

    async function updateRoomStatuses() {

      const now = new Date();
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
      const currentTime = now.toTimeString().split(' ')[0];
  
      const roomStatusMap = {};
  
      schedule_Data.forEach(event => {
          const [eventId, roomNumber, className, instructorName, dayOfWeek, startTime, endTime] = event;
          const roomId = `woodward-${roomNumber}`;
  
          if (dayOfWeek !== currentDay) return;
  
          const startDate = new Date(`${now.toDateString()} ${startTime}`);
          const endDate = new Date(`${now.toDateString()} ${endTime}`);
  
          if (now >= startDate && now <= endDate) {
              roomStatusMap[roomId] = 'occupied';
          }
          else {
              const timeUntilStart = (startDate - now) / 60000;
              if (timeUntilStart > 0 && timeUntilStart <= 15) {
                  roomStatusMap[roomId] = 'upcoming';
              } else if (!roomStatusMap[roomId]) {
                  roomStatusMap[roomId] = 'available';
              }
          }
      });
  
      console.log(roomStatusMap);  // Log the room status map to check if the statuses are being assigned correctly.
  
      document.querySelectorAll('.room').forEach(el => {
          const id = el.id;
          el.classList.remove('available', 'occupied', 'upcoming');
          
          if (roomStatusMap[id]) {
              el.classList.add(roomStatusMap[id]);
          } else {
              el.classList.add('available');
          }
      });
    }
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
