const STORAGE_KEY = "pasanaku_demo_state_v2";
const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre"];

const STORY_MEMBERS = [
  { name: "Ana", trust: 99, goal: "Laptop nueva" },
  { name: "Maria", trust: 98, goal: "Ordenar cuentas del grupo" },
  { name: "Carlos", trust: 88, goal: "Viaje en vacaciones" },
  { name: "Diego", trust: 95, goal: "Ahorro disciplinado" },
  { name: "Lucia", trust: 92, goal: "Curso de ingles" },
  { name: "Pablo", trust: 90, goal: "Deuda familiar" },
  { name: "Fernanda", trust: 94, goal: "Mejorar negocio" },
  { name: "Jorge", trust: 89, goal: "Arreglar moto" },
  { name: "Sofia", trust: 93, goal: "Mudanza" },
  { name: "Ricardo", trust: 91, goal: "Fondo de emergencia" },
];

const DEFAULT_STATE = {
  user: {
    name: "Ana",
    fullName: "Ana Gutierrez",
    trustScore: 98,
    saved: 0,
    paid: 0,
    cycles: 0,
    notifications: true,
  },
  simulation: {
    month: 1,
    totalMonths: 10,
    contribution: 500,
    membersCount: 10,
    totalPot: 5000,
    orderType: "Sorteo",
    turnOrder: STORY_MEMBERS.map((member) => member.name),
    payouts: [{ month: 1, receiver: "Ana", note: "Compra su laptop sin intereses." }],
    latePayments: [{ month: 3, member: "Carlos", daysLate: 3, resolved: false }],
    feed: [
      "Los 10 amigos aportan 500 por mes durante 10 meses.",
      "Mes 1: Ana recibe 5,000 y compra su laptop.",
      "Mes 3: Carlos se atrasa y la app envia alerta y deja trazabilidad.",
    ],
  },
  circles: [
    { name: "Pasanaku UMSA", members: 10, frequency: "Aporte mensual de Bs 500", round: 1, totalRounds: 10, status: "Activo" },
  ],
  selectedCircle: {
    name: "Pasanaku UMSA",
    members: 10,
    started: "Marzo 2026",
    paymentType: "Aporte mensual",
    nextPayment: 500,
    currentCycle: 1,
    totalCycles: 10,
    poolTotal: 5000,
    orderType: "Sorteo",
  },
  payment: {
    recipient: "Maria",
    handle: "@maria_pasanaku",
    amount: 500,
    dueInDays: 2,
    circle: "Pasanaku UMSA",
    paid: false,
    method: "qr",
    receiptUploaded: false,
  },
  invites: ["Carlos", "Maria", "Diego"],
};

function getState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STATE));
    return structuredClone(DEFAULT_STATE);
  }

  try {
    return { ...structuredClone(DEFAULT_STATE), ...JSON.parse(raw) };
  } catch (error) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STATE));
    return structuredClone(DEFAULT_STATE);
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getCurrentReceiver(state) {
  const index = Math.max(0, Math.min(state.simulation.month - 1, state.simulation.turnOrder.length - 1));
  return state.simulation.turnOrder[index];
}

function getNextReceiver(state) {
  const index = Math.max(0, Math.min(state.simulation.month, state.simulation.turnOrder.length - 1));
  return state.simulation.turnOrder[index];
}

function refreshDerivedState(state) {
  const month = state.simulation.month;
  const receiver = getCurrentReceiver(state);
  const next = getNextReceiver(state);
  const lateCase = state.simulation.latePayments.find((entry) => entry.month === month && !entry.resolved);

  state.selectedCircle.currentCycle = month;
  state.selectedCircle.totalCycles = state.simulation.totalMonths;
  state.selectedCircle.nextPayment = state.simulation.contribution;
  state.selectedCircle.poolTotal = state.simulation.totalPot;
  state.selectedCircle.orderType = state.simulation.orderType;

  state.circles[0] = {
    name: state.selectedCircle.name,
    members: state.selectedCircle.members,
    frequency: `Aporte mensual de Bs ${state.simulation.contribution}`,
    round: month,
    totalRounds: state.simulation.totalMonths,
    status: lateCase ? "Con atraso" : "Activo",
  };

  state.payment.recipient = next || receiver;
  state.payment.handle = `@${state.payment.recipient.toLowerCase()}_pasanaku`;
  state.payment.amount = state.simulation.contribution;
  state.payment.circle = state.selectedCircle.name;
  state.payment.dueInDays = lateCase ? 0 : 2;
  state.payment.paid = false;
}

function money(value) {
  return new Intl.NumberFormat("es-BO", {
    style: "currency",
    currency: "BOB",
    minimumFractionDigits: 2,
  }).format(value);
}

function wireGlobalNavigation() {
  document.querySelectorAll("[data-nav]").forEach((item) => {
    item.style.cursor = "pointer";
    item.addEventListener("click", () => {
      const target = item.getAttribute("data-nav");
      if (target) window.location.href = target;
    });
  });

  const back = document.querySelector("[data-action='back']");
  if (back) {
    back.style.cursor = "pointer";
    back.addEventListener("click", () => {
      const target = back.getAttribute("data-target") || "panel-control.html";
      window.location.href = target;
    });
  }
}

function initPanel(state) {
  const trustScore = document.getElementById("trust-score");
  const pendingRecipient = document.getElementById("pending-recipient");
  const pendingDetails = document.getElementById("pending-details");
  const pendingAmount = document.getElementById("pending-amount");
  const payNow = document.getElementById("pay-now-btn");
  const createCircle = document.getElementById("create-circle-btn");
  const statSaved = document.getElementById("stat-saved");
  const statPaid = document.getElementById("stat-paid");
  const statCycles = document.getElementById("stat-cycles");
  const welcomeUser = document.getElementById("welcome-user");
  const simulationStatus = document.getElementById("simulation-status");
  const simulationLog = document.getElementById("simulation-log");
  const advanceMonthBtn = document.getElementById("advance-month-btn");
  const resetDemoBtn = document.getElementById("reset-demo-btn");
  const activeCirclesList = document.getElementById("active-circles-list");

  refreshDerivedState(state);
  if (trustScore) trustScore.textContent = String(state.user.trustScore);
  if (welcomeUser) welcomeUser.textContent = `Bienvenido de nuevo, ${state.user.name}`;
  if (statSaved) statSaved.textContent = money(state.user.saved);
  if (statPaid) statPaid.textContent = money(state.user.paid);
  if (statCycles) statCycles.textContent = String(state.simulation.month);

  const currentLate = state.simulation.latePayments.find((entry) => entry.month === state.simulation.month && !entry.resolved);
  if (simulationStatus) {
    simulationStatus.textContent = `Mes ${state.simulation.month} de ${state.simulation.totalMonths} • Pozo ${money(state.simulation.totalPot)} • ${currentLate ? `Atraso de ${currentLate.member}` : "Sin atrasos"}`;
  }
  if (simulationLog) {
    simulationLog.textContent = state.simulation.feed[state.simulation.feed.length - 1];
  }

  if (pendingRecipient) pendingRecipient.textContent = `Aporta ${money(state.payment.amount)} al ${state.selectedCircle.name}`;
  if (pendingDetails) {
    pendingDetails.textContent = currentLate
      ? `${currentLate.member} tiene ${currentLate.daysLate} dias de atraso • alerta activa`
      : `Turno del mes: ${getCurrentReceiver(state)} • siguiente: ${getNextReceiver(state)}`;
  }
  if (pendingAmount) pendingAmount.textContent = money(state.payment.amount);
  if (payNow) payNow.textContent = "Registrar aporte";

  if (payNow) {
    payNow.addEventListener("click", () => {
      window.location.href = "realizar-pago.html";
    });
  }

  if (createCircle) {
    createCircle.addEventListener("click", () => {
      window.location.href = "crear-circulo.html";
    });
  }

  if (advanceMonthBtn) {
    advanceMonthBtn.addEventListener("click", () => {
      if (state.simulation.month >= state.simulation.totalMonths) {
        alert("La simulacion ya termino. Reinicia la demo para volver a empezar.");
        return;
      }
      state.user.saved += state.simulation.contribution;
      state.user.paid += state.simulation.contribution;
      state.user.cycles += 1;
      state.simulation.month += 1;
      const receiver = getCurrentReceiver(state);
      state.simulation.payouts.push({ month: state.simulation.month, receiver, note: `${receiver} recibe el pozo del mes ${state.simulation.month}.` });
      state.simulation.feed.push(`Mes ${state.simulation.month}: ${receiver} recibe ${money(state.simulation.totalPot)}.`);
      refreshDerivedState(state);
      saveState(state);
      window.location.reload();
    });
  }

  if (resetDemoBtn) {
    resetDemoBtn.addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    });
  }

  if (activeCirclesList) {
    activeCirclesList.innerHTML = "";
    state.circles.forEach((circle) => {
      const progress = Math.round((circle.round / circle.totalRounds) * 100);
      const card = document.createElement("div");
      card.className = "bg-white border rounded-2xl p-5 shadow-sm";
      card.innerHTML = `
        <div class="flex justify-between items-start mb-4">
          <div class="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
            <i class="fas fa-users"></i>
          </div>
          <span class="text-[9px] font-bold ${circle.status === "Con atraso" ? "text-red-600 bg-red-50" : "text-blue-500 bg-blue-50"} px-2 py-1 rounded-md uppercase">${circle.status}</span>
        </div>
        <h3 class="font-bold text-slate-700">${circle.name}</h3>
        <p class="text-[10px] text-slate-400 mb-6">${circle.frequency} • ${circle.members} miembros</p>
        <div class="space-y-2">
          <div class="flex justify-between text-[9px] font-bold uppercase">
            <span class="text-slate-400">Ronda ${circle.round} de ${circle.totalRounds}</span>
            <span class="text-emerald-600">${progress}% completado</span>
          </div>
          <div class="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div class="bg-emerald-600 h-full" style="width:${progress}%"></div>
          </div>
        </div>
      `;
      activeCirclesList.appendChild(card);
    });
  }
}

function initCreateCircle(state) {
  const nameInput = document.getElementById("circle-name-input");
  const monthlyInput = document.getElementById("monthly-input");
  const durationInput = document.getElementById("duration-input");
  const launchBtn = document.getElementById("launch-circle-btn");
  const inviteButtons = document.querySelectorAll("[data-invite]");
  const randomBtn = document.getElementById("order-random-btn");
  const manualBtn = document.getElementById("order-manual-btn");
  const searchInput = document.getElementById("friend-search-input");
  let orderType = "Aleatorio";

  inviteButtons.forEach((button) => {
    const friend = button.getAttribute("data-invite");
    button.addEventListener("click", () => {
      if (!friend) return;
      const list = new Set(state.invites);
      if (list.has(friend)) {
        list.delete(friend);
        button.classList.remove("bg-emerald-700", "text-white");
        button.classList.add("border", "border-emerald-500", "text-emerald-500");
        button.innerHTML = '<i class="fas fa-plus text-xs"></i>';
      } else {
        list.add(friend);
        button.classList.remove("border", "border-emerald-500", "text-emerald-500");
        button.classList.add("bg-emerald-700", "text-white");
        button.innerHTML = '<i class="fas fa-check text-xs"></i>';
      }
      state.invites = [...list];
      saveState(state);
    });
  });

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const term = searchInput.value.trim().toLowerCase();
      document.querySelectorAll("[data-friend-name]").forEach((row) => {
        const friendName = row.getAttribute("data-friend-name")?.toLowerCase() || "";
        row.style.display = friendName.includes(term) ? "flex" : "none";
      });
    });
  }

  if (randomBtn && manualBtn) {
    randomBtn.addEventListener("click", () => {
      orderType = "Aleatorio";
      randomBtn.className = "bg-white text-emerald-700 shadow-sm rounded-lg py-2 text-xs font-bold flex items-center justify-center gap-2";
      manualBtn.className = "text-slate-400 py-2 text-xs font-bold flex items-center justify-center gap-2";
    });
    manualBtn.addEventListener("click", () => {
      orderType = "Manual";
      manualBtn.className = "bg-white text-emerald-700 shadow-sm rounded-lg py-2 text-xs font-bold flex items-center justify-center gap-2";
      randomBtn.className = "text-slate-400 py-2 text-xs font-bold flex items-center justify-center gap-2";
    });
  }

  if (launchBtn) {
    launchBtn.addEventListener("click", () => {
      const name = nameInput?.value?.trim() || "Nuevo pasanaku";
      const monthly = Number(monthlyInput?.value || 0);
      const duration = Number(durationInput?.value || 0);

      if (!name || monthly <= 0 || duration <= 1) {
        alert("Completa nombre, aportacion y duracion validas.");
        return;
      }

      state.selectedCircle = {
        name,
        members: Math.max(state.invites.length + 1, 3),
        started: new Date().toLocaleDateString("es-BO", { month: "long", year: "numeric" }),
        paymentType: "Aporte mensual",
        nextPayment: monthly,
        currentCycle: 1,
        totalCycles: duration,
        poolTotal: monthly * duration,
        orderType,
      };

      state.circles.unshift({
        name,
        members: state.selectedCircle.members,
        frequency: "Rueda mensual",
        round: 1,
        totalRounds: duration,
        status: "Activo",
      });
      saveState(state);
      alert(`Circulo "${name}" creado con exito.`);
      window.location.href = "detalle-circulo.html";
    });
  }
}

function initCircleDetail(state) {
  const title = document.getElementById("circle-title");
  const meta = document.getElementById("circle-meta");
  const nextPayment = document.getElementById("next-payment-value");
  const currentCycle = document.getElementById("current-cycle-value");
  const pool = document.getElementById("pool-total-value");
  const filterBtn = document.getElementById("filter-status-btn");
  const turns = [...document.querySelectorAll("[data-turn-status]")];
  const turnOrderInfo = document.getElementById("turn-order-info");
  const simulateDelayBtn = document.getElementById("simulate-delay-btn");
  const participationRate = document.getElementById("participation-rate");
  let currentFilter = "all";
  refreshDerivedState(state);

  if (title) title.textContent = state.selectedCircle.name;
  if (meta) {
    meta.textContent = `Iniciado en ${state.selectedCircle.started} • ${state.selectedCircle.members} Miembros • ${state.selectedCircle.paymentType}`;
  }
  if (nextPayment) nextPayment.textContent = money(state.selectedCircle.nextPayment);
  if (currentCycle) currentCycle.textContent = `${state.selectedCircle.currentCycle} de ${state.selectedCircle.totalCycles}`;
  if (pool) pool.textContent = money(state.selectedCircle.poolTotal).replace(",00", "");
  if (turnOrderInfo) {
    turnOrderInfo.textContent = `Orden por ${state.selectedCircle.orderType.toLowerCase()}: ${state.simulation.turnOrder.join(" -> ")}`;
  }
  if (participationRate) {
    const participation = Math.max(0, 100 - state.simulation.latePayments.filter((entry) => !entry.resolved).length * 10);
    participationRate.textContent = `${participation}% Tasa de Participacion`;
  }

  const month = state.simulation.month;
  const current = getCurrentReceiver(state);
  const next = getNextReceiver(state);
  const late = state.simulation.latePayments.find((entry) => entry.month === month && !entry.resolved);

  const setText = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  };
  setText("turn-current-index", String(month));
  setText("turn-current-name", current);
  setText("turn-current-score", `Puntaje de Confianza: ${STORY_MEMBERS.find((member) => member.name === current)?.trust || 90}`);
  setText("turn-current-date", `Esperado: Fin de ${MONTH_NAMES[month - 1] || "mes"}`);
  setText("turn-next-index", String(Math.min(month + 1, state.simulation.totalMonths)));
  setText("turn-next-name", next || "Cierre de ciclo");
  setText("turn-next-score", `Puntaje de Confianza: ${STORY_MEMBERS.find((member) => member.name === next)?.trust || 90}`);
  setText("turn-next-date", `Programado: ${MONTH_NAMES[month] || "Cierre del ciclo"}`);

  const lateCard = document.getElementById("late-turn-card");
  if (late) {
    setText("turn-late-index", String(late.month));
    setText("turn-late-name", late.member);
    setText("turn-late-score", `Puntaje de Confianza: ${Math.max(50, (STORY_MEMBERS.find((member) => member.name === late.member)?.trust || 80) - 20)}`);
    setText("turn-late-date", `${late.daysLate} dias de retraso`);
    if (lateCard) lateCard.style.display = "flex";
  } else if (lateCard) {
    lateCard.style.display = "none";
  }

  if (filterBtn) {
    filterBtn.addEventListener("click", () => {
      currentFilter = currentFilter === "all" ? "pending" : currentFilter === "pending" ? "late" : "all";
      turns.forEach((card) => {
        const status = card.getAttribute("data-turn-status");
        const visible = currentFilter === "all" || status === currentFilter;
        card.style.display = visible ? "flex" : "none";
      });
      filterBtn.innerHTML = `<i class="fas fa-sliders-h mr-1"></i> Filtrar: ${currentFilter === "all" ? "Todos" : currentFilter === "pending" ? "Pendientes" : "Atrasados"}`;
    });
  }

  if (simulateDelayBtn) {
    simulateDelayBtn.addEventListener("click", () => {
      const alreadyLate = state.simulation.latePayments.some((entry) => entry.month === state.simulation.month && !entry.resolved);
      if (alreadyLate) {
        alert("El atraso de este mes ya esta simulado.");
        return;
      }
      state.simulation.latePayments.push({
        month: state.simulation.month,
        member: "Carlos",
        daysLate: 2,
        resolved: false,
      });
      state.simulation.feed.push(`Mes ${state.simulation.month}: Carlos se atraso y la app envio recordatorios automaticos.`);
      refreshDerivedState(state);
      saveState(state);
      window.location.reload();
    });
  }
}

function initPayment(state) {
  const recipient = document.getElementById("payment-recipient");
  const handle = document.getElementById("payment-handle");
  const amount = document.getElementById("agreed-amount");
  const scannerBtn = document.getElementById("scanner-btn");
  const methodButtons = document.querySelectorAll("[data-method]");
  const uploadArea = document.getElementById("receipt-upload-area");
  const confirmBtn = document.getElementById("confirm-payment-btn");
  const selectedMethod = document.getElementById("selected-method");

  refreshDerivedState(state);
  if (recipient) recipient.textContent = state.payment.recipient;
  if (handle) handle.textContent = state.payment.handle;
  if (amount) amount.textContent = money(state.payment.amount);
      if (selectedMethod) selectedMethod.textContent = `Metodo actual: ${state.payment.method.toUpperCase()}`;

  if (scannerBtn) {
    scannerBtn.addEventListener("click", () => {
      state.payment.method = "qr";
      saveState(state);
      if (selectedMethod) selectedMethod.textContent = "Metodo actual: QR";
      alert("Escaner abierto (demo). QR validado.");
    });
  }

  methodButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const method = button.getAttribute("data-method");
      if (!method) return;
      state.payment.method = method;
      saveState(state);
      if (selectedMethod) selectedMethod.textContent = `Metodo actual: ${method.toUpperCase()}`;
    });
  });

  if (uploadArea) {
    uploadArea.addEventListener("click", () => {
      state.payment.receiptUploaded = true;
      saveState(state);
      uploadArea.classList.add("border-emerald-400", "bg-emerald-50");
      const title = uploadArea.querySelector("p");
      if (title) title.textContent = "Comprobante cargado (demo)";
    });
  }

  if (confirmBtn) {
    confirmBtn.addEventListener("click", () => {
      if (state.payment.paid) {
        window.location.href = "panel-control.html";
        return;
      }
      if (state.payment.method !== "cash" && state.payment.method !== "card" && state.payment.method !== "qr") {
        alert("Selecciona un metodo de aporte.");
        return;
      }
      state.payment.paid = true;
      state.user.paid += state.payment.amount;
      state.user.saved += state.payment.amount;
      state.user.trustScore = Math.min(100, state.user.trustScore + 1);
      const currentLate = state.simulation.latePayments.find((entry) => entry.month === state.simulation.month && !entry.resolved);
      if (currentLate && currentLate.member === state.payment.recipient) {
        currentLate.resolved = true;
        state.simulation.feed.push(`Mes ${state.simulation.month}: ${currentLate.member} regularizo su aporte.`);
      }
      saveState(state);
      alert("Aporte confirmado y registrado en historial.");
      window.location.href = "panel-control.html";
    });
  }
}

function initProfile(state) {
  const name = document.getElementById("profile-name");
  const trust = document.getElementById("profile-trust-score");
  const edit = document.getElementById("edit-profile-btn");
  const share = document.getElementById("share-profile-btn");
  const addMethod = document.getElementById("add-method-btn");
  const settingRows = document.querySelectorAll("[data-setting]");

  if (name) name.textContent = state.user.fullName;
  if (trust) trust.textContent = String(state.user.trustScore);

  if (edit) {
    edit.addEventListener("click", () => {
      const newName = prompt("Nuevo nombre de perfil", state.user.fullName);
      if (!newName) return;
      state.user.fullName = newName.trim();
      saveState(state);
      if (name) name.textContent = state.user.fullName;
    });
  }

  if (share) {
    share.addEventListener("click", async () => {
      const text = `Perfil de confianza de ${state.user.fullName}: ${state.user.trustScore}/100`;
      try {
        await navigator.clipboard.writeText(text);
        alert("Perfil copiado al portapapeles.");
      } catch {
        alert(text);
      }
    });
  }

  if (addMethod) {
    addMethod.addEventListener("click", () => {
      alert("Metodo agregado (demo).");
    });
  }

  settingRows.forEach((row) => {
    row.addEventListener("click", () => {
      const setting = row.getAttribute("data-setting");
      if (setting === "notifications") {
        state.user.notifications = !state.user.notifications;
        saveState(state);
        alert(`Notificaciones ${state.user.notifications ? "activadas" : "desactivadas"}.`);
        return;
      }
      alert(`Abriendo "${setting}" (demo).`);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const state = getState();
  wireGlobalNavigation();
  const page = document.body.getAttribute("data-page");

  if (page === "panel") initPanel(state);
  if (page === "create") initCreateCircle(state);
  if (page === "detail") initCircleDetail(state);
  if (page === "payment") initPayment(state);
  if (page === "profile") initProfile(state);
});
