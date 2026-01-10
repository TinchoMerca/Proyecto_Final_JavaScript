/* Gestión de Cabañas - Lógica principal
*/

// Variables de estado
let currentDate = new Date();
let bookings = [];
let editingBookingId = null;

// Elementos del DOM
const monthYear = document.getElementById('monthYear');
const daysContainer = document.getElementById('daysContainer');
const cabinFilter = document.getElementById('cabinFilter');

// Clase principal de Reserva
class Booking {
    constructor(guest, phone, cabin, start, end, price, status, total) {
        this.id = Date.now();
        this.guest = guest;
        this.phone = phone;
        this.cabin = cabin;
        this.start = start;
        this.end = end;
        this.pricePerNight = price;
        this.status = status;
        this.totalPrice = total;
    }
}

// Configuración de notificaciones
const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
});

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    await loadInitialData();
    renderCalendar();
    loadNotes();
    renderBookingList();
    updateGuestHistory();
});

// Carga de datos (Local o JSON)
async function loadInitialData() {
    const storedData = localStorage.getItem('cabanas_reservas');

    // Si hay datos guardados y no están vacíos, los usamos
    if (storedData && JSON.parse(storedData).length > 0) {
        bookings = JSON.parse(storedData);
    } else {
        // Si no, traemos el dataset inicial
        try {
            const response = await fetch('./data.json');

            if (!response.ok) throw new Error('Error al cargar datos iniciales');

            const data = await response.json();

            // Generamos IDs frescos y asignamos
            bookings = data.map(b => ({
                ...b,
                id: Date.now() + Math.floor(Math.random() * 10000)
            }));

            localStorage.setItem('cabanas_reservas', JSON.stringify(bookings));

            Toast.fire({
                icon: 'info',
                title: 'Datos iniciales cargados'
            });

        } catch (error) {
            console.error(error);
            bookings = [];
        }
    }
}

/* --- CALENDARIO --- */

function renderCalendar() {
    const filter = cabinFilter.value;

    // Configuración de fecha
    currentDate.setDate(1);
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = currentDate.getDay();

    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    monthYear.innerText = `${months[month]} ${year}`;

    let daysHTML = "";

    // Espacios vacíos mes anterior
    for (let i = 0; i < firstDayIndex; i++) {
        daysHTML += `<div class="day empty"></div>`;
    }

    const allCabins = ["Cabaña 1", "Cabaña 2", "Cabaña 3", "Cabaña 4", "Cabaña 5"];

    // Renderizado de días
    for (let i = 1; i <= lastDay; i++) {
        const dateObj = new Date(year, month, i);
        const dateStr = formatDate(dateObj);
        const isToday = dateStr === formatDate(new Date()) ? "today" : "";

        let slotsHTML = "";
        const cabinsToShow = (filter === 'all') ? allCabins : [filter];

        cabinsToShow.forEach(cabinName => {
            // Buscamos reservas relevantes para este día
            const endingBooking = bookings.find(b => b.cabin === cabinName && b.end === dateStr);
            const startingBooking = bookings.find(b => b.cabin === cabinName && b.start === dateStr);
            const ongoingBooking = bookings.find(b => b.cabin === cabinName && b.start < dateStr && b.end > dateStr);

            // Recambio: Uno sale y otro entra
            if (endingBooking && startingBooking) {
                slotsHTML += `
                <div class="booking-slot">
                    <div class="double-bar-container">
                        <div class="half-bar half-left bg-${endingBooking.status}" 
                             onclick="editBooking(${endingBooking.id}, event)"
                             title="Sale: ${endingBooking.guest}">
                             <i class="fas fa-sign-out-alt"></i>&nbsp;${endingBooking.guest.split(' ')[0]}
                        </div>
                        <div class="half-bar half-right bg-${startingBooking.status}" 
                             onclick="editBooking(${startingBooking.id}, event)"
                             title="Entra: ${startingBooking.guest}">
                             ${startingBooking.guest.split(' ')[0]}&nbsp;<i class="fas fa-sign-in-alt"></i>
                        </div>
                    </div>
                </div>`;
            }
            // Reserva normal (barra completa o inicio/fin)
            else {
                const booking = endingBooking || startingBooking || ongoingBooking;

                if (booking) {
                    let barClass = "bar-mid";
                    if (booking.start === booking.end) barClass = "bar-single";
                    else if (dateStr === booking.start) barClass = "bar-start";
                    else if (dateStr === booking.end) barClass = "bar-end";

                    let content = "&nbsp;";
                    if (dateStr === booking.start) {
                        content = `<i class="fas fa-sign-in-alt icon-in"></i> ${booking.guest.split(' ')[0]}`;
                    } else if (dateStr === booking.end) {
                        content = `<i class="fas fa-sign-out-alt icon-out"></i>`;
                    } else if (i === 1) {
                        content = booking.guest.split(' ')[0];
                    }

                    slotsHTML += `<div class="booking-slot" title="${booking.cabin}: ${booking.guest}">
                                    <div class="booking-bar ${barClass} bg-${booking.status}" 
                                         onclick="editBooking(${booking.id}, event)">
                                        ${content}
                                    </div>
                                  </div>`;
                } else {
                    slotsHTML += `<div class="booking-slot"><div class="booking-placeholder"></div></div>`;
                }
            }
        });

        daysHTML += `<div class="day ${isToday}">
                        <div class="day-number">${i}</div>
                        ${slotsHTML}
                     </div>`;
    }

    daysContainer.innerHTML = daysHTML;
    calculateMonthlyStats();
    renderBookingList();
}

function changeMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    renderCalendar();
}

/* --- CRUD RESERVAS --- */

function saveBooking() {
    const guest = document.getElementById('guestName').value;
    const phone = document.getElementById('guestPhone').value;
    const cabin = document.getElementById('cabinName').value;
    const start = document.getElementById('checkIn').value;
    const end = document.getElementById('checkOut').value;
    const price = parseFloat(document.getElementById('pricePerNight').value) || 0;
    const status = document.getElementById('paymentStatus').value;

    if (!guest || !start || !end) {
        Swal.fire({ icon: 'warning', title: 'Faltan datos', confirmButtonColor: '#4a69bd' });
        return;
    }
    if (start > end) {
        Swal.fire({ icon: 'error', title: 'Fechas incorrectas', text: 'Revisar entrada y salida.', confirmButtonColor: '#eb3b5a' });
        return;
    }

    // Verificar disponibilidad
    const conflict = checkOverlap(cabin, start, end, editingBookingId);
    if (conflict) {
        Swal.fire({
            icon: 'error',
            title: 'No disponible',
            html: `La <b>${cabin}</b> está ocupada por <b>${conflict.guest}</b> en esas fechas.`,
            confirmButtonColor: '#eb3b5a'
        });
        return;
    }

    const nights = calculateNights(start, end);
    const total = nights * price;

    if (editingBookingId) {
        const index = bookings.findIndex(b => b.id === editingBookingId);
        const b = bookings[index];
        b.guest = guest;
        b.phone = phone;
        b.cabin = cabin;
        b.start = start;
        b.end = end;
        b.pricePerNight = price;
        b.status = status;
        b.totalPrice = total;
    } else {
        const newBooking = new Booking(guest, phone, cabin, start, end, price, status, total);
        bookings.push(newBooking);
    }

    localStorage.setItem('cabanas_reservas', JSON.stringify(bookings));
    closeModal();
    renderCalendar();
    updateGuestHistory();

    Toast.fire({ icon: 'success', title: 'Guardado correctamente' });
}

function checkOverlap(cabin, start, end, ignoreId = null) {
    const newStart = new Date(start);
    const newEnd = new Date(end);
    return bookings.find(b => {
        if (ignoreId && b.id === ignoreId) return false;
        if (b.cabin !== cabin) return false;
        const bStart = new Date(b.start);
        const bEnd = new Date(b.end);
        return newStart < bEnd && newEnd > bStart;
    });
}

function editBooking(id, event) {
    if (event) event.stopPropagation();
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;

    editingBookingId = id;
    document.getElementById('modalTitle').innerText = "Editar Reserva";

    document.getElementById('guestName').value = booking.guest;
    document.getElementById('guestPhone').value = booking.phone;
    document.getElementById('cabinName').value = booking.cabin;
    document.getElementById('checkIn').value = booking.start;
    document.getElementById('checkOut').value = booking.end;
    document.getElementById('pricePerNight').value = booking.pricePerNight;
    document.getElementById('paymentStatus').value = booking.status;

    calculateTotalPreview();

    document.getElementById('btnDeleteModal').style.display = 'block';
    document.getElementById('bookingModal').style.display = 'flex';
}

function deleteFromModal() {
    if (!editingBookingId) return;

    Swal.fire({
        title: '¿Eliminar reserva?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#eb3b5a',
        confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
        if (result.isConfirmed) {
            bookings = bookings.filter(b => b.id !== editingBookingId);
            localStorage.setItem('cabanas_reservas', JSON.stringify(bookings));
            closeModal();
            renderCalendar();
            Toast.fire({ icon: 'success', title: 'Eliminada' });
        }
    });
}

/* --- ESTADÍSTICAS Y PDF --- */

function calculateMonthlyStats() {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();

    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    const monthBookings = bookings.filter(b => {
        const bStart = new Date(b.start);
        const bEnd = new Date(b.end);
        return bStart <= monthEnd && bEnd >= monthStart;
    });

    const totalRevenue = monthBookings.reduce((acc, booking) => {
        return acc + (parseFloat(booking.totalPrice) || 0);
    }, 0);

    const totalReservas = monthBookings.length;

    document.getElementById('monthRevenue').innerText = `$${totalRevenue.toLocaleString()}`;
    document.getElementById('monthOccupancy').innerText = totalReservas;
}

function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const monthName = document.getElementById('monthYear').innerText;

    const monthlyBookings = bookings.filter(b => {
        const start = new Date(b.start);
        const end = new Date(b.end);
        return (start.getMonth() === month && start.getFullYear() === year) ||
            (end.getMonth() === month && end.getFullYear() === year) ||
            (start < new Date(year, month, 1) && end > new Date(year, month + 1, 0));
    });

    if (monthlyBookings.length === 0) {
        Swal.fire({ icon: 'info', title: 'Sin datos para exportar' });
        return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Reporte Mensual", 14, 20);
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Período: ${monthName}`, 14, 28);

    const tableColumn = ["Cabaña", "Huesped", "Entrada", "Salida", "Noches", "Total", "Estado"];
    let totalMoney = 0;

    const tableRows = monthlyBookings.map(b => {
        totalMoney += parseFloat(b.totalPrice) || 0;
        let statusEsp = b.status === 'paid' ? "Pagado" : (b.status === 'deposit' ? "Señado" : "Pendiente");
        return [
            b.cabin,
            b.guest,
            b.start,
            b.end,
            calculateNights(b.start, b.end),
            `$${b.totalPrice.toLocaleString()}`,
            statusEsp
        ];
    });

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [74, 105, 189] },
        styles: { fontSize: 9 }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Total: $${totalMoney.toLocaleString()}`, 14, finalY);

    doc.save(`Reporte_${monthName.replace(' ', '_')}.pdf`);
    Toast.fire({ icon: 'success', title: 'Descargando PDF...' });
}

/* --- HELPERS Y UI --- */

function renderBookingList() {
    const listDiv = document.getElementById('bookingList');
    const month = currentDate.getMonth();

    const upcoming = bookings.filter(b => {
        const d = new Date(b.start);
        return d.getMonth() === month && d.getFullYear() === currentDate.getFullYear();
    }).sort((a, b) => new Date(a.start) - new Date(b.start));

    let html = "";
    upcoming.forEach(b => {
        let borderClass = b.status === 'paid' ? 'var(--success)' : (b.status === 'deposit' ? 'var(--warning)' : '#ccc');
        html += `<div class="booking-list-item" style="border-left-color: ${borderClass}">
                    <div>
                        <strong>${b.guest}</strong> <small>(${b.cabin})</small><br>
                        <span style="color:#777; font-size:0.8rem">📅 ${b.start.slice(8)} al ${b.end.slice(8)}</span>
                    </div>
                    <button class="btn" onclick="editBooking(${b.id})"><i class="fas fa-pencil-alt" style="color:#aaa"></i></button>
                 </div>`;
    });
    listDiv.innerHTML = html || "<p style='color:#ccc; text-align:center'>No hay reservas próximas.</p>";
}

function searchBooking() {
    const text = document.getElementById('searchInput').value.toLowerCase();
    const listDiv = document.getElementById('bookingList');

    if (text.length === 0) {
        renderBookingList();
        return;
    }

    const filtered = bookings.filter(b => b.guest.toLowerCase().includes(text));
    let html = "";
    filtered.forEach(b => {
        html += `<div class="booking-list-item" style="border-left-color: var(--primary)">
                    <span>${b.guest} (${b.cabin}) <br> <small>${b.start} al ${b.end}</small></span>
                    <button class="btn" onclick="editBooking(${b.id})"><i class="fas fa-edit"></i></button>
                 </div>`;
    });
    listDiv.innerHTML = html || "<p>Sin resultados.</p>";
}

function updateGuestHistory() {
    const dataList = document.getElementById('guestHistory');
    dataList.innerHTML = '';
    const guests = [...new Set(bookings.map(b => b.guest))];
    guests.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        dataList.appendChild(option);
    });
}

function downloadBackup() {
    const data = { reservas: bookings, notas: localStorage.getItem('cabanas_notas') };
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${formatDate(new Date())}.json`;
    a.click();
    Toast.fire({ icon: 'info', title: 'Backup descargado' });
}

function restoreBackup(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.reservas) bookings = data.reservas;
            if (data.notas) localStorage.setItem('cabanas_notas', data.notas);

            localStorage.setItem('cabanas_reservas', JSON.stringify(bookings));

            Swal.fire({
                icon: 'success',
                title: 'Restauración completada',
                confirmButtonColor: '#20bf6b'
            }).then(() => location.reload());

        } catch (x) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'El archivo no es válido.' });
        }
    };
    reader.readAsText(file);
}

/* --- MODAL --- */

function openModal() {
    editingBookingId = null;
    cleanForm();
    document.getElementById('modalTitle').innerText = "Nueva Reserva";
    document.getElementById('btnDeleteModal').style.display = 'none';
    document.getElementById('bookingModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('bookingModal').style.display = 'none';
}

function cleanForm() {
    document.getElementById('guestName').value = "";
    document.getElementById('guestPhone').value = "";
    document.getElementById('checkIn').value = "";
    document.getElementById('checkOut').value = "";
    document.getElementById('pricePerNight').value = "";
    document.getElementById('totalPreview').innerText = "Total estimado: $0";
}

window.onclick = function (e) {
    if (e.target == document.getElementById('bookingModal')) closeModal();
}

function calculateTotalPreview() {
    const start = document.getElementById('checkIn').value;
    const end = document.getElementById('checkOut').value;
    const price = document.getElementById('pricePerNight').value;

    if (start && end && price) {
        const total = calculateNights(start, end) * price;
        document.getElementById('totalPreview').innerText = `Total estimado: $${total.toLocaleString()}`;
    }
}

function loadNotes() {
    document.getElementById('notesArea').value = localStorage.getItem('cabanas_notas') || "";
}

document.getElementById('notesArea').addEventListener('input', (e) => {
    localStorage.setItem('cabanas_notas', e.target.value);
});

// Utils
function isDateInProgress(current, start, end) {
    return current >= start && current <= end;
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function calculateNights(start, end) {
    const d1 = new Date(start);
    const d2 = new Date(end);
    return Math.max(1, Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)));
}