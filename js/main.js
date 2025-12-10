// --- 1. ESTADO Y VARIABLES ---
let inventario = JSON.parse(localStorage.getItem("inventario")) || [];
let ventas = JSON.parse(localStorage.getItem("ventas")) || [];

const formulario = document.getElementById("product-form");
const inputNombre = document.getElementById("product-name");
const inputPrecio = document.getElementById("product-price");
const inputCantidad = document.getElementById("product-quantity");
const contenedorProductos = document.getElementById("products-container");
const contenedorVentas = document.getElementById("sales-log");
const spanTotalStock = document.getElementById("total-stock");
const spanDinero = document.getElementById("total-money");
const btnBorrarHistorial = document.getElementById("btn-clear-history");

// Creamos un contenedor para las notificaciones en el DOM si no existe
const notificacionesDiv = document.createElement("div");
notificacionesDiv.className = "notification-container";
document.body.appendChild(notificacionesDiv);

// --- 2. CLASES ---
class Producto {
    constructor(nombre, precio, stock) {
        this.id = Date.now();
        this.nombre = nombre.toUpperCase();
        this.precio = parseFloat(precio);
        this.stock = parseInt(stock);
    }
}

// --- 3. FUNCIONES AUXILIARES ---

function guardarEnStorage() {
    localStorage.setItem("inventario", JSON.stringify(inventario));
    localStorage.setItem("ventas", JSON.stringify(ventas));
}

// Función para mostrar notificaciones personalizadas (Reemplaza al alert)
function mostrarNotificacion(mensaje, tipo) {
    const notificacion = document.createElement("div");
    notificacion.className = `notification ${tipo}`;
    notificacion.textContent = mensaje;

    notificacionesDiv.appendChild(notificacion);

    // Eliminar la notificación después de 3 segundos
    setTimeout(() => {
        notificacion.remove();
    }, 3000);
}

// --- 4. LÓGICA DE RENDERIZADO ---

function renderizarProductos() {
    contenedorProductos.innerHTML = "";

    inventario.forEach((producto) => {
        const card = document.createElement("div");
        card.className = "card";
        if (producto.stock <= 3) card.classList.add("pocostock");
            
        card.innerHTML = `
            <h3>${producto.nombre}</h3>
            <p>Precio: $${producto.precio}</p>
            <p>Stock: <strong>${producto.stock}</strong></p>
            <div class="card-actions">
                <button id="btn-vender-${producto.id}" class="btn-vender">Vender</button>
                <button id="btn-borrar-${producto.id}" class="btn-borrar">Eliminar</button>
            </div>
        `;
        contenedorProductos.appendChild(card);

        document.getElementById(`btn-vender-${producto.id}`).addEventListener("click", () => venderProducto(producto.id));
        document.getElementById(`btn-borrar-${producto.id}`).addEventListener("click", () => eliminarProducto(producto.id));
    });
    
    actualizarResumen();
}

function renderizarHistorial() {
    contenedorVentas.innerHTML = "";
    ventas.forEach((venta) => {
        const li = document.createElement("li");
        li.innerHTML = `<span>${venta.producto}</span> <span>+$${venta.precio}</span>`;
        contenedorVentas.appendChild(li);
    });
}

function actualizarResumen() {
    const totalStock = inventario.reduce((acc, prod) => acc + prod.stock, 0);
    const totalDinero = ventas.reduce((acc, venta) => acc + venta.precio, 0);
    spanTotalStock.innerText = `Items en Stock: ${totalStock}`;
    spanDinero.innerText = `Dinero en Caja: $${totalDinero}`;
}

// --- 5. LÓGICA DE NEGOCIO ---

function agregarProducto(e) {
    e.preventDefault();
    const nombre = inputNombre.value;
    const precio = inputPrecio.value;
    const stock = inputCantidad.value;

    if (nombre === "" || precio === "" || stock === "") {
        mostrarNotificacion("Por favor completa todos los campos", "error");
        return;
    }
    if (precio <= 0 || stock <= 0) {
        mostrarNotificacion("Los valores deben ser mayores a cero", "error");
        return;
    }

    const productoExistente = inventario.find(prod => prod.nombre === nombre.toUpperCase());

    if (productoExistente) {
        productoExistente.stock += parseInt(stock);
        productoExistente.precio = parseFloat(precio);
        mostrarNotificacion(`Stock actualizado: ${productoExistente.nombre}`, "info");
    } else {
        const nuevoProducto = new Producto(nombre, precio, stock);
        inventario.push(nuevoProducto);
        mostrarNotificacion("Producto agregado exitosamente", "success");
    }

    guardarEnStorage();
    renderizarProductos();
    formulario.reset();
}

function venderProducto(id) {
    const producto = inventario.find((prod) => prod.id === id);

    if (producto.stock > 0) {
        producto.stock--;
        ventas.push({ id: Date.now(), producto: producto.nombre, precio: producto.precio });
        
        guardarEnStorage();
        renderizarProductos();
        renderizarHistorial();
        mostrarNotificacion("¡Venta registrada!", "success");
    } else {
        mostrarNotificacion("No hay stock disponible", "error");
    }
}

function eliminarProducto(id) {
    // Usamos confirm porque es una acción destructiva importante
    // (Nota: confirm es el único "alert" permitido por UX en casos críticos, 
    // pero si quieres quitarlo también, simplemente borra el if y ejecuta directo)
    if(confirm("¿Seguro que deseas eliminar este producto?")) {
        inventario = inventario.filter(prod => prod.id !== id);
        guardarEnStorage();
        renderizarProductos();
        mostrarNotificacion("Producto eliminado", "error");
    }
}

function borrarHistorial() {
    if(ventas.length === 0) {
        mostrarNotificacion("No hay historial para borrar", "info");
        return;
    }
    ventas = [];
    guardarEnStorage();
    renderizarHistorial();
    actualizarResumen();
    mostrarNotificacion("Historial vaciado", "info");
}

// --- 6. INICIALIZACIÓN ---
formulario.addEventListener("submit", agregarProducto);
btnBorrarHistorial.addEventListener("click", borrarHistorial);

renderizarProductos();
renderizarHistorial();
actualizarResumen();