/**
 * ENGINEX - Professional Engineering & Technical Unit Converter Engine
 * Handles bidirectional bindings, SVG visualizers, references, and session logging.
 */

document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================
  // 1. Data Schema & Engineering Presets
  // ==========================================
  const conversionConfig = {
    temperature: {
      title: "Thermodynamics & Heat",
      desc: "Calculate thermal dynamics, cooling cycles, engine room heat loads, and thermodynamic processes.",
      units: {
        celsius: { name: "Celsius", symbol: "°C", type: "temp" },
        fahrenheit: { name: "Fahrenheit", symbol: "°F", type: "temp" },
        kelvin: { name: "Kelvin", symbol: "K", type: "temp" }
      },
      presets: [
        { name: "Absolute Zero", value: 0, unit: "kelvin" },
        { name: "Water Freezing Point", value: 0, unit: "celsius" },
        { name: "Standard Room Temp", value: 20, unit: "celsius" },
        { name: "Human Body Temp", value: 37, unit: "celsius" },
        { name: "Water Boiling Point", value: 100, unit: "celsius" }
      ],
      gaugeLimits: { min: -50, max: 200, baseUnit: "celsius" },
      gaugeLabel: "THERMAL COLUMN"
    },
    pressure: {
      title: "Pressure & Fluid Physics",
      desc: "Analyze compressor capacity, gas kinetics, fluid lines, hydraulic pumps, and manifold gauges.",
      units: {
        pascal: { name: "Pascal", symbol: "Pa", baseMultiplier: 1 },
        bar: { name: "Bar", symbol: "bar", baseMultiplier: 100000 },
        psi: { name: "PSI (Pounds/sq in)", symbol: "psi", baseMultiplier: 6894.75729 }
      },
      presets: [
        { name: "Vacuum Chamber Target", value: 10, unit: "pascal" },
        { name: "Standard Atmospheric (atm)", value: 1.01325, unit: "bar" },
        { name: "Typical Tire Pressure", value: 32, unit: "psi" },
        { name: "Scuba Cylinder Rating", value: 200, unit: "bar" },
        { name: "Industrial Air Compressor", value: 120, unit: "psi" }
      ],
      gaugeLimits: { min: 0, max: 500000, baseUnit: "pascal" },
      gaugeLabel: "FLUID PRESS LOAD"
    },
    power: {
      title: "Power & Mechanical Work",
      desc: "Measure mechanical motor ratings, electrical consumption loads, and thermal power transfer rates.",
      units: {
        watt: { name: "Watt", symbol: "W", baseMultiplier: 1 },
        kilowatt: { name: "Kilowatt", symbol: "kW", baseMultiplier: 1000 },
        horsepower: { name: "Horsepower (hp)", symbol: "hp", baseMultiplier: 745.699872 }
      },
      presets: [
        { name: "Human Basal Output", value: 85, unit: "watt" },
        { name: "Heavy Duty Server Unit", value: 750, unit: "watt" },
        { name: "Domestic Electric Kettle", value: 2.2, unit: "kilowatt" },
        { name: "HVAC Condenser Motor", value: 5, unit: "horsepower" },
        { name: "Locomotive Diesel Motor", value: 3300, unit: "kilowatt" }
      ],
      gaugeLimits: { min: 0, max: 10000, baseUnit: "watt" },
      gaugeLabel: "WORK FORCE RATIO"
    },
    length: {
      title: "Physical Dimensions & Clearances",
      desc: "Perform dynamic sizing, tolerance spacing, building elevations, and precise mechanical alignments.",
      units: {
        meter: { name: "Meter", symbol: "m", baseMultiplier: 1 },
        centimeter: { name: "Centimeter", symbol: "cm", baseMultiplier: 0.01 },
        millimeter: { name: "Millimeter", symbol: "mm", baseMultiplier: 0.001 },
        inch: { name: "Inch", symbol: "in", baseMultiplier: 0.0254 },
        foot: { name: "Foot", symbol: "ft", baseMultiplier: 0.3048 }
      },
      presets: [
        { name: "CNC Machining Space", value: 0.25, unit: "millimeter" },
        { name: "Precision Caliper Limit", value: 6, unit: "inch" },
        { name: "Standard Rack Space Height", value: 1.75, unit: "inch" },
        { name: "Machinery Base Leveling", value: 3, unit: "meter" },
        { name: "Transmission Line Height", value: 35, unit: "foot" }
      ],
      gaugeLimits: { min: 0, max: 5, baseUnit: "meter" },
      gaugeLabel: "DIMENSIONAL SCOPE"
    },
    weight: {
      title: "Mass & Structural Loads",
      desc: "Analyze structural ballast specs, mechanical weights, industrial payloads, and force actions.",
      units: {
        kilogram: { name: "Kilogram", symbol: "kg", baseMultiplier: 1 },
        pound: { name: "Pound", symbol: "lb", baseMultiplier: 0.45359237 },
        gram: { name: "Gram", symbol: "g", baseMultiplier: 0.001 },
        ounce: { name: "Ounce", symbol: "oz", baseMultiplier: 0.028349523 }
      },
      presets: [
        { name: "Precision Lab Weight", value: 50, unit: "gram" },
        { name: "Pneumatic Handheld Tool", value: 4.5, unit: "pound" },
        { name: "Server Cabin Loaded Rack", value: 350, unit: "kilogram" },
        { name: "Industrial Crane Load Limit", value: 2000, unit: "kilogram" },
        { name: "Aircraft Aluminum Plate", value: 80, unit: "ounce" }
      ],
      gaugeLimits: { min: 0, max: 500, baseUnit: "kilogram" },
      gaugeLabel: "GRAVITATIONAL MASS"
    }
  };

  // ==========================================
  // 2. Global State Variable Registry
  // ==========================================
  let currentCategory = 'temperature';
  let historyLogs = JSON.parse(localStorage.getItem('enginex_history')) || [];
  let logDebounceTimer = null;
  let activeDirection = 'src-to-tgt'; // Track active user editing flow for formula highlights

  // ==========================================
  // 3. Document Object Model Node Mappings
  // ==========================================
  const DOM = {
    // Navigation & Theme
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    themeIcon: document.getElementById('themeIcon'),
    categoryNav: document.getElementById('categoryNav'),
    categoryTitle: document.getElementById('categoryTitle'),
    categoryDesc: document.getElementById('categoryDesc'),

    // Inputs & Dropdowns
    srcCard: document.getElementById('srcCard'),
    tgtCard: document.getElementById('tgtCard'),
    srcUnitSelect: document.getElementById('srcUnitSelect'),
    tgtUnitSelect: document.getElementById('tgtUnitSelect'),
    srcValueInput: document.getElementById('srcValueInput'),
    tgtValueInput: document.getElementById('tgtValueInput'),
    srcSymbol: document.getElementById('srcSymbol'),
    tgtSymbol: document.getElementById('tgtSymbol'),
    srcUnitBadge: document.getElementById('srcUnitBadge'),
    tgtUnitBadge: document.getElementById('tgtUnitBadge'),
    swapUnitsBtn: document.getElementById('swapUnitsBtn'),

    // Visualizers & Details
    formulaEquation: document.getElementById('formulaEquation'),
    formulaStep: document.getElementById('formulaStep'),
    gaugeFillPath: document.getElementById('gaugeFillPath'),
    gaugeNeedle: document.getElementById('gaugeNeedle'),
    gaugeValueText: document.getElementById('gaugeValueText'),
    gaugeLabelText: document.getElementById('gaugeLabelText'),
    presetList: document.getElementById('presetList'),
    historyList: document.getElementById('historyList'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn')
  };

  // ==========================================
  // 4. Core Mathematical Conversion Formulas
  // ==========================================
  
  /**
   * Translates a category metric value between two given units.
   */
  function convert(value, fromUnitKey, toUnitKey, categoryKey) {
    if (isNaN(value)) return NaN;
    if (fromUnitKey === toUnitKey) return value;
    
    const cat = conversionConfig[categoryKey];
    
    // Temperature handles affine mappings
    if (categoryKey === 'temperature') {
      let celsius;
      if (fromUnitKey === 'celsius') celsius = value;
      else if (fromUnitKey === 'fahrenheit') celsius = (value - 32) * 5 / 9;
      else if (fromUnitKey === 'kelvin') celsius = value - 273.15;

      if (toUnitKey === 'celsius') return celsius;
      if (toUnitKey === 'fahrenheit') return (celsius * 9 / 5) + 32;
      if (toUnitKey === 'kelvin') return celsius + 273.15;
    }
    
    // Standard scaling factors for other units
    const fromMultiplier = cat.units[fromUnitKey].baseMultiplier;
    const toMultiplier = cat.units[toUnitKey].baseMultiplier;
    const baseValue = value * fromMultiplier;
    return baseValue / toMultiplier;
  }

  // ==========================================
  // 5. System UI Component Renderers
  // ==========================================

  /**
   * Dynamically populates dropdown unit selection elements.
   */
  function renderUnitSelectOptions() {
    const units = conversionConfig[currentCategory].units;
    let selectHTML = '';
    
    for (const [key, details] of Object.entries(units)) {
      selectHTML += `<option value="${key}">${details.name} (${details.symbol})</option>`;
    }
    
    DOM.srcUnitSelect.innerHTML = selectHTML;
    DOM.tgtUnitSelect.innerHTML = selectHTML;
    
    // Ensure separate active units by default
    const keys = Object.keys(units);
    DOM.srcUnitSelect.value = keys[0];
    DOM.tgtUnitSelect.value = keys[1] || keys[0];
    
    updateUnitSymbolLabels();
  }

  /**
   * Refreshes the display symbols next to the value input areas.
   */
  function updateUnitSymbolLabels() {
    const catUnits = conversionConfig[currentCategory].units;
    const srcUnit = catUnits[DOM.srcUnitSelect.value];
    const tgtUnit = catUnits[DOM.tgtUnitSelect.value];

    DOM.srcSymbol.textContent = srcUnit.symbol;
    DOM.tgtSymbol.textContent = tgtUnit.symbol;
    DOM.srcUnitBadge.textContent = srcUnit.name;
    DOM.tgtUnitBadge.textContent = tgtUnit.name;
  }

  /**
   * Renders the reference presets clickable list.
   */
  function renderPresets() {
    const presets = conversionConfig[currentCategory].presets;
    const units = conversionConfig[currentCategory].units;
    let html = '';
    
    presets.forEach((preset) => {
      const symbol = units[preset.unit].symbol;
      html += `
        <div class="ref-row" data-val="${preset.value}" data-unit="${preset.unit}">
          <span class="ref-name">${preset.name}</span>
          <span class="ref-val">${preset.value} ${symbol}</span>
        </div>
      `;
    });
    
    DOM.presetList.innerHTML = html;
    
    // Add Click listeners for loading preset metrics
    DOM.presetList.querySelectorAll('.ref-row').forEach(row => {
      row.addEventListener('click', () => {
        const val = parseFloat(row.getAttribute('data-val'));
        const unit = row.getAttribute('data-unit');
        
        DOM.srcUnitSelect.value = unit;
        DOM.srcValueInput.value = val;
        
        activeDirection = 'src-to-tgt';
        updateUnitSymbolLabels();
        performConversion();
      });
    });
  }

  /**
   * Prepares and updates the graphical SVG gauge display.
   */
  function updateVisualizer(sourceVal, srcUnitKey) {
    const cat = conversionConfig[currentCategory];
    
    // Step 1: Normalize current value to the base unit
    let baseVal = sourceVal;
    if (currentCategory === 'temperature') {
      if (srcUnitKey === 'fahrenheit') baseVal = (sourceVal - 32) * 5 / 9;
      else if (srcUnitKey === 'kelvin') baseVal = sourceVal - 273.15;
    } else {
      const multiplier = cat.units[srcUnitKey].baseMultiplier;
      baseVal = sourceVal * multiplier;
    }

    // Step 2: Compute ratio based on gauge configuration limits
    const limit = cat.gaugeLimits;
    let percentage = (baseVal - limit.min) / (limit.max - limit.min);
    
    // Clamp percentages between 0 and 100
    percentage = Math.max(0, Math.min(1, percentage));
    
    // Step 3: Shift SVG dynamic circle and needles
    // Gauge Path length represents 252 degrees or 352px dash spacing.
    const dashLength = 352;
    const dashOffset = dashLength * (1 - percentage);
    
    DOM.gaugeFillPath.style.strokeDashoffset = dashOffset;
    
    // Rotate needle from -126deg to +126deg
    const angle = -126 + (252 * percentage);
    DOM.gaugeNeedle.style.transform = `rotate(${angle}deg)`;
    
    // Render text indicator
    const percentText = Math.round(percentage * 100);
    DOM.gaugeValueText.textContent = `${percentText}%`;
    DOM.gaugeLabelText.textContent = cat.gaugeLabel;
  }

  /**
   * Constructs step-by-step mathematical strings mapping the execution.
   */
  function updateFormulaExplanation(srcVal, srcUnitKey, tgtVal, tgtUnitKey) {
    if (isNaN(srcVal) || isNaN(tgtVal)) {
      DOM.formulaEquation.textContent = "Equation Parsing Failure";
      DOM.formulaStep.textContent = "Please input valid parameters.";
      return;
    }

    const cat = conversionConfig[currentCategory];
    const srcUnit = cat.units[srcUnitKey];
    const tgtUnit = cat.units[tgtUnitKey];

    // Limit decimal precision for display comfort
    const displaySrc = Number(srcVal.toFixed(4));
    const displayTgt = Number(tgtVal.toFixed(4));

    if (srcUnitKey === tgtUnitKey) {
      DOM.formulaEquation.textContent = `${displaySrc} ${srcUnit.symbol} = ${displayTgt} ${tgtUnit.symbol}`;
      DOM.formulaStep.textContent = "Identical values. Factor scale: 1.000";
      return;
    }

    // Custom text templates for Temperatures
    if (currentCategory === 'temperature') {
      if (srcUnitKey === 'celsius' && tgtUnitKey === 'fahrenheit') {
        DOM.formulaEquation.innerHTML = `(${displaySrc} ${srcUnit.symbol} &times; 9/5) + 32 = ${displayTgt} ${tgtUnit.symbol}`;
        DOM.formulaStep.textContent = "Multiply by 1.8 and add 32.";
      } else if (srcUnitKey === 'fahrenheit' && tgtUnitKey === 'celsius') {
        DOM.formulaEquation.innerHTML = `(${displaySrc} ${srcUnit.symbol} - 32) &times; 5/9 = ${displayTgt} ${tgtUnit.symbol}`;
        DOM.formulaStep.textContent = "Subtract 32 then multiply by 0.5556.";
      } else if (srcUnitKey === 'celsius' && tgtUnitKey === 'kelvin') {
        DOM.formulaEquation.innerHTML = `${displaySrc} ${srcUnit.symbol} + 273.15 = ${displayTgt} ${tgtUnit.symbol}`;
        DOM.formulaStep.textContent = "Add absolute freezing constant: 273.15.";
      } else if (srcUnitKey === 'kelvin' && tgtUnitKey === 'celsius') {
        DOM.formulaEquation.innerHTML = `${displaySrc} ${srcUnit.symbol} - 273.15 = ${displayTgt} ${tgtUnit.symbol}`;
        DOM.formulaStep.textContent = "Subtract absolute freezing constant: 273.15.";
      } else if (srcUnitKey === 'fahrenheit' && tgtUnitKey === 'kelvin') {
        DOM.formulaEquation.innerHTML = `(${displaySrc} ${srcUnit.symbol} - 32) &times; 5/9 + 273.15 = ${displayTgt} ${tgtUnit.symbol}`;
        DOM.formulaStep.textContent = "Translate to Celsius then shift to Kelvin absolute scales.";
      } else if (srcUnitKey === 'kelvin' && tgtUnitKey === 'fahrenheit') {
        DOM.formulaEquation.innerHTML = `(${displaySrc} ${srcUnit.symbol} - 273.15) &times; 9/5 + 32 = ${displayTgt} ${tgtUnit.symbol}`;
        DOM.formulaStep.textContent = "Translate to Celsius then expand to Fahrenheit ranges.";
      }
      return;
    }

    // Standard multipliers formulas
    const fromM = srcUnit.baseMultiplier;
    const toM = tgtUnit.baseMultiplier;
    const factorRatio = fromM / toM;
    
    // Format nicely using engineering scale formatting
    let mathFactor = factorRatio.toLocaleString(undefined, { maximumFractionDigits: 6 });
    if (factorRatio < 0.0001 || factorRatio > 100000) {
      mathFactor = factorRatio.toExponential(4);
    }

    DOM.formulaEquation.innerHTML = `${displaySrc} ${srcUnit.symbol} &times; ${mathFactor} = ${displayTgt} ${tgtUnit.symbol}`;
    
    // Display textual steps
    if (fromM > toM) {
      DOM.formulaStep.textContent = `Multiply source metric by mechanical factor ratio ${mathFactor}.`;
    } else {
      const divisionFactor = (toM / fromM).toLocaleString(undefined, { maximumFractionDigits: 4 });
      DOM.formulaStep.textContent = `Divide source metric by inverse factor ratio ${divisionFactor}.`;
    }
  }

  // ==========================================
  // 6. Interactive Conversion Engine Handlers
  // ==========================================

  /**
   * Main calculation driver coordinating state, converters, widgets, and history.
   */
  function performConversion() {
    const srcUnitKey = DOM.srcUnitSelect.value;
    const tgtUnitKey = DOM.tgtUnitSelect.value;
    
    let srcValue = parseFloat(DOM.srcValueInput.value);
    let tgtValue = parseFloat(DOM.tgtValueInput.value);

    // Safeguard empty fields
    if (DOM.srcValueInput.value.trim() === '') srcValue = NaN;
    if (DOM.tgtValueInput.value.trim() === '') tgtValue = NaN;

    if (activeDirection === 'src-to-tgt') {
      if (isNaN(srcValue)) {
        DOM.tgtValueInput.value = '';
        updateFormulaExplanation(NaN, srcUnitKey, NaN, tgtUnitKey);
        updateVisualizer(0, srcUnitKey);
        return;
      }
      
      const calculated = convert(srcValue, srcUnitKey, tgtUnitKey, currentCategory);
      // Clean decimal tail representation
      DOM.tgtValueInput.value = Number(calculated.toFixed(6));
      
      updateFormulaExplanation(srcValue, srcUnitKey, calculated, tgtUnitKey);
      updateVisualizer(srcValue, srcUnitKey);
      queueHistoryLog(srcValue, srcUnitKey, calculated, tgtUnitKey);
    } else {
      if (isNaN(tgtValue)) {
        DOM.srcValueInput.value = '';
        updateFormulaExplanation(NaN, srcUnitKey, NaN, tgtUnitKey);
        updateVisualizer(0, srcUnitKey);
        return;
      }
      
      const calculated = convert(tgtValue, tgtUnitKey, srcUnitKey, currentCategory);
      DOM.srcValueInput.value = Number(calculated.toFixed(6));
      
      updateFormulaExplanation(calculated, srcUnitKey, tgtValue, tgtUnitKey);
      updateVisualizer(calculated, srcUnitKey);
      queueHistoryLog(calculated, srcUnitKey, tgtValue, tgtUnitKey);
    }
  }

  // ==========================================
  // 7. Persistent History Log Module
  // ==========================================

  /**
   * Debounces history inserts to restrict logs to meaningful key halts.
   */
  function queueHistoryLog(srcVal, srcUnitKey, tgtVal, tgtUnitKey) {
    if (logDebounceTimer) clearTimeout(logDebounceTimer);
    
    logDebounceTimer = setTimeout(() => {
      recordHistory(srcVal, srcUnitKey, tgtVal, tgtUnitKey);
    }, 1200); // 1.2s timeout
  }

  /**
   * Validates and logs calculations into history, rendering elements.
   */
  function recordHistory(srcVal, srcUnitKey, tgtVal, tgtUnitKey) {
    if (isNaN(srcVal) || isNaN(tgtVal) || srcUnitKey === tgtUnitKey) return;

    const cat = conversionConfig[currentCategory];
    const srcSymbol = cat.units[srcUnitKey].symbol;
    const tgtSymbol = cat.units[tgtUnitKey].symbol;

    const logEntry = {
      category: currentCategory,
      srcVal: Number(srcVal.toFixed(4)),
      srcUnitKey,
      srcSymbol,
      tgtVal: Number(tgtVal.toFixed(4)),
      tgtUnitKey,
      tgtSymbol,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    // Avoid duplicating consecutive identical operations
    if (historyLogs.length > 0) {
      const last = historyLogs[0];
      if (last.srcVal === logEntry.srcVal && 
          last.srcUnitKey === logEntry.srcUnitKey && 
          last.tgtUnitKey === logEntry.tgtUnitKey &&
          last.category === logEntry.category) {
        return;
      }
    }

    historyLogs.unshift(logEntry);
    
    // Limit local logs pool to 10 entries
    if (historyLogs.length > 10) historyLogs.pop();

    localStorage.setItem('enginex_history', JSON.stringify(historyLogs));
    renderHistory();
  }

  /**
   * Renders calculation list items into history containers.
   */
  function renderHistory() {
    if (historyLogs.length === 0) {
      DOM.historyList.innerHTML = `<div class="history-empty">No calculations logged yet. Type a value to log.</div>`;
      return;
    }

    let html = '';
    historyLogs.forEach((log, index) => {
      html += `
        <div class="history-item" data-index="${index}" style="--delay: ${index}">
          <div class="history-item-top">
            <span>${log.category.toUpperCase()}</span>
            <span>${log.timestamp}</span>
          </div>
          <div class="history-item-bottom">
            <span>${log.srcVal} ${log.srcSymbol}</span>
            <span class="history-arrow">&rarr;</span>
            <span>${log.tgtVal} ${log.tgtSymbol}</span>
          </div>
        </div>
      `;
    });

    DOM.historyList.innerHTML = html;

    // Click handler to load historical operations back to active slots
    DOM.historyList.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', () => {
        const index = parseInt(item.getAttribute('data-index'));
        const log = historyLogs[index];
        
        // Reset category if mismatch
        if (log.category !== currentCategory) {
          switchCategory(log.category);
        }
        
        DOM.srcUnitSelect.value = log.srcUnitKey;
        DOM.tgtUnitSelect.value = log.tgtUnitKey;
        DOM.srcValueInput.value = log.srcVal;
        
        activeDirection = 'src-to-tgt';
        updateUnitSymbolLabels();
        performConversion();
      });
    });
  }

  // ==========================================
  // 8. Global State Interaction Routines
  // ==========================================

  /**
   * Transitions active converter contexts when user changes categories.
   */
  function switchCategory(categoryKey) {
    currentCategory = categoryKey;
    
    // Update active visual button classes
    DOM.categoryNav.querySelectorAll('.category-btn').forEach(btn => {
      if (btn.getAttribute('data-category') === categoryKey) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const cat = conversionConfig[categoryKey];
    DOM.categoryTitle.textContent = cat.title;
    DOM.categoryDesc.textContent = cat.desc;

    // Reset default inputs
    DOM.srcValueInput.value = categoryKey === 'temperature' ? 100 : 1;
    activeDirection = 'src-to-tgt';

    renderUnitSelectOptions();
    renderPresets();
    performConversion();
  }

  // ==========================================
  // 9. Input & Control Event Listeners
  // ==========================================

  // Sidebar buttons for Category switcher
  DOM.categoryNav.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.getAttribute('data-category');
      switchCategory(category);
    });
  });

  // Bidirectional live inputs
  DOM.srcValueInput.addEventListener('input', () => {
    activeDirection = 'src-to-tgt';
    performConversion();
  });

  DOM.tgtValueInput.addEventListener('input', () => {
    activeDirection = 'tgt-to-src';
    performConversion();
  });

  // Dropdown select updates
  DOM.srcUnitSelect.addEventListener('change', () => {
    updateUnitSymbolLabels();
    performConversion();
  });

  DOM.tgtUnitSelect.addEventListener('change', () => {
    updateUnitSymbolLabels();
    performConversion();
  });

  // Swap unit slots handler
  DOM.swapUnitsBtn.addEventListener('click', () => {
    const tempUnit = DOM.srcUnitSelect.value;
    DOM.srcUnitSelect.value = DOM.tgtUnitSelect.value;
    DOM.tgtUnitSelect.value = tempUnit;

    const tempVal = DOM.srcValueInput.value;
    DOM.srcValueInput.value = DOM.tgtValueInput.value;
    DOM.tgtValueInput.value = tempVal;

    // Retain direction sync depending on what was active
    activeDirection = activeDirection === 'src-to-tgt' ? 'tgt-to-src' : 'src-to-tgt';
    
    updateUnitSymbolLabels();
    performConversion();
  });

  // Clear Session History Logs
  DOM.clearHistoryBtn.addEventListener('click', () => {
    historyLogs = [];
    localStorage.removeItem('enginex_history');
    renderHistory();
  });

  // ==========================================
  // 10. Theme Toggling Control Unit
  // ==========================================
  
  function initializeTheme() {
    const savedTheme = localStorage.getItem('enginex_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
  }

  function updateThemeIcon(theme) {
    if (theme === 'dark') {
      DOM.themeIcon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke-linecap="round" stroke-linejoin="round"/>`;
    } else {
      DOM.themeIcon.innerHTML = `
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/>
        <line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      `;
    }
  }

  DOM.themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('enginex_theme', newTheme);
    updateThemeIcon(newTheme);
  });

  // ==========================================
  // 11. System Initializer Call
  // ==========================================
  initializeTheme();
  renderUnitSelectOptions();
  renderPresets();
  renderHistory();
  performConversion();

});
