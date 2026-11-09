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
// Grant Grab: random base funding, topped up by the mini-game.
const FUNDING_RULES = { baseMin: 60000, baseMax: 72000, maxBonus: 25000 };
// Pollen Rush: a perfect round boosts that site's pollination by this much.
const POLLEN_RUSH_MAX_BONUS_PCT = 15;
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
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  grantFunding: null,
  grantBonus: 0,
  pollenRushPlayed: new Set(),
  pollenRushResults: [],
  pollenRushSkipAll: false
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
  vehicleChoice.addEventListener('change', () => changeVehicle(vehicleChoice.value));
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
        freezeTruck();
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

async function startGame() {
  titleScreen.classList.add('hidden');
  builderScreen.classList.add('hidden');
  mapScreen.classList.add('hidden');
  await runFundingRound();
  builderScreen.classList.remove('hidden');
  resetBuild();
  generateBudget();
  loadComponents().then(() => initBuilderWizard());
}

async function runFundingRound() {
  const grantScreen = document.getElementById('grant-screen');
  const skipButton = document.getElementById('grant-skip-btn');
  const step = 1000;
  const base = FUNDING_RULES.baseMin +
    Math.floor(Math.random() * ((FUNDING_RULES.baseMax - FUNDING_RULES.baseMin) / step + 1)) * step;
  document.getElementById('grant-base').textContent = base.toLocaleString();
  document.getElementById('grant-max').textContent = FUNDING_RULES.maxBonus.toLocaleString();
  skipButton.textContent = 'Skip — use base funding';
  grantScreen.classList.remove('hidden');
  window.scrollTo(0, 0);
  let result = { finalFunding: base, bonusFunding: 0, skipped: true };
  if (window.Minigames) {
    result = await window.Minigames.runGrantGrab({
      container: document.getElementById('grant-container'),
      skipButton,
      initialFunding: base,
      maxBonus: FUNDING_RULES.maxBonus
    });
  }
  grantScreen.classList.add('hidden');
  gameData.grantFunding = result.finalFunding;
  gameData.grantBonus = result.bonusFunding || 0;
  if (gameData.grantBonus > 0) {
    showToast(`Grant Grab won you an extra $${gameData.grantBonus.toLocaleString()}! Total budget: $${result.finalFunding.toLocaleString()}.`, { tone: 'success', durationMs: 5000 });
  }
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
  gameData.budget = gameData.grantFunding ??
    (FUNDING_RULES.baseMin + Math.floor(Math.random() * (FUNDING_RULES.baseMax - FUNDING_RULES.baseMin)));
  gameData.budgetRemaining = gameData.budget;
  updateStats();
}

async function loadGridData() {
  const [footprintsResponse, vehiclesResponse] = await Promise.all([
    fetch('assets/components/pollination_component_grid_sizes.json', { cache: 'no-cache' }),
    fetch('assets/Transporter%20Assets/vehicles-layered.json', { cache: 'no-cache' })
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

// ---------- Builder: one source of truth ----------
// gameData.selectedComponents + gameData.selectedVehicle are the ONLY record of
// the build. Cards, counters, ticks and the truck layout are all redrawn from
// that state after every change, so they can never disagree with each other.

const CATEGORY_LABELS = {
  vehicle: 'Transporter size',
  control: 'Control',
  engine: 'Engine',
  pollinator: 'Pollinator squadrons',
  other: 'Extras'
};

const COMPONENT_QUIPS = {
  'Small Transporter': 'Parks anywhere. Fits almost nothing.',
  'Medium Transporter': 'The Goldilocks of bee trucks.',
  'Large Transporter': 'Turning circle: roughly one suburb.',
  'AI Controlled': 'Never sleeps, never asks "are we there yet?"',
  'Driven by People': 'Runs on coffee, snacks and 8 hours of sleep.',
  'Remote Controlled': 'Works great… until it goes "searching for signal".',
  'Truck Engine': 'Smells like diesel and nostalgia.',
  'Jet Engine': 'Is it legal? Let’s not ask.',
  'Battery': 'Like your phone: always 1 hour from needing a charge.',
  'Solar Battery': 'Powered by sunshine. Sulks on cloudy days.',
  'Hybrid Engine': 'Can’t decide what it wants to be, so it’s both.',
  'Nuclear Engine': 'Never refuels. Please don’t crash.',
  'Honey Bee Hive': '50,000 tiny employees. Zero union meetings.',
  'Robot Forager': 'Shiny, speedy, scared of the dark.',
  'Smart Hive': 'A hive with Wi-Fi and central heating.',
  'Robot Scout': 'Night owl. Well… night bee.',
  'Robot Pollinator': 'Slow and steady wins the… pollen?',
  'Distance and Vision Sensors': 'Eyes in the back of the truck’s head.',
  'Repair': 'Duct tape, but make it science.',
  'Navigation GPS': '"Recalculating…" fewer times than you’d expect.',
  'Robo-Pollinator Control': 'The remote for your robot bees. Don’t lose it.',
  'Small Charging Station': 'Charges robots in small, polite batches.',
  'Large Charging Station': 'Robot buffet. All you can charge.'
};

const VEHICLE_CARD_IMAGES = {
  small: 'assets/components/Bee Transport Truck - Small.webp',
  medium: 'assets/components/Bee Transport Truck - Medium.webp',
  large: 'assets/components/Bee Transport Truck - Large.webp'
};

async function loadComponents() {
  const response = await fetch('data/components.json', { cache: 'no-cache' });
  const data = await response.json();
  gameData.catalog = data;
  (data.vehicle || []).forEach((spec) => {
    if (gameData.vehicles[spec.id]) {
      Object.assign(gameData.vehicles[spec.id], {
        cost: spec.cost || 0,
        speedMultiplier: spec.speedMultiplier || 1,
        label: spec.name
      });
    }
  });
  componentSelectionLeft.innerHTML = '';
  componentSelectionRight.innerHTML = '';

  Object.entries(data).forEach(([category, options]) => {
    if (!Array.isArray(options)) return;
    const fieldset = document.createElement('fieldset');
    fieldset.className = `component-group component-group--${category}`;
    const legend = document.createElement('legend');
    legend.textContent = CATEGORY_LABELS[category] || category;
    fieldset.appendChild(legend);
    options.forEach((part) => fieldset.appendChild(createComponentCard(category, part)));
    const target = ['vehicle', 'control', 'engine'].includes(category)
      ? componentSelectionLeft
      : componentSelectionRight;
    target.appendChild(fieldset);
  });

  vehicleChoice.value = gameData.selectedVehicle;
  updateStats();
  renderCardStates();
}

function findCatalogItem(category, name) {
  return (gameData.catalog[category] || []).find((item) => item.name === name) || null;
}

function findCard(category, name) {
  return document.querySelector(
    `.component-card[data-category="${category}"][data-name="${CSS.escape(name)}"]`
  );
}

function createComponentCard(category, part) {
  const kind = category === 'pollinator' ? 'counter' : category === 'other' ? 'toggle' : 'pick';
  const card = document.createElement('div');
  card.className = `component-card component-card--${kind}`;
  card.dataset.category = category;
  card.dataset.name = part.name;
  if (category === 'vehicle') card.dataset.vehicleId = part.id;
  card.tabIndex = 0;
  card.setAttribute('role', 'button');
  card.title = part.notes || part.effect || '';

  const img = document.createElement('img');
  img.src = category === 'vehicle' ? VEHICLE_CARD_IMAGES[part.id] : getComponentImage(part.name);
  img.alt = '';
  img.draggable = false;
  img.loading = 'lazy';

  const info = document.createElement('div');
  info.className = 'component-info';
  const details = [`$${part.cost.toLocaleString()}`];
  if (category === 'vehicle') {
    const vehicle = gameData.vehicles[part.id];
    if (vehicle) details.push(`${vehicle.columns * vehicle.rows} spaces`);
    if (part.speedMultiplier && part.speedMultiplier !== 1) {
      details.push(`${part.speedMultiplier > 1 ? '+' : ''}${Math.round((part.speedMultiplier - 1) * 100)}% speed`);
    }
  } else {
    const footprint = gameData.footprints[getComponentId(part.name)];
    if (footprint) details.push(`${footprint.width}×${footprint.height}`);
    if (part.quantityRange) details.push(`${part.quantityRange[0] / 1000}k–${part.quantityRange[1] / 1000}k bees`);
    else if (part.quantity) details.push(`${part.quantity.toLocaleString()} robots`);
    if (part.power) details.push(`${part.power > 0 ? '+' : ''}${part.power}W`);
  }
  const strong = document.createElement('strong');
  strong.textContent = part.name;
  const detailSpan = document.createElement('span');
  detailSpan.textContent = details.join(' · ');
  info.append(strong, detailSpan);
  const quip = COMPONENT_QUIPS[part.name];
  if (quip) {
    const em = document.createElement('em');
    em.className = 'component-quip';
    em.textContent = quip;
    info.appendChild(em);
  }
  const blocked = document.createElement('span');
  blocked.className = 'component-blocked-reason';
  info.appendChild(blocked);

  card.append(img, info);

  if (kind === 'counter') {
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
    [minusBtn, plusBtn].forEach((btn) => btn.addEventListener('pointerdown', (e) => e.stopPropagation()));
    minusBtn.addEventListener('click', (e) => { e.stopPropagation(); changePollinatorQuantity(part.name, -1); });
    plusBtn.addEventListener('click', (e) => { e.stopPropagation(); changePollinatorQuantity(part.name, 1); });
    counter.append(minusBtn, qtyLabel, plusBtn);
    card.appendChild(counter);
  } else {
    const tick = document.createElement('span');
    tick.className = 'card-tick';
    tick.setAttribute('aria-hidden', 'true');
    card.appendChild(tick);
  }

  card.addEventListener('click', () => {
    if (dragState.suppressClick) return;
    activateCard(category, part.name);
  });
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activateCard(category, part.name);
    } else if (category === 'pollinator' && (event.key === '-' || event.key === 'Backspace' || event.key === 'Delete')) {
      event.preventDefault();
      changePollinatorQuantity(part.name, -1);
    }
  });
  if (category !== 'vehicle') {
    card.addEventListener('pointerdown', (event) => beginPointerDrag(event, {
      category,
      name: part.name,
      source: 'card',
      el: card
    }));
  }
  return card;
}

function cloneSelection(selection = gameData.selectedComponents) {
  return {
    control: selection.control,
    engine: selection.engine,
    pollinator: selection.pollinator.map((item) => ({ ...item })),
    other: selection.other.map((item) => ({ ...item }))
  };
}

function setPollinatorQuantity(proposal, name, quantity) {
  const catalogItem = findCatalogItem('pollinator', name);
  if (!catalogItem) return;
  const qty = Math.max(0, Math.min(10, quantity));
  proposal.pollinator = proposal.pollinator.filter((item) => item.name !== name);
  if (qty > 0) {
    proposal.pollinator.push({
      ...catalogItem,
      quantity: qty,
      cost: catalogItem.cost * qty,
      power: (catalogItem.power || 0) * qty
    });
    // Keep catalogue order so the layout is stable.
    const order = (gameData.catalog.pollinator || []).map((item) => item.name);
    proposal.pollinator.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
  }
}

function getPollinatorQuantity(name, selection = gameData.selectedComponents) {
  return selection.pollinator.find((item) => item.name === name)?.quantity || 0;
}

function activateCard(category, name) {
  if (category === 'vehicle') {
    const spec = findCatalogItem('vehicle', name);
    if (spec) changeVehicle(spec.id);
    return;
  }
  if (category === 'pollinator') {
    changePollinatorQuantity(name, 1);
    return;
  }
  const item = findCatalogItem(category, name);
  if (!item) return;
  const proposal = cloneSelection();
  let message;
  if (category === 'control' || category === 'engine') {
    if (proposal[category]?.name === name) {
      proposal[category] = null;
      message = `${name} removed from the transporter.`;
    } else {
      const replaced = proposal[category]?.name;
      proposal[category] = item;
      message = replaced ? `${replaced} swapped for ${name}.` : `${name} fitted.`;
    }
  } else if (category === 'other') {
    if (proposal.other.some((part) => part.name === name)) {
      proposal.other = proposal.other.filter((part) => part.name !== name);
      message = `${name} removed from the transporter.`;
    } else {
      proposal.other.push({ ...item });
      message = `${name} added.`;
    }
  }
  applyProposal(proposal, { message, card: findCard(category, name) });
}

function changePollinatorQuantity(name, delta) {
  const current = getPollinatorQuantity(name);
  const next = current + delta;
  const card = findCard('pollinator', name);
  if (next < 0) return false;
  if (next > 10) {
    builderFeedback.textContent = `You can carry at most 10 ${name} units.`;
    flashCardRejected(card);
    return false;
  }
  const proposal = cloneSelection();
  setPollinatorQuantity(proposal, name, next);
  return applyProposal(proposal, {
    message: delta > 0 ? `${name} added (${next} on board).` : `${name} removed (${next} on board).`,
    card
  });
}

function applyProposal(proposal, {
  preferred = null,
  vehicleId = gameData.selectedVehicle,
  message = '',
  card = null
} = {}) {
  const validation = validateBuild(proposal, vehicleId, preferred);
  if (!validation.valid) {
    builderFeedback.textContent = validation.message;
    builderFeedback.classList.add('is-error');
    flashCardRejected(card);
    renderCardStates();
    return false;
  }
  commitBuild(proposal, validation, vehicleId);
  builderFeedback.classList.remove('is-error');
  const hasRobots = proposal.pollinator.some((item) => ROBOT_POLLINATORS.has(item.name));
  const hasRobotControl = proposal.other.some((item) => item.name === 'Robo-Pollinator Control');
  builderFeedback.textContent = hasRobots && !hasRobotControl
    ? `${message} Robot pollinators need Robo-Pollinator Control to work.`.trim()
    : message;
  renderCardStates();
  if (typeof updateWizardHint === 'function') updateWizardHint();
  return true;
}

function flashCardRejected(card) {
  if (!card) return;
  card.classList.remove('is-rejected');
  void card.offsetWidth;
  card.classList.add('is-rejected');
  setTimeout(() => card.classList.remove('is-rejected'), 600);
}

function isCardSelected(category, name) {
  const s = gameData.selectedComponents;
  if (category === 'vehicle') return findCatalogItem('vehicle', name)?.id === gameData.selectedVehicle;
  if (category === 'control' || category === 'engine') return s[category]?.name === name;
  if (category === 'pollinator') return getPollinatorQuantity(name) > 0;
  if (category === 'other') return s.other.some((item) => item.name === name);
  return false;
}

/** Quick (no layout search) check of why adding this card would fail. */
function getBlockedReason(category, name) {
  if (category === 'vehicle' || isCardSelected(category, name) && category !== 'pollinator') return '';
  const item = findCatalogItem(category, name);
  if (!item) return '';
  const vehicle = gameData.vehicles[gameData.selectedVehicle];
  const s = gameData.selectedComponents;
  const replaced = (category === 'control' || category === 'engine') ? s[category] : null;
  const extraCost = item.cost - (replaced?.cost || 0);
  if (extraCost > gameData.budget - getTotalCost(s)) return 'Not enough budget';
  const footprint = gameData.footprints[getComponentId(name)];
  const used = gameData.placement.reduce((sum, part) => sum + part.width * part.height, 0);
  const freed = replaced ? (gameData.footprints[getComponentId(replaced.name)]?.area || 0) : 0;
  if (footprint && footprint.width * footprint.height > vehicle.columns * vehicle.rows - used + freed) {
    return 'No room in this truck';
  }
  if (category === 'pollinator' && getPollinatorQuantity(name) >= 10) return 'Maximum 10';
  return '';
}

function renderCardStates() {
  document.querySelectorAll('.component-card').forEach((card) => {
    const { category, name } = card.dataset;
    const selected = isCardSelected(category, name);
    card.classList.toggle('is-selected', selected);
    card.setAttribute('aria-pressed', String(selected));
    const qty = card.querySelector('.qty-label');
    if (qty) qty.textContent = String(getPollinatorQuantity(name));
    const reason = getBlockedReason(category, name);
    card.classList.toggle('is-blocked', Boolean(reason));
    const reasonEl = card.querySelector('.component-blocked-reason');
    if (reasonEl) reasonEl.textContent = reason;
  });
  vehicleChoice.value = gameData.selectedVehicle;
}

function getVehicleCost(vehicleId = gameData.selectedVehicle) {
  return gameData.vehicles[vehicleId]?.cost || 0;
}

function getTotalCost(components, vehicleId = gameData.selectedVehicle) {
  return getVehicleCost(vehicleId) + [
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
  const previousPositions = new Map(
    vehicleId === gameData.selectedVehicle
      ? gameData.placement.map((item) => [item.instanceId, { col: item.col, row: item.row }])
      : []
  );
  // Parts already on the truck are placed first (in their old spots), new ones after.
  instances.sort((a, b) => Number(previousPositions.has(b.instanceId)) - Number(previousPositions.has(a.instanceId)));
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
    // Try the part's current spot first so the player's layout stays put.
    const candidates = [];
    const previous = previousPositions.get(item.instanceId);
    if (previous) candidates.push(previous);
    for (let row = 0; row <= vehicle.rows - item.height; row += 1) {
      for (let col = 0; col <= vehicle.columns - item.width; col += 1) {
        candidates.push({ col, row });
      }
    }
    for (const { col, row } of candidates) {
      if (col < 0 || row < 0 || col + item.width > vehicle.columns || row + item.height > vehicle.rows) continue;
      {
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
  const totalCost = getTotalCost(components, vehicleId);
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

function placementHasOverlap(placement, vehicleId) {
  const vehicle = gameData.vehicles[vehicleId];
  const seen = new Set();
  return placement.some((item) => {
    if (item.col < 0 || item.row < 0 ||
      item.col + item.width > vehicle.columns ||
      item.row + item.height > vehicle.rows) return true;
    for (let y = item.row; y < item.row + item.height; y += 1) {
      for (let x = item.col; x < item.col + item.width; x += 1) {
        const key = `${x},${y}`;
        if (seen.has(key)) return true;
        seen.add(key);
      }
    }
    return false;
  });
}

function commitBuild(components, validation, vehicleId = gameData.selectedVehicle) {
  let placement = validation.placement;
  // Belt and braces: never draw two parts in the same cell.
  if (placementHasOverlap(placement, vehicleId)) {
    placement = calculatePlacement(components, vehicleId).placement || [];
  }
  gameData.selectedComponents = components;
  gameData.selectedVehicle = vehicleId;
  gameData.placement = placement;
  vehicleChoice.value = vehicleId;
  builderFeedback.textContent = '';
  updateStats();
}

// Kept for callers elsewhere in the file: cards are always redrawn from state.
function syncSelectionControls() {
  renderCardStates();
}

function removePlacedComponent(component) {
  const proposal = cloneSelection();
  if (component.category === 'control') {
    proposal.control = null;
  } else if (component.category === 'engine') {
    proposal.engine = null;
  } else if (component.category === 'pollinator') {
    setPollinatorQuantity(proposal, component.name, getPollinatorQuantity(component.name) - 1);
  } else if (component.category === 'other') {
    proposal.other = proposal.other.filter((item) => item.name !== component.name);
  }
  applyProposal(proposal, { message: `${component.name} removed from the transporter.` });
}

function getDragProposal(draggedComponent) {
  const { category, name } = draggedComponent;
  const catalogItem = findCatalogItem(category, name);
  if (!catalogItem) return null;
  const proposal = cloneSelection();
  let instanceNumber = 1;

  if (category === 'control' || category === 'engine') {
    proposal[category] = catalogItem;
  } else if (category === 'pollinator') {
    const quantity = getPollinatorQuantity(name);
    if (quantity >= 10) return null;
    instanceNumber = quantity + 1;
    setPollinatorQuantity(proposal, name, quantity + 1);
  } else if (category === 'other') {
    if (!proposal.other.some((item) => item.name === name)) proposal.other.push({ ...catalogItem });
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

// ---------- Pointer drag & drop (mouse, pen and touch) ----------
const dragState = { suppressClick: false, ghost: null, source: null, overTruck: false };

function beginPointerDrag(event, info) {
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  if (event.target.closest('.qty-btn, .placed-component__remove')) return;
  if (builderScreen.classList.contains('hidden')) return;
  const pointerId = event.pointerId;
  const startX = event.clientX;
  const startY = event.clientY;
  let started = false;

  const onMove = (e) => {
    if (e.pointerId !== pointerId) return;
    if (!started) {
      if (Math.hypot(e.clientX - startX, e.clientY - startY) < 6) return;
      started = true;
      startDragVisual(info, e.clientX, e.clientY);
    }
    e.preventDefault();
    updateDrag(e.clientX, e.clientY);
  };
  const cleanup = () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onCancel);
  };
  const onUp = (e) => {
    if (e.pointerId !== pointerId) return;
    cleanup();
    if (!started) return;
    dragState.suppressClick = true;
    setTimeout(() => { dragState.suppressClick = false; }, 0);
    finishDrag(e.clientX, e.clientY);
  };
  const onCancel = (e) => {
    if (e.pointerId !== pointerId) return;
    cleanup();
    if (started) endDragVisual();
  };
  window.addEventListener('pointermove', onMove, { passive: false });
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onCancel);
}

function getRigCellSizePx() {
  const art = transporterGrid.querySelector('.truck-rig');
  const vehicle = gameData.vehicles[gameData.selectedVehicle];
  if (!art || !vehicle) return 40;
  return art.getBoundingClientRect().width * vehicle.cellSize / vehicle.width;
}

function startDragVisual(info, x, y) {
  const isMove = info.source === 'placed';
  gameData.activeDrag = {
    action: isMove ? 'move' : 'add',
    category: info.category,
    name: info.name,
    componentId: getComponentId(info.name),
    instanceId: info.instanceId
  };
  dragState.source = info.el;
  info.el?.classList.add('is-dragging');
  transporterGrid.querySelector('.truck-rig')?.classList.add('is-interacting');
  document.body.classList.add('is-dragging-part');

  const footprint = gameData.footprints[getComponentId(info.name)] || { width: 1, height: 1 };
  const cell = getRigCellSizePx();
  const ghost = document.createElement('div');
  ghost.className = 'drag-ghost';
  ghost.style.width = `${footprint.width * cell}px`;
  ghost.style.height = `${footprint.height * cell}px`;
  const img = document.createElement('img');
  img.src = getComponentImage(info.name);
  img.alt = '';
  ghost.appendChild(img);
  document.body.appendChild(ghost);
  dragState.ghost = ghost;
  updateDrag(x, y);
}

function updateDrag(x, y) {
  const ghost = dragState.ghost;
  if (ghost) {
    ghost.style.left = `${x}px`;
    ghost.style.top = `${y}px`;
  }
  const dragged = gameData.activeDrag;
  if (!dragged) return;
  const cell = getDropCell(x, y, dragged.name);
  dragState.overTruck = Boolean(cell);
  ghost?.classList.toggle('is-over-truck', Boolean(cell));
  if (cell) {
    updatePlacementPreview(cell.col, cell.row);
  } else {
    transporterGrid.querySelector('.placement-preview')?.remove();
    transporterGrid.classList.remove('is-drop-target');
    builderFeedback.classList.remove('is-error');
    builderFeedback.textContent = dragged.action === 'move'
      ? `Let go here to take ${dragged.name} off the transporter.`
      : `Drag ${dragged.name} onto the transporter.`;
  }
}

/** Grid cell for the top-left of the dragged part, centred under the pointer. */
function getDropCell(clientX, clientY, name) {
  const art = transporterGrid.querySelector('.truck-rig');
  const vehicle = gameData.vehicles[gameData.selectedVehicle];
  if (!art || !vehicle) return null;
  const bounds = art.getBoundingClientRect();
  const margin = 24;
  if (clientX < bounds.left - margin || clientX > bounds.right + margin ||
    clientY < bounds.top - margin || clientY > bounds.bottom + margin) return null;
  const footprint = gameData.footprints[getComponentId(name)] || { width: 1, height: 1 };
  const sourceX = ((clientX - bounds.left) / bounds.width) * vehicle.width;
  const sourceY = ((clientY - bounds.top) / bounds.height) * vehicle.height;
  const col = Math.round((sourceX - vehicle.gridX) / vehicle.cellSize - footprint.width / 2);
  const row = Math.round((sourceY - vehicle.gridY) / vehicle.cellSize - footprint.height / 2);
  return {
    col: Math.max(0, Math.min(vehicle.columns - footprint.width, col)),
    row: Math.max(0, Math.min(vehicle.rows - footprint.height, row))
  };
}

function getDropValidation(dragged, col, row) {
  const drop = dragged.action === 'move'
    ? {
      proposal: gameData.selectedComponents,
      preferredPlacement: { componentId: dragged.componentId, instanceId: dragged.instanceId }
    }
    : getDragProposal(dragged);
  if (!drop) {
    return { drop, validation: { valid: false, message: `You can carry at most 10 ${dragged.name} units.` } };
  }
  return {
    drop,
    validation: validateBuild(drop.proposal, gameData.selectedVehicle, { ...drop.preferredPlacement, col, row })
  };
}

function updatePlacementPreview(col, row) {
  const art = transporterGrid.querySelector('.truck-rig');
  const vehicle = gameData.vehicles[gameData.selectedVehicle];
  const dragged = gameData.activeDrag;
  if (!art || !vehicle || !dragged) return;
  const footprint = getFootprint(dragged.name);
  const { validation } = getDropValidation(dragged, col, row);

  let preview = art.querySelector('.placement-preview');
  if (!preview) {
    preview = document.createElement('div');
    preview.className = 'placed-component placement-preview';
    art.querySelector('.truck-rig__cargo').appendChild(preview);
  }
  preview.style.left = `${((vehicle.gridX + col * vehicle.cellSize) / vehicle.width) * 100}%`;
  preview.style.top = `${((vehicle.gridY + row * vehicle.cellSize) / vehicle.height) * 100}%`;
  preview.style.width = `${(footprint.width * vehicle.cellSize / vehicle.width) * 100}%`;
  preview.style.height = `${(footprint.height * vehicle.cellSize / vehicle.height) * 100}%`;
  preview.classList.toggle('is-valid', validation.valid);
  preview.classList.toggle('is-invalid', !validation.valid);
  transporterGrid.classList.add('is-drop-target');
  builderFeedback.classList.toggle('is-error', !validation.valid);
  builderFeedback.textContent = validation.valid
    ? `Drop ${dragged.name} here — other parts will shuffle to make room.`
    : validation.message;
}

function finishDrag(x, y) {
  const dragged = gameData.activeDrag;
  endDragVisual();
  if (!dragged) return;
  const cell = getDropCell(x, y, dragged.name);
  if (!cell) {
    if (dragged.action === 'move') removePlacedComponent(dragged);
    else builderFeedback.textContent = '';
    return;
  }
  const { drop, validation } = getDropValidation(dragged, cell.col, cell.row);
  if (!drop || !validation.valid) {
    builderFeedback.classList.add('is-error');
    builderFeedback.textContent = validation.message;
    flashCardRejected(findCard(dragged.category, dragged.name));
    return;
  }
  applyProposal(drop.proposal, {
    preferred: { ...drop.preferredPlacement, ...cell },
    message: dragged.action === 'move'
      ? `${dragged.name} moved.`
      : `${dragged.name} loaded onto the transporter.`
  });
}

function endDragVisual() {
  dragState.ghost?.remove();
  dragState.ghost = null;
  dragState.source?.classList.remove('is-dragging');
  dragState.source = null;
  gameData.activeDrag = null;
  document.body.classList.remove('is-dragging-part');
  transporterGrid.classList.remove('is-drop-target');
  transporterGrid.querySelector('.placement-preview')?.remove();
  transporterGrid.querySelector('.truck-rig')?.classList.remove('is-interacting');
}

function changeVehicle(requestedVehicle = vehicleChoice.value) {
  if (!gameData.vehicles[requestedVehicle]) return;
  if (requestedVehicle === gameData.selectedVehicle) {
    renderCardStates();
    return;
  }
  const label = gameData.vehicles[requestedVehicle].label || `${requestedVehicle} transporter`;
  const ok = applyProposal(cloneSelection(), {
    vehicleId: requestedVehicle,
    message: `Switched to the ${label}.`,
    card: document.querySelector(`.component-card[data-vehicle-id="${requestedVehicle}"]`)
  });
  if (!ok) {
    builderFeedback.textContent = `${builderFeedback.textContent} Remove some parts before switching to the ${label}.`;
  }
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
    'Tap a card to load it, or drag it onto the truck where you want it. Drag a part off the truck (or tap its ×) to remove it.';
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
    component.draggable = false;
    if (interactive) {
      component.addEventListener('pointerdown', (event) => beginPointerDrag(event, {
        category: item.category,
        name: item.name,
        instanceId: item.instanceId,
        source: 'placed',
        el: component
      }));
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'placed-component__remove';
      remove.setAttribute('aria-label', `Remove ${item.name}`);
      remove.textContent = '×';
      remove.addEventListener('pointerdown', (event) => event.stopPropagation());
      remove.addEventListener('click', (event) => {
        event.stopPropagation();
        removePlacedComponent(item);
      });
      component.appendChild(remove);
    }
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

// ---------- Journey truck movement ----------
// The truck (plus its crew badges) lives in a "mover" that game.js positions:
// parked on arrival, then driving steadily left → right through each travel
// slice and off the right edge, before driving into the next scene.
const TRUCK_PARK_LEFT = 9;
const TRUCK_EXIT_LEFT = 104;
const TRAVEL_SLICE_MS = 1100;
const TRUCK_DRIVE_IN_MS = 1800;
const MAX_TRAVEL_EVENTS_PER_SEGMENT = 2;

function renderJourneyTransporter() {
  const mover = document.createElement('div');
  mover.className = 'journey-truck-mover';
  mover.id = 'journey-truck-mover';
  const badges = document.getElementById('truck-pollinator-badges');
  if (badges) mover.appendChild(badges);
  mover.appendChild(createVehicleRig(gameData.selectedVehicle, { journey: true }));
  journeyTruckTrack.replaceChildren(mover);
  setTruckLeft(TRUCK_PARK_LEFT, 0);
  updateTransporterAppearance();
}

function setTruckLeft(pct, durationMs = 0) {
  const mover = document.getElementById('journey-truck-mover');
  if (!mover) return;
  mover.style.transitionDuration = `${gameData.reducedMotion ? 0 : durationMs}ms`;
  mover.style.left = `${pct}%`;
}

/** Stop the truck exactly where it is (events, repairs). */
function freezeTruck() {
  const mover = document.getElementById('journey-truck-mover');
  if (!mover) return;
  const track = journeyTruckTrack.getBoundingClientRect();
  if (!track.width) return;
  const current = (mover.getBoundingClientRect().left - track.left) / track.width * 100;
  setTruckLeft(current, 0);
}

function truckDriveIn() {
  const mover = document.getElementById('journey-truck-mover');
  if (!mover) return;
  const track = journeyTruckTrack.getBoundingClientRect();
  const widthPct = track.width ? mover.getBoundingClientRect().width / track.width * 100 : 70;
  setTruckLeft(-widthPct - 4, 0);
  void mover.offsetWidth;
  setTruckLeft(TRUCK_PARK_LEFT, TRUCK_DRIVE_IN_MS);
}

function truckLeftForSlice(sliceIndex) {
  const progress = Math.max(0, Math.min(1, sliceIndex / SIMULATION_RULES.travelSlicesPerSegment));
  return TRUCK_PARK_LEFT + (TRUCK_EXIT_LEFT - TRUCK_PARK_LEFT) * progress;
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
  const routeResponse = await fetch('data/enriched_pollination_route.json', { cache: 'no-cache' });
  const eventsResponse = await fetch('data/events.json', { cache: 'no-cache' });
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
  gameData.pollenRushPlayed = new Set();
  gameData.pollenRushResults = [];
  gameData.pollenRushSkipAll = false;
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
    gameData.currentPhase = 'pollen-rush';
  }
  if (gameData.currentPhase === 'pollen-rush') {
    const stop = gameData.route[gameData.routeIndex];
    const index = gameData.routeIndex;
    if ((stop.stopDurationDays || 0) > 0 && !gameData.pollenRushPlayed.has(index)) {
      gameData.pollenRushPlayed.add(index);
      offerPollenRush(stop, index).then(() => {
        if (!gameData.missionFailed) scheduleJourney(200);
      });
      return;
    }
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
  setTruckLeft(truckLeftForSlice(gameData.segmentSliceIndex), TRAVEL_SLICE_MS);

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

  const isOpportunity = gameData.scheduledEventSlices.includes(gameData.segmentSliceIndex - 1) &&
    gameData.segmentEventIds.size < MAX_TRAVEL_EVENTS_PER_SEGMENT;
  if (isOpportunity && tryTriggerPhaseEvent('travel', destination, origin)) return;
  scheduleJourney(TRAVEL_SLICE_MS / JOURNEY_PACE);
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
  truckDriveIn();
  scheduleJourney((TRUCK_DRIVE_IN_MS + 600) / JOURNEY_PACE);
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
  freezeTruck();
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
  // The truck picks up where it stopped and keeps driving across the scene.
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

// ---------- Pollen Rush (optional, once per pollination site) ----------
function offerPollenRush(stop, index) {
  if (gameData.pollenRushSkipAll || !window.Minigames) {
    gameData.pollenRushResults.push({ index, region: stop.region, played: false, bonusPct: 0 });
    return Promise.resolve();
  }
  const overlay = document.getElementById('pollen-rush-overlay');
  const container = document.getElementById('pollen-rush-container');
  const playBtn = document.getElementById('pollen-rush-play');
  const skipBtn = document.getElementById('pollen-rush-skip');
  const skipAll = document.getElementById('pollen-rush-skip-all');
  const resultEl = document.getElementById('pollen-rush-result');
  document.getElementById('pollen-rush-site').textContent = stop.region;
  document.getElementById('pollen-rush-max').textContent = String(POLLEN_RUSH_MAX_BONUS_PCT);
  container.replaceChildren();
  resultEl.classList.add('hidden');
  resultEl.replaceChildren();
  playBtn.classList.remove('hidden');
  skipBtn.classList.remove('hidden');
  skipBtn.textContent = 'Skip';
  skipAll.checked = false;
  skipAll.parentElement.classList.remove('hidden');
  overlay.classList.remove('hidden');
  locationStage.classList.add('is-paused');
  freezeTruck();
  playBtn.focus();

  return new Promise((resolve) => {
    let state = 'offer';
    const close = (bonusPct, played) => {
      playBtn.onclick = null;
      skipBtn.onclick = null;
      window.Minigames.runPollenRush.current?.destroy();
      container.replaceChildren();
      overlay.classList.add('hidden');
      if (!gameData.currentEvent && repairPanel.classList.contains('hidden')) {
        locationStage.classList.remove('is-paused');
      }
      gameData.pollenRushResults.push({ index, region: stop.region, played, bonusPct });
      resolve();
    };
    const applyResult = (result) => {
      const performance = Math.max(0, Math.min(1, Number(result.performanceIndex) || 0));
      const bonusPct = result.played ? Math.round(performance * POLLEN_RUSH_MAX_BONUS_PCT * 10) / 10 : 0;
      if (bonusPct > 0) {
        gameData.siteOutputMultipliers[index] *= 1 + bonusPct / 100;
        addLogEntry(`Pollen Rush at ${stop.region}: ${result.bankedScore} points banked — pollination boosted by ${bonusPct}%.`);
        refreshJourneyStatus();
        animatePollenEvent(bonusPct);
      } else if (result.played) {
        addLogEntry(`Pollen Rush at ${stop.region}: no points banked, so no bonus this time.`);
      }
      return bonusPct;
    };

    skipBtn.onclick = () => {
      if (skipAll.checked) gameData.pollenRushSkipAll = true;
      if (state === 'playing') {
        window.Minigames.runPollenRush.current?.skip();
        return;
      }
      if (state === 'done') return;
      addLogEntry(`Pollen Rush skipped at ${stop.region}.`);
      close(0, false);
    };

    playBtn.onclick = () => {
      state = 'playing';
      playBtn.classList.add('hidden');
      skipAll.parentElement.classList.add('hidden');
      skipBtn.textContent = 'Stop and skip bonus';
      window.Minigames.runPollenRush({
        container,
        siteId: `site_${index}`
      }).then((result) => {
        state = 'done';
        const bonusPct = applyResult(result);
        if (!result.played) {
          close(0, false);
          return;
        }
        resultEl.replaceChildren();
        const msg = document.createElement('p');
        msg.innerHTML = bonusPct > 0
          ? `<strong>${result.bankedScore.toLocaleString()} points banked!</strong> Pollination at ${stop.region} boosted by <strong>+${bonusPct}%</strong>.`
          : '<strong>No points banked</strong> — remember to return pollen to the hive before time runs out.';
        const cont = document.createElement('button');
        cont.type = 'button';
        cont.textContent = 'Continue journey ▶';
        cont.onclick = () => close(bonusPct, true);
        resultEl.append(msg, cont);
        resultEl.classList.remove('hidden');
        skipBtn.classList.add('hidden');
        cont.focus();
      }).catch((error) => {
        console.error('Pollen Rush failed', error);
        close(0, false);
      });
    };
  });
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
  if (hasSelectedComponent(name)) return;
  const item = findCatalogItem('other', name);
  if (!item) return;
  const proposal = cloneSelection();
  proposal.other.push({ ...item });
  applyProposal(proposal, { message: `${name} added.` });
}

function removeOtherByName(name) {
  if (!hasSelectedComponent(name)) return;
  const proposal = cloneSelection();
  proposal.other = proposal.other.filter((item) => item.name !== name);
  applyProposal(proposal, { message: `${name} removed.` });
}

function removeRobotPollinators() {
  const proposal = cloneSelection();
  proposal.pollinator = proposal.pollinator.filter((item) => !ROBOT_POLLINATORS.has(item.name));
  applyProposal(proposal, { message: 'Robot crew removed.' });
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
  { key: 'vehicle',   label: 'Truck',      required: true,  hint: 'Choose your transporter size.' },
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
  if (builder.dataset.wizardBound) return;
  builder.dataset.wizardBound = 'true';
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
  [componentSelectionLeft, componentSelectionRight].forEach((sidebar) => {
    sidebar.hidden = !sidebar.querySelector('.component-group.is-active-step');
  });
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
  if (step.key === 'vehicle') return Boolean(gameData.vehicles[gameData.selectedVehicle]);
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
