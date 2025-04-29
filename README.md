# RoomMate

RoomMate is a Django-based web application that provides an interactive SVG map of campus buildings, real-time room availability visualization, a contact form for reporting issues (demo ticket system), and a "Meet the Team" page showcasing project members.

## Features

- Interactive SVG map: pan, zoom, and click buildings to reveal rooms.

- Room status: highlights rooms as available, upcoming, or occupied based on schedule data.

- Accordion detail panel: click rooms in the side panel or on the map to view details.

- Demo ticket form: submit issue reports stored in browser sessionStorage.

- About page: team member profiles with photos and bios.

## Tech Stack

- Backend: Django

- Frontend: HTML5, Bootstrap 5, JavaScript (ES6)

- Data: Static JSON for room schedules

- CSS: Custom default.css for map styling and overrides

## Prerequisites

- Python 3.8+
- pip
- Git
- MySQL Server
- MySQL Workbench

## Installation

1. Clone the repository
```
git clone https://github.com/Team-Neptune-4155/Sprint-3
cd storefront
```

2. Create and activate a virtual environment:
```
python -m venv venv
source venv/bin/activate # Linux/macOS
venv\Scripts\activate # Windows
```

3. Install dependencies:
```
pip install Django
python -m pip install mysql-connector-python 
```

4. Apply database migrations (no existing models by default):
```
python manage.py migrate
```

## Usage

Start the development server:
```
python manage.py runserver
```

Visit:
- Home: `http://127.0.0.1:8000/` — interactive map and availability

- Contact: `http://127.0.0.1:8000/contact/` — demo ticket form

- About: `http://127.0.0.1:8000/about/` — Meet Team Neptune

## Configuration

- Schedule data lives in `static/rooms.json`. Update with real values or API integration.

- Static files: ensure `STATIC_URL` and `STATICFILES_DIRS` in `settings.py` include `static/`.