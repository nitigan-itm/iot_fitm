// State Management
let widgets = [];
let simulatedStates = {
    V0: 28,  // Temp Slider
    V1: 62,  // Humidity Slider
    V2: 0,   // LED V2 (Output)
    V3: 0,   // LED V3 (Output)
    V4: 0,   // Custom
    V5: 0    // Custom
};

let activeConfigWidgetId = null;

// DOM Elements
const widgetGrid = document.getElementById('widgetGrid');
const addGaugeBtn = document.getElementById('addGaugeBtn');
const addButtonBtn = document.getElementById('addButtonBtn');
const copyTokenBtn = document.getElementById('copyTokenBtn');
const authTokenText = document.getElementById('authToken');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// Config Sidebar Elements
const configSidebar = document.getElementById('configSidebar');
const closeConfigBtn = document.getElementById('closeConfigBtn');
const configForm = document.getElementById('configForm');
const saveConfigBtn = document.getElementById('saveConfigBtn');
const configWidgetId = document.getElementById('configWidgetId');
const configTitle = document.getElementById('configTitle');
const configPin = document.getElementById('configPin');
const configColorPicker = document.getElementById('configColorPicker');
const gaugeConfigGroup = document.getElementById('gaugeConfigGroup');
const buttonConfigGroup = document.getElementById('buttonConfigGroup');
const configUnit = document.getElementById('configUnit');
const configMin = document.getElementById('configMin');
const configMax = document.getElementById('configMax');
const configButtonMode = document.getElementById('configButtonMode');

// Sim Elements
const simSliderV0 = document.getElementById('simSliderV0');
const simSliderV1 = document.getElementById('simSliderV1');
const simLedV2 = document.getElementById('simLedV2');
const simLedV3 = document.getElementById('simLedV3');

// Default Seed Data
const DEFAULT_WIDGETS = [
    {
        id: 'widget-temp-gauge',
        type: 'gauge',
        title: 'Room Temperature',
        pin: 'V0',
        theme: 'emerald',
        value: 28,
        min: 0,
        max: 100,
        unit: '°C'
    },
    {
        id: 'widget-humidity-gauge',
        type: 'gauge',
        title: 'Air Humidity',
        pin: 'V1',
        theme: 'cyan',
        value: 62,
        min: 0,
        max: 100,
        unit: '%'
    },
    {
        id: 'widget-relay-btn',
        type: 'button',
        title: 'AC Relay Power',
        pin: 'V2',
        theme: 'magenta',
        value: 0,
        mode: 'switch'
    }
];

// Initialize Application
function init() {
    // Load from LocalStorage or seed defaults
    const savedWidgets = localStorage.getItem('blynk_mock_widgets');
    if (savedWidgets) {
        widgets = JSON.parse(savedWidgets);
    } else {
        widgets = [...DEFAULT_WIDGETS];
        saveToLocalStorage();
    }

    // Load simulator states to match defaults
    simSliderV0.value = simulatedStates.V0;
    simSliderV1.value = simulatedStates.V1;
    updateSimulatorLEDs();

    // Event Listeners
    setupEventListeners();

    // Render Dashboard
    renderWidgets();
}

// Event Listeners Setup
function setupEventListeners() {
    // Add widgets
    addGaugeBtn.addEventListener('click', () => createWidget('gauge'));
    addButtonBtn.addEventListener('click', () => createWidget('button'));

    // Config Panel Actions
    closeConfigBtn.addEventListener('click', closeConfig);
    saveConfigBtn.addEventListener('click', saveWidgetConfig);

    // Color Pickers in Config
    configColorPicker.addEventListener('click', (e) => {
        if (e.target.classList.contains('color-pill')) {
            document.querySelectorAll('.color-pill').forEach(p => p.classList.remove('selected'));
            e.target.classList.add('selected');
        }
    });

    // Copy Auth Token
    copyTokenBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(authTokenText.textContent).then(() => {
            showToast('Auth Token copied to clipboard!');
        });
    });

    // Hardware Simulator Sliders
    simSliderV0.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        updateSimulatedState('V0', val);
    });

    simSliderV1.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        updateSimulatedState('V1', val);
    });
}

// Save widgets back to localStorage
function saveToLocalStorage() {
    localStorage.setItem('blynk_mock_widgets', JSON.stringify(widgets));
}

// Display alert messages
function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// Create new widget
function createWidget(type) {
    const id = 'widget-' + Date.now();
    let newWidget = {
        id: id,
        type: type,
        title: type === 'gauge' ? 'New Gauge' : 'New Switch',
        pin: type === 'gauge' ? 'V0' : 'V3',
        theme: type === 'gauge' ? 'cyan' : 'emerald',
        value: 0
    };

    if (type === 'gauge') {
        newWidget.min = 0;
        newWidget.max = 100;
        newWidget.unit = 'units';
        newWidget.value = simulatedStates[newWidget.pin] || 0;
    } else {
        newWidget.mode = 'switch';
        newWidget.value = 0;
    }

    widgets.push(newWidget);
    saveToLocalStorage();
    renderWidgets();
    showToast(`Added new ${type} widget!`);
    
    // Auto-open configurations for the newly created widget
    openConfig(id);
}

// Delete widget
function deleteWidget(id) {
    widgets = widgets.filter(w => w.id !== id);
    saveToLocalStorage();
    renderWidgets();
    if (activeConfigWidgetId === id) {
        closeConfig();
    }
    showToast('Widget deleted.');
}

// Update simulated states (Hardware inputs)
function updateSimulatedState(pin, value) {
    simulatedStates[pin] = value;
    
    // Find widgets bound to this pin and update them
    widgets.forEach(w => {
        if (w.pin === pin) {
            w.value = value;
            if (w.type === 'gauge') {
                updateGaugeUI(w);
            } else if (w.type === 'button') {
                const checkbox = document.getElementById(`toggle-${w.id}`);
                if (checkbox) {
                    checkbox.checked = value === 1;
                }
                const label = document.getElementById(`status-lbl-${w.id}`);
                if (label) {
                    label.textContent = value === 1 ? 'ON' : 'OFF';
                }
            }
        }
    });

    // Update physical status in hardware simulator if it is an LED target
    updateSimulatorLEDs();
}

// Keep hardware LEDs in sync with output values
function updateSimulatorLEDs() {
    if (simulatedStates.V2 === 1) {
        simLedV2.classList.add('active');
    } else {
        simLedV2.classList.remove('active');
    }

    if (simulatedStates.V3 === 1) {
        simLedV3.classList.add('active');
    } else {
        simLedV3.classList.remove('active');
    }
}

// Open config panel
function openConfig(widgetId) {
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return;

    activeConfigWidgetId = widgetId;
    configWidgetId.value = widgetId;
    configTitle.value = widget.title;
    configPin.value = widget.pin;

    // Set selected theme color pill
    document.querySelectorAll('.color-pill').forEach(pill => {
        pill.classList.remove('selected');
        if (pill.dataset.theme === widget.theme) {
            pill.classList.add('selected');
        }
    });

    // Toggle input visibility based on widget type
    if (widget.type === 'gauge') {
        gaugeConfigGroup.style.display = 'block';
        buttonConfigGroup.style.display = 'none';
        configUnit.value = widget.unit || '';
        configMin.value = widget.min || 0;
        configMax.value = widget.max || 100;
    } else {
        gaugeConfigGroup.style.display = 'none';
        buttonConfigGroup.style.display = 'block';
        configButtonMode.value = widget.mode || 'switch';
    }

    configSidebar.classList.add('active');
}

// Close config panel
function closeConfig() {
    configSidebar.classList.remove('active');
    activeConfigWidgetId = null;
}

// Save widget configuration
function saveWidgetConfig() {
    const widgetId = configWidgetId.value;
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return;

    widget.title = configTitle.value || (widget.type === 'gauge' ? 'Gauge' : 'Button');
    widget.pin = configPin.value;

    const selectedPill = document.querySelector('.color-pill.selected');
    widget.theme = selectedPill ? selectedPill.dataset.theme : 'cyan';

    if (widget.type === 'gauge') {
        widget.unit = configUnit.value;
        widget.min = parseFloat(configMin.value) || 0;
        widget.max = parseFloat(configMax.value) || 100;
        // Bind to simulator state immediately
        widget.value = simulatedStates[widget.pin] || 0;
    } else {
        widget.mode = configButtonMode.value;
        // If mode changed to push, reset values to 0
        widget.value = simulatedStates[widget.pin] || 0;
    }

    saveToLocalStorage();
    renderWidgets();
    closeConfig();
    showToast('Widget updated!');
}

// Math for Gauge visual arc
function updateGaugeUI(widget) {
    const card = document.getElementById(widget.id);
    if (!card) return;

    const valueEl = card.querySelector('.gauge-value');
    if (valueEl) valueEl.textContent = widget.value;

    const fillPath = card.querySelector('.gauge-fill-path');
    if (fillPath) {
        // Safe ranges
        const min = widget.min;
        const max = widget.max;
        const value = Math.max(min, Math.min(max, widget.value));
        
        const ratio = (value - min) / (max - min);
        // Circumference of semi-circle arc (A 70 70) is ~220
        const strokeDashoffset = 220 - (ratio * 220);
        fillPath.style.strokeDashoffset = strokeDashoffset;
    }
}

// Main Render Function
function renderWidgets() {
    widgetGrid.innerHTML = '';

    if (widgets.length === 0) {
        widgetGrid.innerHTML = `
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path></svg>
                <h3>No Widgets Added</h3>
                <p>Add reactive controllers from the left sidebar to start monitoring virtual ESP32 hardware.</p>
            </div>
        `;
        return;
    }

    widgets.forEach(widget => {
        const card = document.createElement('div');
        card.id = widget.id;
        card.className = `widget-card theme-${widget.theme}`;

        // Sync local widget value with global pin states
        if (simulatedStates[widget.pin] !== undefined) {
            widget.value = simulatedStates[widget.pin];
        }

        let widgetBodyHtml = '';

        if (widget.type === 'gauge') {
            const min = widget.min;
            const max = widget.max;
            const value = Math.max(min, Math.min(max, widget.value));
            const ratio = (value - min) / (max - min);
            const strokeDashoffset = 220 - (ratio * 220);

            widgetBodyHtml = `
                <div class="widget-body gauge-body">
                    <svg class="gauge-svg" viewBox="0 0 170 100">
                        <path class="gauge-bg-path" d="M 15 90 A 70 70 0 0 1 155 90" />
                        <path class="gauge-fill-path" d="M 15 90 A 70 70 0 0 1 155 90" style="stroke-dashoffset: ${strokeDashoffset};" />
                    </svg>
                    <div class="gauge-value-display">
                        <span class="gauge-value">${value}</span>
                        <span class="gauge-unit">${widget.unit || ''}</span>
                    </div>
                    <div class="gauge-range">
                        <span>${widget.min}</span>
                        <span>${widget.max}</span>
                    </div>
                </div>
            `;
        } else if (widget.type === 'button') {
            const isChecked = widget.value === 1 ? 'checked' : '';
            const statusLabel = widget.value === 1 ? 'ON' : 'OFF';

            widgetBodyHtml = `
                <div class="widget-body button-body">
                    <label class="blynk-switch">
                        <input type="checkbox" id="toggle-${widget.id}" ${isChecked}>
                        <span class="slider-toggle"></span>
                    </label>
                    <span class="button-status" id="status-lbl-${widget.id}">${statusLabel}</span>
                </div>
            `;
        }

        card.innerHTML = `
            <div class="widget-header">
                <div class="widget-title-container">
                    <span class="widget-title">${widget.title}</span>
                    <span class="widget-pin">${widget.pin}</span>
                </div>
                <div class="widget-actions">
                    <button class="widget-action-btn edit-btn" onclick="openConfig('${widget.id}')" title="Configure Widget">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                    </button>
                    <button class="widget-action-btn delete-btn" onclick="deleteWidget('${widget.id}')" title="Delete Widget">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </div>
            </div>
            ${widgetBodyHtml}
        `;

        widgetGrid.appendChild(card);

        // Bind interactive events for buttons inside widget
        if (widget.type === 'button') {
            const toggle = document.getElementById(`toggle-${widget.id}`);
            if (toggle) {
                if (widget.mode === 'switch') {
                    toggle.addEventListener('change', (e) => {
                        const newVal = e.target.checked ? 1 : 0;
                        updateSimulatedState(widget.pin, newVal);
                    });
                } else {
                    // Momentary push button logic
                    // Convert regular toggle visual to fit momentary feedback behavior
                    toggle.addEventListener('mousedown', () => {
                        updateSimulatedState(widget.pin, 1);
                    });
                    
                    const handleRelease = () => {
                        if (simulatedStates[widget.pin] === 1) {
                            updateSimulatedState(widget.pin, 0);
                        }
                    };
                    toggle.addEventListener('mouseup', handleRelease);
                    toggle.addEventListener('mouseleave', handleRelease);
                    // touch support
                    toggle.addEventListener('touchstart', (e) => {
                        e.preventDefault();
                        updateSimulatedState(widget.pin, 1);
                    });
                    toggle.addEventListener('touchend', handleRelease);
                }
            }
        }
    });
}

// Start App
window.onload = init;
