import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBm_vUcQXLXAVQeHVeFCxrgaIgEBXM-3pI",
  authDomain: "agenda-spa-sabado3.firebaseapp.com",
  projectId: "agenda-spa-sabado3",
  storageBucket: "agenda-spa-sabado3.firebasestorage.app",
  messagingSenderId: "438686436372",
  appId: "1:438686436372:web:0a3632991310bfedaeeb01",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const horarios = [
  "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30",
];
const maxTurnos = 6;
let horaActual = "";

// 🧠 Función para cargar los horarios
async function cargarHorarios() {
  const contenedor = document.getElementById("horarios");
  contenedor.innerHTML = `
    <div class="col-span-2 text-center text-gray-600 animate-pulse">
      Cargando horarios...
    </div>`;

  const snapshot = await getDocs(collection(db, "reservas"));
  const conteo = {};
  snapshot.forEach((doc) => {
    const hora = doc.data().hora;
    conteo[hora] = (conteo[hora] || 0) + 1;
  });

  contenedor.innerHTML = "";

  horarios.forEach((hora) => {
    const cantidad = conteo[hora] || 0;
    const disponible = cantidad < maxTurnos;

    contenedor.innerHTML += `
      <div class="bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow flex justify-between items-center animate-fade-in-up">
        <div>
          <p class="font-bold text-lg">${hora}</p>
          <p class="text-sm text-gray-600">
            ${maxTurnos - cantidad > 0
              ? `Tenemos ${maxTurnos - cantidad} turnos disponibles`
              : "Sin cupos 😢"}
          </p>
        </div>
        <button ${!disponible ? "disabled" : ""}
          onclick="abrirModal('${hora}')"
          class="px-4 py-2 text-white rounded-full font-semibold transition-all duration-300 transform ${
            disponible
              ? "bg-gradient-to-r from-pink-400 via-pink-500 to-pink-600 shadow-md hover:scale-105 hover:brightness-110"
              : "bg-gray-400 cursor-not-allowed"
          }">
          Reservar
        </button>
      </div>
    `;
  });
}

// 📋 Modal control
window.abrirModal = function (hora) {
  horaActual = hora;
  document.getElementById("horaSeleccionada").textContent = `Horario seleccionado: ${hora}`;
  document.getElementById("modal").classList.remove("hidden");
  document.getElementById("modal").classList.add("flex");
};

window.cerrarModal = function () {
  document.getElementById("modal").classList.add("hidden");
  document.getElementById("cedulaCliente").value = "";
  document.getElementById("nombreCliente").value = "";
};

// 🧠 Función para validar cédula de Ecuador
function validarCedula(cedula) {
  if (cedula.length !== 10 || isNaN(cedula)) return false;
  
  const digitos = cedula.split('').map(Number);
  const provincia = parseInt(cedula.substring(0, 2));

  if (provincia < 1 || provincia > 24) return false;

  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let mult = (i % 2 === 0) ? 2 : 1;
    let res = digitos[i] * mult;
    if (res > 9) res -= 9;
    suma += res;
  }

  let digitoVerificador = (10 - (suma % 10)) % 10;
  return digitoVerificador === digitos[9];
}

// ✅ Confirmar Reserva
window.confirmarReserva = async function () {
  const cedula = document.getElementById("cedulaCliente").value.trim();
  const nombre = document.getElementById("nombreCliente").value.trim();
  if (!cedula || !nombre) return;

  if (!validarCedula(cedula)) {
    mostrarModalErrorCedula("La cédula ingresada no es válida.");
    return;
  }

  const snapshot = await getDocs(collection(db, "reservas"));
  const conteo = {};
  let cedulaRepetidaEnHora = false;
  let cedulaRepetidaGlobal = false;

  snapshot.forEach((doc) => {
    const data = doc.data();
    const hora = data.hora;
    const cedu = data.cedula;
    conteo[hora] = (conteo[hora] || 0) + 1;

    if (hora === horaActual && cedu === cedula) {
      cedulaRepetidaEnHora = true;
    }

    if (cedu === cedula) {
      cedulaRepetidaGlobal = true;
    }
  });

  if (cedulaRepetidaGlobal) {
    mostrarModalDuplicado("Esta cédula ya tiene una cita agendada.");
    cerrarModal();
    return;
  }

  if ((conteo[horaActual] || 0) >= maxTurnos) {
    mostrarModalError("Lamentablemente este horario ya está lleno.");
    cerrarModal();
    return;
  }

  await addDoc(collection(db, "reservas"), {
    cedula,
    nombre,
    hora: horaActual,
    estado: "pendiente",
    createdAt: Date.now()
  });

  cerrarModal();
  mostrarModalExito();
  cargarHorarios();
};

// 🎯 Modales
window.mostrarModalExito = function () {
  document.getElementById("modalExito").classList.remove("hidden");
  document.getElementById("modalExito").classList.add("flex");
};

window.cerrarModalExito = function () {
  document.getElementById("modalExito").classList.add("hidden");
};

window.mostrarModalError = function (mensaje = "Algo salió mal.") {
  document.getElementById("modalErrorMensaje").textContent = mensaje;
  document.getElementById("modalError").classList.remove("hidden");
  document.getElementById("modalError").classList.add("flex");
};

window.mostrarModalErrorCedula = function (mensaje = "La cédula ingresada no es válida.") {
  document.getElementById("modalErrorMensajeCedula").textContent = mensaje;
  document.getElementById("modalErrorCedula").classList.remove("hidden");
  document.getElementById("modalErrorCedula").classList.add("flex");
};


window.cerrarModalErrorCedula = function () {
  document.getElementById("modalErrorCedula").classList.add("hidden");
};


window.cerrarModalError = function () {
  document.getElementById("modalError").classList.add("hidden");
};

window.mostrarModalDuplicado = function () {
  document.getElementById("modalDuplicado").classList.remove("hidden");
  document.getElementById("modalDuplicado").classList.add("flex");
};

window.cerrarModalDuplicado = function () {
  document.getElementById("modalDuplicado").classList.add("hidden");
};

// 🚀 Carga inicial
cargarHorarios();
