import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, updateDoc, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBm_vUcQXLXAVQeHVeFCxrgaIgEBXM-3pI",
  authDomain: "agenda-spa-sabado3.firebaseapp.com",
  projectId: "agenda-spa-sabado3",
  storageBucket: "agenda-spa-sabado3.appspot.com",
  messagingSenderId: "438686436372",
  appId: "1:438686436372:web:0a3632991310bfedaeeb01"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const horarios = ["15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30"];
const maxTurnos = 6;

let todasLasReservas = [];
let idReservaCambio = "";
let horaActualReserva = "";

// 🔒 Control de acceso
document.addEventListener('DOMContentLoaded', async () => {
  const claveCorrecta = "spa@mayo@03";

  const { value: claveIngresada } = await Swal.fire({
    title: '🔒 Área Administrativa',
    text: 'Por favor ingrese la clave de acceso',
    input: 'password',
    inputPlaceholder: 'Clave de acceso...',
    showCancelButton: false,
    confirmButtonText: 'Acceder',
    allowOutsideClick: false,
    allowEscapeKey: false,
    customClass: { popup: 'rounded-xl' }
  });

  if (claveIngresada === claveCorrecta) {
    document.getElementById('contenidoAdmin').classList.remove('blur-md');
    cargarReservas();
  } else {
    Swal.fire({
      icon: 'error',
      title: '⛔ Acceso denegado',
      text: 'Serás redirigido...',
      showConfirmButton: false,
      timer: 1500
    });
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1600);
  }
});

// 🧠 Cargar reservas
async function cargarReservas() {
  const contenedor = document.getElementById('citas');
  const snapshot = await getDocs(collection(db, "reservas"));
  contenedor.innerHTML = '';
  todasLasReservas = [];

  snapshot.forEach((docu) => {
    const data = docu.data();
    todasLasReservas.push({ id: docu.id, ...data });
  });

  mostrarReservas(todasLasReservas);
}

// 📋 Mostrar reservas corregido
function mostrarReservas(reservas) {
    const contenedor = document.getElementById('citas');
    contenedor.innerHTML = '';
  
    reservas.forEach((data) => {
      contenedor.innerHTML += `
        <div class="bg-white p-4 rounded-xl shadow flex flex-col sm:flex-row sm:justify-between items-center gap-4 max-w-full overflow-hidden break-words animate-fade-in-up">
          <div class="text-center sm:text-left w-full sm:w-auto">
            <p class="font-semibold text-pink-700 break-words">🕐 ${data.hora}</p>
            <p class="text-gray-700 text-sm break-words">💳 ${data.cedula}</p>
            <p class="text-gray-700 text-sm break-words">💖 ${data.nombre}</p>
            <p class="text-sm mt-1 break-words"><span class="font-semibold">Estado:</span> ${data.estado || 'pendiente'}</p>
          </div>
          <div class="flex flex-wrap gap-2 justify-center sm:justify-end w-full sm:w-auto">
            <button onclick="cambiarEstado('${data.id}', 'confirmada')" class="px-4 py-1 bg-green-500 hover:bg-green-600 text-white rounded-full text-sm font-semibold transition whitespace-nowrap">✅ Confirmar</button>
            <button onclick="cambiarEstado('${data.id}', 'rechazada')" class="px-4 py-1 bg-red-500 hover:bg-red-600 text-white rounded-full text-sm font-semibold transition whitespace-nowrap">❌ Rechazar</button>
            <button onclick="abrirCambioHorario('${data.id}', '${data.hora}')" class="px-4 py-1 bg-yellow-400 hover:bg-yellow-500 text-white rounded-full text-sm font-semibold transition whitespace-nowrap">🕐 Cambiar</button>
          </div>
        </div>
      `;
    });
  }
  


// 🕐 Cambio de horario
window.cambiarEstado = async function (id, nuevoEstado) {
    const accion = nuevoEstado === 'confirmada' ? 'confirmar' : 'rechazar';
  
    const result = await Swal.fire({
      title: `¿Quieres ${accion} esta cita?`,
      text: nuevoEstado === 'confirmada'
        ? "Será confirmada y ocupará un cupo disponible."
        : "Será eliminada y el turno quedará libre.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: nuevoEstado === 'confirmada' ? '#38a169' : '#e53e3e',
      cancelButtonColor: '#718096',
      confirmButtonText: nuevoEstado === 'confirmada' ? 'Sí, confirmar' : 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      backdrop: true,
      customClass: {
        popup: 'rounded-xl'
      }
    });
  
    if (result.isConfirmed) {
      const citaRef = doc(db, "reservas", id);
  
      if (nuevoEstado === 'confirmada') {
        await updateDoc(citaRef, { estado: 'confirmada' });
      } else {
        await deleteDoc(citaRef);
      }
  
      await Swal.fire({
        title: '¡Actualizado!',
        text: nuevoEstado === 'confirmada' ? 'Reserva confirmada ✅' : 'Reserva eliminada 🗑️',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
      
      // Aquí ponemos el setTimeout:
      setTimeout(() => {
        cargarReservas();
      }, 300);
    }
  };

window.cerrarCambioHorario = function () {
  document.getElementById('modalCambio').classList.add('hidden');
};

async function cargarHorariosDisponibles() {
  const select = document.getElementById('nuevoHorario');
  select.innerHTML = '';

  const snapshot = await getDocs(collection(db, "reservas"));
  const conteo = {};
  snapshot.forEach((doc) => {
    const hora = doc.data().hora;
    conteo[hora] = (conteo[hora] || 0) + 1;
  });

  horarios.forEach((hora) => {
    const cantidad = conteo[hora] || 0;
    const disponible = cantidad < maxTurnos || hora === horaActualReserva;
    if (disponible) {
      const option = document.createElement('option');
      option.value = hora;
      option.textContent = hora + (hora === horaActualReserva ? " (actual)" : "");
      select.appendChild(option);
    }
  });
}

window.confirmarCambioHorario = async function () {
  const nuevo = document.getElementById('nuevoHorario').value;
  if (!nuevo || nuevo === horaActualReserva) return;

  const snapshot = await getDocs(collection(db, "reservas"));
  let existeDuplicado = false;

  snapshot.forEach((docu) => {
    const data = docu.data();
    if (data.hora === nuevo && data.cedula === todasLasReservas.find(r => r.id === idReservaCambio)?.cedula) {
      existeDuplicado = true;
    }
  });

  if (existeDuplicado) {
    await Swal.fire({
      icon: 'error',
      title: '⛔ Error',
      text: 'Ya existe una reserva con esta cédula en el nuevo horario.',
      confirmButtonText: 'Entendido'
    });
    return;
  }

  const citaRef = doc(db, "reservas", idReservaCambio);
  await updateDoc(citaRef, { hora: nuevo });

  cerrarCambioHorario();
  cargarReservas();
};

// 🔍 Buscador de cédula
document.getElementById('buscarCedula').addEventListener('input', (e) => {
  const texto = e.target.value.trim();
  const filtradas = todasLasReservas.filter((reserva) =>
    reserva.cedula.includes(texto)
  );
  mostrarReservas(filtradas);
});

// 📄 Generar Reporte PDF
window.generarReportePDF = async function () {
  const { jsPDF } = window.jspdf;
  const docu = new jsPDF();
  const snapshot = await getDocs(collection(db, "reservas"));
  const grupos = {};

  snapshot.forEach((doc) => {
    const data = doc.data();
    const hora = data.hora;
    if (!grupos[hora]) grupos[hora] = [];
    grupos[hora].push([data.nombre, data.cedula, data.estado || 'pendiente']);
  });

  let y = 20;
  docu.text("Reporte de Reservas Spa 3 de Mayo", 14, y);
  y += 10;

  Object.keys(grupos).sort().forEach(hora => {
    docu.text(`Hora: ${hora}`, 14, y);
    y += 6;
    docu.autoTable({
      head: [['Nombre', 'Cédula', 'Estado']],
      body: grupos[hora],
      startY: y,
      theme: 'grid',
      styles: { fontSize: 9 },
      margin: { left: 14 }
    });
    y = docu.lastAutoTable.finalY + 10;
  });

  docu.save('reporte-citas.pdf');
};



  
