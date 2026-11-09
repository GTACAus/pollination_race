const titleScreen = document.getElementById('title-screen');
const builderScreen = document.getElementById('vehicle-builder');
const mapScreen = document.getElementById('map-view');
const budgetEl = document.getElementById('budget');
const powerEl = document.getElementById('power');
const componentSelectionLeft = document.getElementById('component-selection-left');
const componentSelectionRight = document.getElementById('component-selection-right');
const vehiclePreview = document.getElementById('vehicle-preview');
const vehicleChoice = document.getElementById('vehicle-choice');
const transporterGrid = document.getElementById('transporter-grid');
const transporterMotion = document.getElementById('transporter-motion');
const transporterGridVisible = document.getElementById('transporter-grid-visible');
const transporterReducedMotion = document.getElementById('transporter-reduced-motion');
const journeyTruckTrack = document.getElementById('journey-truck-track');
const builderFeedback = document.getElementById('builder-feedback');
const routeStatus = document.getElementById('route-status');
const journeyLog = document.getElementById('journey-log');
const eventPopup = document.getElementById('event-popup');
const eventName = document.getElementById('event-name');
const eventDescription = document.getElementById('event-description');
const eventImage = document.getElementById('event-img');
const closeEventButton = document.getElementById('close-event');
const eventChoices = document.getElementById('event-choices');
const eventResult = document.getElementById('event-result');
const newBuildButton = document.getElementById('new-build-btn');
const locationImage = document.getElementById('location-img');
const currentStopName = document.getElementById('current-stop-name');
const journeyScore = document.getElementById('journey-score');
const mapMarker = document.getElementById('map-marker');
const locationStage = document.querySelector('.location-stage');
const healthMeter = document.querySelector('.health-meter');
const healthMeterFill = document.getElementById('health-meter-fill');
const vehicleHealthValue = document.getElementById('vehicle-health-value');
const vehicleSpeedStatus = document.getElementById('vehicle-speed-status');
const malfunctionWarning = document.getElementById('malfunction-warning');
const activePopulationTotal = document.getElementById('active-population-total');
const populationSurvival = document.getElementById('population-survival');
const populationBreakdown = document.getElementById('population-breakdown');
const componentStatusList = document.getElementById('component-status-list');
const repairPanel = document.getElementById('repair-panel');
const repairActions = document.getElementById('repair-actions');
const repairFeedback = document.getElementById('repair-feedback');
const repairBudget = document.getElementById('repair-budget');
const missionSummary = document.getElementById('mission-summary');
const missionSummaryOutcome = document.getElementById('mission-summary-outcome');
const missionSummaryDetails = document.getElementById('mission-summary-details');
const SIMULATION_RULES = {
  travelSlicesPerSegment: 10,
  minEventOpportunitiesPerSegment: 3,
  maxEventOpportunitiesPerSegment: 5,
  healthSpeedBands: [
    { minHealth: 70, multiplier: 1 },
    { minHealth: 40, multiplier: 0.85 },
    { minHealth: 1, multiplier: 0.65 }
  ],
  criticalHealthMalfunctionChance: 0.15,
  smartHiveWeatherLossMultiplier: 0.5,
  eventBaseSuccessReduction: 0.1,
  pollinatorDamageMultiplier: 1.5,
  repair: {
    healthPoints: 5,
    costPerAction: 500,
    withModuleHours: 2,
    withoutModuleHours: 8,
    robotRecoveryWithModulePct: 0.1,
    robotRecoveryWithoutModulePct: 0.05
  },
  scoreWeights: {
    journey: 0.8,
    pollinatorSurvival: 0.1,
    vehicleHealth: 0.1
  }
};
const MAX_EVENT_SUCCESS_PROBABILITY = 0.95;
const ROBOT_POLLINATORS = new Set(['Robot Forager', 'Robot Scout', 'Robot Pollinator']);

const routeMapPositions = [
  { left: 50, top: 73 },
  { left: 29, top: 77 },
  { left: 62, top: 57 },
  { left: 75, top: 66 },
  { left: 77, top: 86 },
  { left: 36, top: 41 },
  { left: 12, top: 12 },
  { left: 68, top: 28 },
  { left: 50, top: 73 }
];

const gameData = {
  budget: 100000,
  budgetRemaining: 100000,
  powerUsed: 0,
  catalog: {},
  footprints: {},
  vehicles: {},
  selectedVehicle: 'medium',
  placement: [],
  pendingDrop: null,
  activeDrag: null,
  selectedComponents: {
    control: null,
    engine: null,
    pollinator: [],
    other: []
  },
  route: [],
  events: [],
  currentEvent: null,
  journeyLog: [],
  routeIndex: 0,
  score: 0,
  rng: Math.random,
  eventResolved: false,
  availableEventChoices: [],
  eventHistory: [],
  eventTimeHours: 0,
  pollinatorPopulations: {},
  siteOutputMultipliers: [],
  siteProductivitySnapshots: [],
  baselineTravelHours: 0,
  baselinePollinationHours: 0,
  vehicleHealth: 100,
  componentStatuses: {},
  currentPhase: 'departure',
  eventResumePhase: '',
  segmentSliceIndex: 0,
  elapsedTravelHours: 0,
  elapsedPollinationHours: 0,
  elapsedChargingHours: 0,
  elapsedJourneyHours: 0,
  currentWeather: '',
  repairHours: 0,
  currentSiteOutput: 0,
  totalPollinationAchieved: 0,
  totalPollinationPossible: 0,
  startingPollinatorTotal: 0,
  startingPollinationCapacity: 0,
  currentChargingAdjustmentHours: 0,
  agriculturalLocationsReached: 0,
  pollinationSitesCompleted: 0,
  totalRobotsDamaged: 0,
  totalRobotsRepaired: 0,
  missionFailed: false,
  missionFailureReason: '',
  missionEndedAt: '',
  encounteredEventIds: new Set(),
  segmentEventIds: new Set(),
  phaseEventKeys: new Set(),
  scheduledEventSlices: [],
  simulationTimer: null,
  repairPausedSimulation: false,
  transporterMotion: 'driving',
  transporterGridVisible: true,
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
};

async function init() {
  bindButtons();
  transporterReducedMotion.checked = gameData.reducedMotion;
  await loadGridData();
  generateBudget();
  await loadComponents();
  await loadRouteData();
}

function bindButtons() {
  document.getElementById('start-btn').addEventListener('click', startGame);
  document.getElementById('instructions-btn').addEventListener('click', toggleInstructions);
  document.addEventListener('click', (event) => {
    const instructions = document.getElementById('instructions');
    const instructionsButton = document.getElementById('instructions-btn');
    if (
      !instructions.classList.contains('hidden') &&
      !instructions.contains(event.target) &&
      !instructionsButton.contains(event.target)
    ) {
      instructions.classList.add('hidden');
    }
  });
  document.getElementById('route-btn').addEventListener('click', startRoute);
  vehicleChoice.addEventListener('change', changeVehicle);
  transporterMotion.addEventListener('change', () => {
    gameData.transporterMotion = transporterMotion.value;
    updateTransporterAppearance();
  });
  transporterGridVisible.addEventListener('change', () => {
    gameData.transporterGridVisible = transporterGridVisible.checked;
    updateTransporterAppearance();
  });
  transporterReducedMotion.addEventListener('change', () => {
    gameData.reducedMotion = transporterReducedMotion.checked;
    updateTransporterAppearance();
  });
  transporterGrid.addEventListener('dragover', handleTransporterDragOver);
  transporterGrid.addEventListener('drop', handleTransporterDrop);
  componentSelectionLeft.addEventListener('dragstart', handleComponentDragStart);
  componentSelectionRight.addEventListener('dragstart', handleComponentDragStart);
  componentSelectionLeft.addEventListener('dragend', handleComponentDragEnd);
  componentSelectionRight.addEventListener('dragend', handleComponentDragEnd);
  transporterGrid.addEventListener('dragstart', handlePlacedComponentDragStart);
  transporterGrid.addEventListener('dragend', handleComponentDragEnd);
  document.addEventListener('dragover', handleComponentDragOverDocument);
  document.addEventListener('drop', handleComponentDropOutside);
  eventChoices.addEventListener('click', (event) => {
    const choiceButton = event.target.closest('[data-choice-id]');
    if (choiceButton) resolveEventChoice(choiceButton.dataset.choiceId);
  });
  closeEventButton.addEventListener('click', continueAfterEvent);
  document.getElementById('open-repair-btn').addEventListener('click', () => {
    if (!gameData.missionFailed && gameData.currentPhase !== 'complete') {
      if (repairPanel.classList.contains('hidden')) {
        gameData.repairPausedSimulation = Boolean(gameData.simulationTimer);
        if (gameData.simulationTimer) {
          clearTimeout(gameData.simulationTimer);
          gameData.simulationTimer = null;
        }
        repairPanel.classList.remove('hidden');
        locationStage.classList.add('is-paused');
        renderRepairActions();
      } else {
        closeRepairPanel();
      }
    }
  });
  document.getElementById('close-repair-btn').addEventListener('click', () => {
    closeRepairPanel();
  });
  repairActions.addEventListener('click', (event) => {
    const action = event.target.closest('[data-repair-type]');
    if (action) performRepair(action.dataset.repairType, action.dataset.componentName);
  });
  document.getElementById('restart-journey-btn').addEventListener('click', resetToBuilder);
  document.getElementById('new-build-btn').addEventListener('click', resetToBuilder);
}

function closeRepairPanel() {
  repairPanel.classList.add('hidden');
  if (!gameData.currentEvent) locationStage.classList.remove('is-paused');
  if (gameData.repairPausedSimulation && !gameData.missionFailed && !gameData.currentEvent) {
    scheduleJourney(120);
  }
  gameData.repairPausedSimulation = false;
}

const JOURNEY_PACE = 2;
function scheduleJourney(delay) {
  if (gameData.simulationTimer) clearTimeout(gameData.simulationTimer);
  gameData.simulationTimer = setTimeout(() => {
    gameData.simulationTimer = null;
    runJourney();
  }, delay * JOURNEY_PACE);
}

function startGame() {
  titleScreen.classList.add('hidden');
  builderScreen.classList.remove('hidden');
  mapScreen.classList.add('hidden');
  resetBuild();
  generateBudget();
  loadComponents().then(() => initBuilderWizard());
}

function resetBuild() {
  if (gameData.simulationTimer) {
    clearTimeout(gameData.simulationTimer);
    gameData.simulationTimer = null;
  }
  gameData.repairPausedSimulation = false;
  gameData.selectedComponents = {
    control: null,
    engine: null,
    pollinator: [],
    other: []
  };
  gameData.selectedVehicle = 'medium';
  gameData.placement = [];
  gameData.pendingDrop = null;
  vehicleChoice.value = gameData.selectedVehicle;
}

function toggleInstructions() {
  const instructions = document.getElementById('instructions');
  instructions.classList.toggle('hidden');
}

function generateBudget() {
  gameData.budget = 90000 + Math.floor(Math.random() * 30000);
  gameData.budgetRemaining = gameData.budget;
  updateStats();
}

async function loadGridData() {
  const [footprintsResponse, vehiclesResponse] = await Promise.all([
    fetch('assets/components/pollination_component_grid_sizes.json'),
    fetch('assets/Transporter%20Assets/vehicles-layered.json')
  ]);
  if (!footprintsResponse.ok || !vehiclesResponse.ok) {
    throw new Error('Unable to load transporter grid data.');
  }
  const footprintsData = await footprintsResponse.json();
  const vehiclesData = await vehiclesResponse.json();
  gameData.footprints = footprintsData.components;
  gameData.vehicles = Object.fromEntries(
    Object.entries(vehiclesData.vehicles).map(([id, vehicle]) => [id, {
      ...vehicle,
      width: vehicle.canvasWidth,
      height: vehicle.canvasHeight,
      png: vehicle.truckStatic,
      staticImage: vehicleAssetUrl(vehicle.truckStatic),
      wheelsImage: vehicleAssetUrl(vehicle.truckWheelsWebP),
      wheelsFallback: vehicleAssetUrl(vehicle.truckWheelsGIF),
      wheelsStaticFallback: vehicleAssetUrl(vehicle.truckWheelsSVG),
      gridOverlayImage: vehicleAssetUrl(vehicle.gridOverlay)
    }])
  );

  vehicleChoice.replaceChildren();
  Object.entries(gameData.vehicles).forEach(([id, vehicle]) => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = `${id.charAt(0).toUpperCase() + id.slice(1)} (${vehicle.columns} x ${vehicle.rows})`;
    vehicleChoice.appendChild(option);
  });
  vehicleChoice.value = gameData.selectedVehicle;
}

function vehicleAssetUrl(assetPath) {
  const fileName = assetPath.split('/').pop();
  return `assets/Transporter%20Assets/${encodeURIComponent(fileName)}`;
}

function getComponentId(name) {
  const entry = Object.entries(gameData.footprints).find(([, footprint]) => footprint.label === name);
  if (entry) return entry[0];
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function getFootprint(name) {
  const footprint = gameData.footprints[getComponentId(name)];
  if (!footprint) {
    throw new Error(`Missing grid footprint for component "${name}".`);
  }
  return footprint;
}

function getComponentImage(name) {
  const imageMap = {
    'AI Controlled': 'assets/components/Computer Controlled.webp',
    'Driven by People': 'assets/components/Navigation.webp',
    'Remote Controlled': 'assets/components/Navigation.webp',
    'Truck Engine': 'assets/components/Bee Transport Truck - Medium.webp',
    'Jet Engine': 'assets/components/Jet Enginge.webp',
    'Battery': 'assets/components/Charging Station.webp',
    'Solar Battery': 'assets/components/Solar Panel.webp',
    'Hybrid Engine': 'assets/components/Engine.webp',
    'Nuclear Engine': 'assets/components/Nuclear Engine.webp',
    'Honey Bee Hive': 'assets/components/Hive.webp',
    'Robot Forager': 'assets/components/Robo Forager.webp',
    'Smart Hive': 'assets/components/smart hive.webp',
    'Robot Scout': 'assets/components/Robot Scout.webp',
    'Robot Pollinator': 'assets/components/Robot Pollinator.webp',
    'Distance and Vision Sensors': 'assets/components/Sensor.webp',
    'Repair': 'assets/components/Repair Module.webp',
    'Navigation GPS': 'assets/components/Navigation.webp',
    'Robo-Pollinator Control': 'assets/components/Robot Pollinator Control.webp',
    'Small Charging Station': 'assets/components/Charging Station.webp',
    'Large Charging Station': 'assets/components/Bee Transport Trucks.webp'
  };

  return imageMap[name] || 'assets/components/Engine.webp';
}

async function loadComponents() {
  const response = await fetch('data/components.json');
  const data = await response.json();
  gameData.catalog = data;
  componentSelectionLeft.innerHTML = '';
  componentSelectionRight.innerHTML = '';

  Object.entries(data).forEach(([category, options]) => {
    if (!Array.isArray(options) || category === 'gameConfig') {
      return;
    }

    const fieldset = document.createElement('fieldset');
    fieldset.className = 'component-group';
    fieldset.classList.add(`component-group--${category}`);
    const legend = document.createElement('legend');
    legend.textContent = category === 'pollinator' ? 'Pollinator squadrons' : category.charAt(0).toUpperCase() + category.slice(1);
    fieldset.appendChild(legend);

    if (category === 'pollinator') {
      options.forEach((part) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'component-card component-card--counter';
        wrapper.draggable = true;
        wrapper.dataset.category = category;
        wrapper.dataset.name = part.name;

        const img = document.createElement('img');
        img.src = getComponentImage(part.name);
        img.alt = part.name;
        img.loading = 'lazy';

        const info = document.createElement('div');
        info.className = 'component-info';
        const perUnit = part.quantityRange
          ? `${part.quantityRange[0].toLocaleString()}–${part.quantityRange[1].toLocaleString()} per hive`
          : part.quantity
            ? `${part.quantity.toLocaleString()} per unit`
            : '';
        info.innerHTML = `<strong>${part.name}</strong><span>$${part.cost.toLocaleString()}${perUnit ? ` · ${perUnit}` : ''}</span>`;

        const select = document.createElement('select');
        select.dataset.category = category;
        select.dataset.name = part.name;
        select.setAttribute('aria-label', `${part.name} quantity`);
        select.className = 'sr-only';
        select.tabIndex = -1;
        for (let qty = 0; qty <= 10; qty += 1) {
          const option = document.createElement('option');
          option.value = String(qty);
          option.textContent = String(qty);
          select.appendChild(option);
        }
        select.value = '0';
        select.addEventListener('change', () => {
          qtyLabel.textContent = select.value;
          wrapper.classList.toggle('is-selected', Number(select.value) > 0);
          updateSelectedComponents();
        });

        const counter = document.createElement('div');
        counter.className = 'qty-counter';
        const minusBtn = document.createElement('button');
        minusBtn.type = 'button';
        minusBtn.className = 'qty-btn qty-btn--minus';
        minusBtn.setAttribute('aria-label', `Remove one ${part.name}`);
        minusBtn.textContent = '−';
        const qtyLabel = document.createElement('span');
        qtyLabel.className = 'qty-label';
        qtyLabel.textContent = '0';
        const plusBtn = document.createElement('button');
        plusBtn.type = 'button';
        plusBtn.className = 'qty-btn qty-btn--plus';
        plusBtn.setAttribute('aria-label', `Add one ${part.name}`);
        plusBtn.textContent = '+';
        const changeBy = (delta) => {
          const next = Math.max(0, Math.min(10, Number(select.value) + delta));
          if (next === Number(select.value)) return;
          select.value = String(next);
          select.dispatchEvent(new Event('change', { bubbles: true }));
        };
        minusBtn.addEventListener('click', (e) => { e.stopPropagation(); changeBy(-1); });
        plusBtn.addEventListener('click', (e) => { e.stopPropagation(); changeBy(1); });
        counter.append(minusBtn, qtyLabel, plusBtn);

        wrapper.appendChild(img);
        wrapper.appendChild(info);
        wrapper.appendChild(counter);
        wrapper.appendChild(select);
        fieldset.appendChild(wrapper);
      });
    } else if (category === 'other') {
      options.forEach((part) => {
        const wrapper = document.createElement('label');
        wrapper.className = 'component-card component-card--toggle';
        wrapper.draggable = true;
        wrapper.dataset.category = category;
        wrapper.dataset.name = part.name;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = category;
        checkbox.value = part.name;
        checkbox.checked = false;
        checkbox.className = 'sr-only';
        checkbox.addEventListener('change', () => {
          wrapper.classList.toggle('is-selected', checkbox.checked);
          updateSelectedComponents();
        });

        const img = document.createElement('img');
        img.src = getComponentImage(part.name);
        img.alt = part.name;
        img.loading = 'lazy';

        const info = document.createElement('div');
        info.className = 'component-info';
        info.innerHTML = `<strong>${part.name}</strong><span>$${part.cost.toLocaleString()}</span>`;

        const tick = document.createElement('span');
        tick.className = 'card-tick';
        tick.setAttribute('aria-hidden', 'true');

        wrapper.appendChild(checkbox);
        wrapper.appendChild(img);
        wrapper.appendChild(info);
        wrapper.appendChild(tick);
        fieldset.appendChild(wrapper);
      });
    } else {
      options.forEach((part) => {
        const wrapper = document.createElement('label');
        wrapper.className = 'component-card component-card--pick';
        wrapper.draggable = true;
        wrapper.dataset.category = category;
        wrapper.dataset.name = part.name;

        const input = document.createElement('input');
        input.type = 'radio';
        input.name = category;
        input.value = part.name;
        input.checked = false;
        input.className = 'sr-only';
        input.addEventListener('change', () => {
          // mark all siblings unselected first; browser handles radio exclusivity
          fieldset.querySelectorAll('.component-card').forEach((c) => c.classList.remove('is-selected'));
          wrapper.classList.add('is-selected');
          updateSelectedComponents();
        });

        const img = document.createElement('img');
        img.src = getComponentImage(part.name);
        img.alt = part.name;
        img.loading = 'lazy';

        const info = document.createElement('div');
        info.className = 'component-info';
        info.innerHTML = `<strong>${part.name}</strong><span>$${part.cost.toLocaleString()}</span>`;

        const tick = document.createElement('span');
        tick.className = 'card-tick';
        tick.setAttribute('aria-hidden', 'true');

        wrapper.appendChild(input);
        wrapper.appendChild(img);
        wrapper.appendChild(info);
        wrapper.appendChild(tick);
        fieldset.appendChild(wrapper);
      });
    }

    const target = category === 'control' || category === 'engine'
      ? componentSelectionLeft
      : componentSelectionRight;
    target.appendChild(fieldset);
  });

  vehicleChoice.value = gameData.selectedVehicle;
  updateSelectedComponents();
}

function updateSelectedComponents() {
  const preferredPlacement = gameData.pendingDrop;
  gameData.pendingDrop = null;
  const proposal = {
    control: null,
    engine: null,
    pollinator: [],
    other: []
  };

  const controlSelection = document.querySelector('input[name="control"]:checked');
  if (controlSelection) {
    proposal.control = (gameData.catalog.control || []).find((item) => item.name === controlSelection.value) || null;
  }

  const engineSelection = document.querySelector('input[name="engine"]:checked');
  if (engineSelection) {
    proposal.engine = (gameData.catalog.engine || []).find((item) => item.name === engineSelection.value) || null;
  }

  const pollinatorParts = Array.from(document.querySelectorAll('select[data-category="pollinator"]'))
    .map((select) => ({
      name: select.dataset.name,
      quantity: Number(select.value)
    }))
    .filter((part) => part.quantity > 0);

  const pollinatorCatalog = gameData.catalog.pollinator || [];
  proposal.pollinator = pollinatorParts.map((part) => {
    const catalogItem = pollinatorCatalog.find((item) => item.name === part.name);
    return {
      ...catalogItem,
      quantity: part.quantity,
      cost: (catalogItem?.cost || 0) * part.quantity,
      power: (catalogItem?.power || 0) * part.quantity
    };
  });

  const otherCatalog = gameData.catalog.other || [];
  const checkedOther = Array.from(document.querySelectorAll('input[name="other"]:checked'));
  proposal.other = checkedOther.map((checkbox) => {
    const match = otherCatalog.find((item) => item.name === checkbox.value);
    return { ...match };
  });

  const validation = validateBuild(proposal, gameData.selectedVehicle, preferredPlacement);
  if (!validation.valid) {
    builderFeedback.textContent = validation.message;
    syncSelectionControls();
    return;
  }
  commitBuild(proposal, validation);
  const hasRobots = proposal.pollinator.some((item) => ROBOT_POLLINATORS.has(item.name));
  const hasRobotControl = proposal.other.some((item) => item.name === 'Robo-Pollinator Control');
  if (hasRobots && !hasRobotControl) {
    builderFeedback.textContent = 'Robot pollinators need Robo-Pollinator Control to function. Add that component; otherwise only a bee hive can keep the journey running.';
  }
  if (typeof updateWizardHint === 'function') updateWizardHint();
}

function getTotalCost(components) {
  return [
    components.control,
    components.engine,
    ...components.pollinator,
    ...components.other
  ].reduce((sum, item) => sum + (item?.cost || 0), 0);
}

function getComponentInstances(components) {
  const instances = [];
  const addInstances = (item, category, quantity = 1) => {
    const footprint = getFootprint(item.name);
    const componentId = getComponentId(item.name);
    for (let index = 0; index < quantity; index += 1) {
      instances.push({
        componentId,
        instanceId: `${componentId}-${index + 1}`,
        category,
        name: item.name,
        width: footprint.width,
        height: footprint.height,
        icon: getComponentImage(item.name)
      });
    }
  };

  if (components.control) addInstances(components.control, 'control');
  if (components.engine) addInstances(components.engine, 'engine');
  components.pollinator.forEach((item) => addInstances(item, 'pollinator', item.quantity));
  components.other.forEach((item) => addInstances(item, 'other'));
  return instances;
}

function calculatePlacement(components, vehicleId, preferredPlacement = null) {
  const vehicle = gameData.vehicles[vehicleId];
  const instances = getComponentInstances(components)
    .sort((a, b) => (b.width * b.height) - (a.width * a.height) ||
      b.width - a.width || a.componentId.localeCompare(b.componentId) ||
      a.instanceId.localeCompare(b.instanceId));
  const occupied = Array.from({ length: vehicle.rows }, () => Array(vehicle.columns).fill(false));
  let searchNodes = 0;
  const searchLimit = 50000;

  if (preferredPlacement) {
    const preferredIndex = instances.findIndex((item) =>
      item.componentId === preferredPlacement.componentId &&
      item.instanceId === preferredPlacement.instanceId
    );
    if (preferredIndex < 0) {
      return { placement: null, searchLimitReached: false };
    }

    const [preferred] = instances.splice(preferredIndex, 1);
    const { col, row } = preferredPlacement;
    if (
      col < 0 || row < 0 ||
      col + preferred.width > vehicle.columns ||
      row + preferred.height > vehicle.rows
    ) {
      return { placement: null, searchLimitReached: false };
    }
    preferred.col = col;
    preferred.row = row;
    for (let y = row; y < row + preferred.height; y += 1) {
      for (let x = col; x < col + preferred.width; x += 1) {
        occupied[y][x] = true;
      }
    }
    instances.unshift(preferred);
  }

  function place(index) {
    if (preferredPlacement && index === 0) return place(1);
    if (index === instances.length) return true;
    if (searchNodes >= searchLimit) return false;

    const item = instances[index];
    for (let row = 0; row <= vehicle.rows - item.height; row += 1) {
      for (let col = 0; col <= vehicle.columns - item.width; col += 1) {
        searchNodes += 1;
        if (searchNodes > searchLimit) return false;

        let fits = true;
        for (let y = row; y < row + item.height && fits; y += 1) {
          for (let x = col; x < col + item.width; x += 1) {
            if (occupied[y][x]) {
              fits = false;
              break;
            }
          }
        }
        if (!fits) continue;

        for (let y = row; y < row + item.height; y += 1) {
          for (let x = col; x < col + item.width; x += 1) occupied[y][x] = true;
        }
        item.col = col;
        item.row = row;
        if (place(index + 1)) return true;
        for (let y = row; y < row + item.height; y += 1) {
          for (let x = col; x < col + item.width; x += 1) occupied[y][x] = false;
        }
      }
    }
    return false;
  }

  return place(0) ? { placement: instances, searchLimitReached: false } : {
    placement: null,
    searchLimitReached: searchNodes >= searchLimit
  };
}

function validateBuild(components, vehicleId, preferredPlacement = null) {
  const totalCost = getTotalCost(components);
  const budgetShortfall = Math.max(0, totalCost - gameData.budget);
  const result = calculatePlacement(components, vehicleId, preferredPlacement);
  const capacity = gameData.vehicles[vehicleId].columns * gameData.vehicles[vehicleId].rows;
  const used = getComponentInstances(components).reduce((sum, item) => sum + item.width * item.height, 0);
  const spaceShortfall = Math.max(0, used - capacity);
  const placementFailed = !result.placement;
  const spaceFailed = spaceShortfall > 0 || placementFailed;

  if (budgetShortfall || spaceFailed) {
    const messages = [];
    if (budgetShortfall) {
      messages.push(`Not enough budget — $${budgetShortfall.toLocaleString()} more required.`);
    }
    if (spaceShortfall > 0) {
      messages.push(`Not enough grid space — ${spaceShortfall} more spaces required.`);
    } else if (placementFailed) {
      messages.push(
        `Insufficient contiguous space: no valid rectangular layout was found${result.searchLimitReached ? ' within the bounded layout search' : ''}.`
      );
    }
    return { valid: false, message: messages.join(' ') };
  }

  return { valid: true, placement: result.placement };
}

function commitBuild(components, validation, vehicleId = gameData.selectedVehicle) {
  gameData.selectedComponents = components;
  gameData.selectedVehicle = vehicleId;
  gameData.placement = validation.placement;
  vehicleChoice.value = vehicleId;
  builderFeedback.textContent = '';
  updateStats();
}

function syncSelectionControls() {
  const { control, engine, pollinator, other } = gameData.selectedComponents;
  document.querySelectorAll('input[name="control"]').forEach((input) => {
    input.checked = input.value === control?.name;
  });
  document.querySelectorAll('input[name="engine"]').forEach((input) => {
    input.checked = input.value === engine?.name;
  });
  document.querySelectorAll('input[name="other"]').forEach((input) => {
    input.checked = other.some((item) => item.name === input.value);
  });
  document.querySelectorAll('select[data-category="pollinator"]').forEach((select) => {
    const selected = pollinator.find((item) => item.name === select.dataset.name);
    select.value = String(selected?.quantity || 0);
  });
}

function handleComponentDragStart(event) {
  const card = event.target.closest('.component-card');
  if (!card || !event.dataTransfer) return;

  gameData.activeDrag = {
    category: card.dataset.category,
    name: card.dataset.name
  };
  transporterGrid.querySelector('.truck-rig')?.classList.add('is-interacting');
  event.dataTransfer.effectAllowed = 'copy';
  event.dataTransfer.setData('application/json', JSON.stringify({
    category: gameData.activeDrag.category,
    name: gameData.activeDrag.name
  }));
  card.classList.add('is-dragging');
  event.dataTransfer.setData('text/plain', card.dataset.name);
}

function handlePlacedComponentDragStart(event) {
  const component = event.target.closest('.placed-component:not(.placement-preview)');
  if (!component || !event.dataTransfer) return;

  gameData.activeDrag = {
    action: 'move',
    category: component.dataset.category,
    name: component.dataset.name,
    componentId: getComponentId(component.dataset.name),
    instanceId: component.dataset.instanceId
  };
  component.closest('.truck-rig')?.classList.add('is-interacting');
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('application/json', JSON.stringify(gameData.activeDrag));
  event.dataTransfer.setData('text/plain', component.dataset.name);
  component.classList.add('is-dragging');
}

function handleComponentDragOverDocument(event) {
  if (gameData.activeDrag?.action === 'move') {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }
}

function handleComponentDropOutside(event) {
  if (gameData.activeDrag?.action !== 'move' || transporterGrid.contains(event.target)) return;
  event.preventDefault();
  removePlacedComponent(gameData.activeDrag);
}

function removePlacedComponent(component) {
  const proposal = {
    control: gameData.selectedComponents.control,
    engine: gameData.selectedComponents.engine,
    pollinator: gameData.selectedComponents.pollinator.map((item) => ({ ...item })),
    other: gameData.selectedComponents.other.map((item) => ({ ...item }))
  };

  if (component.category === 'control') {
    proposal.control = null;
  } else if (component.category === 'engine') {
    proposal.engine = null;
  } else if (component.category === 'pollinator') {
    const squad = proposal.pollinator.find((item) => item.name === component.name);
    if (squad) {
      squad.quantity -= 1;
      squad.cost = (gameData.catalog.pollinator.find((item) => item.name === component.name)?.cost || 0) * squad.quantity;
      squad.power = (gameData.catalog.pollinator.find((item) => item.name === component.name)?.power || 0) * squad.quantity;
      if (squad.quantity <= 0) {
        proposal.pollinator = proposal.pollinator.filter((item) => item.name !== component.name);
      }
    }
  } else if (component.category === 'other') {
    proposal.other = proposal.other.filter((item) => item.name !== component.name);
  }

  const validation = validateBuild(proposal, gameData.selectedVehicle);
  if (!validation.valid) {
    builderFeedback.textContent = validation.message;
    return;
  }

  commitBuild(proposal, validation);
  syncSelectionControls();
  builderFeedback.textContent = `${component.name} removed from the transporter.`;
}

function handleTransporterDragOver(event) {
  if (event.dataTransfer?.types.includes('application/json')) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    updatePlacementPreview(event.clientX, event.clientY);
  }
}

function getDragProposal(draggedComponent) {
  const { category, name } = draggedComponent;
  const catalogItem = (gameData.catalog[category] || []).find((item) => item.name === name);
  if (!catalogItem) return null;

  const proposal = {
    control: gameData.selectedComponents.control,
    engine: gameData.selectedComponents.engine,
    pollinator: gameData.selectedComponents.pollinator.map((item) => ({ ...item })),
    other: gameData.selectedComponents.other.map((item) => ({ ...item }))
  };
  let instanceNumber = 1;

  if (category === 'control') {
    proposal.control = catalogItem;
  } else if (category === 'engine') {
    proposal.engine = catalogItem;
  } else if (category === 'pollinator') {
    const existing = proposal.pollinator.find((item) => item.name === name);
    const quantity = existing?.quantity || 0;
    if (quantity >= 10) {
      return null;
    }
    instanceNumber = quantity + 1;
    if (existing) {
      existing.quantity += 1;
      existing.cost = catalogItem.cost * existing.quantity;
      existing.power = catalogItem.power * existing.quantity;
    } else {
      proposal.pollinator.push({
        ...catalogItem,
        quantity: 1,
        cost: catalogItem.cost,
        power: catalogItem.power
      });
    }
  } else if (category === 'other') {
    const existing = proposal.other.some((item) => item.name === name);
    if (!existing) proposal.other.push(catalogItem);
  } else {
    return null;
  }

  return {
    proposal,
    preferredPlacement: {
      componentId: getComponentId(name),
      instanceId: `${getComponentId(name)}-${instanceNumber}`
    }
  };
}

function updatePlacementPreview(clientX, clientY) {
  const art = transporterGrid.querySelector('.truck-rig');
  const vehicle = gameData.vehicles[gameData.selectedVehicle];
  if (!art || !vehicle || !gameData.activeDrag) return;

  let preview = art.querySelector('.placement-preview');
  if (!preview) {
    preview = document.createElement('div');
    preview.className = 'placed-component placement-preview';
    const icon = document.createElement('img');
    icon.alt = '';
    icon.setAttribute('aria-hidden', 'true');
    preview.appendChild(icon);
    art.querySelector('.truck-rig__cargo').appendChild(preview);
  }

  const dragged = gameData.activeDrag;
  preview.classList.add(`placed-component--${dragged.category}`);
  const catalogItem = (gameData.catalog[dragged.category] || [])
    .find((item) => item.name === dragged.name);
  if (!catalogItem) return;

  const footprint = getFootprint(dragged.name);
  const bounds = art.getBoundingClientRect();
  const sourceX = ((clientX - bounds.left) / bounds.width) * vehicle.width;
  const sourceY = ((clientY - bounds.top) / bounds.height) * vehicle.height;
  const col = Math.floor((sourceX - vehicle.gridX) / vehicle.cellSize);
  const row = Math.floor((sourceY - vehicle.gridY) / vehicle.cellSize);
  const isMovingPlacedComponent = dragged.action === 'move';
  const drop = isMovingPlacedComponent
    ? {
      proposal: gameData.selectedComponents,
      preferredPlacement: {
        componentId: dragged.componentId,
        instanceId: dragged.instanceId
      }
    }
    : getDragProposal(dragged);
  const capacityFits = col >= 0 && row >= 0 &&
    col + footprint.width <= vehicle.columns &&
    row + footprint.height <= vehicle.rows;
  const validation = capacityFits && drop
    ? validateBuild(drop.proposal, gameData.selectedVehicle, {
      ...drop.preferredPlacement,
      col,
      row
    })
    : {
      valid: false,
      message: capacityFits
        ? 'The maximum quantity for this pollinator squad is already selected.'
        : 'Keep the whole component inside the transporter grid.'
    };

  preview.style.left = `${((vehicle.gridX + col * vehicle.cellSize) / vehicle.width) * 100}%`;
  preview.style.top = `${((vehicle.gridY + row * vehicle.cellSize) / vehicle.height) * 100}%`;
  preview.style.width = `${(footprint.width * vehicle.cellSize / vehicle.width) * 100}%`;
  preview.style.height = `${(footprint.height * vehicle.cellSize / vehicle.height) * 100}%`;
  preview.querySelector('img').src = getComponentImage(dragged.name);
  preview.classList.toggle('is-valid', validation.valid);
  preview.classList.toggle('is-invalid', !validation.valid);
  transporterGrid.classList.add('is-drop-target');
  builderFeedback.textContent = validation.message || `Place ${dragged.name} at column ${col + 1}, row ${row + 1}.`;
}

function handleTransporterDrop(event) {
  event.preventDefault();
  transporterGrid.classList.remove('is-drop-target');
  transporterGrid.querySelector('.placement-preview')?.remove();
  componentSelectionLeft.querySelectorAll('.is-dragging').forEach((card) => card.classList.remove('is-dragging'));
  componentSelectionRight.querySelectorAll('.is-dragging').forEach((card) => card.classList.remove('is-dragging'));
  if (gameData.activeDrag?.action === 'move') {
    const dragged = gameData.activeDrag;
    const art = transporterGrid.querySelector('.truck-rig');
    const vehicle = gameData.vehicles[gameData.selectedVehicle];
    if (!art || !vehicle) return;

    const bounds = art.getBoundingClientRect();
    const sourceX = ((event.clientX - bounds.left) / bounds.width) * vehicle.width;
    const sourceY = ((event.clientY - bounds.top) / bounds.height) * vehicle.height;
    const col = Math.floor((sourceX - vehicle.gridX) / vehicle.cellSize);
    const row = Math.floor((sourceY - vehicle.gridY) / vehicle.cellSize);
    const validation = validateBuild(gameData.selectedComponents, gameData.selectedVehicle, {
      componentId: dragged.componentId,
      instanceId: dragged.instanceId,
      col,
      row
    });
    gameData.activeDrag = null;
    transporterGrid.querySelector('.truck-rig')?.classList.remove('is-interacting');
    if (!validation.valid) {
      builderFeedback.textContent = validation.message;
      return;
    }
    commitBuild(gameData.selectedComponents, validation);
    builderFeedback.textContent = `${dragged.name} moved to column ${col + 1}, row ${row + 1}.`;
    return;
  }

  const art = transporterGrid.querySelector('.truck-rig');
  const vehicle = gameData.vehicles[gameData.selectedVehicle];
  if (!art || !vehicle) return;

  let draggedComponent;
  try {
    draggedComponent = JSON.parse(event.dataTransfer.getData('application/json'));
  } catch {
    builderFeedback.textContent = 'That component could not be placed. Please drag it from the component list.';
    return;
  }

  const item = (gameData.catalog[draggedComponent.category] || [])
    .find((component) => component.name === draggedComponent.name);
  if (!item) {
    builderFeedback.textContent = 'That component could not be placed because it is not in the component list.';
    return;
  }

  const artBounds = art.getBoundingClientRect();
  const sourceX = ((event.clientX - artBounds.left) / artBounds.width) * vehicle.width;
  const sourceY = ((event.clientY - artBounds.top) / artBounds.height) * vehicle.height;
  const col = Math.floor((sourceX - vehicle.gridX) / vehicle.cellSize);
  const row = Math.floor((sourceY - vehicle.gridY) / vehicle.cellSize);
  if (col < 0 || row < 0 || col >= vehicle.columns || row >= vehicle.rows) {
    builderFeedback.textContent = 'Drop the component inside an open transporter grid cell.';
    return;
  }

  let instanceNumber = 1;
  if (draggedComponent.category === 'pollinator') {
    const select = Array.from(document.querySelectorAll('select[data-category="pollinator"]'))
      .find((control) => control.dataset.name === item.name);
    if (!select || Number(select.value) >= 10) {
      builderFeedback.textContent = 'The maximum quantity for this pollinator squad is already selected.';
      return;
    }
    instanceNumber = Number(select.value) + 1;
    select.value = String(instanceNumber);
  } else if (draggedComponent.category === 'other') {
    const checkbox = Array.from(document.querySelectorAll('input[name="other"]'))
      .find((control) => control.value === item.name);
    if (!checkbox) return;
    checkbox.checked = true;
  } else {
    const radio = Array.from(document.querySelectorAll(`input[name="${draggedComponent.category}"]`))
      .find((control) => control.value === item.name);
    if (!radio) return;
    radio.checked = true;
  }

  gameData.pendingDrop = {
    componentId: getComponentId(item.name),
    instanceId: `${getComponentId(item.name)}-${instanceNumber}`,
    col,
    row
  };
  updateSelectedComponents();
}

function handleComponentDragEnd(event) {
  event.target.closest('.component-card')?.classList.remove('is-dragging');
  event.target.closest('.placed-component')?.classList.remove('is-dragging');
  gameData.activeDrag = null;
  transporterGrid.classList.remove('is-drop-target');
  transporterGrid.querySelector('.placement-preview')?.remove();
}

function changeVehicle() {
  const requestedVehicle = vehicleChoice.value;
  const validation = validateBuild(gameData.selectedComponents, requestedVehicle);
  if (!validation.valid) {
    builderFeedback.textContent = validation.message;
    vehicleChoice.value = gameData.selectedVehicle;
    return;
  }
  commitBuild(gameData.selectedComponents, validation, requestedVehicle);
}

function updateStats() {
  const totalCost = getTotalCost(gameData.selectedComponents);
  const vehicle = gameData.vehicles[gameData.selectedVehicle];
  budgetEl.textContent = gameData.budget.toLocaleString();
  document.getElementById('spent').textContent = totalCost.toLocaleString();
  document.getElementById('budget-remaining').textContent = (gameData.budget - totalCost).toLocaleString();
  document.getElementById('spaces-used').textContent = gameData.placement.reduce((sum, item) => sum + item.width * item.height, 0);
  document.getElementById('spaces-total').textContent = vehicle.columns * vehicle.rows;
  document.getElementById('spaces-remaining').textContent = vehicle.columns * vehicle.rows -
    gameData.placement.reduce((sum, item) => sum + item.width * item.height, 0);
  document.getElementById('vehicle-size').textContent = `${vehicle.columns} columns x ${vehicle.rows} rows`;
  gameData.budgetRemaining = gameData.budget - totalCost;
  const selectedPower = [
    gameData.selectedComponents.control,
    gameData.selectedComponents.engine,
    ...gameData.selectedComponents.pollinator,
    ...gameData.selectedComponents.other
  ].reduce((sum, item) => sum + (item?.power || 0), 0);
  gameData.powerUsed = Math.abs(selectedPower);
  powerEl.textContent = `${gameData.powerUsed}`;
  renderVehiclePreview();
  renderTransporterGrid();
}

function renderTransporterGrid() {
  transporterGrid.replaceChildren(
    createVehicleRig(gameData.selectedVehicle, { journey: false, interactive: true })
  );
  document.getElementById('layout-note').textContent =
    'Components are automatically packed largest-first using a bounded backtracking search. A failed search may not prove that no possible layout exists.';
  updateTransporterAppearance();
}

function createVehicleRig(vehicleId, { journey = false, interactive = false } = {}) {
  const vehicle = gameData.vehicles[vehicleId];
  const rig = document.createElement('div');
  rig.className = `truck-rig${journey ? ' truck-rig--journey' : ''}`;
  rig.style.aspectRatio = `${vehicle.width} / ${vehicle.height}`;
  rig.style.backgroundImage = `url("${vehicle.staticImage}")`;
  rig.setAttribute('aria-label', `${vehicleId} transporter`);

  const wheelLayer = document.createElement('img');
  wheelLayer.className = 'truck-rig__layer truck-rig__wheels';
  wheelLayer.src = vehicle.wheelsImage;
  wheelLayer.alt = '';
  wheelLayer.draggable = false;
  wheelLayer.setAttribute('aria-hidden', 'true');
  wheelLayer.addEventListener('error', () => {
    const fallbacks = [vehicle.wheelsFallback, vehicle.wheelsStaticFallback];
    const fallbackIndex = Number(wheelLayer.dataset.fallbackIndex || 0);
    if (fallbackIndex < fallbacks.length) {
      wheelLayer.dataset.fallbackIndex = String(fallbackIndex + 1);
      wheelLayer.src = fallbacks[fallbackIndex];
      return;
    }
    wheelLayer.hidden = true;
  });
  rig.appendChild(wheelLayer);

  const gridOverlay = document.createElement('img');
  gridOverlay.className = 'truck-rig__layer truck-rig__grid-overlay';
  gridOverlay.src = vehicle.gridOverlayImage;
  gridOverlay.alt = '';
  gridOverlay.draggable = false;
  gridOverlay.setAttribute('aria-hidden', 'true');
  rig.appendChild(gridOverlay);

  const cargoLayer = document.createElement('div');
  cargoLayer.className = 'truck-rig__cargo';
  cargoLayer.setAttribute('aria-label', 'Transporter cargo layout');
  if (interactive) {
    const hitArea = document.createElement('div');
    hitArea.className = 'truck-rig__grid-hit-area';
    hitArea.style.left = `${vehicle.gridX / vehicle.width * 100}%`;
    hitArea.style.top = `${vehicle.gridY / vehicle.height * 100}%`;
    hitArea.style.width = `${vehicle.columns * vehicle.cellSize / vehicle.width * 100}%`;
    hitArea.style.height = `${vehicle.rows * vehicle.cellSize / vehicle.height * 100}%`;
    hitArea.style.setProperty('--grid-columns', vehicle.columns);
    hitArea.style.setProperty('--grid-rows', vehicle.rows);
    for (let index = 0; index < vehicle.columns * vehicle.rows; index += 1) {
      const cell = document.createElement('span');
      cell.className = 'truck-rig__grid-cell';
      cell.setAttribute('aria-hidden', 'true');
      hitArea.appendChild(cell);
    }
    cargoLayer.appendChild(hitArea);
  }

  gameData.placement.forEach((item) => {
    const component = document.createElement('div');
    component.className = `placed-component placed-component--${item.category}`;
    component.title = `${item.name} — ${item.width} x ${item.height}`;
    component.setAttribute('aria-label', `${item.name}, ${item.width} columns by ${item.height} rows`);
    component.dataset.category = item.category;
    component.dataset.name = item.name;
    component.dataset.instanceId = item.instanceId;
    component.draggable = interactive;
    component.style.left = `${((vehicle.gridX + item.col * vehicle.cellSize) / vehicle.width) * 100}%`;
    component.style.top = `${((vehicle.gridY + item.row * vehicle.cellSize) / vehicle.height) * 100}%`;
    component.style.width = `${(item.width * vehicle.cellSize / vehicle.width) * 100}%`;
    component.style.height = `${(item.height * vehicle.cellSize / vehicle.height) * 100}%`;

    const icon = document.createElement('img');
    icon.src = item.icon;
    icon.alt = '';
    icon.draggable = false;
    icon.setAttribute('aria-hidden', 'true');
    component.appendChild(icon);
    cargoLayer.appendChild(component);
  });

  rig.appendChild(cargoLayer);
  return rig;
}

function renderJourneyTransporter() {
  journeyTruckTrack.replaceChildren(
    createVehicleRig(gameData.selectedVehicle, { journey: true })
  );
  updateTransporterAppearance();
}

function updateTransporterAppearance() {
  document.querySelectorAll('.truck-rig').forEach((rig) => {
    rig.classList.toggle('is-parked', gameData.transporterMotion === 'parked');
    rig.classList.toggle('is-driving', gameData.transporterMotion === 'driving');
    rig.classList.toggle('is-grid-hidden', !gameData.transporterGridVisible);
    rig.classList.toggle('is-reduced-motion', gameData.reducedMotion);
  });
  journeyTruckTrack.classList.toggle(
    'is-driving',
    gameData.transporterMotion === 'driving' && !gameData.reducedMotion
  );
}

function renderVehiclePreview() {
  const { control, engine, pollinator, other } = gameData.selectedComponents;
  vehiclePreview.innerHTML = '<h3>Your Vehicle</h3>';

  if (control) {
    vehiclePreview.innerHTML += `<p><strong>Control:</strong> ${control.name}</p>`;
  }
  if (engine) {
    vehiclePreview.innerHTML += `<p><strong>Engine:</strong> ${engine.name}</p>`;
  }
  if (pollinator.length > 0) {
    vehiclePreview.innerHTML += `<p><strong>Pollinators:</strong> ${pollinator.map((item) => `${item.name} x${item.quantity}`).join(', ')}</p>`;
  }
  if (other.length > 0) {
    vehiclePreview.innerHTML += `<p><strong>Support:</strong> ${other.map((item) => item.name).join(', ')}</p>`;
  }
  if (!control && !engine && pollinator.length === 0 && other.length === 0) {
    vehiclePreview.innerHTML += '<p>Select your setup to preview the route.</p>';
  }
}

function validateSelections() {
  return Boolean(
    gameData.selectedComponents.control &&
    gameData.selectedComponents.engine &&
    gameData.selectedComponents.pollinator.length > 0
  );
}

async function loadRouteData() {
  const routeResponse = await fetch('data/enriched_pollination_route.json');
  const eventsResponse = await fetch('data/events.json');
  if (!routeResponse.ok || !eventsResponse.ok) {
    throw new Error('Unable to load route and random-event data.');
  }
  gameData.route = await routeResponse.json();
  const events = await eventsResponse.json();
  if (!Array.isArray(events) || events.some((event) =>
    !event.id || !event.name || !Array.isArray(event.choices)
  )) {
    throw new Error('Random-event data is invalid: every event needs an id, name, and choices list.');
  }
  gameData.events = events;
}

function startRoute() {
  if (!validateSelections()) {
    const missing = [];
    if (!gameData.selectedComponents.control) missing.push('control');
    if (!gameData.selectedComponents.engine) missing.push('engine');
    if (!gameData.selectedComponents.pollinator.length) missing.push('pollinator');
    highlightMissing(missing);
    const article = (w) => (/^[aeiou]/i.test(w) ? 'an' : 'a');
    showToast('Add ' + missing.map((w) => `${article(w)} ${w}`).join(', ') + ' before setting off.', { tone: 'warning' });
    return;
  }
  const hasRobots = gameData.selectedComponents.pollinator.some((item) =>
    ROBOT_POLLINATORS.has(item.name)
  );
  const hasRoboControl = hasSelectedComponent('Robo-Pollinator Control');
  const hasBiologicalPollinators = gameData.selectedComponents.pollinator.some((item) =>
    item.name === 'Honey Bee Hive' || item.name === 'Smart Hive'
  );
  // Case A: robots selected but no control + no bees → offer one-tap fixes.
  if (hasRobots && !hasRoboControl && !hasBiologicalPollinators) {
    showFixDialog({
      title: 'Robot crew needs a controller',
      body: 'Robot pollinators don’t work on their own. Add Robo-Pollinator Control (+$3,000) or drop the robots.',
      actions: [
        { label: 'Add Robo-Pollinator Control', primary: true, onClick: () => { addOtherByName('Robo-Pollinator Control'); startRoute(); } },
        { label: 'Remove robot crew', onClick: () => { removeRobotPollinators(); startRoute(); } }
      ]
    });
    return;
  }
  // Case B: controller selected but no robots → it does nothing. Offer fixes.
  if (!hasRobots && hasRoboControl) {
    showFixDialog({
      title: 'Controller has nothing to control',
      body: 'Robo-Pollinator Control only works with a robot crew. Add a robot crew or remove the controller.',
      actions: [
        { label: 'Remove controller', primary: true, onClick: () => { removeOtherByName('Robo-Pollinator Control'); startRoute(); } },
        { label: 'Keep anyway', onClick: () => { hideFixDialog(); continueStartRoute(); } }
      ]
    });
    return;
  }
  continueStartRoute();
}

function continueStartRoute() {

  builderScreen.classList.add('hidden');
  mapScreen.classList.remove('hidden');
  gameData.routeIndex = 0;
  gameData.journeyLog = [];
  gameData.currentEvent = null;
  gameData.eventResolved = false;
  gameData.availableEventChoices = [];
  gameData.eventHistory = [];
  gameData.eventTimeHours = 0;
  gameData.speedAdjustmentPct = 0;
  gameData.pollinatorPopulations = {};
  gameData.siteOutputMultipliers = gameData.route.map(() => 1);
  gameData.siteProductivitySnapshots = gameData.route.map(() => null);
  gameData.vehicleHealth = 100;
  gameData.componentStatuses = {};
  gameData.currentPhase = 'departure';
  gameData.eventResumePhase = '';
  gameData.currentWeather = '';
  gameData.segmentSliceIndex = 0;
  gameData.elapsedTravelHours = 0;
  gameData.elapsedPollinationHours = 0;
  gameData.elapsedChargingHours = 0;
  gameData.elapsedJourneyHours = 0;
  gameData.repairHours = 0;
  gameData.currentSiteOutput = 0;
  gameData.totalPollinationAchieved = 0;
  gameData.totalPollinationPossible = 0;
  gameData.startingPollinatorTotal = 0;
  gameData.startingPollinationCapacity = 0;
  gameData.currentChargingAdjustmentHours = 0;
  gameData.agriculturalLocationsReached = 0;
  gameData.pollinationSitesCompleted = 0;
  gameData.totalRobotsDamaged = 0;
  gameData.totalRobotsRepaired = 0;
  gameData.missionFailed = false;
  gameData.missionFailureReason = '';
  gameData.missionEndedAt = '';
  gameData.encounteredEventIds = new Set();
  gameData.segmentEventIds = new Set();
  gameData.phaseEventKeys = new Set();
  gameData.scheduledEventSlices = [];
  gameData.simulationTimer = null;
  gameData.repairPausedSimulation = false;
  gameData.baselineTravelHours = gameData.route.reduce(
    (total, stop) => total + (stop.estimatedTravelDays || 0) * 24,
    0
  );
  gameData.baselinePollinationHours = gameData.route.reduce(
    (total, stop) => total + (stop.stopDurationDays || 0) * 24,
    0
  );
  initializePollinatorState();
  gameData.startingPollinatorTotal = Object.values(gameData.pollinatorPopulations)
    .flat()
    .reduce((sum, group) => sum + group.initial, 0);
  gameData.startingPollinationCapacity = getEffectivePollinatorOutput(true);
  journeyLog.replaceChildren();
  const emptyLogEntry = document.createElement('p');
  emptyLogEntry.className = 'log-empty';
  emptyLogEntry.textContent = 'Journey updates will appear here.';
  journeyLog.appendChild(emptyLogEntry);
  const unmatchedEvents = getUnmatchedRegionEvents();
  if (unmatchedEvents.length > 0) {
    addLogEntry(`Route limitation: ${unmatchedEvents.map((event) => `${event.name} (${event.regionHint})`).join(', ')} cannot occur because the route has no matching stop.`);
  }
  journeyScore.textContent = 'In progress';
  routeStatus.innerHTML = '<p>Preparing route...</p>';
  // Reset progress bar for a fresh journey.
  const _pbf = document.getElementById('progress-bar-fill');
  if (_pbf) _pbf.style.width = '0%';
  const _pcur = document.getElementById('progress-current');
  if (_pcur) _pcur.textContent = '1';
  const _ptot = document.getElementById('progress-total');
  if (_ptot) _ptot.textContent = String(gameData.route?.length || '—');
  closeEventButton.classList.add('hidden');
  eventPopup.classList.add('hidden');
  missionSummary.classList.add('hidden');
  missionSummary.classList.remove('is-failed');
  repairPanel.classList.add('hidden');
  newBuildButton.classList.add('hidden');
  renderJourneyTransporter();
  updateJourneyLocation(gameData.route[0], 0);
  resetPollenJarForNewSite(); // start empty at GTAC, fills to the site's target
  refreshJourneyStatus();
  if (checkMissionFailure('at departure')) return;
  addLogEntry('Final checks at GTAC — transporter settles in before departure.');
  journeyTruckTrack.classList.remove('is-driving');
  // Guided tour on first arrival + hold at GTAC for ~10s before moving.
  startJourneyTour(() => {
    journeyTruckTrack.classList.add('is-driving');
    scheduleJourney(5000); // multiplied by JOURNEY_PACE = ~10 s
  });
}

function initializePollinatorState() {
  const catalog = gameData.catalog.pollinator || [];
  gameData.pollinatorPopulations = {};
  gameData.selectedComponents.pollinator.forEach((selected) => {
    const component = catalog.find((item) => item.name === selected.name);
    if (!component) {
      throw new Error(`Missing pollinator definition for "${selected.name}".`);
    }

    gameData.pollinatorPopulations[selected.name] = [];
    for (let unitIndex = 0; unitIndex < selected.quantity; unitIndex += 1) {
      const initial = component.quantityRange
        ? randomInteger(component.quantityRange[0], component.quantityRange[1])
        : (component.quantity || 0);
      gameData.pollinatorPopulations[selected.name].push({
        unitId: `${getComponentId(selected.name)}-${unitIndex + 1}`,
        initial,
        active: initial,
        damaged: 0,
        permanentLoss: 0
      });
    }
  });
  gameData.componentStatuses = {};
  getInstalledComponents().forEach((component) => {
    gameData.componentStatuses[component.name] = 'operational';
  });
}

function getInstalledComponents() {
  const { control, engine, pollinator, other } = gameData.selectedComponents;
  return [
    ...(control ? [control] : []),
    ...(engine ? [engine] : []),
    ...pollinator,
    ...other
  ];
}

function randomInteger(minimum, maximum) {
  return minimum + Math.floor(gameData.rng() * (maximum - minimum + 1));
}

function runJourney() {
  if (gameData.missionFailed) return;
  if (gameData.currentPhase === 'departure') {
    if (tryTriggerPhaseEvent('departure', gameData.route[gameData.routeIndex])) return;
    gameData.currentPhase = 'travel';
    startTravelSegment();
    return;
  }
  if (gameData.currentPhase === 'travel') {
    advanceTravelSlice();
    return;
  }
  if (gameData.currentPhase === 'pollination-check') {
    const stop = gameData.route[gameData.routeIndex];
    if ((stop.stopDurationDays || 0) > 0 && tryTriggerPhaseEvent('pollination', stop)) return;
    gameData.currentPhase = 'pollination';
  }
  if (gameData.currentPhase === 'pollination') {
    completePollinationAtCurrentStop();
    gameData.currentPhase = 'charging-check';
  }
  if (gameData.currentPhase === 'charging-check') {
    const stop = gameData.route[gameData.routeIndex];
    if (calculateNormalChargingHours(stop) > 0 && tryTriggerPhaseEvent('charging', stop)) return;
    gameData.currentPhase = 'charging';
  }
  if (gameData.currentPhase === 'charging') {
    completeChargingAtCurrentStop();
    gameData.currentPhase = 'next-segment';
  }
  if (gameData.currentPhase === 'next-segment') {
    if (gameData.routeIndex >= gameData.route.length - 1) {
      finishJourney();
      return;
    }
    gameData.currentPhase = 'travel';
    startTravelSegment();
  }
}

function startTravelSegment() {
  if (gameData.missionFailed) return;
  if (gameData.routeIndex >= gameData.route.length - 1) {
    finishJourney();
    return;
  }
  gameData.segmentSliceIndex = 0;
  gameData.segmentEventIds = new Set();
  const risk = gameData.route[gameData.routeIndex + 1].eventRiskScore ?? 0.3;
  const opportunityCount = SIMULATION_RULES.minEventOpportunitiesPerSegment +
    Math.floor(
      Math.min(1, Math.max(0, risk)) *
      (SIMULATION_RULES.maxEventOpportunitiesPerSegment -
        SIMULATION_RULES.minEventOpportunitiesPerSegment)
    );
  const slices = new Set();
  while (slices.size < opportunityCount) {
    slices.add(Math.floor(gameData.rng() * SIMULATION_RULES.travelSlicesPerSegment));
  }
  gameData.scheduledEventSlices = [...slices].sort((a, b) => a - b);
  routeStatus.innerHTML = `<p><strong>Travelling to:</strong> ${gameData.route[gameData.routeIndex + 1].region}</p>`;
  refreshJourneyStatus();
  runJourney();
}

function getHealthSpeedMultiplier() {
  const band = SIMULATION_RULES.healthSpeedBands.find((item) => gameData.vehicleHealth >= item.minHealth);
  return band?.multiplier || 0;
}

function hasOperationalComponent(name) {
  return hasSelectedComponent(name) && gameData.componentStatuses[name] !== 'malfunctioning';
}

function getTravelModifiers() {
  const engine = gameData.selectedComponents.engine;
  const control = gameData.selectedComponents.control;
  const engineSpeed = hasOperationalComponent(engine?.name) ? (engine.speedMultiplier || 1) : 0.5;
  const driverEfficiency = hasOperationalComponent(control?.name) ? (control.driverEfficiency || 1) : 0.5;
  const navigationFactor = hasOperationalComponent('Navigation GPS') ? 0.9 : 1;
  const healthFactor = getHealthSpeedMultiplier();
  const solarWeatherFactor = engine?.name === 'Solar Battery' &&
    gameData.currentWeather === 'extreme' &&
    hasOperationalComponent('Solar Battery') &&
    !(control?.immuneToWeather && hasOperationalComponent(control.name))
    ? (engine.weatherPenalty || 0.5)
    : 1;
  return {
    engineSpeed,
    driverEfficiency,
    navigationFactor,
    healthFactor,
    solarWeatherFactor,
    totalSpeed: engineSpeed * driverEfficiency * navigationFactor * healthFactor * solarWeatherFactor
  };
}

function advanceTravelSlice() {
  if (gameData.missionFailed) return;
  if (gameData.segmentSliceIndex >= SIMULATION_RULES.travelSlicesPerSegment) {
    completeTravelSegment();
    return;
  }
  const origin = gameData.route[gameData.routeIndex];
  const destination = gameData.route[gameData.routeIndex + 1];
  const baseSegmentHours = (origin.estimatedTravelDays || 0) * 24;
  const baseSliceHours = baseSegmentHours / SIMULATION_RULES.travelSlicesPerSegment;
  const modifiers = getTravelModifiers();
  const speed = Math.max(0.1, modifiers.totalSpeed);
  const dailyDowntime = Math.max(0, gameData.selectedComponents.engine?.dailyDowntime || 0);
  const driverRest = Math.max(0, gameData.selectedComponents.control?.restHoursPerDay || 0);
  const sliceHours = baseSliceHours / speed +
    ((baseSegmentHours / 24) * (dailyDowntime + driverRest) /
      SIMULATION_RULES.travelSlicesPerSegment);
  gameData.elapsedTravelHours += sliceHours;
  gameData.elapsedJourneyHours += sliceHours;
  gameData.segmentSliceIndex += 1;
  gameData.currentWeather = '';

  routeStatus.innerHTML = `
    <p><strong>Travelling to:</strong> ${destination.region}</p>
    <p>${formatDuration(gameData.elapsedTravelHours)} on the road</p>
  `;
  updateJourneyProgress();
  if (
    gameData.vehicleHealth > 0 &&
    gameData.vehicleHealth < 40 &&
    gameData.rng() < SIMULATION_RULES.criticalHealthMalfunctionChance
  ) {
    malfunctionRandomComponent();
  }
  refreshJourneyStatus();
  if (checkMissionFailure('during travel')) return;

  const isOpportunity = gameData.scheduledEventSlices.includes(gameData.segmentSliceIndex - 1);
  if (isOpportunity && tryTriggerPhaseEvent('travel', destination, origin)) return;
  scheduleJourney(120);
}

function completeTravelSegment() {
  if (gameData.missionFailed) return;
  gameData.routeIndex += 1;
  gameData.currentPhase = 'pollination-check';
  const stop = gameData.route[gameData.routeIndex];
  updateJourneyLocation(stop, gameData.routeIndex);
  gameData.agriculturalLocationsReached += (stop.stopDurationDays || 0) > 0 ? 1 : 0;
  gameData.segmentSliceIndex = 0;
  gameData.segmentEventIds = new Set();
  resetPollenJarForNewSite(); // start empty; fill to this stop's target
  refreshJourneyStatus();
  if (checkMissionFailure('on arrival')) return;
  addLogEntry(`Arrived at ${stop.region}. Transporter health: ${gameData.vehicleHealth}%.`);
  scheduleJourney(150);
}

function tryTriggerPhaseEvent(phase, location) {
  if (phase !== 'travel') {
    const phaseKey = `${phase}:${gameData.routeIndex}`;
    if (gameData.phaseEventKeys.has(phaseKey)) return false;
    gameData.phaseEventKeys.add(phaseKey);
  }
  const risk = location?.eventRiskScore ?? 0.3;
  const eventChance = Math.min(0.85, 0.2 + risk * 0.75);
  if (gameData.rng() >= eventChance) return false;
  return triggerPhaseEvent(phase, location);
}

function triggerPhaseEvent(phase, location, origin = null) {
  const eligibleEvents = selectEligibleEvents(phase, location, origin);
  if (eligibleEvents.length === 0) return false;
  const event = eligibleEvents[Math.floor(gameData.rng() * eligibleEvents.length)];
  return showEvent(event, location);
}

function selectEligibleEvents(phase, location, origin = null) {
  return gameData.events.filter((event) =>
    (!event.phase || event.phase === phase) &&
    matchesComponentCondition(event.eligibleWhen) &&
    event.choices.some((choice) => matchesComponentCondition(choice.availableWhen, true)) &&
    !gameData.encounteredEventIds.has(event.id) &&
    eventMatchesRegion(event, location, origin) &&
    (phase !== 'travel' || !gameData.segmentEventIds.has(event.id))
  );
}

function normalizeRegion(region) {
  return String(region || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function regionHintMatches(hint, region) {
  const normalizedHint = normalizeRegion(hint);
  const normalizedRegion = normalizeRegion(region);
  return Boolean(normalizedHint && normalizedRegion &&
    (normalizedRegion.includes(normalizedHint) || normalizedHint.includes(normalizedRegion)));
}

function eventMatchesRegion(event, location, origin) {
  if (!event.regionHint) return true;
  return regionHintMatches(event.regionHint, location?.region) ||
    regionHintMatches(event.regionHint, origin?.region);
}

function getUnmatchedRegionEvents() {
  return gameData.events.filter((event) => event.regionHint &&
    !gameData.route.some((stop) => regionHintMatches(event.regionHint, stop.region))
  );
}

function malfunctionRandomComponent() {
  const candidates = getInstalledComponents().filter((component) =>
    gameData.componentStatuses[component.name] !== 'malfunctioning'
  );
  if (candidates.length === 0) return false;
  const component = candidates[Math.floor(gameData.rng() * candidates.length)];
  setComponentMalfunction(component.name);
  addLogEntry(`${component.name} malfunctioned while the transporter was running at low health.`);
  return true;
}

function setComponentMalfunction(name) {
  if (!hasSelectedComponent(name)) return false;
  gameData.componentStatuses[name] = 'malfunctioning';
  refreshJourneyStatus();
  return true;
}

function updateJourneyLocation(stop, routeIndex) {
  const region = stop.region.toLowerCase();
  let imageName = 'GTAC - Start and end points.webp';

  if (region.includes('werribee')) {
    imageName = 'Werribee South.webp';
  } else if (region.includes('yarra valley')) {
    imageName = 'Yarra Valley.webp';
  } else if (region.includes('monbulk') || region.includes('yarra ranges')) {
    imageName = 'Yarra Ranges.webp';
  } else if (region.includes('gippsland') || region.includes('western district')) {
    imageName = 'Gippsland.webp';
  } else if (region.includes('goulburn')) {
    imageName = 'Goulburn Valley.webp';
  } else if (region.includes('mildura')) {
    imageName = 'Mildura.webp';
  } else if (region.includes('north east')) {
    imageName = 'Goulburn Valley.webp';
  }

  locationImage.src = `assets/Locations/${encodeURIComponent(imageName)}`;
  locationImage.alt = `Scenery at ${stop.region}`;
  currentStopName.textContent = stop.region;
  const position = routeMapPositions[routeIndex] || routeMapPositions[0];
  mapMarker.style.left = `${position.left}%`;
  mapMarker.style.top = `${position.top}%`;
  mapMarker.setAttribute('aria-label', `Transporter location: ${stop.region}`);
  updateJourneyProgress();
}

/**
 * Target pollen % for the current site: 80% baseline, boosted up to 100% by
 * positive events, pulled down to 70% by penalties. Each site has its own
 * jar reading computed from siteOutputMultipliers.
 */
function computeSiteTargetPct(index) {
  const mult = gameData.siteOutputMultipliers?.[index] ?? 1;
  let delta = (mult - 1) * 100; // mult 1.20 → +20pts; mult 0.90 → -10pts
  if (delta > 20) delta = 20;
  if (delta < -10) delta = -10;
  return Math.max(70, Math.min(100, Math.round(80 + delta)));
}

/**
 * Snap the pollen jar visually to empty, then let the next refresh animate it
 * up to the current site's target. Called when the truck arrives at a new site.
 */
function resetPollenJarForNewSite() {
  const fill = document.getElementById('pollen-jar-fill');
  const pctEl = document.getElementById('pollen-pct');
  if (!fill) return;
  const original = fill.style.transition;
  fill.style.transition = 'none';
  fill.style.width = '0%';
  if (pctEl) pctEl.textContent = '0%';
  // Force a reflow so the next width change animates from 0.
  void fill.offsetWidth;
  fill.style.transition = original || '';
  // On the next frame, refresh — this will set the width to the new target
  // and the CSS transition will animate the fill.
  requestAnimationFrame(() => refreshJourneyStatus());
}

function updateJourneyProgress() {
  const total = Math.max(1, (gameData.route?.length || 1) - 1);
  const index = Math.max(0, Math.min(total, gameData.routeIndex || 0));
  const pctByStop = (index / total) * 100;
  // Smooth within a segment using travel-slice progress.
  let pct = pctByStop;
  if (gameData.currentPhase === 'travel') {
    const slice = Math.max(0, Math.min(1, (gameData.segmentSliceIndex || 0) / SIMULATION_RULES.travelSlicesPerSegment));
    pct = ((index + slice) / total) * 100;
  }
  pct = Math.max(0, Math.min(100, pct));
  const fill = document.getElementById('progress-bar-fill');
  const bar = document.getElementById('progress-bar');
  const cur = document.getElementById('progress-current');
  const tot = document.getElementById('progress-total');
  if (fill) fill.style.width = `${pct}%`;
  if (bar) bar.setAttribute('aria-valuenow', String(Math.round(pct)));
  if (cur) cur.textContent = String(Math.min(index + 1, (gameData.route?.length || 1)));
  if (tot) tot.textContent = String(gameData.route?.length || '—');
}

function showEvent(event, stop) {
  const choices = event.choices.filter((choice) =>
    matchesComponentCondition(choice.availableWhen, true)
  );
  if (choices.length === 0) return false;

  gameData.currentEvent = event;
  gameData.eventResumePhase = gameData.currentPhase;
  gameData.currentWeather = event.category === 'weather' &&
    gameData.currentPhase === 'travel'
    ? 'extreme'
    : '';
  if (gameData.currentPhase === 'travel') gameData.segmentEventIds.add(event.id);
  gameData.encounteredEventIds.add(event.id);
  gameData.eventResolved = false;
  gameData.availableEventChoices = choices.map((choice) => ({
    choice,
    probability: calculateChoiceProbability(choice)
  }));
  eventName.textContent = event.name;
  eventDescription.textContent = `${event.description} Your transporter is at ${stop.region}.`;
  eventPopup.classList.remove('hidden');
  locationStage.classList.add('is-paused');
  eventImage.src = pickEventImage(event);
  eventImage.alt = event.name;
  closeEventButton.classList.add('hidden');
  eventResult.classList.add('hidden');
  eventResult.replaceChildren();
  eventChoices.classList.remove('hidden');
  renderEventChoices();
  eventChoices.querySelector('button')?.focus();
  return true;
}

function pickEventImage(event) {
  if (event.category === 'weather') return 'assets/components/Temperature and Humidity Sensor.webp';
  if (event.category === 'technical') return 'assets/components/Repair Module.webp';
  if (event.category === 'ecology') return 'assets/components/Hive.webp';
  if (event.category === 'navigation' || event.category === 'logistics') {
    return 'assets/components/Navigation.webp';
  }
  if (event.name.toLowerCase().includes('charg')) {
    return 'assets/components/Charging Station.webp';
  }
  if (event.category === 'social' || event.name.toLowerCase().includes('bee')) {
    return 'assets/components/Hive.webp';
  }
  if (event.name.toLowerCase().includes('flower')) {
    return 'assets/components/Robo Forager.webp';
  }
  if (event.category === 'opportunity') return 'assets/components/Engine.webp';
  return 'assets/components/Robot Pollinator.webp';
}

function matchesComponentCondition(condition, operationalOnly = false) {
  if (condition === undefined || condition === null) return true;
  if (typeof condition.has === 'string') {
    return operationalOnly
      ? hasOperationalComponent(condition.has)
      : hasSelectedComponent(condition.has);
  }
  if (Array.isArray(condition.all)) {
    return condition.all.every((item) => matchesComponentCondition(item, operationalOnly));
  }
  if (Array.isArray(condition.any)) {
    return condition.any.some((item) => matchesComponentCondition(item, operationalOnly));
  }
  return false;
}

function hasSelectedComponent(name) {
  const { control, engine, pollinator, other } = gameData.selectedComponents;
  return control?.name === name ||
    engine?.name === name ||
    pollinator.some((item) => item.name === name && item.quantity > 0) ||
    other.some((item) => item.name === name);
}

function getMatchingComponentNames(condition) {
  if (!condition) return [];
  if (typeof condition.has === 'string') {
    return hasOperationalComponent(condition.has) ? [condition.has] : [];
  }
  const nested = [...(condition.all || []), ...(condition.any || [])];
  return [...new Set(nested.flatMap(getMatchingComponentNames))];
}

function calculateChoiceProbability(choice) {
  if (!Number.isFinite(choice.baseSuccessProbability) ||
    choice.baseSuccessProbability < 0 ||
    choice.baseSuccessProbability > 1) {
    throw new Error(`Choice "${choice.id}" is missing a valid base success probability.`);
  }
  const matchedBonuses = (choice.bonuses || [])
    .filter((bonus) => matchesComponentCondition(bonus.when, true))
    .map((bonus) => ({
      probabilityBonus: bonus.probabilityBonus,
      explanation: bonus.explanation || '',
      components: getMatchingComponentNames(bonus.when)
    }));
  if (matchedBonuses.some((bonus) => !Number.isFinite(bonus.probabilityBonus))) {
    throw new Error(`Choice "${choice.id}" contains an invalid component bonus.`);
  }
  const bonusTotal = matchedBonuses.reduce((sum, bonus) => sum + bonus.probabilityBonus, 0);
  const adjustedBaseProbability = Math.max(
    0,
    choice.baseSuccessProbability - SIMULATION_RULES.eventBaseSuccessReduction
  );
  const probability = Math.min(
    MAX_EVENT_SUCCESS_PROBABILITY,
    adjustedBaseProbability + bonusTotal
  );
  return { baseProbability: adjustedBaseProbability, matchedBonuses, probability };
}

function formatHours(hours) {
  return `${Number(hours.toFixed(1))} ${Math.abs(hours) === 1 ? 'hour' : 'hours'}`;
}

function formatDuration(hours) {
  const safeHours = Math.round(Math.max(0, hours) * 10) / 10;
  const days = Math.floor(safeHours / 24);
  const remainingHours = Math.round((safeHours - days * 24) * 10) / 10;
  if (days === 0) return formatHours(safeHours);
  if (remainingHours === 0) return `${days} ${days === 1 ? 'day' : 'days'}`;
  return `${days} ${days === 1 ? 'day' : 'days'}, ${formatHours(remainingHours)}`;
}

function describeOutcome(outcome, eventCategory = '') {
  const describePollinatorDamage = (value, multiplier = 1) => {
    const adjusted = amplifyPollinatorDamage(value);
    const format = (percentage) => Number((percentage * multiplier).toFixed(1));
    return adjusted && typeof adjusted === 'object'
      ? `${format(adjusted.min)}-${format(adjusted.max)}%`
      : `${format(adjusted)}%`;
  };
  const describeEffectValue = (value) => value && typeof value === 'object'
    ? `${value.min}-${value.max}%`
    : `${value}%`;
  const effects = [];
  if (outcome.timeHours) {
    effects.push(outcome.timeHours > 0
      ? `adds ${formatHours(outcome.timeHours)} to journey time`
      : `saves ${formatHours(Math.abs(outcome.timeHours))} of journey time`);
  }
  if (outcome.chargingHours) {
    effects.push(outcome.chargingHours > 0
      ? `adds ${formatHours(outcome.chargingHours)} of charging`
      : `saves ${formatHours(Math.abs(outcome.chargingHours))} of charging`);
  }
  Object.entries(outcome.pollinatorLossPct || {}).forEach(([name, percentage]) => {
    const protectionMultiplier = eventCategory === 'weather' && name === 'Smart Hive'
      ? SIMULATION_RULES.smartHiveWeatherLossMultiplier
      : 1;
    effects.push(`loses ${describePollinatorDamage(percentage, protectionMultiplier)} of living ${name} pollinators`);
  });
  if (outcome.robotDamagePct) {
    effects.push(`temporarily disables ${describePollinatorDamage(outcome.robotDamagePct)} of operational robot pollinators`);
  }
  if (outcome.vehicleHealthLossPct) {
    effects.push(`reduces transporter health by ${describeEffectValue(outcome.vehicleHealthLossPct)}`);
  }
  if (outcome.componentMalfunction) {
    const malfunctions = Array.isArray(outcome.componentMalfunction)
      ? outcome.componentMalfunction
      : [outcome.componentMalfunction];
    effects.push(`may malfunction ${malfunctions.map((rule) =>
      typeof rule === 'string' ? rule : rule.componentName
    ).filter(Boolean).join(', ')}`);
  }
  if (outcome.siteOutputPct) {
    effects.push(`${outcome.siteOutputPct > 0 ? 'increases' : 'reduces'} this site's output by ${Math.abs(outcome.siteOutputPct)}%`);
  }
  return effects.length > 0 ? effects.join('; ') : 'no extra time or pollination-output change';
}

function renderEventChoices() {
  eventChoices.replaceChildren();
  gameData.availableEventChoices.forEach(({ choice, probability }) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'event-choice';
    button.dataset.choiceId = choice.id;

    const heading = document.createElement('strong');
    heading.className = 'event-choice__label';
    heading.textContent = choice.label;
    button.appendChild(heading);

    const tradeoffs = document.createElement('span');
    tradeoffs.className = 'event-choice__tradeoffs';
    const category = gameData.currentEvent?.category || '';
    tradeoffs.textContent = `If successful: ${describeOutcome(choice.onSuccess || {}, category)}. If not: ${describeOutcome(choice.onFailure || {}, category)}.`;
    button.appendChild(tradeoffs);

    // Only show the rationale if the event actually provides a specific one
    // (not the generic "Compare the possible outcomes..." boilerplate).
    if (choice.decisionRationale) {
      const rationale = document.createElement('span');
      rationale.className = 'event-choice__rationale';
      rationale.textContent = choice.decisionRationale;
      button.appendChild(rationale);
    }

    // Bonuses go last, soft italic.
    const advantageList = document.createElement('span');
    advantageList.className = 'event-choice__bonuses';
    if (probability.matchedBonuses.length > 0) {
      advantageList.textContent = probability.matchedBonuses.map((bonus) =>
        `${bonus.components.join(', ')} +${Math.round(bonus.probabilityBonus * 100)} percentage points${bonus.explanation ? ` — ${bonus.explanation}` : ''}`
      ).join('; ');
    } else {
      advantageList.textContent = 'No component bonus applies.';
    }
    button.appendChild(advantageList);
    eventChoices.appendChild(button);
  });
}

function resolveEventChoice(choiceId) {
  if (!gameData.currentEvent || gameData.eventResolved) return;
  const selected = gameData.availableEventChoices.find(({ choice }) => choice.id === choiceId);
  if (!selected) return;

  gameData.eventResolved = true;
  const roll = gameData.rng();
  if (!Number.isFinite(roll) || roll < 0 || roll >= 1) {
    throw new Error('The random-event roll must be a number in the range [0, 1).');
  }
  const success = roll < selected.probability.probability;
  const choice = selected.choice;
  const outcome = success ? (choice.onSuccess || {}) : (choice.onFailure || {});
  const appliedEffects = applyEventOutcome(outcome);
  const historyEntry = {
    eventId: gameData.currentEvent.id,
    choiceId: choice.id,
    baseProbability: selected.probability.baseProbability,
    matchedBonuses: selected.probability.matchedBonuses,
    finalProbability: selected.probability.probability,
    roll,
    success,
    appliedEffects
  };
  gameData.eventHistory.push(historyEntry);
  renderEventResult(historyEntry);
  eventChoices.querySelectorAll('button').forEach((button) => {
    button.disabled = true;
  });
  closeEventButton.classList.remove('hidden');
  closeEventButton.focus();
}

function applyEventOutcome(outcome) {
  const appliedEffects = {
    timeHours: outcome.timeHours || 0,
    chargingHours: outcome.chargingHours || 0,
    vehicleHealthLossPct: 0,
    pollinatorLosses: [],
    robotDamage: [],
    componentMalfunctions: [],
    siteOutputPct: outcome.siteOutputPct || 0,
    messages: []
  };

  gameData.eventTimeHours += appliedEffects.timeHours;
  gameData.elapsedJourneyHours = Math.max(
    0,
    gameData.elapsedJourneyHours + appliedEffects.timeHours
  );
  gameData.currentChargingAdjustmentHours += outcome.chargingHours || 0;
  if (appliedEffects.timeHours) {
    appliedEffects.messages.push(appliedEffects.timeHours > 0
      ? `Journey time increased by ${formatHours(appliedEffects.timeHours)}.`
      : `Journey time reduced by ${formatHours(Math.abs(appliedEffects.timeHours))}.`);
  }
  if (appliedEffects.chargingHours) {
    const adjustedChargingHours = Math.max(0, gameData.currentChargingAdjustmentHours);
    appliedEffects.messages.push(
      `Charging time changed by ${appliedEffects.chargingHours > 0 ? '+' : ''}${formatHours(appliedEffects.chargingHours)}; the current event adjustment is ${formatHours(adjustedChargingHours)}.`
    );
  }

  Object.entries(outcome.pollinatorLossPct || {}).forEach(([name, percentage]) => {
    const groups = gameData.pollinatorPopulations[name];
    if (!groups || groups.length === 0) return;
    const requestedPercentage = resolveEffectRange(amplifyPollinatorDamage(percentage));
    const isWeather = gameData.currentEvent?.category === 'weather';
    const protectionMultiplier = isWeather && name === 'Smart Hive'
      ? SIMULATION_RULES.smartHiveWeatherLossMultiplier
      : 1;
    const lossPercentage = requestedPercentage * protectionMultiplier;
    let lost = 0;
    groups.forEach((group) => {
      const groupLoss = Math.min(
        group.active,
        Math.round(group.active * lossPercentage / 100)
      );
      group.active -= groupLoss;
      group.permanentLoss += groupLoss;
      lost += groupLoss;
    });
    const effect = {
      name,
      percentage: lossPercentage,
      lost,
      remaining: getPopulationTotals(name).active
    };
    appliedEffects.pollinatorLosses.push(effect);
    appliedEffects.messages.push(
      `${name}: ${lost.toLocaleString()} lost; ${effect.remaining.toLocaleString()} remain${isWeather && name === 'Smart Hive' ? ` (weather protection reduced the loss from ${requestedPercentage}% to ${lossPercentage}%).` : '.'}`
    );
  });

  if (outcome.robotDamagePct) {
    const damagePct = resolveEffectRange(amplifyPollinatorDamage(outcome.robotDamagePct));
    const robotTypes = outcome.robotDamageTypes || [...ROBOT_POLLINATORS];
    robotTypes.forEach((name) => {
      if (!ROBOT_POLLINATORS.has(name) || !hasSelectedComponent(name)) return;
      if (!hasOperationalComponent('Robo-Pollinator Control')) return;
      if (gameData.currentEvent?.category === 'weather') {
        const definition = gameData.catalog.pollinator.find((component) => component.name === name);
        if (definition?.immuneToWeather || name === 'Robot Pollinator') return;
        if (definition?.weatherDamageChance &&
          gameData.rng() >= definition.weatherDamageChance) return;
      }
      const groups = gameData.pollinatorPopulations[name] || [];
      let damaged = 0;
      groups.forEach((group) => {
        const groupDamage = Math.min(group.active, Math.round(group.active * damagePct / 100));
        group.active -= groupDamage;
        group.damaged += groupDamage;
        damaged += groupDamage;
      });
      if (damaged > 0) {
        gameData.totalRobotsDamaged += damaged;
        const effect = { name, damagePct, damaged, active: getPopulationTotals(name).active };
        appliedEffects.robotDamage.push(effect);
        appliedEffects.messages.push(`${name}: ${damaged.toLocaleString()} damaged and inactive; ${effect.active.toLocaleString()} remain active.`);
      }
    });
    if (appliedEffects.robotDamage.length === 0) {
      appliedEffects.messages.push('No vulnerable robotic pollinators were damaged.');
    }
  }

  const healthDamage = outcome.vehicleHealthLossPct
    ? resolveEffectRange(outcome.vehicleHealthLossPct)
    : 0;
  if (healthDamage > 0) {
    const previousHealth = gameData.vehicleHealth;
    gameData.vehicleHealth = Math.max(0, gameData.vehicleHealth - healthDamage);
    appliedEffects.vehicleHealthLossPct = previousHealth - gameData.vehicleHealth;
    appliedEffects.messages.push(`Transporter health fell by ${appliedEffects.vehicleHealthLossPct}% to ${gameData.vehicleHealth}%.`);
  }

  const malfunction = outcome.componentMalfunction;
  if (malfunction) {
    const malfunctionRules = Array.isArray(malfunction) ? malfunction : [malfunction];
    malfunctionRules.forEach((rule) => {
      const componentName = typeof rule === 'string' ? rule : rule.componentName;
      const chance = typeof rule === 'string' ? 1 : (rule.probability ?? 1);
      if (!Number.isFinite(chance) || chance < 0 || chance > 1) {
        throw new Error(`Invalid malfunction probability for "${componentName}".`);
      }
      if (
        componentName &&
        hasOperationalComponent(componentName) &&
        gameData.rng() < chance &&
        setComponentMalfunction(componentName)
      ) {
        appliedEffects.componentMalfunctions.push(componentName);
        appliedEffects.messages.push(`${componentName} malfunctioned and needs repair.`);
      }
    });
  }

  if (appliedEffects.siteOutputPct) {
    const siteIndex = findAffectedPollinationSite();
    if (siteIndex >= 0) {
      gameData.siteOutputMultipliers[siteIndex] *= 1 + appliedEffects.siteOutputPct / 100;
      appliedEffects.siteIndex = siteIndex;
      appliedEffects.siteOutputMultiplier = gameData.siteOutputMultipliers[siteIndex];
      appliedEffects.messages.push(
        `Pollination output at ${gameData.route[siteIndex].region} changed by ${appliedEffects.siteOutputPct}%.`
      );
    } else {
      appliedEffects.siteOutputPct = 0;
      appliedEffects.messages.push('No pollination site is available for this output change.');
    }
  }
  if (appliedEffects.messages.length === 0) {
    appliedEffects.messages.push('No additional time or pollination changes.');
  }
  refreshJourneyStatus();
  return appliedEffects;
}

function resolveEffectRange(value) {
  if (Number.isFinite(value) && value >= 0 && value <= 100) return value;
  if (
    value &&
    Number.isFinite(value.min) &&
    Number.isFinite(value.max) &&
    value.min >= 0 &&
    value.max <= 100 &&
    value.max >= value.min
  ) return randomInteger(value.min, value.max);
  throw new Error('Event effect percentage must be a number or a valid min/max range from 0 to 100.');
}

function amplifyPollinatorDamage(value) {
  const amplify = (percentage) => Math.min(
    100,
    Math.ceil(percentage * SIMULATION_RULES.pollinatorDamageMultiplier)
  );
  if (Number.isFinite(value) && value >= 0 && value <= 100) return amplify(value);
  if (
    value &&
    Number.isFinite(value.min) &&
    Number.isFinite(value.max) &&
    value.min >= 0 &&
    value.max <= 100 &&
    value.max >= value.min
  ) {
    return { min: amplify(value.min), max: amplify(value.max) };
  }
  throw new Error('Pollinator damage percentage must be a number or a valid min/max range from 0 to 100.');
}

function findAffectedPollinationSite() {
  for (let index = gameData.routeIndex; index < gameData.route.length; index += 1) {
    if ((gameData.route[index].stopDurationDays || 0) > 0) return index;
  }
  return -1;
}

function renderEventResult(result) {
  const selected = gameData.availableEventChoices.find(({ choice }) => choice.id === result.choiceId);
  const choice = selected.choice;
  eventResult.replaceChildren();
  eventResult.classList.toggle('is-success', !!result.success);
  eventResult.classList.toggle('is-failure', !result.success);

  const title = document.createElement('h4');
  title.textContent = result.success ? 'Your plan worked!' : 'That plan did not work.';
  eventResult.appendChild(title);

  const choicePara = document.createElement('p');
  choicePara.className = 'event-result__choice';
  choicePara.textContent = `You chose: ${choice.label}`;
  eventResult.appendChild(choicePara);

  const chips = buildOutcomeChips(result.appliedEffects);
  if (chips.length) {
    const row = document.createElement('div');
    row.className = 'outcome-chips';
    chips.forEach((c) => row.appendChild(c));
    eventResult.appendChild(row);
    // Persist a speed change whenever the event moves journey time:
    //   > 0 hours lost  → bar drops and stays down
    //   < 0 hours saved → bar climbs and stays up
    if (result.appliedEffects.timeHours) {
      animateSpeedChange(result.appliedEffects.timeHours);
    }
  } else {
    const neutral = document.createElement('p');
    neutral.className = 'event-result__outcome';
    neutral.textContent = result.success ? 'No lasting damage — press on.' : 'Nothing changed this time.';
    eventResult.appendChild(neutral);
  }

  // Hide the choice list — only the outcome and Continue button remain.
  eventChoices.classList.add('hidden');
  eventResult.classList.remove('hidden');
}

/**
 * Builds a list of visual “outcome chip” elements that show the player
 * exactly which stats shifted and by how much. Each chip has an icon,
 * a label, a signed value, and a tiny proportional bar.
 */
function buildOutcomeChips(effects) {
  const chips = [];
  const BAR_MAX = {
    time: 8,       // hours
    health: 25,    // percentage points
    pollinators: 20000,
    output: 25,    // percentage points
    components: 3  // count
  };

  function chip({ icon, label, value, barPct, tone, title }) {
    const el = document.createElement('div');
    el.className = `outcome-chip is-${tone}`;
    el.title = title || `${label}: ${value}`;
    el.innerHTML =
      `<div class="outcome-chip__head"><span class="outcome-chip__icon" aria-hidden="true">${icon}</span>` +
      `<span class="outcome-chip__label">${label}</span>` +
      `<span class="outcome-chip__value">${value}</span></div>` +
      `<div class="outcome-chip__bar"><span style="width:${Math.max(0, Math.min(100, barPct))}%"></span></div>`;
    return el;
  }

  // ⏱ Time
  if (effects.timeHours) {
    const h = effects.timeHours;
    const sign = h > 0 ? '+' : '−';
    const tone = h > 0 ? 'bad' : 'good';
    chips.push(chip({
      icon: '⏱',
      label: 'Journey time',
      value: `${sign}${formatHours(Math.abs(h))}`,
      barPct: Math.min(100, Math.abs(h) / BAR_MAX.time * 100),
      tone,
      title: h > 0 ? 'You lose time on the road.' : 'You save time on the road.'
    }));
  }

  // ❤ Health
  if (effects.vehicleHealthLossPct > 0) {
    chips.push(chip({
      icon: '❤',
      label: 'Transporter health',
      value: `−${effects.vehicleHealthLossPct}%`,
      barPct: effects.vehicleHealthLossPct / BAR_MAX.health * 100,
      tone: 'bad',
      title: 'Your truck took damage. Lower health means slower driving.'
    }));
    animateHealthDrop(effects.vehicleHealthLossPct);
  }

  // 🐝 Bio pollinator losses — animate the badge + HUD count ticking down
  let totalLostNow = 0;
  effects.pollinatorLosses?.forEach((loss) => {
    if (!loss.lost) return;
    chips.push(chip({
      icon: '🐝',
      label: `${loss.name} lost`,
      value: `−${loss.lost.toLocaleString()}`,
      barPct: loss.lost / BAR_MAX.pollinators * 100,
      tone: 'bad',
      title: `${loss.lost.toLocaleString()} bees died or left. ${loss.remaining.toLocaleString()} still active.`
    }));
    animateCrewLoss(loss.name, loss.lost);
    totalLostNow += loss.lost;
  });

  // 🤖 Robot damage
  effects.robotDamage?.forEach((dmg) => {
    if (!dmg.damaged) return;
    chips.push(chip({
      icon: '🤖',
      label: `${dmg.name} damaged`,
      value: `−${dmg.damaged.toLocaleString()}`,
      barPct: dmg.damaged / BAR_MAX.pollinators * 100,
      tone: 'bad',
      title: `${dmg.damaged.toLocaleString()} robots damaged. Repair them to bring them back.`
    }));
    animateCrewLoss(dmg.name, dmg.damaged);
    totalLostNow += dmg.damaged;
  });

  if (totalLostNow > 0) animateHudPollinatorDrop(totalLostNow);

  // 🌾 Site output
  if (effects.siteOutputPct) {
    const pct = effects.siteOutputPct;
    const sign = pct > 0 ? '+' : '';
    chips.push(chip({
      icon: '🌾',
      label: 'Pollination output',
      value: `${sign}${pct}%`,
      barPct: Math.abs(pct) / BAR_MAX.output * 100,
      tone: pct > 0 ? 'good' : 'bad',
      title: pct > 0 ? 'More crops will be pollinated at this site.' : 'Fewer crops will be pollinated at this site.'
    }));
    const siteName = (typeof effects.siteIndex === 'number' && gameData.route[effects.siteIndex])
      ? gameData.route[effects.siteIndex].region : null;
    flashSiteOutput(pct, siteName);
    animatePollenEvent(pct);
    // siteOutputMultipliers was already updated in applyEventOutcome, so the
    // next refresh will move the jar to its new target.
    requestAnimationFrame(() => refreshJourneyStatus());
  }

  // ⚙ Components malfunctioning
  if (effects.componentMalfunctions?.length) {
    chips.push(chip({
      icon: '⚙',
      label: 'Broken parts',
      value: `${effects.componentMalfunctions.length}`,
      barPct: effects.componentMalfunctions.length / BAR_MAX.components * 100,
      tone: 'bad',
      title: `${effects.componentMalfunctions.join(', ')} malfunctioned. Open Repair to fix.`
    }));
    effects.componentMalfunctions.forEach((name) => flashSystemItem(name));
    flashRepairButton();
  }

  // 🔌 Charging
  if (effects.chargingHours) {
    const h = effects.chargingHours;
    const sign = h > 0 ? '+' : '−';
    chips.push(chip({
      icon: '🔌',
      label: 'Charging time',
      value: `${sign}${formatHours(Math.abs(h))}`,
      barPct: Math.min(100, Math.abs(h) / BAR_MAX.time * 100),
      tone: h > 0 ? 'bad' : 'good',
      title: 'How long you need to charge before the next leg.'
    }));
  }

  return chips;
}

/**
 * Count-down animation: ticks a number down from `from` → `to` so students
 * can watch the loss happen rather than seeing it just snap.
 */
function tickCountDown(el, from, to, durationMs = 1600) {
  const start = performance.now();
  const delta = to - from;
  function step(now) {
    const t = Math.min(1, (now - start) / durationMs);
    const eased = 1 - Math.pow(1 - t, 3);
    const val = Math.round(from + delta * eased);
    el.textContent = val.toLocaleString();
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/**
 * Animates a single crew badge (hovering above the truck) ticking down and
 * flashing red to make the loss visible.
 */
function animateCrewLoss(name, lost) {
  const badge = document.querySelector(`.pollinator-badge[data-crew="${name}"]`);
  if (!badge) return;
  const countEl = badge.querySelector('.pollinator-badge__count');
  if (!countEl) return;
  const now = parseInt(countEl.textContent.replace(/,/g, ''), 10) || 0;
  const prev = now + lost;
  countEl.textContent = prev.toLocaleString();
  badge.classList.add('is-losing');
  tickCountDown(countEl, prev, now, 1800);
  setTimeout(() => badge.classList.remove('is-losing'), 2200);
}

/**
 * Animates the main HUD pollinator total: snaps up to the pre-loss number
 * and ticks down to the current, flashing the mana row red.
 */
function animateHudPollinatorDrop(totalLost) {
  const totalEl = document.getElementById('active-population-total');
  if (!totalEl) return;
  const now = parseInt(totalEl.textContent.replace(/,/g, ''), 10) || 0;
  const prev = now + totalLost;
  totalEl.textContent = prev.toLocaleString();
  tickCountDown(totalEl, prev, now, 2000);
  const row = document.querySelector('.hud-mana');
  if (row) {
    row.classList.add('is-losing');
    setTimeout(() => row.classList.remove('is-losing'), 2400);
  }
}

/**
 * Health drop — ramps the health bar from pre-event value back down to the
 * new value and pulses the whole health row red so the hit is obvious.
 */
function animateHealthDrop(lostPct) {
  const fill = document.getElementById('health-meter-fill');
  const valueEl = document.getElementById('vehicle-health-value');
  const row = document.querySelector('.hud-health');
  if (!fill || !row || !valueEl) return;
  const now = gameData.vehicleHealth;
  const prev = Math.min(100, now + lostPct);
  fill.style.width = `${prev}%`;
  valueEl.textContent = `${prev}%`;
  row.classList.add('is-losing');
  // Tick the % label down + ramp bar width down over ~1.8s.
  const start = performance.now();
  function step(t) {
    const p = Math.min(1, (t - start) / 1800);
    const eased = 1 - Math.pow(1 - p, 3);
    const val = Math.round(prev + (now - prev) * eased);
    valueEl.textContent = `${val}%`;
    fill.style.width = `${val}%`;
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
  setTimeout(() => row.classList.remove('is-losing'), 2200);
}

/**
 * Flash a Systems-rail item when a component malfunctions, so the player can
 * see at a glance which part broke.
 */
function flashSystemItem(name) {
  const items = document.querySelectorAll('.component-status-item');
  items.forEach((item) => {
    if (item.dataset.component === name || item.textContent.includes(name)) {
      item.classList.add('is-just-broke');
      setTimeout(() => item.classList.remove('is-just-broke'), 2600);
    }
  });
}

/**
 * Draw attention to the Repair button when a part breaks so the fix is
 * one obvious tap away.
 */
function flashRepairButton() {
  const btn = document.getElementById('open-repair-btn');
  if (!btn) return;
  btn.classList.add('is-urgent');
  setTimeout(() => btn.classList.remove('is-urgent'), 3200);
}

/**
 * Pop a floating badge on the stage announcing the site-output change
 * so the player understands this event will affect crop pollination later.
 */
function flashSiteOutput(pct, siteName) {
  const stage = document.querySelector('.location-stage');
  if (!stage) return;
  const banner = document.createElement('div');
  banner.className = 'site-output-pop ' + (pct > 0 ? 'is-good' : 'is-bad');
  const sign = pct > 0 ? '+' : '';
  banner.innerHTML = `<span class="site-output-pop__icon" aria-hidden="true">🌾</span>` +
    `<span class="site-output-pop__text"><strong>${sign}${pct}% output</strong>` +
    (siteName ? ` at ${siteName}` : '') + `</span>`;
  stage.appendChild(banner);
  setTimeout(() => {
    banner.classList.add('is-leaving');
    setTimeout(() => banner.remove(), 500);
  }, 2400);
}

/**
 * Persistent speed change for time events. Negative hoursDelta = time saved
 * (speed goes UP and stays up); positive = time lost (speed goes DOWN and
 * stays down). The bar stays at the new value until the next time event.
 */
function animateSpeedChange(hoursDelta) {
  // 1 hour ≈ 8 percentage points; cap single event at 50 points.
  const change = Math.max(-50, Math.min(50, Math.round(-hoursDelta * 8)));
  // Adjustment is capped at 0 so effective speed never exceeds the 100% baseline.
  gameData.speedAdjustmentPct = Math.max(-80, Math.min(0, (gameData.speedAdjustmentPct || 0) + change));
  const meter = document.querySelector('.speed-meter');
  if (meter) {
    meter.classList.add('is-penalised');
    setTimeout(() => meter.classList.remove('is-penalised'), 1600);
  }
  // refreshJourneyStatus will pick up the new adjustment and move the bar.
  if (typeof refreshJourneyStatus === 'function') refreshJourneyStatus();
}

// Backwards-compat alias for the old "dip" call site.
function animateSpeedDip(hoursLost) {
  animateSpeedChange(hoursLost);
}

/**
 * Flash the pollen jar to signal a future site-output change.
 * Positive pct → honey glow; negative pct → flame glow.
 */
function animatePollenEvent(pct) {
  const row = document.querySelector('.hud-pollen');
  if (!row) return;
  row.classList.remove('is-boosted', 'is-cut');
  // force reflow so the animation restarts
  void row.offsetWidth;
  row.classList.add(pct > 0 ? 'is-boosted' : 'is-cut');
  setTimeout(() => row.classList.remove('is-boosted', 'is-cut'), 2200);
}

// ---------- Pollinator badge tap-tooltip (touch-friendly) ----------
document.addEventListener('click', (e) => {
  const badge = e.target.closest?.('.pollinator-badge');
  if (badge) {
    document.querySelectorAll('.pollinator-badge.is-open').forEach((b) => {
      if (b !== badge) b.classList.remove('is-open');
    });
    badge.classList.toggle('is-open');
  } else {
    document.querySelectorAll('.pollinator-badge.is-open').forEach((b) => b.classList.remove('is-open'));
  }
});

function continueAfterEvent() {
  if (!gameData.currentEvent || !gameData.eventResolved) return;
  eventPopup.classList.add('hidden');
  if (repairPanel.classList.contains('hidden')) locationStage.classList.remove('is-paused');
  currentStopName.focus();
  const result = gameData.eventHistory[gameData.eventHistory.length - 1];
  addLogEntry(`${gameData.currentEvent.name}: ${result.success ? 'response succeeded' : 'response failed'}; ${result.appliedEffects.messages.join(' ')}`);
  const resolvedEventName = gameData.currentEvent.name;
  gameData.currentEvent = null;
  gameData.availableEventChoices = [];
  gameData.eventResolved = false;
  gameData.currentPhase = gameData.eventResumePhase;
  gameData.eventResumePhase = '';
  if (checkMissionFailure(`after ${resolvedEventName}`)) return;
  // Each event ends with the transporter arriving at the next area, so the
  // scenery and current stop advance after every incident.
  if (
    gameData.currentPhase === 'travel' &&
    gameData.routeIndex < gameData.route.length - 1
  ) {
    if (gameData.simulationTimer) clearTimeout(gameData.simulationTimer);
    gameData.simulationTimer = setTimeout(() => {
      gameData.simulationTimer = null;
      completeTravelSegment();
    }, 300 * JOURNEY_PACE);
    return;
  }
  scheduleJourney(300);
}

function getPopulationTotals(name) {
  const groups = gameData.pollinatorPopulations[name] || [];
  return groups.reduce((totals, group) => ({
    initial: totals.initial + group.initial,
    active: totals.active + group.active,
    damaged: totals.damaged + group.damaged,
    permanentLoss: totals.permanentLoss + group.permanentLoss
  }), { initial: 0, active: 0, damaged: 0, permanentLoss: 0 });
}

function getFunctioningPollinatorTotal() {
  const controlOperational = hasOperationalComponent('Robo-Pollinator Control');
  return Object.entries(gameData.pollinatorPopulations).reduce((total, [name, groups]) => {
    if (!hasOperationalComponent(name) ||
      (ROBOT_POLLINATORS.has(name) && !controlOperational)) return total;
    return total + groups.reduce((sum, group) => sum + group.active, 0);
  }, 0);
}

function getEffectivePollinatorOutput(initialPopulation = false) {
  const controlOperational = hasOperationalComponent('Robo-Pollinator Control');
  return Object.entries(gameData.pollinatorPopulations).reduce((total, [name, groups]) => {
    const component = gameData.catalog.pollinator.find((item) => item.name === name);
    if (!component || !hasOperationalComponent(name) ||
      (ROBOT_POLLINATORS.has(name) && !controlOperational)) return total;
    const population = groups.reduce(
      (sum, group) => sum + (initialPopulation ? group.initial : group.active),
      0
    );
    return total + population * (component.efficiency || 1);
  }, 0);
}

function refreshJourneyStatus() {
  if (!healthMeter || !activePopulationTotal) return;
  const health = Math.max(0, Math.min(100, gameData.vehicleHealth));
  healthMeterFill.style.width = `${health}%`;
  healthMeter.classList.toggle('is-damaged', health < 70);
  healthMeter.classList.toggle('is-critical', health < 40);
  healthMeter.setAttribute('aria-valuenow', String(health));
  vehicleHealthValue.textContent = `${health}%`;
  const speedBand = SIMULATION_RULES.healthSpeedBands.find((band) => health >= band.minHealth);
  const baseSpeedPct = speedBand ? Math.round(speedBand.multiplier * 100) : 0;
  // The persistent speed shown to the player: base speed from health, plus
  // cumulative adjustments from event time penalties / bonuses. Capped at
  // 100% so the meter never over-fills. Each event moves this number and
  // the bar stays there until the next event changes it.
  const adj = gameData.speedAdjustmentPct || 0;
  const effectiveSpeed = Math.max(0, Math.min(100, baseSpeedPct + adj));
  vehicleSpeedStatus.textContent = effectiveSpeed === 0
    ? 'Transporter stopped'
    : effectiveSpeed >= 100
      ? (adj > 0 ? 'Ahead of schedule' : 'Normal speed')
      : `${effectiveSpeed}% speed${adj < 0 ? ' (behind schedule)' : ''}`;
  const speedFill = document.getElementById('speed-meter-fill');
  const speedMeter = document.querySelector('.speed-meter');
  const speedValueEl = document.getElementById('vehicle-speed-value');
  if (speedFill) speedFill.style.width = `${effectiveSpeed}%`;
  if (speedValueEl) speedValueEl.textContent = `${effectiveSpeed}%`;
  if (speedMeter) {
    speedMeter.setAttribute('aria-valuenow', String(effectiveSpeed));
    speedMeter.classList.toggle('is-low', effectiveSpeed > 0 && effectiveSpeed < 90);
    speedMeter.classList.toggle('is-stopped', effectiveSpeed === 0);
  }
  // Pollen jar — per-site output. Starts empty at each new site and fills
  // toward the target % for the current stop. 80% is the normal result;
  // positive events push toward 100%, penalties pull down toward 70%.
  const pollenTarget = computeSiteTargetPct(gameData.routeIndex);
  const pollenFill = document.getElementById('pollen-jar-fill');
  const pollenPctEl = document.getElementById('pollen-pct');
  const pollenJar = document.querySelector('.pollen-jar');
  const pollenSub = document.getElementById('pollen-sub');
  if (pollenFill) pollenFill.style.width = `${pollenTarget}%`;
  if (pollenPctEl) pollenPctEl.textContent = `${pollenTarget}%`;
  if (pollenJar) pollenJar.setAttribute('aria-valuenow', String(pollenTarget));
  if (pollenSub) {
    const siteName = gameData.route?.[gameData.routeIndex]?.region || 'this stop';
    const base = `${siteName}: ${pollenTarget}% output`;
    if (pollenTarget >= 100) pollenSub.textContent = `${base} — max!`;
    else if (pollenTarget > 80) pollenSub.textContent = `${base} (boosted)`;
    else if (pollenTarget < 80) pollenSub.textContent = `${base} (reduced)`;
    else pollenSub.textContent = `${base} (normal)`;
  }

  const activeTotal = getFunctioningPollinatorTotal();
  const initialTotal = gameData.startingPollinatorTotal;
  const permanentSurvivors = Object.values(gameData.pollinatorPopulations)
    .flat()
    .reduce((sum, group) => sum + group.initial - group.permanentLoss, 0);
  const survivalPct = initialTotal > 0
    ? Math.max(0, Math.min(100, Math.round(permanentSurvivors / initialTotal * 100)))
    : 0;
  activePopulationTotal.textContent = Math.round(activeTotal).toLocaleString();
  populationSurvival.textContent = `${survivalPct}%`;
  populationBreakdown.replaceChildren();
  const truckBadgesEl = document.getElementById('truck-pollinator-badges');
  if (truckBadgesEl) truckBadgesEl.replaceChildren();
  Object.entries(gameData.pollinatorPopulations).forEach(([name]) => {
    const totals = getPopulationTotals(name);
    const operational = hasOperationalComponent(name) &&
      (!ROBOT_POLLINATORS.has(name) || hasOperationalComponent('Robo-Pollinator Control'));
    const line = document.createElement('p');
    line.className = 'population-row';
    line.innerHTML = `<span>${name}</span><span>${Math.round(totals.active).toLocaleString()}${totals.permanentLoss > 0 ? ` (-${Math.round(totals.permanentLoss).toLocaleString()})` : ''}</span>`;
    populationBreakdown.appendChild(line);

    if (truckBadgesEl) {
      const badge = document.createElement('button');
      badge.type = 'button';
      badge.className = 'pollinator-badge' + (operational ? '' : ' is-inactive');
      badge.dataset.crew = name;
      const img = document.createElement('img');
      img.src = iconPathFor(name);
      img.alt = '';
      badge.appendChild(img);
      const count = document.createElement('span');
      count.className = 'pollinator-badge__count';
      count.textContent = Math.round(totals.active).toLocaleString();
      badge.appendChild(count);
      const tip = document.createElement('span');
      tip.className = 'pollinator-badge__tip';
      tip.innerHTML = `<strong>${name}</strong>` +
        `<span>${Math.round(totals.active).toLocaleString()} active${totals.permanentLoss > 0 ? ` · ${Math.round(totals.permanentLoss).toLocaleString()} lost` : ''}${totals.damaged > 0 ? ` · ${Math.round(totals.damaged).toLocaleString()} damaged` : ''}</span>` +
        `<span class="pollinator-badge__tip-note">${operational ? 'Working now.' : 'Not working — missing a working controller or part.'}</span>`;
      badge.appendChild(tip);
      badge.setAttribute('aria-label', `${name}: ${Math.round(totals.active).toLocaleString()} active${operational ? '' : ', not working'}`);
      truckBadgesEl.appendChild(badge);
    }
  });

  const manaFill = document.getElementById('mana-meter-fill');
  if (manaFill) {
    const pct = initialTotal > 0 ? Math.max(0, Math.min(100, (activeTotal / initialTotal) * 100)) : 0;
    manaFill.style.width = `${pct}%`;
  }

  componentStatusList.replaceChildren();
  getInstalledComponents().forEach((component) => {
    const line = document.createElement('p');
    line.className = 'component-status-item';
    const status = gameData.componentStatuses[component.name] || 'operational';
    line.dataset.component = component.name;
    line.style.setProperty('--component-icon', `url("${new URL(iconPathFor(component.name), document.baseURI).href}")`);
    line.innerHTML = `<strong>${component.name}</strong><em>${status}</em>`;
    line.classList.toggle('is-malfunctioning', status === 'malfunctioning');
    componentStatusList.appendChild(line);
  });
  const malfunctioning = getInstalledComponents()
    .filter((component) => gameData.componentStatuses[component.name] === 'malfunctioning')
    .map((component) => component.name);
  malfunctionWarning.textContent = malfunctioning.length > 0
    ? `Needs repair: ${malfunctioning.join(', ')}`
    : '';
  malfunctionWarning.classList.toggle('hidden', malfunctioning.length === 0);
  renderRepairActions();
}

function calculateNormalChargingHours(stop) {
  const stations = (gameData.catalog.other || []).filter((component) =>
    component.type === 'charging' &&
    hasSelectedComponent(component.name) &&
    hasOperationalComponent(component.name)
  );
  if (stations.length === 0 || !stop?.chargingNeeds) return 0;
  const capacityPerBatch = stations.reduce(
    (total, station) => total + Math.max(0, station.chargeCapacity || 0),
    0
  );
  if (capacityPerBatch <= 0) return 0;
  const chargeTime = Math.max(...stations.map((station) => station.chargeTimePerBatch || 1));
  return gameData.selectedComponents.pollinator.reduce((total, selected) => {
    const definition = gameData.catalog.pollinator.find((item) => item.name === selected.name);
    if (!definition?.requiresCharging ||
      !hasOperationalComponent(selected.name) ||
      !hasOperationalComponent('Robo-Pollinator Control')) return total;
    const cycleKey = selected.name === 'Robot Scout' ? 'scoutChargeCycles' : 'pollinatorChargeCycles';
    const cycles = Math.max(0, stop.chargingNeeds[cycleKey] || 0);
    return total + Math.ceil(getPopulationTotals(selected.name).active / capacityPerBatch) *
      cycles * chargeTime;
  }, 0);
}

function completePollinationAtCurrentStop() {
  const stop = gameData.route[gameData.routeIndex];
  const hours = Math.max(0, (stop.stopDurationDays || 0) * 24);
  if (hours === 0) return;
  const outputMultiplier = gameData.siteOutputMultipliers[gameData.routeIndex] || 1;
  const possible = gameData.startingPollinationCapacity * hours;
  const achieved = getEffectivePollinatorOutput() * outputMultiplier * hours;
  gameData.elapsedPollinationHours += hours;
  gameData.elapsedJourneyHours += hours;
  gameData.totalPollinationPossible += possible;
  gameData.totalPollinationAchieved += achieved;
  gameData.currentSiteOutput = possible > 0 ? achieved / possible : 0;
  gameData.pollinationSitesCompleted += 1;
  gameData.siteProductivitySnapshots[gameData.routeIndex] = {
    siteOutputMultiplier: outputMultiplier,
    effectivePollinatorOutput: getEffectivePollinatorOutput()
  };
  addLogEntry(`Pollination at ${stop.region}: ${Math.round(gameData.currentSiteOutput * 100)}% of planned output over ${formatDuration(hours)}.`);
  refreshJourneyStatus();
}

function completeChargingAtCurrentStop() {
  const stop = gameData.route[gameData.routeIndex];
  const planned = calculateNormalChargingHours(stop);
  const adjustment = gameData.currentChargingAdjustmentHours;
  const actual = Math.max(0, planned + adjustment);
  gameData.elapsedChargingHours += actual;
  gameData.elapsedJourneyHours += actual;
  gameData.currentChargingAdjustmentHours = 0;
  if (planned > 0 || adjustment !== 0) {
    addLogEntry(`Charging at ${stop.region}: ${formatDuration(actual)}${adjustment ? ` (${adjustment > 0 ? '+' : ''}${formatHours(adjustment)} event adjustment)` : ''}.`);
  }
}

function renderRepairActions() {
  if (!repairActions) return;
  repairActions.replaceChildren();
  const cost = SIMULATION_RULES.repair.costPerAction;
  repairBudget.textContent = `Available journey funds: $${gameData.budgetRemaining.toLocaleString()}. Each repair costs $${cost.toLocaleString()}.`;
  if (
    !mapScreen ||
    mapScreen.classList.contains('hidden') ||
    gameData.missionFailed ||
    gameData.currentPhase === 'complete'
  ) return;
  const withModule = hasOperationalComponent('Repair');
  const duration = withModule
    ? SIMULATION_RULES.repair.withModuleHours
    : SIMULATION_RULES.repair.withoutModuleHours;
  const addAction = (type, label, name = '') => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'repair-action';
    button.dataset.repairType = type;
    if (name) button.dataset.componentName = name;
    button.textContent = `${label} (${formatHours(duration)}, $${cost.toLocaleString()})`;
    button.disabled = gameData.budgetRemaining < cost;
    if (button.disabled) {
      button.title = 'Not enough journey funds for this repair.';
    }
    repairActions.appendChild(button);
  };
  if (gameData.vehicleHealth < 100) {
    addAction('vehicle', `Restore ${SIMULATION_RULES.repair.healthPoints}% transporter health`);
  }
  Object.entries(gameData.pollinatorPopulations).forEach(([name, groups]) => {
    if (ROBOT_POLLINATORS.has(name) && groups.some((group) => group.damaged > 0)) {
      addAction('robots', `Repair ${name}`, name);
    }
  });
  getInstalledComponents()
    .filter((component) => gameData.componentStatuses[component.name] === 'malfunctioning')
    .forEach((component) => addAction('component', `Repair ${component.name}`, component.name));
}

function performRepair(type, componentName) {
  if (gameData.missionFailed) return;
  const cost = SIMULATION_RULES.repair.costPerAction;
  if (gameData.budgetRemaining < cost) {
    repairFeedback.textContent = `Not enough journey funds. Each repair costs $${cost.toLocaleString()}.`;
    renderRepairActions();
    return;
  }
  const withModule = hasOperationalComponent('Repair');
  const hours = withModule
    ? SIMULATION_RULES.repair.withModuleHours
    : SIMULATION_RULES.repair.withoutModuleHours;
  let repaired = false;
  if (type === 'vehicle' && gameData.vehicleHealth < 100) {
    const previous = gameData.vehicleHealth;
    gameData.vehicleHealth = Math.min(100, previous + SIMULATION_RULES.repair.healthPoints);
    repairFeedback.textContent = `Transporter health restored by ${gameData.vehicleHealth - previous}%.`;
    repaired = true;
  } else if (type === 'component' && componentName &&
    gameData.componentStatuses[componentName] === 'malfunctioning') {
    gameData.componentStatuses[componentName] = 'operational';
    repairFeedback.textContent = `${componentName} is operational again.`;
    repaired = true;
  } else if (type === 'robots' && componentName) {
    const groups = gameData.pollinatorPopulations[componentName] || [];
    const rate = withModule
      ? SIMULATION_RULES.repair.robotRecoveryWithModulePct
      : SIMULATION_RULES.repair.robotRecoveryWithoutModulePct;
    let restored = 0;
    groups.forEach((group) => {
      const amount = Math.min(group.damaged, Math.max(1, Math.floor(group.damaged * rate)));
      group.damaged -= amount;
      group.active += amount;
      restored += amount;
    });
    if (restored > 0) {
      gameData.totalRobotsRepaired += restored;
      repairFeedback.textContent = `${restored.toLocaleString()} ${componentName} restored to active service.`;
      repaired = true;
    }
  }
  if (!repaired) return;
  gameData.budgetRemaining -= cost;
  gameData.repairHours += hours;
  gameData.elapsedJourneyHours += hours;
  repairFeedback.textContent += ` Repair cost: $${cost.toLocaleString()}.`;
  addLogEntry(`Repair completed in ${formatHours(hours)} for $${cost.toLocaleString()}. ${repairFeedback.textContent}`);
  refreshJourneyStatus();
  checkMissionFailure('after repair');
}

function checkMissionFailure(context) {
  if (gameData.missionFailed) return true;
  if (gameData.vehicleHealth <= 0) {
    gameData.missionFailureReason = `The transporter reached 0% health ${context}.`;
  } else if (getFunctioningPollinatorTotal() <= 0) {
    gameData.missionFailureReason = `No functioning pollinators remain ${context}.`;
  } else {
    return false;
  }
  gameData.missionFailed = true;
  gameData.missionEndedAt = gameData.route[gameData.routeIndex]?.region || 'the route';
  if (gameData.simulationTimer) {
    clearTimeout(gameData.simulationTimer);
    gameData.simulationTimer = null;
  }
  finishJourney();
  return true;
}

function addLogEntry(message) {
  gameData.journeyLog.push(message);
  journeyLog.querySelector('.log-empty')?.remove();
  const entry = document.createElement('p');
  entry.textContent = message;
  journeyLog.appendChild(entry);
}

function finishJourney() {
  if (gameData.currentPhase === 'complete') return;
  locationStage.classList.add('is-paused');
  if (gameData.simulationTimer) {
    clearTimeout(gameData.simulationTimer);
    gameData.simulationTimer = null;
  }
  if (gameData.missionFailed) {
    routeStatus.innerHTML = `<p><strong>Mission ended:</strong> ${gameData.missionFailureReason}</p>`;
  } else {
    gameData.missionEndedAt = gameData.route[gameData.route.length - 1]?.region || '';
    routeStatus.innerHTML = '<p><strong>Mission status:</strong> Journey complete.</p>';
  }
  if (gameData.currentChargingAdjustmentHours > 0) {
    gameData.elapsedJourneyHours += gameData.currentChargingAdjustmentHours;
    gameData.elapsedChargingHours += gameData.currentChargingAdjustmentHours;
    gameData.currentChargingAdjustmentHours = 0;
  }
  const outputRatio = gameData.totalPollinationPossible > 0
    ? gameData.totalPollinationAchieved / gameData.totalPollinationPossible
    : 0;
  const controlEfficiency = gameData.selectedComponents.control?.driverEfficiency || 1;
  const engineSpeed = gameData.selectedComponents.engine?.speedMultiplier || 1;
  const squadCount = gameData.selectedComponents.pollinator.reduce(
    (total, component) => total + component.quantity,
    0
  );
  const supportCount = gameData.selectedComponents.other.length;
  const buildPerformance = Math.min(100, Math.round(
    35 + controlEfficiency * 20 + engineSpeed * 15 + squadCount * 0.08 + supportCount * 5
  )) / 100;
  const baselineHours = gameData.baselineTravelHours + gameData.baselinePollinationHours;
  const timeEfficiency = baselineHours > 0
    ? Math.min(1, baselineHours / Math.max(1, gameData.elapsedJourneyHours))
    : 0;
  const journeyPerformance = buildPerformance *
    Math.max(0, Math.min(1, outputRatio)) *
    timeEfficiency;
  const permanentSurvivors = Object.values(gameData.pollinatorPopulations)
    .flat()
    .reduce((sum, group) => sum + group.initial - group.permanentLoss, 0);
  const survival = gameData.startingPollinatorTotal > 0
    ? permanentSurvivors / gameData.startingPollinatorTotal
    : 0;
  const health = Math.max(0, Math.min(100, gameData.vehicleHealth)) / 100;
  const score = Math.max(0, Math.min(100, Math.round(100 * (
    SIMULATION_RULES.scoreWeights.journey * journeyPerformance +
    SIMULATION_RULES.scoreWeights.pollinatorSurvival * survival +
    SIMULATION_RULES.scoreWeights.vehicleHealth * health
  ))));
  gameData.score = score;
  gameData.currentPhase = 'complete';
  journeyScore.textContent = `${score}/100`;
  const summaryScoreEl = document.getElementById('summary-score-value');
  const summaryVerdictEl = document.getElementById('summary-hero-verdict');
  if (summaryScoreEl) summaryScoreEl.textContent = String(score);
  if (summaryVerdictEl) {
    summaryVerdictEl.textContent = gameData.missionFailed
      ? 'Mission ended early'
      : score >= 85 ? 'Outstanding pollination run!'
      : score >= 70 ? 'Solid work — crops pollinated.'
      : score >= 50 ? 'You made it — plenty to improve.'
      : 'Rough journey — try a new build!';
  }
  // Ensure progress bar reads 100% at finish.
  const fill = document.getElementById('progress-bar-fill');
  if (fill) fill.style.width = '100%';
  const cur = document.getElementById('progress-current');
  if (cur) cur.textContent = String(gameData.route?.length || '—');
  routeStatus.innerHTML += `
    <p><strong>Final score:</strong> ${score}/100</p>
    <p><strong>Pollination output:</strong> ${Math.round(outputRatio * 100)}% of planned output across ${gameData.pollinationSitesCompleted} sites</p>
    <p><strong>Journey time:</strong> ${formatDuration(gameData.elapsedJourneyHours)} actual; ${formatDuration(baselineHours)} planned</p>
    <p><strong>Score weights:</strong> ${Math.round(SIMULATION_RULES.scoreWeights.journey * 100)}% journey performance, ${Math.round(SIMULATION_RULES.scoreWeights.pollinatorSurvival * 100)}% pollinator survival, ${Math.round(SIMULATION_RULES.scoreWeights.vehicleHealth * 100)}% transporter health</p>
  `;
  missionSummaryOutcome.textContent = gameData.missionFailed
    ? `Mission ended at ${gameData.missionEndedAt}. ${gameData.missionFailureReason}`
    : `Journey completed at ${gameData.missionEndedAt}.`;
  missionSummaryDetails.replaceChildren();
  [
    ['Final score', `${score}/100`],
    ['Journey performance', `${Math.round(journeyPerformance * 100)}%`],
    ['Transporter build rating', `${Math.round(buildPerformance * 100)}%`],
    ['Pollination output', `${Math.round(outputRatio * 100)}%`],
    ['Pollinator survival', `${Math.round(survival * 100)}%`],
    ['Transporter health', `${Math.round(health * 100)}%`],
    ['Journey duration', formatDuration(gameData.elapsedJourneyHours)],
    ['Travel time', formatDuration(gameData.elapsedTravelHours)],
    ['Pollination time', formatDuration(gameData.elapsedPollinationHours)],
    ['Charging time', formatDuration(gameData.elapsedChargingHours)],
    ['Event time adjustment', `${gameData.eventTimeHours >= 0 ? '+' : '-'}${formatHours(Math.abs(gameData.eventTimeHours))}`],
    ['Repair time', formatDuration(gameData.repairHours)],
    ['Robots repaired', gameData.totalRobotsRepaired.toLocaleString()],
    ['Robots damaged', gameData.totalRobotsDamaged.toLocaleString()],
    ['Events resolved', String(gameData.eventHistory.length)],
    ['Budget remaining', `$${gameData.budgetRemaining.toLocaleString()}`]
  ].forEach(([label, value]) => {
    const detail = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = `${label}: `;
    detail.append(strong, document.createTextNode(value));
    missionSummaryDetails.appendChild(detail);
  });
  missionSummary.classList.toggle('is-failed', gameData.missionFailed);
  missionSummary.classList.remove('hidden');
  repairPanel.classList.add('hidden');
  newBuildButton.classList.remove('hidden');
  eventPopup.classList.add('hidden');
  closeEventButton.classList.add('hidden');
  refreshJourneyStatus();
  addLogEntry(gameData.missionFailed
    ? `Mission failed: ${gameData.missionFailureReason}`
    : `Journey complete. Final score: ${score}/100.`);
}

function resetToBuilder() {
  newBuildButton.classList.add('hidden');
  mapScreen.classList.add('hidden');
  builderScreen.classList.remove('hidden');
  titleScreen.classList.add('hidden');
  resetBuild();
  generateBudget();
  loadComponents().then(() => initBuilderWizard());
}

// ---------- UI helpers: toast, highlight, modal wiring, icon mapping ----------

function iconPathFor(name) {
  // Delegate to the game's canonical name→image mapping so the Systems rail
  // and pollinator badges stay in lockstep with builder icons.
  if (!name) return encodeURI('assets/components/Repair Module.webp');
  try {
    const src = getComponentImage(name);
    if (src) return src;
  } catch (_) {}
  return encodeURI(`assets/components/${name}.webp`);
}

let toastTimer = null;
let toastHideTimer = null;
function showToast(message, { tone = 'warning', durationMs = 3800 } = {}) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = 'toast';
  toast.classList.toggle('is-success', tone === 'success');
  toast.classList.remove('hidden', 'is-leaving');
  if (toastTimer) clearTimeout(toastTimer);
  if (toastHideTimer) clearTimeout(toastHideTimer);
  toastTimer = setTimeout(() => {
    toast.classList.add('is-leaving');
    toastHideTimer = setTimeout(() => toast.classList.add('hidden'), 300);
  }, durationMs);
}

function highlightMissing(categories) {
  const left = document.getElementById('component-selection-left');
  const right = document.getElementById('component-selection-right');
  [left, right].forEach((container) => {
    if (!container) return;
    container.querySelectorAll('fieldset').forEach((fs) => fs.classList.remove('is-missing'));
  });
  categories.forEach((cat) => {
    document
      .querySelectorAll(`fieldset.component-group--${cat}`)
      .forEach((fs) => {
        fs.classList.add('is-missing');
        fs.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
  });
  setTimeout(() => {
    document.querySelectorAll('fieldset.is-missing').forEach((fs) => fs.classList.remove('is-missing'));
  }, 4200);
}

function wireJourneyModals() {
  const mapBtn = document.getElementById('open-map-btn');
  const mapModal = document.getElementById('map-modal');
  const summaryMapBtn = document.getElementById('summary-map-btn');
  const openMap = () => { if (mapModal) mapModal.classList.remove('hidden'); };
  if (mapBtn && mapModal) {
    mapBtn.addEventListener('click', () => {
      mapModal.classList.toggle('hidden');
    });
  }
  if (summaryMapBtn && mapModal) {
    summaryMapBtn.addEventListener('click', openMap);
  }
  document.querySelectorAll('[data-close-modal]').forEach((el) => {
    el.addEventListener('click', () => {
      const modal = el.closest('.journey-modal');
      if (modal) modal.classList.add('hidden');
    });
  });
  document.querySelectorAll('[data-close-repair]').forEach((el) => {
    el.addEventListener('click', () => closeRepairPanel());
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Escape') return;
    if (mapModal && !mapModal.classList.contains('hidden')) mapModal.classList.add('hidden');
    if (repairPanel && !repairPanel.classList.contains('hidden')) closeRepairPanel();
  });
}

wireJourneyModals();

// ---------- Fix dialog (one-tap problem solvers) ----------
function ensureFixDialog() {
  let el = document.getElementById('fix-dialog');
  if (el) return el;
  el = document.createElement('div');
  el.id = 'fix-dialog';
  el.className = 'fix-dialog hidden';
  el.setAttribute('role', 'alertdialog');
  el.setAttribute('aria-modal', 'true');
  el.innerHTML = `
    <div class="fix-dialog__backdrop" data-fix-close></div>
    <div class="fix-dialog__panel">
      <h3 class="fix-dialog__title"></h3>
      <p class="fix-dialog__body"></p>
      <div class="fix-dialog__actions"></div>
    </div>`;
  document.body.appendChild(el);
  return el;
}

function showFixDialog({ title, body, actions }) {
  const el = ensureFixDialog();
  el.querySelector('.fix-dialog__title').textContent = title;
  el.querySelector('.fix-dialog__body').textContent = body;
  const row = el.querySelector('.fix-dialog__actions');
  row.replaceChildren();
  (actions || []).forEach(({ label, onClick, primary }) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.className = 'hud-btn' + (primary ? '' : ' hud-btn--ghost');
    b.addEventListener('click', () => { hideFixDialog(); onClick && onClick(); });
    row.appendChild(b);
  });
  el.classList.remove('hidden');
}

function hideFixDialog() {
  const el = document.getElementById('fix-dialog');
  if (el) el.classList.add('hidden');
}

function addOtherByName(name) {
  const cb = document.querySelector(`input[name="other"][value="${name}"]`);
  if (!cb) return;
  if (!cb.checked) { cb.checked = true; cb.dispatchEvent(new Event('change', { bubbles: true })); }
}

function removeOtherByName(name) {
  const cb = document.querySelector(`input[name="other"][value="${name}"]`);
  if (!cb) return;
  if (cb.checked) { cb.checked = false; cb.dispatchEvent(new Event('change', { bubbles: true })); }
}

function removeRobotPollinators() {
  document.querySelectorAll('select[data-category="pollinator"]').forEach((sel) => {
    if (ROBOT_POLLINATORS.has(sel.dataset.name) && Number(sel.value) > 0) {
      sel.value = '0';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
}

// ---------- Builder onboarding dismiss ----------
(function wireOnboarding() {
  const card = document.getElementById('builder-onboarding');
  const btn = document.getElementById('dismiss-onboarding');
  if (!card || !btn) return;
  // Onboarding card shows on every page load; close is per-session only.
  btn.addEventListener('click', () => {
    card.classList.add('is-dismissed');
  });
})();

// ---------- Builder wizard (one step at a time) ----------
const WIZARD_STEPS = [
  { key: 'control',   label: 'Control',    required: true,  hint: 'Pick a control system — your truck’s brain.' },
  { key: 'engine',    label: 'Engine',     required: true,  hint: 'Pick an engine or power source.' },
  { key: 'pollinator', label: 'Crew',      required: true,  hint: 'Add at least one pollinator crew with the + button.' },
  { key: 'other',     label: 'Extras',     required: false, hint: 'Add any extras you want — or skip to the start.' }
];
let wizardIndex = 0;

function initBuilderWizard() {
  const builder = document.getElementById('vehicle-builder');
  if (!builder) return;
  builder.classList.add('is-wizard');
  renderWizardSteps();
  showWizardStep(0);
  document.getElementById('wizard-next-btn')?.addEventListener('click', () => {
    if (!canAdvance()) return;
    if (wizardIndex < WIZARD_STEPS.length - 1) {
      showWizardStep(wizardIndex + 1);
    } else {
      // Last step: start the route via the normal route button handler.
      document.getElementById('route-btn')?.click();
    }
  });
  document.getElementById('wizard-back-btn')?.addEventListener('click', () => {
    if (wizardIndex > 0) showWizardStep(wizardIndex - 1);
  });
}

function renderWizardSteps() {
  const list = document.getElementById('builder-wizard-steps');
  if (!list) return;
  list.replaceChildren();
  WIZARD_STEPS.forEach((step, i) => {
    const li = document.createElement('li');
    li.className = 'wizard-step';
    li.dataset.step = step.key;
    li.innerHTML = `<span class="wizard-step__num"><span class="wizard-step__num-text">${i + 1}</span></span>${step.label}`;
    list.appendChild(li);
  });
}

function showWizardStep(i) {
  wizardIndex = Math.max(0, Math.min(WIZARD_STEPS.length - 1, i));
  const step = WIZARD_STEPS[wizardIndex];
  document.querySelectorAll('.component-group').forEach((fs) => fs.classList.remove('is-active-step'));
  document.querySelectorAll(`.component-group--${step.key}`).forEach((fs) => fs.classList.add('is-active-step'));
  document.querySelectorAll('.wizard-step').forEach((el, idx) => {
    el.classList.toggle('is-active', idx === wizardIndex);
    el.classList.toggle('is-done', idx < wizardIndex);
  });
  document.getElementById('wizard-back-btn').disabled = wizardIndex === 0;
  const nextBtn = document.getElementById('wizard-next-btn');
  const routeBtn = document.getElementById('route-btn');
  const onLast = wizardIndex === WIZARD_STEPS.length - 1;
  nextBtn.classList.toggle('hidden', onLast);
  routeBtn.classList.toggle('hidden', !onLast);
  updateWizardHint();
}

function canAdvance() {
  const step = WIZARD_STEPS[wizardIndex];
  if (!step.required) return true;
  if (step.key === 'control') return !!gameData.selectedComponents.control;
  if (step.key === 'engine') return !!gameData.selectedComponents.engine;
  if (step.key === 'pollinator') return gameData.selectedComponents.pollinator.length > 0;
  return true;
}

function updateWizardHint() {
  const step = WIZARD_STEPS[wizardIndex];
  const hint = document.getElementById('builder-nav-hint');
  const nextBtn = document.getElementById('wizard-next-btn');
  const routeBtn = document.getElementById('route-btn');
  if (!hint) return;
  const ok = canAdvance();
  if (step.required && !ok) {
    hint.textContent = step.hint;
    nextBtn.disabled = true;
    routeBtn.disabled = true;
  } else if (wizardIndex === WIZARD_STEPS.length - 1) {
    hint.textContent = 'All set! Tap Start Route when you are ready.';
    nextBtn.disabled = true;
    routeBtn.disabled = false;
  } else {
    hint.textContent = `Nice — tap Next for ${WIZARD_STEPS[wizardIndex + 1].label}.`;
    nextBtn.disabled = false;
    routeBtn.disabled = false;
  }
}

// ---------- Journey tour (first arrival at GTAC) ----------
const TOUR_STEPS = [
  {
    sel: '.hud-health',
    title: 'Transporter health',
    body: 'This bar is your truck. Hazards and crashes drain it. Below 70% you slow down, below 40% things can break.'
  },
  {
    sel: '.hud-mana, .hud-pollen',
    title: 'Pollinator crew & pollen jar',
    body: 'Top: your pollinator count and the share still alive. One Honey Bee Hive carries 20,000–80,000 bees; one Robot Pollinator carries 20,000 robots. Bottom: the pollen jar for the current stop — 80% is normal, boosts push it to 100%, penalties drop it to 70%.'
  },
  {
    sel: '.truck-pollinator-badges',
    title: 'Crew on board',
    body: 'This badge shows which pollinator crews are riding on the truck right now and how many are still working. Each icon is a different crew type.'
  },
  {
    sel: '.component-rail',
    title: 'Systems',
    body: 'Every part you installed is listed here with its status. If one goes orange it is broken — tap Repair to fix it.'
  },
  {
    sel: '.progress-pill',
    title: 'Journey progress',
    body: 'Shows which stop you are on across the whole Victoria route, and fills as you cover ground.'
  },
  {
    sel: '#open-map-btn',
    title: 'Map & journey log',
    body: 'Tap here any time to see where you are on the Victoria map and read what has happened so far.'
  },
  {
    sel: '#open-repair-btn',
    title: 'Repair bay',
    body: 'Open the repair menu to patch up damaged parts. Repairs cost time, so pick carefully.'
  },
  {
    sel: '.location-caption-compact',
    title: 'Current stop',
    body: 'The stop you are at — and the one you are heading to next. The game begins at GTAC, Parkville.'
  }
];

let tourIndex = 0;
let tourOnComplete = null;

function startJourneyTour(onComplete) {
  // Tour runs on every arrival at GTAC so students always get the walkthrough.
  tourOnComplete = onComplete;
  tourIndex = 0;
  const tour = document.getElementById('tour');
  if (!tour) { if (onComplete) onComplete(); return; }
  tour.classList.remove('hidden');
  document.getElementById('tour-total').textContent = String(TOUR_STEPS.length);
  renderTourStep();
  const nextBtn = document.getElementById('tour-next');
  const skipBtn = document.getElementById('tour-skip');
  nextBtn.onclick = () => {
    tourIndex += 1;
    if (tourIndex >= TOUR_STEPS.length) return finishTour();
    renderTourStep();
  };
  skipBtn.onclick = finishTour;
  window.addEventListener('resize', positionTour);
}

function renderTourStep() {
  const step = TOUR_STEPS[tourIndex];
  document.getElementById('tour-step').textContent = String(tourIndex + 1);
  document.getElementById('tour-title').textContent = step.title;
  document.getElementById('tour-body').textContent = step.body;
  const nextBtn = document.getElementById('tour-next');
  nextBtn.textContent = tourIndex === TOUR_STEPS.length - 1 ? 'Start the journey' : 'Next';
  positionTour();
}

function positionTour() {
  const step = TOUR_STEPS[tourIndex];
  const els = document.querySelectorAll(step.sel);
  const spot = document.querySelector('.tour__spotlight');
  const tip = document.querySelector('.tour__tooltip');
  if (!els.length || !spot || !tip) return;
  // Union of all matched elements, so a step can highlight multiple regions
  // (e.g. the mana bar + the pollen jar together).
  let top = Infinity, left = Infinity, right = -Infinity, bottom = -Infinity;
  els.forEach((el) => {
    const b = el.getBoundingClientRect();
    if (b.top < top) top = b.top;
    if (b.left < left) left = b.left;
    if (b.right > right) right = b.right;
    if (b.bottom > bottom) bottom = b.bottom;
  });
  const r = { top, left, right, bottom, width: right - left, height: bottom - top };
  const pad = 12;
  spot.style.top = `${r.top - pad}px`;
  spot.style.left = `${r.left - pad}px`;
  spot.style.width = `${r.width + pad * 2}px`;
  spot.style.height = `${r.height + pad * 2}px`;
  // Position tooltip: prefer to the right; fall back to below or left
  const tipW = 360;
  const tipH = tip.offsetHeight || 200;
  let tipLeft = r.right + 24;
  let tipTop = r.top;
  if (tipLeft + tipW > window.innerWidth - 16) {
    tipLeft = Math.max(16, r.left - tipW - 24);
  }
  if (tipLeft < 16) {
    tipLeft = Math.max(16, Math.min(window.innerWidth - tipW - 16, r.left));
    tipTop = r.bottom + 24;
  }
  if (tipTop + tipH > window.innerHeight - 16) {
    tipTop = Math.max(16, window.innerHeight - tipH - 16);
  }
  tip.style.top = `${tipTop}px`;
  tip.style.left = `${tipLeft}px`;
}

function finishTour() {
  const tour = document.getElementById('tour');
  if (tour) tour.classList.add('hidden');
  if (tourOnComplete) tourOnComplete();
  tourOnComplete = null;
  window.removeEventListener('resize', positionTour);
}

init();
